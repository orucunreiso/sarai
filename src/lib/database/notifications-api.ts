/**
 * Notifications System API
 * Database integration for SARA platform notifications and achievements
 */

import { supabase } from '@/lib/supabase/client';

// ===================================================================
// TYPES AND INTERFACES
// ===================================================================

export interface Notification {
  id: string;
  userId: string;
  notificationType:
    | 'achievement'
    | 'friend_request'
    | 'room_invite'
    | 'daily_reminder'
    | 'streak_warning'
    | 'goal_achieved'
    | 'system_update'
    | 'social_activity';
  title: string;
  message: string;
  actionUrl?: string;
  actionData?: Record<string, any>;
  relatedUserId?: string;
  relatedRoomId?: string;
  relatedAchievementId?: string;
  isRead: boolean;
  isDelivered: boolean;
  deliveryMethod: string[];
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor: string;
  expiresAt?: string;
  deliveredAt?: string;
  readAt?: string;
  clickedAt?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  badgeColor: string;
  category: string;
  achievementType: string;
  condition: Record<string, any>;
  rewards: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  earnedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface NotificationSettings {
  userId: string;
  achievements: boolean;
  friendRequests: boolean;
  dailyReminders: boolean;
  streakWarnings: boolean;
  goalAchieved: boolean;
  socialActivity: boolean;
  studyRoomInvites: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// ===================================================================
// NOTIFICATION MANAGEMENT FUNCTIONS
// ===================================================================

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    types?: string[];
  } = {},
): Promise<{ data: Notification[] | null; error: any }> {
  try {
    console.log('Getting notifications for user:', userId, options);

    let query = supabase
      .from('notifications')
      .select(
        `
        id,
        user_id,
        notification_type,
        title,
        message,
        action_url,
        action_data,
        related_user_id,
        related_room_id,
        related_achievement_id,
        is_read,
        is_delivered,
        delivery_method,
        priority_level,
        scheduled_for,
        expires_at,
        delivered_at,
        read_at,
        clicked_at,
        created_at
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options.types && options.types.length > 0) {
      query = query.in('notification_type', options.types);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }

    // Transform notifications
    const notifications: Notification[] = (data || []).map((notification) => ({
      id: notification.id,
      userId: notification.user_id,
      notificationType: notification.notification_type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.action_url,
      actionData: notification.action_data,
      relatedUserId: notification.related_user_id,
      relatedRoomId: notification.related_room_id,
      relatedAchievementId: notification.related_achievement_id,
      isRead: notification.is_read,
      isDelivered: notification.is_delivered,
      deliveryMethod: notification.delivery_method || [],
      priorityLevel: notification.priority_level,
      scheduledFor: notification.scheduled_for,
      expiresAt: notification.expires_at,
      deliveredAt: notification.delivered_at,
      readAt: notification.read_at,
      clickedAt: notification.clicked_at,
      createdAt: notification.created_at,
    }));

    console.log('Notifications retrieved:', notifications.length, 'notifications');
    return { data: notifications, error: null };
  } catch (error) {
    console.error('Exception in getUserNotifications:', error);
    return { data: null, error };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<{ data: boolean; error: any }> {
  try {
    console.log('Marking notification as read:', { notificationId, userId });

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId); // Ensure user can only update their own notifications

    if (error) {
      console.error('Error marking notification as read:', error);
      return { data: false, error };
    }

    console.log('Notification marked as read successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('Exception in markNotificationAsRead:', error);
    return { data: false, error };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<{ data: boolean; error: any }> {
  try {
    console.log('Marking all notifications as read for user:', userId);

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { data: false, error };
    }

    console.log('All notifications marked as read successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('Exception in markAllNotificationsAsRead:', error);
    return { data: false, error };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<{ data: boolean; error: any }> {
  try {
    console.log('Deleting notification:', { notificationId, userId });

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId); // Ensure user can only delete their own notifications

    if (error) {
      console.error('Error deleting notification:', error);
      return { data: false, error };
    }

    console.log('Notification deleted successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('Exception in deleteNotification:', error);
    return { data: false, error };
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  options: {
    actionUrl?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    relatedUserId?: string;
    relatedRoomId?: string;
    relatedAchievementId?: string;
    scheduledFor?: string;
    expiresAt?: string;
  } = {},
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Creating notification:', { userId, type, title, message, options });

    // Use the database function to create notification
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_action_url: options.actionUrl || null,
      p_priority: options.priority || 'normal',
      p_related_user_id: options.relatedUserId || null,
      p_related_room_id: options.relatedRoomId || null,
      p_related_achievement_id: options.relatedAchievementId || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return { data: null, error };
    }

    console.log('Notification created successfully, ID:', data);
    return { data: data, error: null };
  } catch (error) {
    console.error('Exception in createNotification:', error);
    return { data: null, error };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<{ data: number; error: any }> {
  try {
    console.log('Getting unread notification count for user:', userId);

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread notification count:', error);
      return { data: 0, error };
    }

    console.log('Unread notification count:', count || 0);
    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Exception in getUnreadNotificationCount:', error);
    return { data: 0, error };
  }
}

// ===================================================================
// ACHIEVEMENT FUNCTIONS
// ===================================================================

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string): Promise<{
  data: { earned: Achievement[]; available: Achievement[] } | null;
  error: any;
}> {
  try {
    console.log('Getting achievements for user:', userId);

    // Get all achievements with user progress
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select(
        `
        id,
        name,
        display_name,
        description,
        icon,
        badge_color,
        category,
        achievement_type,
        condition,
        rewards,
        is_active,
        sort_order,
        user_achievements!left (
          earned_at,
          progress,
          max_progress
        )
      `,
      )
      .eq('is_active', true)
      .order('sort_order');

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return { data: null, error: achievementsError };
    }

    // Separate earned and available achievements
    const earned: Achievement[] = [];
    const available: Achievement[] = [];

    (achievements || []).forEach((achievement) => {
      const userAchievement = achievement.user_achievements?.[0];
      const isEarned = userAchievement?.earned_at !== null;

      const achievementData: Achievement = {
        id: achievement.id,
        name: achievement.name,
        displayName: achievement.display_name,
        description: achievement.description,
        icon: achievement.icon,
        badgeColor: achievement.badge_color,
        category: achievement.category,
        achievementType: achievement.achievement_type,
        condition: achievement.condition || {},
        rewards: achievement.rewards || {},
        isActive: achievement.is_active,
        sortOrder: achievement.sort_order,
        earnedAt: userAchievement?.earned_at,
        progress: userAchievement?.progress || 0,
        maxProgress: userAchievement?.max_progress || achievement.condition?.target || 100,
      };

      if (isEarned) {
        earned.push(achievementData);
      } else {
        available.push(achievementData);
      }
    });

    console.log('Achievements retrieved:', {
      earned: earned.length,
      available: available.length,
    });

    return {
      data: { earned, available },
      error: null,
    };
  } catch (error) {
    console.error('Exception in getUserAchievements:', error);
    return { data: null, error };
  }
}

/**
 * Get achievement by ID with user progress
 */
export async function getAchievement(
  achievementId: string,
  userId: string,
): Promise<{ data: Achievement | null; error: any }> {
  try {
    console.log('Getting achievement:', { achievementId, userId });

    const { data: achievement, error } = await supabase
      .from('achievements')
      .select(
        `
        id,
        name,
        display_name,
        description,
        icon,
        badge_color,
        category,
        achievement_type,
        condition,
        rewards,
        is_active,
        sort_order,
        user_achievements!left (
          earned_at,
          progress,
          max_progress
        )
      `,
      )
      .eq('id', achievementId)
      .eq('user_achievements.user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching achievement:', error);
      return { data: null, error };
    }

    const userAchievement = achievement.user_achievements?.[0];

    const achievementData: Achievement = {
      id: achievement.id,
      name: achievement.name,
      displayName: achievement.display_name,
      description: achievement.description,
      icon: achievement.icon,
      badgeColor: achievement.badge_color,
      category: achievement.category,
      achievementType: achievement.achievement_type,
      condition: achievement.condition || {},
      rewards: achievement.rewards || {},
      isActive: achievement.is_active,
      sortOrder: achievement.sort_order,
      earnedAt: userAchievement?.earned_at,
      progress: userAchievement?.progress || 0,
      maxProgress: userAchievement?.max_progress || achievement.condition?.target || 100,
    };

    console.log('Achievement retrieved:', achievementData);
    return { data: achievementData, error: null };
  } catch (error) {
    console.error('Exception in getAchievement:', error);
    return { data: null, error };
  }
}

/**
 * Create achievement notification
 */
export async function createAchievementNotification(
  userId: string,
  achievementId: string,
  achievementName: string,
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Creating achievement notification:', { userId, achievementId, achievementName });

    const notificationId = await createNotification(
      userId,
      'achievement',
      '🏆 Yeni Başarı Kazandın!',
      `Tebrikler! "${achievementName}" başarısını kazandın!`,
      {
        priority: 'high',
        relatedAchievementId: achievementId,
        actionUrl: '/achievements',
      },
    );

    return notificationId;
  } catch (error) {
    console.error('Exception in createAchievementNotification:', error);
    return { data: null, error };
  }
}

/**
 * Create goal achievement notification
 */
export async function createGoalAchievementNotification(
  userId: string,
  goalType: string,
  goalValue: number,
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Creating goal achievement notification:', { userId, goalType, goalValue });

    let title = '';
    let message = '';

    switch (goalType) {
      case 'daily_questions':
        title = '🎯 Günlük Hedef Tamamlandı!';
        message = `Tebrikler! Bugün ${goalValue} soru çözerek günlük hedefini tamamladın!`;
        break;
      case 'weekly_questions':
        title = '📅 Haftalık Hedef Tamamlandı!';
        message = `Harika! Bu hafta ${goalValue} soru çözerek haftalık hedefini tamamladın!`;
        break;
      case 'streak_milestone':
        title = '🔥 Seri Kilometre Taşı!';
        message = `İnanılmaz! ${goalValue} gün üst üste çalışma serisini tamamladın!`;
        break;
      default:
        title = '🎯 Hedef Tamamlandı!';
        message = `Tebrikler! Hedefini başarıyla tamamladın!`;
    }

    const notificationId = await createNotification(userId, 'goal_achieved', title, message, {
      priority: 'high',
      actionUrl: '/dashboard',
    });

    return notificationId;
  } catch (error) {
    console.error('Exception in createGoalAchievementNotification:', error);
    return { data: null, error };
  }
}

/**
 * Create streak warning notification
 */
export async function createStreakWarningNotification(
  userId: string,
  currentStreak: number,
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Creating streak warning notification:', { userId, currentStreak });

    const notificationId = await createNotification(
      userId,
      'streak_warning',
      '⚠️ Serini Kaybetme!',
      `${currentStreak} günlük serini kaybetmemek için bugün soru çözmeyi unutma!`,
      {
        priority: 'high',
        actionUrl: '/dashboard',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    );

    return notificationId;
  } catch (error) {
    console.error('Exception in createStreakWarningNotification:', error);
    return { data: null, error };
  }
}

/**
 * Create daily reminder notification
 */
export async function createDailyReminderNotification(
  userId: string,
  reminderType: 'morning' | 'evening' = 'evening',
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Creating daily reminder notification:', { userId, reminderType });

    let title = '';
    let message = '';

    if (reminderType === 'morning') {
      title = '🌅 Günaydın!';
      message = 'Yeni bir günde hedeflerine ulaşmak için çalışmaya başla!';
    } else {
      title = '🌙 Bugünkü hedefini tamamla!';
      message = 'Gün bitmeden hedeflerini tamamlamak için son şansın!';
    }

    const notificationId = await createNotification(userId, 'daily_reminder', title, message, {
      priority: 'normal',
      actionUrl: '/dashboard',
    });

    return notificationId;
  } catch (error) {
    console.error('Exception in createDailyReminderNotification:', error);
    return { data: null, error };
  }
}
