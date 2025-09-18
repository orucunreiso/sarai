import { supabase } from '@/lib/supabase';

export interface SurpriseReward {
  type: 'xp' | 'achievement' | 'streak_freeze' | 'double_xp' | 'bonus_questions' | 'special_badge';
  name: string;
  description: string;
  icon: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  duration?: number; // For temporary effects (in hours)
}

export interface SurpriseBox {
  id: string;
  user_id: string;
  box_type: 'daily' | 'weekly' | 'achievement' | 'milestone' | 'special';
  earned_at: string;
  opened_at?: string;
  reward?: SurpriseReward;
  is_opened: boolean;
}

export interface SurpriseBoxResult {
  box: SurpriseBox;
  reward: SurpriseReward;
  isNew: boolean;
  xpAwarded?: number;
}

/**
 * Surprise box system for random rewards and gamification
 */
export class SurpriseBoxEngine {
  // Reward pool with weighted probabilities
  static readonly REWARD_POOLS = {
    daily: {
      common: 70, // 70% chance
      rare: 25, // 25% chance
      epic: 5, // 5% chance
      legendary: 0, // 0% chance
    },
    weekly: {
      common: 40,
      rare: 35,
      epic: 20,
      legendary: 5,
    },
    achievement: {
      common: 30,
      rare: 40,
      epic: 25,
      legendary: 5,
    },
    milestone: {
      common: 20,
      rare: 30,
      epic: 35,
      legendary: 15,
    },
    special: {
      common: 10,
      rare: 20,
      epic: 40,
      legendary: 30,
    },
  };

  // Available rewards by rarity
  static readonly REWARDS: Record<SurpriseReward['rarity'], SurpriseReward[]> = {
    common: [
      {
        type: 'xp',
        name: 'Mini XP Bonusu',
        description: '25 bonus XP kazandın!',
        icon: '⭐',
        value: 25,
        rarity: 'common',
      },
      {
        type: 'xp',
        name: 'XP Paketi',
        description: '50 bonus XP kazandın!',
        icon: '🌟',
        value: 50,
        rarity: 'common',
      },
      {
        type: 'bonus_questions',
        name: 'Extra Sorular',
        description: '5 bonus soru hakkı kazandın!',
        icon: '📝',
        value: 5,
        rarity: 'common',
      },
    ],
    rare: [
      {
        type: 'xp',
        name: 'XP Hazinesi',
        description: '100 bonus XP kazandın!',
        icon: '💫',
        value: 100,
        rarity: 'rare',
      },
      {
        type: 'double_xp',
        name: 'Çift XP',
        description: 'Sonraki 2 saat çift XP kazanırsın!',
        icon: '🚀',
        value: 2,
        rarity: 'rare',
        duration: 2,
      },
      {
        type: 'streak_freeze',
        name: 'Seri Koruma',
        description: 'Serini kaybetme koruması (1 gün)!',
        icon: '🛡️',
        value: 1,
        rarity: 'rare',
      },
      {
        type: 'bonus_questions',
        name: 'Soru Paketi',
        description: '10 bonus soru hakkı kazandın!',
        icon: '📚',
        value: 10,
        rarity: 'rare',
      },
    ],
    epic: [
      {
        type: 'xp',
        name: 'Mega XP Bonusu',
        description: '200 bonus XP kazandın!',
        icon: '✨',
        value: 200,
        rarity: 'epic',
      },
      {
        type: 'double_xp',
        name: 'Süper Çift XP',
        description: 'Sonraki 6 saat çift XP kazanırsın!',
        icon: '💥',
        value: 2,
        rarity: 'epic',
        duration: 6,
      },
      {
        type: 'streak_freeze',
        name: 'Güçlü Seri Koruma',
        description: 'Serini kaybetme koruması (3 gün)!',
        icon: '🛡️✨',
        value: 3,
        rarity: 'epic',
      },
      {
        type: 'special_badge',
        name: 'Şanslı Roze',
        description: 'Özel "Şanslı" rozeti kazandın!',
        icon: '🍀',
        value: 1,
        rarity: 'epic',
      },
    ],
    legendary: [
      {
        type: 'xp',
        name: 'Efsane XP Kasası',
        description: '500 bonus XP kazandın!',
        icon: '🏆',
        value: 500,
        rarity: 'legendary',
      },
      {
        type: 'double_xp',
        name: 'Efsane Çift XP',
        description: 'Sonraki 24 saat çift XP kazanırsın!',
        icon: '🎆',
        value: 2,
        rarity: 'legendary',
        duration: 24,
      },
      {
        type: 'streak_freeze',
        name: 'Efsane Seri Koruma',
        description: 'Serini kaybetme koruması (7 gün)!',
        icon: '🛡️🏆',
        value: 7,
        rarity: 'legendary',
      },
      {
        type: 'special_badge',
        name: 'Efsane Kaşif',
        description: 'Ultra nadir "Efsane Kaşif" rozeti!',
        icon: '🏆✨',
        value: 1,
        rarity: 'legendary',
      },
    ],
  };

