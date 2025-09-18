/**
 * Friends System API
 * Database integration for SARA platform friends and social features
 */

import { supabase } from '@/lib/supabase/client';

// ===================================================================
// TYPES AND INTERFACES
// ===================================================================

export interface Friend {
  id: string;
  name: string;
  email?: string;
  questionsToday: number;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  isActive: boolean;
  lastSeen: string;
  profileImageUrl?: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  recipientId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  requestSource: 'search' | 'room_encounter' | 'mutual_friends' | 'qr_code' | 'suggestion';
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
}

export interface FriendSearchResult {
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  totalXP: number;
  profileImageUrl?: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  activityType: string;
  activityDescription: string;
  activityValue: number;
  subjectName?: string;
  isPublic: boolean;
  createdAt: string;
}

// ===================================================================
// FRIEND MANAGEMENT FUNCTIONS
// ===================================================================

/**
 * Get user's active friends with their current stats
 */
export async function getUserFriends(
  userId: string,
): Promise<{ data: Friend[] | null; error: any }> {
  try {
    console.log('Getting friends for user:', userId);

    // Get friends with their current stats using a complex query
    const { data, error } = await supabase
      .from('user_friends')
      .select(
        `
        id,
        friend_id,
        user_profiles!user_friends_friend_id_fkey (
          full_name,
          email,
          profile_image_url
        ),
        user_statistics!user_friends_friend_id_fkey (
          total_xp,
          current_level,
          current_streak,
          questions_today,
          last_activity_date
        )
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching friends:', error);
      return { data: null, error };
    }

    // Transform the data to match our Friend interface
    const friends: Friend[] = (data || []).map((friendship) => {
      const profile = friendship.user_profiles;
      const stats = friendship.user_statistics;
      const lastActivity = stats?.last_activity_date;
      const today = new Date().toISOString().split('T')[0];

      return {
        id: friendship.friend_id,
        name: profile?.full_name || 'Unknown User',
        email: profile?.email,
        questionsToday: stats?.questions_today || 0,
        totalXP: stats?.total_xp || 0,
        currentLevel: stats?.current_level || 1,
        currentStreak: stats?.current_streak || 0,
        isActive: lastActivity === today,
        lastSeen: lastActivity || new Date().toISOString(),
        profileImageUrl: profile?.profile_image_url,
      };
    });

    console.log('Friends data retrieved:', friends.length, 'friends');
    return { data: friends, error: null };
  } catch (error) {
    console.error('Exception in getUserFriends:', error);
    return { data: null, error };
  }
}

/**
 * Search for users to add as friends
 */
export async function searchUsers(
  query: string,
  currentUserId: string,
): Promise<{ data: FriendSearchResult[] | null; error: any }> {
  try {
    console.log('Searching users with query:', query);

    if (!query || query.trim().length < 2) {
      return { data: [], error: null };
    }

    // Search users by name or email
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        user_id,
        full_name,
        email,
        profile_image_url,
        user_statistics (
          total_xp,
          current_level
        )
      `,
      )
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('user_id', currentUserId)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return { data: null, error };
    }

    // Check existing friendships and pending requests
    const userIds = data?.map((user) => user.user_id) || [];

    const [friendships, pendingRequests] = await Promise.all([
      supabase
        .from('user_friends')
        .select('friend_id')
        .eq('user_id', currentUserId)
        .in('friend_id', userIds)
        .eq('status', 'active'),

      supabase
        .from('friend_requests')
        .select('recipient_id')
        .eq('requester_id', currentUserId)
        .in('recipient_id', userIds)
        .eq('status', 'pending'),
    ]);

    const existingFriends = new Set(friendships.data?.map((f) => f.friend_id) || []);
    const pendingRequestUsers = new Set(pendingRequests.data?.map((r) => r.recipient_id) || []);

    // Transform results
    const searchResults: FriendSearchResult[] = (data || []).map((user) => ({
      id: user.user_id,
      name: user.full_name || 'Unknown User',
      email: user.email || '',
      currentLevel: user.user_statistics?.current_level || 1,
      totalXP: user.user_statistics?.total_xp || 0,
      profileImageUrl: user.profile_image_url,
      isAlreadyFriend: existingFriends.has(user.user_id),
      hasPendingRequest: pendingRequestUsers.has(user.user_id),
    }));

    console.log('User search results:', searchResults.length, 'users found');
    return { data: searchResults, error: null };
  } catch (error) {
    console.error('Exception in searchUsers:', error);
    return { data: null, error };
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  requesterId: string,
  recipientId: string,
  message?: string,
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Sending friend request:', { requesterId, recipientId, message });

    // Use the database function to send friend request
    const { data, error } = await supabase.rpc('send_friend_request', {
      p_requester_id: requesterId,
      p_recipient_id: recipientId,
      p_message: message || null,
    });

    if (error) {
      console.error('Error sending friend request:', error);
      return { data: null, error };
    }

    console.log('Friend request sent successfully, request ID:', data);
    return { data: data, error: null };
  } catch (error) {
    console.error('Exception in sendFriendRequest:', error);
    return { data: null, error };
  }
}

