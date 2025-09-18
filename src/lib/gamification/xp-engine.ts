import { supabase } from '@/lib/supabase';

export interface XPActivity {
  type: 'question_solved' | 'daily_goal' | 'streak_bonus' | 'first_login' | 'achievement';
  description: string;
  baseXP: number;
  multiplier?: number;
}

export interface XPResult {
  xpGained: number;
  newTotalXP: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  streakBonus?: number;
}

export interface UserStats {
  total_xp: number;
  current_level: number;
  questions_solved: number;
  study_streak: number;
  last_activity_date: string;
}

/**
 * XP calculation and management system
 */
export class XPEngine {
  // XP values for different activities
  static readonly XP_VALUES: Record<XPActivity['type'], number> = {
    question_solved: 10,
    daily_goal: 50,
    streak_bonus: 25,
    first_login: 10,
    achievement: 0, // Variable based on achievement
  };

  // Level calculation: 100 XP per level
  static readonly XP_PER_LEVEL = 100;

  // Streak bonus multipliers
  static readonly STREAK_MULTIPLIERS: Record<number, number> = {
    3: 1.2, // 20% bonus for 3+ day streak
    7: 1.5, // 50% bonus for 7+ day streak
    14: 1.8, // 80% bonus for 14+ day streak
    30: 2.0, // 100% bonus for 30+ day streak
  };

  /**
   * Calculate level from total XP
   */
  static calculateLevel(totalXP: number): number {
    return Math.max(1, Math.floor(totalXP / this.XP_PER_LEVEL) + 1);
  }

  /**
   * Calculate XP needed for next level
   */
  static getXPForNextLevel(currentLevel: number): number {
    return currentLevel * this.XP_PER_LEVEL;
  }

  /**
   * Get current user stats
   */
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  /**
   * Initialize user stats for new user
   */
  static async initializeUserStats(userId: string): Promise<UserStats> {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .insert({
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          questions_solved: 0,
          study_streak: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing user stats:', error);
      throw error;
    }
  }

  /**
   * Calculate streak bonus based on current streak
   */
  static getStreakMultiplier(streakDays: number): number {
    for (const [days, multiplier] of Object.entries(this.STREAK_MULTIPLIERS).reverse()) {
      if (streakDays >= parseInt(days)) {
        return multiplier;
      }
    }
    return 1.0; // No bonus
  }

  /**
   * Update daily streak
   */
  static async updateStreak(userId: string): Promise<{ streakBonus: number; newStreak: number }> {
    try {
      const stats = await this.getUserStats(userId);
      if (!stats) {
        await this.initializeUserStats(userId);
        return { streakBonus: 0, newStreak: 1 };
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = new Date(stats.last_activity_date).toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let newStreak = stats.study_streak;
      let streakBonus = 0;

      if (lastActivity === today) {
        // Already active today, no streak change
        return { streakBonus: 0, newStreak };
      } else if (lastActivity === yesterday) {
        // Continuing streak
        newStreak = stats.study_streak + 1;

        // Award streak bonus for milestones
        if ([3, 7, 14, 21, 30].includes(newStreak)) {
          streakBonus = this.XP_VALUES.streak_bonus * this.getStreakMultiplier(newStreak);
        }
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }

      // Update streak in database
      await supabase
        .from('user_xp')
        .update({
          study_streak: newStreak,
          last_activity_date: today,
        })
        .eq('user_id', userId);

      return { streakBonus, newStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { streakBonus: 0, newStreak: 1 };
    }
  }

  /**
   * Award XP to user for an activity
   */
  static async awardXP(
    userId: string,
    activity: XPActivity,
    additionalData?: { questionsIncrement?: number },
  ): Promise<XPResult> {
    try {
      // Get current stats or initialize
      let stats = await this.getUserStats(userId);
      if (!stats) {
        stats = await this.initializeUserStats(userId);
      }

      const oldLevel = stats.current_level;
      const oldTotalXP = stats.total_xp;

      // Calculate base XP
      let xpGained = activity.baseXP || this.XP_VALUES[activity.type];

      // Apply multipliers
      if (activity.multiplier) {
        xpGained *= activity.multiplier;
      }

      // Apply streak bonus for question solving
      if (activity.type === 'question_solved') {
        const streakMultiplier = this.getStreakMultiplier(stats.study_streak);
        if (streakMultiplier > 1) {
          xpGained = Math.floor(xpGained * streakMultiplier);
        }
      }

      // Calculate new totals
      const newTotalXP = oldTotalXP + xpGained;
      const newLevel = this.calculateLevel(newTotalXP);
      const leveledUp = newLevel > oldLevel;

      // Update database
      const updateData: any = {
        total_xp: newTotalXP,
        current_level: newLevel,
        last_activity_date: new Date().toISOString().split('T')[0],
      };

      // Increment questions solved if applicable
      if (additionalData?.questionsIncrement) {
        updateData.questions_solved = stats.questions_solved + additionalData.questionsIncrement;
      }

      const { error: updateError } = await supabase
        .from('user_xp')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log XP activity
      await supabase.from('xp_logs').insert({
        user_id: userId,
        xp_gained: xpGained,
        activity_type: activity.type,
        description: activity.description,
      });

      return {
        xpGained,
        newTotalXP,
        oldLevel,
        newLevel,
        leveledUp,
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  }

  /**
   * Check and award daily goal completion
   */
  static async checkDailyGoal(userId: string): Promise<XPResult | null> {
    try {
      // Get user's daily goal and progress
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('daily_goal')
        .eq('user_id', userId)
        .single();

      if (!preferences) return null;

      const stats = await this.getUserStats(userId);
      if (!stats) return null;

      // Check if daily goal was completed today
      const today = new Date().toISOString().split('T')[0];

      // Get today's questions count
      const { data: todayLogs } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'question_solved')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59');

      const todayQuestions = todayLogs?.length || 0;

      // Check if already awarded daily goal today
      const { data: dailyGoalAwarded } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'daily_goal')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59')
        .single();

      // Award if goal reached and not yet awarded today
      if (todayQuestions >= preferences.daily_goal && !dailyGoalAwarded) {
        return await this.awardXP(userId, {
          type: 'daily_goal',
          description: `Günlük hedef tamamlandı! (${todayQuestions}/${preferences.daily_goal} soru)`,
          baseXP: this.XP_VALUES.daily_goal,
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking daily goal:', error);
      return null;
    }
  }

  /**
   * Get recent XP activities for user
   */
  static async getRecentActivities(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  /**
   * Get XP leaderboard (for future social features)
   */
  static async getLeaderboard(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select(
          `
          total_xp,
          current_level,
          questions_solved,
          user_profiles!inner(full_name)
        `,
        )
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