  /**
   * Award a surprise box to user
   */
  static async awardSurpriseBox(
    userId: string,
    boxType: SurpriseBox['box_type'],
    reason?: string,
  ): Promise<SurpriseBox | null> {
    try {
      const { data: box, error } = await supabase
        .from('surprise_boxes')
        .insert({
          user_id: userId,
          box_type: boxType,
          is_opened: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the box award
      if (reason) {
        await supabase.from('xp_logs').insert({
          user_id: userId,
          xp_gained: 0,
          activity_type: 'achievement',
          description: `Sürpriz kutu kazandın: ${reason}`,
        });
      }

      return box;
    } catch (error) {
      console.error('Error awarding surprise box:', error);
      return null;
    }
  }

  /**
   * Open a surprise box and get reward
   */
  static async openSurpriseBox(userId: string, boxId: string): Promise<SurpriseBoxResult | null> {
    try {
      // Get the box
      const { data: box, error: boxError } = await supabase
        .from('surprise_boxes')
        .select('*')
        .eq('id', boxId)
        .eq('user_id', userId)
        .eq('is_opened', false)
        .single();

      if (boxError || !box) {
        throw new Error('Box not found or already opened');
      }

      // Generate random reward
      const reward = this.generateRandomReward(box.box_type);

      // Update box as opened
      const { error: updateError } = await supabase
        .from('surprise_boxes')
        .update({
          is_opened: true,
          opened_at: new Date().toISOString(),
          reward: reward,
        })
        .eq('id', boxId);

      if (updateError) throw updateError;

      // Apply reward effects
      const result = await this.applyReward(userId, reward);

      return {
        box: { ...box, is_opened: true, opened_at: new Date().toISOString(), reward },
        reward,
        isNew: true,
        xpAwarded: result.xpAwarded,
      };
    } catch (error) {
      console.error('Error opening surprise box:', error);
      return null;
    }
  }

  /**
   * Generate random reward based on box type
   */
  private static generateRandomReward(boxType: SurpriseBox['box_type']): SurpriseReward {
    const pool = this.REWARD_POOLS[boxType];
    const random = Math.random() * 100;

    let cumulativeChance = 0;
    let selectedRarity: SurpriseReward['rarity'] = 'common';

    // Determine rarity based on weighted chances
    for (const [rarity, chance] of Object.entries(pool)) {
      cumulativeChance += chance;
      if (random <= cumulativeChance) {
        selectedRarity = rarity as SurpriseReward['rarity'];
        break;
      }
    }

    // Select random reward from rarity pool
    const availableRewards = this.REWARDS[selectedRarity];
    const randomIndex = Math.floor(Math.random() * availableRewards.length);

    return { ...availableRewards[randomIndex] };
  }

  /**
   * Apply reward effects to user
   */
  private static async applyReward(
    userId: string,
    reward: SurpriseReward,
  ): Promise<{ xpAwarded?: number; success: boolean }> {
    try {
      let xpAwarded = 0;

      switch (reward.type) {
        case 'xp':
          const { XPEngine } = await import('./xp-engine');
          const xpResult = await XPEngine.awardXP(userId, {
            type: 'achievement',
            description: reward.description,
            baseXP: reward.value,
          });
          xpAwarded = xpResult.xpGained;
          break;

        case 'double_xp':
          // Store double XP effect in user preferences or separate table
          await this.applyTemporaryEffect(userId, 'double_xp', reward.duration || 2);
          break;

        case 'streak_freeze':
          // Store streak freeze protection
          await this.applyTemporaryEffect(userId, 'streak_freeze', reward.value);
          break;

        case 'bonus_questions':
          // Add bonus question credits
          await this.addBonusCredits(userId, 'questions', reward.value);
          break;

        case 'special_badge':
          // Award special achievement
          await this.awardSpecialBadge(userId, reward.name, reward.description, reward.icon);
          break;

        case 'achievement':
          // This would unlock a specific achievement
          break;
      }

      return { xpAwarded, success: true };
    } catch (error) {
      console.error('Error applying reward:', error);
      return { success: false };
    }
  }

  /**
   * Apply temporary effect to user
   */
  private static async applyTemporaryEffect(
    userId: string,
    effectType: string,
    duration: number,
  ): Promise<void> {
    const expiresAt = new Date();

    if (effectType === 'double_xp') {
      expiresAt.setHours(expiresAt.getHours() + duration);
    } else if (effectType === 'streak_freeze') {
      expiresAt.setDate(expiresAt.getDate() + duration);
    }

    await supabase.from('user_effects').upsert({
      user_id: userId,
      effect_type: effectType,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });
  }

  /**
   * Add bonus credits to user
   */
  private static async addBonusCredits(
    userId: string,
    creditType: string,
    amount: number,
  ): Promise<void> {
    await supabase.from('user_credits').upsert(
      {
        user_id: userId,
        credit_type: creditType,
        amount: amount,
      },
      {
        onConflict: 'user_id,credit_type',
      },
    );
  }

  /**
   * Award special badge
   */
  private static async awardSpecialBadge(
    userId: string,
    name: string,
    description: string,
    icon: string,
  ): Promise<void> {
    // Create or find special achievement
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .upsert({
        name,
        description,
        icon,
        category: 'special',
        criteria: { type: 'special_event', value: 1 },
        xp_reward: 100,
        rarity: 'epic',
        is_active: true,
      })
      .select()
      .single();

    if (achievementError || !achievement) return;

    // Award to user
    await supabase.from('user_achievements').upsert({
      user_id: userId,
      achievement_id: achievement.id,
    });
  }

  /**
   * Get user's surprise boxes
   */
  static async getUserSurpriseBoxes(userId: string): Promise<SurpriseBox[]> {
    try {
      const { data, error } = await supabase
        .from('surprise_boxes')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching surprise boxes:', error);
      return [];
    }
  }

  /**
   * Get unopened surprise boxes for user
   */
  static async getUnopenedBoxes(userId: string): Promise<SurpriseBox[]> {
    try {
      const { data, error } = await supabase
        .from('surprise_boxes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_opened', false)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unopened boxes:', error);
      return [];
    }
  }

  /**
   * Check if user should receive daily surprise box
   */
  static async checkDailySurpriseBox(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('surprise_boxes')
        .select('id')
        .eq('user_id', userId)
        .eq('box_type', 'daily')
        .gte('earned_at', today + 'T00:00:00')
        .lt('earned_at', today + 'T23:59:59')
        .single();

      // If no box found for today, user should receive one
      return error?.code === 'PGRST116';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get active user effects
   */
  static async getUserActiveEffects(userId: string): Promise<any[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_effects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', now);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user effects:', error);
      return [];
    }
  }

  /**
   * Check for milestone-based surprise boxes
   */
  static async checkMilestoneSurpriseBoxes(
    userId: string,
    newStats: { level?: number; totalXP?: number; questionsTotal?: number; streak?: number },
  ): Promise<void> {
    try {
      const boxes: Array<{ type: SurpriseBox['box_type']; reason: string }> = [];

      // Level milestones
      if (newStats.level && [5, 10, 20, 50].includes(newStats.level)) {
        boxes.push({
          type: 'milestone',
          reason: `Seviye ${newStats.level} milestone`,
        });
      }

      // XP milestones
      if (newStats.totalXP && [1000, 2500, 5000, 10000].includes(newStats.totalXP)) {
        boxes.push({
          type: 'milestone',
          reason: `${newStats.totalXP} XP milestone`,
        });
      }

      // Question milestones
      if (newStats.questionsTotal && [100, 250, 500, 1000].includes(newStats.questionsTotal)) {
        boxes.push({
          type: 'milestone',
          reason: `${newStats.questionsTotal} soru milestone`,
        });
      }

      // Streak milestones
      if (newStats.streak && [7, 14, 30, 50].includes(newStats.streak)) {
        boxes.push({
          type: 'milestone',
          reason: `${newStats.streak} günlük seri milestone`,
        });
      }

      // Award boxes
      for (const box of boxes) {
        await this.awardSurpriseBox(userId, box.type, box.reason);
      }
    } catch (error) {
      console.error('Error checking milestone surprise boxes:', error);
    }
  }
}
