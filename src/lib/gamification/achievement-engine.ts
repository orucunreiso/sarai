import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'streak' | 'level' | 'special' | 'progress';
  criteria: AchievementCriteria;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementCriteria {
  type:
    | 'questions_solved'
    | 'streak_reached'
    | 'level_reached'
    | 'xp_earned'
    | 'login_days'
    | 'special_event';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface AchievementUnlock {
  achievement: Achievement;
  isNew: boolean;
  xpAwarded: number;
}

/**
 * Achievement system for managing user badges and rewards
 */
export class AchievementEngine {
  /**
   * Check and unlock achievements for user based on current activity
   */
  static async checkAndUnlockAchievements(
    userId: string,
    activityType: 'question_solved' | 'level_up' | 'streak_milestone' | 'login' | 'setup_complete',
  ): Promise<AchievementUnlock[]> {
    try {
      const [userStats, userAchievements, availableAchievements] = await Promise.all([
        this.getUserStats(userId),
        this.getUserAchievements(userId),
        this.getAvailableAchievements(),
      ]);

      if (!userStats) return [];

      const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievement_id));
      const newUnlocks: AchievementUnlock[] = [];

      // Check each available achievement
      for (const achievement of availableAchievements) {
        // Skip if already unlocked
        if (unlockedAchievementIds.has(achievement.id)) continue;

        // Check if criteria is met
        const isMet = await this.checkCriteria(userId, achievement, userStats, activityType);
        if (isMet) {
          const unlock = await this.unlockAchievement(userId, achievement);
          if (unlock) {
            newUnlocks.push(unlock);
          }
        }
      }

      return newUnlocks;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Check if achievement criteria is met
   */
  private static async checkCriteria(
    userId: string,
    achievement: Achievement,
    userStats: any,
    activityType: string,
  ): Promise<boolean> {
    const { type, value, timeframe } = achievement.criteria;

    switch (type) {
      case 'questions_solved':
        if (timeframe === 'daily') {
          const todayCount = await this.getTodayQuestionCount(userId);
          return todayCount >= value;
        }
        return userStats.questions_solved >= value;

      case 'streak_reached':
        return userStats.study_streak >= value;

      case 'level_reached':
        return userStats.current_level >= value;

      case 'xp_earned':
        if (timeframe === 'daily') {
          const todayXP = await this.getTodayXPCount(userId);
          return todayXP >= value;
        }
        return userStats.total_xp >= value;

      case 'login_days':
        const loginDays = await this.getLoginDayCount(userId, timeframe);
        return loginDays >= value;

      case 'special_event':
        // Handle special events like setup completion
        return activityType === 'setup_complete' && value === 1;

      default:
        return false;
    }
  }

  /**
   * Unlock achievement for user and award XP
   */
  private static async unlockAchievement(
    userId: string,
    achievement: Achievement,
  ): Promise<AchievementUnlock | null> {
    try {
      // Insert achievement unlock
      const { data: userAchievement, error: unlockError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        })
        .select()
        .single();

      if (unlockError) throw unlockError;

      // Award XP for achievement
      let xpAwarded = 0;
      if (achievement.xp_reward > 0) {
        const { XPEngine } = await import('./xp-engine');
        const xpResult = await XPEngine.awardXP(userId, {
          type: 'achievement',
          description: `${achievement.name} rozetini kazandın!`,
          baseXP: achievement.xp_reward,
        });
        xpAwarded = xpResult.xpGained;
      }

      return {
        achievement,
        isNew: true,
        xpAwarded,
      };
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }

  /**
   * Get user statistics for achievement checking
   */
  private static async getUserStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  /**
   * Get all user achievements
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(
          `
          *,
          achievements (*)
        `,
        )
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  /**
   * Get all available achievements
   */
  private static async getAvailableAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  /**
   * Get today's question count for user
   */
  private static async getTodayQuestionCount(userId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('xp_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('activity_type', 'question_solved')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching today question count:', error);
      return 0;
    }
  }

  /**
   * Get today's XP count for user
   */
  private static async getTodayXPCount(userId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('xp_logs')
        .select('xp_gained')
        .eq('user_id', userId)
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59');

      if (error) throw error;
      return data?.reduce((sum, log) => sum + log.xp_gained, 0) || 0;
    } catch (error) {
      console.error('Error fetching today XP count:', error);
      return 0;
    }
  }

  /**
   * Get login day count for user
   */
  private static async getLoginDayCount(userId: string, timeframe?: string): Promise<number> {
    try {
      let dateFilter = '';
      const today = new Date();

      switch (timeframe) {
        case 'weekly':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString().split('T')[0];
          break;
        case 'monthly':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = monthAgo.toISOString().split('T')[0];
          break;
        default:
          // All time - count unique days
          const { data, error } = await supabase
            .from('xp_logs')
            .select('created_at')
            .eq('user_id', userId);

          if (error) throw error;

          const uniqueDays = new Set(data?.map((log) => log.created_at.split('T')[0]) || []);
          return uniqueDays.size;
      }

      // For weekly/monthly, count unique days in timeframe
      const { data, error } = await supabase
        .from('xp_logs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFilter + 'T00:00:00');

      if (error) throw error;

      const uniqueDays = new Set(data?.map((log) => log.created_at.split('T')[0]) || []);
      return uniqueDays.size;
    } catch (error) {
      console.error('Error fetching login day count:', error);
      return 0;
    }
  }

  /**
   * Get achievement progress for user
   */
  static async getAchievementProgress(userId: string) {
    try {
      const [userStats, userAchievements, availableAchievements] = await Promise.all([
        this.getUserStats(userId),
        this.getUserAchievements(userId),
        this.getAvailableAchievements(),
      ]);

      if (!userStats) return { unlocked: [], available: [] };

      const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
      const progressData = [];

      for (const achievement of availableAchievements) {
        const isUnlocked = unlockedIds.has(achievement.id);
        let progress = 0;

        if (!isUnlocked) {
          progress = await this.calculateProgress(userId, achievement, userStats);
        }

        progressData.push({
          achievement,
          isUnlocked,
          progress: isUnlocked ? 100 : progress,
          unlockedAt: isUnlocked
            ? userAchievements.find((ua) => ua.achievement_id === achievement.id)?.unlocked_at
            : null,
        });
      }

      return {
        unlocked: progressData.filter((p) => p.isUnlocked),
        available: progressData.filter((p) => !p.isUnlocked),
      };
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return { unlocked: [], available: [] };
    }
  }

  /**
   * Calculate progress percentage for achievement
   */
  private static async calculateProgress(
    userId: string,
    achievement: Achievement,
    userStats: any,
  ): Promise<number> {
    const { type, value, timeframe } = achievement.criteria;
    let current = 0;

    switch (type) {
      case 'questions_solved':
        current =
          timeframe === 'daily'
            ? await this.getTodayQuestionCount(userId)
            : userStats.questions_solved;
        break;
      case 'streak_reached':
        current = userStats.study_streak;
        break;
      case 'level_reached':
        current = userStats.current_level;
        break;
      case 'xp_earned':
        current = timeframe === 'daily' ? await this.getTodayXPCount(userId) : userStats.total_xp;
        break;
      case 'login_days':
        current = await this.getLoginDayCount(userId, timeframe);
        break;
      default:
        current = 0;
    }

    return Math.min(Math.round((current / value) * 100), 100);
  }

  /**
   * Get achievement statistics
   */
  static async getAchievementStats(userId: string) {
    try {
      const [userAchievements, totalAchievements] = await Promise.all([
        this.getUserAchievements(userId),
        this.getAvailableAchievements(),
      ]);

      const unlockedCount = userAchievements.length;
      const totalCount = totalAchievements.length;
      const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

      // Count by rarity
      const rarityStats = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      userAchievements.forEach((ua) => {
        if (ua.achievement) {
          rarityStats[ua.achievement.rarity as keyof typeof rarityStats]++;
        }
      });

      // Count by category
      const categoryStats = {
        study: 0,
        streak: 0,
        level: 0,
        special: 0,
        progress: 0,
      };

      userAchievements.forEach((ua) => {
        if (ua.achievement) {
          categoryStats[ua.achievement.category as keyof typeof categoryStats]++;
        }
      });

      return {
        total: {
          unlocked: unlockedCount,
          available: totalCount,
          completionRate,
        },
        byRarity: rarityStats,
        byCategory: categoryStats,
        recentUnlocks: userAchievements.slice(0, 5),
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      return {
        total: { unlocked: 0, available: 0, completionRate: 0 },
        byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 },
        byCategory: { study: 0, streak: 0, level: 0, special: 0, progress: 0 },
        recentUnlocks: [],
      };
    }
  }
}
