import { supabase } from '@/lib/supabase';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  daily_goal: number;
  preferred_subjects: string[];
  study_reminders: boolean;
  reminder_time: string;
  language: 'tr' | 'en';
}

export const defaultPreferences: UserPreferences = {
  theme: 'dark',
  notifications_enabled: true,
  daily_goal: 5,
  preferred_subjects: [],
  study_reminders: true,
  reminder_time: '09:00:00',
  language: 'tr',
};

export class PreferencesService {
  /**
   * Get user preferences from database
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default preferences if none exist
        const { data: newData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...defaultPreferences,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return {
        theme: data.theme || defaultPreferences.theme,
        notifications_enabled:
          data.notifications_enabled ?? defaultPreferences.notifications_enabled,
        daily_goal: data.daily_goal || defaultPreferences.daily_goal,
        preferred_subjects: data.preferred_subjects || defaultPreferences.preferred_subjects,
        study_reminders: data.study_reminders ?? defaultPreferences.study_reminders,
        reminder_time: data.reminder_time || defaultPreferences.reminder_time,
        language: data.language || defaultPreferences.language,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return defaultPreferences;
    }
  }

  /**
   * Update user preferences in database
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Reset preferences to defaults
   */
  static async resetPreferences(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: userId,
        ...defaultPreferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Get daily goal for user
   */
  static async getDailyGoal(userId: string): Promise<number> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences.daily_goal;
    } catch (error) {
      return defaultPreferences.daily_goal;
    }
  }

  /**
   * Update daily goal
   */
  static async updateDailyGoal(userId: string, dailyGoal: number): Promise<boolean> {
    return this.updateUserPreferences(userId, { daily_goal: dailyGoal });
  }

  /**
   * Get preferred subjects
   */
  static async getPreferredSubjects(userId: string): Promise<string[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences.preferred_subjects;
    } catch (error) {
      return defaultPreferences.preferred_subjects;
    }
  }

  /**
   * Update preferred subjects
   */
  static async updatePreferredSubjects(userId: string, subjects: string[]): Promise<boolean> {
    return this.updateUserPreferences(userId, { preferred_subjects: subjects });
  }

  /**
   * Toggle notifications
   */
  static async toggleNotifications(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const newValue = !preferences.notifications_enabled;

      return this.updateUserPreferences(userId, {
        notifications_enabled: newValue,
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Update theme preference
   */
  static async updateTheme(userId: string, theme: 'light' | 'dark' | 'auto'): Promise<boolean> {
    return this.updateUserPreferences(userId, { theme });
  }

  /**
   * Check if user has completed initial setup
   */
  static async hasCompletedSetup(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, grade')
        .eq('user_id', userId)
        .single();

      if (error) return false;

      return !!(data?.full_name && data?.grade);
    } catch (error) {
      return false;
    }
  }
}