/**
 * Get pending friend requests for a user (both sent and received)
 */
export async function getFriendRequests(userId: string): Promise<{
  data: { received: FriendRequest[]; sent: FriendRequest[] } | null;
  error: any;
}> {
  try {
    console.log('Getting friend requests for user:', userId);

    // Get received requests
    const { data: receivedData, error: receivedError } = await supabase
      .from('friend_requests')
      .select(
        `
        id,
        requester_id,
        recipient_id,
        message,
        status,
        request_source,
        created_at,
        expires_at,
        responded_at,
        user_profiles!friend_requests_requester_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (receivedError) {
      console.error('Error fetching received friend requests:', receivedError);
      return { data: null, error: receivedError };
    }

    // Get sent requests
    const { data: sentData, error: sentError } = await supabase
      .from('friend_requests')
      .select(
        `
        id,
        requester_id,
        recipient_id,
        message,
        status,
        request_source,
        created_at,
        expires_at,
        responded_at,
        user_profiles!friend_requests_recipient_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (sentError) {
      console.error('Error fetching sent friend requests:', sentError);
      return { data: null, error: sentError };
    }

    // Transform received requests
    const received: FriendRequest[] = (receivedData || []).map((request) => ({
      id: request.id,
      requesterId: request.requester_id,
      requesterName: request.user_profiles?.full_name || 'Unknown User',
      requesterEmail: request.user_profiles?.email,
      recipientId: request.recipient_id,
      message: request.message,
      status: request.status,
      requestSource: request.request_source,
      createdAt: request.created_at,
      expiresAt: request.expires_at,
      respondedAt: request.responded_at,
    }));

    // Transform sent requests
    const sent: FriendRequest[] = (sentData || []).map((request) => ({
      id: request.id,
      requesterId: request.requester_id,
      requesterName: request.user_profiles?.full_name || 'Unknown User',
      requesterEmail: request.user_profiles?.email,
      recipientId: request.recipient_id,
      message: request.message,
      status: request.status,
      requestSource: request.request_source,
      createdAt: request.created_at,
      expiresAt: request.expires_at,
      respondedAt: request.responded_at,
    }));

    console.log('Friend requests retrieved:', {
      received: received.length,
      sent: sent.length,
    });

    return {
      data: { received, sent },
      error: null,
    };
  } catch (error) {
    console.error('Exception in getFriendRequests:', error);
    return { data: null, error };
  }
}

/**
 * Respond to a friend request (accept or decline)
 */
export async function respondToFriendRequest(
  requestId: string,
  response: 'accepted' | 'declined',
  userId: string,
): Promise<{ data: boolean; error: any }> {
  try {
    console.log('Responding to friend request:', { requestId, response, userId });

    // Update the friend request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({
        status: response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('recipient_id', userId); // Ensure user can only respond to their own requests

    if (updateError) {
      console.error('Error updating friend request:', updateError);
      return { data: false, error: updateError };
    }

    // If accepted, create the friendship
    if (response === 'accepted') {
      // Get the request details
      const { data: requestData, error: requestError } = await supabase
        .from('friend_requests')
        .select('requester_id, recipient_id')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Error fetching request details:', requestError);
        return { data: false, error: requestError };
      }

      // Create bidirectional friendship
      const friendshipPromises = [
        supabase.from('user_friends').insert({
          user_id: requestData.requester_id,
          friend_id: requestData.recipient_id,
          status: 'active',
        }),
        supabase.from('user_friends').insert({
          user_id: requestData.recipient_id,
          friend_id: requestData.requester_id,
          status: 'active',
        }),
      ];

      const friendshipResults = await Promise.all(friendshipPromises);

      // Check for errors in friendship creation
      for (const result of friendshipResults) {
        if (result.error) {
          console.error('Error creating friendship:', result.error);
          return { data: false, error: result.error };
        }
      }

      // Create notification for requester
      await supabase.from('notifications').insert({
        user_id: requestData.requester_id,
        notification_type: 'social_activity',
        title: 'Arkadaşlık İsteği Kabul Edildi',
        message: 'Arkadaşlık isteğin kabul edildi!',
        related_user_id: requestData.recipient_id,
      });

      console.log('Friendship created successfully');
    }

    console.log('Friend request response processed successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('Exception in respondToFriendRequest:', error);
    return { data: false, error };
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(
  userId: string,
  friendId: string,
): Promise<{ data: boolean; error: any }> {
  try {
    console.log('Removing friend:', { userId, friendId });

    // Remove bidirectional friendship
    const removePromises = [
      supabase.from('user_friends').delete().eq('user_id', userId).eq('friend_id', friendId),
      supabase.from('user_friends').delete().eq('user_id', friendId).eq('friend_id', userId),
    ];

    const results = await Promise.all(removePromises);

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error removing friendship:', result.error);
        return { data: false, error: result.error };
      }
    }

    console.log('Friendship removed successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('Exception in removeFriend:', error);
    return { data: false, error };
  }
}

// ===================================================================
// SOCIAL ACTIVITY FUNCTIONS
// ===================================================================

/**
 * Get friends' recent activities for activity feed
 */
export async function getFriendsActivity(
  userId: string,
  limit: number = 20,
): Promise<{ data: UserActivity[] | null; error: any }> {
  try {
    console.log('Getting friends activity for user:', userId);

    // Get friends list first
    const { data: friends, error: friendsError } = await supabase
      .from('user_friends')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (friendsError) {
      console.error('Error fetching friends for activity:', friendsError);
      return { data: null, error: friendsError };
    }

    if (!friends || friends.length === 0) {
      return { data: [], error: null };
    }

    const friendIds = friends.map((f) => f.friend_id);

    // Get public activities from friends
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity_log')
      .select(
        `
        id,
        user_id,
        activity_type,
        activity_description,
        activity_value,
        created_at,
        subjects (name),
        user_profiles!user_activity_log_user_id_fkey (full_name)
      `,
      )
      .in('user_id', friendIds)
      .eq('is_public', true)
      .eq('is_feed_visible', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activitiesError) {
      console.error('Error fetching friends activities:', activitiesError);
      return { data: null, error: activitiesError };
    }

    // Transform activities
    const transformedActivities: UserActivity[] = (activities || []).map((activity) => ({
      id: activity.id,
      userId: activity.user_id,
      userName: activity.user_profiles?.full_name || 'Unknown User',
      activityType: activity.activity_type,
      activityDescription: activity.activity_description,
      activityValue: activity.activity_value || 0,
      subjectName: activity.subjects?.name,
      isPublic: true,
      createdAt: activity.created_at,
    }));

    console.log('Friends activities retrieved:', transformedActivities.length, 'activities');
    return { data: transformedActivities, error: null };
  } catch (error) {
    console.error('Exception in getFriendsActivity:', error);
    return { data: null, error };
  }
}

/**
 * Get leaderboard of friends
 */
export async function getFriendsLeaderboard(userId: string): Promise<{
  data: Array<{
    id: string;
    name: string;
    totalXP: number;
    currentLevel: number;
    questionsToday: number;
    currentStreak: number;
    rank: number;
  }> | null;
  error: any;
}> {
  try {
    console.log('Getting friends leaderboard for user:', userId);

    // Get friends with their stats
    const { data: friends, error } = await getUserFriends(userId);

    if (error) {
      return { data: null, error };
    }

    // Include current user in leaderboard
    const { data: currentUserStats, error: userError } = await supabase
      .from('user_statistics')
      .select('total_xp, current_level, questions_today, current_streak')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching current user stats:', userError);
      return { data: null, error: userError };
    }

    const { data: currentUserProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching current user profile:', profileError);
      return { data: null, error: profileError };
    }

    // Combine friends and current user
    const allUsers = [
      {
        id: userId,
        name: currentUserProfile.full_name || 'You',
        totalXP: currentUserStats.total_xp || 0,
        currentLevel: currentUserStats.current_level || 1,
        questionsToday: currentUserStats.questions_today || 0,
        currentStreak: currentUserStats.current_streak || 0,
      },
      ...(friends || []).map((friend) => ({
        id: friend.id,
        name: friend.name,
        totalXP: friend.totalXP,
        currentLevel: friend.currentLevel,
        questionsToday: friend.questionsToday,
        currentStreak: friend.currentStreak,
      })),
    ];

    // Sort by total XP and assign ranks
    const leaderboard = allUsers
      .sort((a, b) => b.totalXP - a.totalXP)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    console.log('Friends leaderboard generated:', leaderboard.length, 'users');
    return { data: leaderboard, error: null };
  } catch (error) {
    console.error('Exception in getFriendsLeaderboard:', error);
    return { data: null, error };
  }
}
