-- Create Enhanced Social Features Tables
-- Migration: 011_create_social_extended.sql
-- Description: Extended social features including study rooms, notifications, and enhanced friends system
-- Purpose: Support collaborative study, social learning, and community features

-- ===================================================================
-- STUDY ROOMS TABLE - Virtual study rooms for collaborative learning
-- ===================================================================
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Room identification
  room_name TEXT NOT NULL,
  room_code TEXT NOT NULL UNIQUE, -- 6-character join code
  room_description TEXT,

  -- Room configuration
  room_type TEXT NOT NULL CHECK (room_type IN ('public', 'private', 'friends_only', 'invite_only')),
  max_participants INTEGER DEFAULT 8 CHECK (max_participants BETWEEN 2 AND 20),
  current_participants INTEGER DEFAULT 1 CHECK (current_participants >= 0),

  -- Study settings
  study_mode TEXT DEFAULT 'focus' CHECK (study_mode IN ('focus', 'collaboration', 'silent', 'discussion')),
  session_duration_minutes INTEGER CHECK (session_duration_minutes > 0),
  break_duration_minutes INTEGER DEFAULT 5 CHECK (break_duration_minutes >= 0),

  -- Subject and topic focus
  primary_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  study_topics TEXT[] DEFAULT '{}',
  target_grade INTEGER CHECK (target_grade BETWEEN 9 AND 12),

  -- Room status
  is_active BOOLEAN DEFAULT true,
  is_session_active BOOLEAN DEFAULT false,
  session_started_at TIMESTAMP WITH TIME ZONE,
  session_ends_at TIMESTAMP WITH TIME ZONE,

  -- Room settings
  allow_chat BOOLEAN DEFAULT true,
  allow_screen_share BOOLEAN DEFAULT false,
  allow_voice BOOLEAN DEFAULT false,
  show_participants_progress BOOLEAN DEFAULT true,
  auto_pause_enabled BOOLEAN DEFAULT true,

  -- Statistics
  total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
  total_study_time_minutes INTEGER DEFAULT 0 CHECK (total_study_time_minutes >= 0),
  average_session_duration INTEGER DEFAULT 0,

  -- Metadata
  room_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- STUDY ROOM PARTICIPANTS TABLE - Track users in study rooms
-- ===================================================================
CREATE TABLE IF NOT EXISTS study_room_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Participation status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'away', 'break', 'left', 'kicked')),
  role TEXT DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),

  -- Study tracking
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_time_in_room INTEGER DEFAULT 0 CHECK (total_time_in_room >= 0), -- minutes
  questions_solved_in_session INTEGER DEFAULT 0 CHECK (questions_solved_in_session >= 0),

  -- Session participation
  is_currently_studying BOOLEAN DEFAULT false,
  current_session_start TIMESTAMP WITH TIME ZONE,
  break_count INTEGER DEFAULT 0 CHECK (break_count >= 0),

  -- Preferences and settings
  notifications_enabled BOOLEAN DEFAULT true,
  show_my_progress BOOLEAN DEFAULT true,

  -- Performance in room
  focus_score DECIMAL(3,2) DEFAULT 0 CHECK (focus_score BETWEEN 0 AND 1),
  collaboration_score DECIMAL(3,2) DEFAULT 0 CHECK (collaboration_score BETWEEN 0 AND 1),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(room_id, user_id)
);

-- ===================================================================
-- STUDY ROOM MESSAGES TABLE - Chat messages within study rooms
-- ===================================================================
CREATE TABLE IF NOT EXISTS study_room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'emoji', 'system', 'achievement', 'question_share')),
  message_content TEXT NOT NULL,

  -- Message metadata
  is_system_message BOOLEAN DEFAULT false,
  reply_to_message_id UUID REFERENCES study_room_messages(id) ON DELETE SET NULL,

  -- Attachments and rich content
  attached_file_ids UUID[] DEFAULT '{}', -- References to file_uploads
  shared_solution_id UUID REFERENCES ai_solutions(id) ON DELETE SET NULL,
  shared_achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,

  -- Message status
  is_deleted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  edit_count INTEGER DEFAULT 0 CHECK (edit_count >= 0),
  last_edited_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- NOTIFICATIONS TABLE - User notification system
-- ===================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification identification
  notification_type TEXT NOT NULL CHECK (notification_type IN ('achievement', 'friend_request', 'room_invite', 'daily_reminder', 'streak_warning', 'goal_achieved', 'system_update', 'social_activity')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Notification data
  action_url TEXT, -- Deep link for notification action
  action_data JSONB DEFAULT '{}', -- Additional data for the action

  -- Related entities
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For friend requests, etc.
  related_room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  related_achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,

  -- Notification status
  is_read BOOLEAN DEFAULT false,
  is_delivered BOOLEAN DEFAULT false,
  delivery_method TEXT[] DEFAULT '{}', -- ['in_app', 'email', 'push']

  -- Priority and scheduling
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Delivery tracking
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- FRIEND REQUESTS TABLE - Extend existing user_friends for pending requests
-- ===================================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  message TEXT, -- Optional message with friend request
  request_source TEXT DEFAULT 'search' CHECK (request_source IN ('search', 'room_encounter', 'mutual_friends', 'qr_code', 'suggestion')),

  -- Request status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),

  -- Timestamps
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  responded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);

-- ===================================================================
-- USER ACTIVITY LOG TABLE - Track user activities for social features
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity identification
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'question_solved', 'goal_achieved', 'achievement_earned', 'room_joined', 'room_created', 'friend_added', 'streak_extended')),
  activity_description TEXT NOT NULL,

  -- Activity context
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  room_id UUID REFERENCES study_rooms(id) ON DELETE SET NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,

  -- Activity data
  activity_value INTEGER DEFAULT 0, -- Numeric value (questions solved, XP gained, etc.)
  activity_metadata JSONB DEFAULT '{}',

  -- Visibility settings
  is_public BOOLEAN DEFAULT true, -- Whether friends can see this activity
  is_feed_visible BOOLEAN DEFAULT true, -- Whether to show in activity feed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- RLS POLICIES - Study Rooms
-- ===================================================================
CREATE POLICY "Users can view accessible study rooms" ON study_rooms
  FOR SELECT USING (
    owner_id = auth.uid() OR
    room_type = 'public' OR
    (room_type = 'friends_only' AND owner_id IN (
      SELECT CASE WHEN user_id = auth.uid() THEN friend_id ELSE user_id END
      FROM user_friends
      WHERE (user_id = auth.uid() OR friend_id = auth.uid()) AND status = 'active'
    )) OR
    id IN (SELECT room_id FROM study_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create study rooms" ON study_rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can update their rooms" ON study_rooms
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Room owners can delete their rooms" ON study_rooms
  FOR DELETE USING (auth.uid() = owner_id);

-- ===================================================================
-- RLS POLICIES - Study Room Participants
-- ===================================================================
CREATE POLICY "Users can view participants of accessible rooms" ON study_room_participants
  FOR SELECT USING (
    room_id IN (SELECT id FROM study_rooms WHERE owner_id = auth.uid()) OR
    user_id = auth.uid() OR
    room_id IN (SELECT room_id FROM study_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join rooms" ON study_room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON study_room_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users and room owners can manage participation" ON study_room_participants
  FOR DELETE USING (
    auth.uid() = user_id OR
    room_id IN (SELECT id FROM study_rooms WHERE owner_id = auth.uid())
  );

-- ===================================================================
-- RLS POLICIES - Study Room Messages
-- ===================================================================
CREATE POLICY "Participants can view room messages" ON study_room_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM study_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Participants can send messages" ON study_room_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (SELECT room_id FROM study_room_participants WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Users can edit own messages" ON study_room_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- ===================================================================
-- RLS POLICIES - Notifications
-- ===================================================================
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ===================================================================
-- RLS POLICIES - Friend Requests
-- ===================================================================
CREATE POLICY "Users can view relevant friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update relevant friend requests" ON friend_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- ===================================================================
-- RLS POLICIES - User Activity Log
-- ===================================================================
CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' public activity" ON user_activity_log
  FOR SELECT USING (
    is_public = true AND
    user_id IN (
      SELECT CASE WHEN user_id = auth.uid() THEN friend_id ELSE user_id END
      FROM user_friends
      WHERE (user_id = auth.uid() OR friend_id = auth.uid()) AND status = 'active'
    )
  );

CREATE POLICY "Users can create own activity" ON user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- PERFORMANCE INDEXES
-- ===================================================================

-- Study Rooms indexes
CREATE INDEX IF NOT EXISTS idx_study_rooms_owner ON study_rooms(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_rooms_active ON study_rooms(is_active, room_type);
CREATE INDEX IF NOT EXISTS idx_study_rooms_code ON study_rooms(room_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_study_rooms_subject ON study_rooms(primary_subject_id, target_grade);

-- Study Room Participants indexes
CREATE INDEX IF NOT EXISTS idx_study_room_participants_room ON study_room_participants(room_id, status);
CREATE INDEX IF NOT EXISTS idx_study_room_participants_user ON study_room_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_room_participants_activity ON study_room_participants(last_activity_at DESC);

-- Study Room Messages indexes
CREATE INDEX IF NOT EXISTS idx_study_room_messages_room ON study_room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_room_messages_user ON study_room_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_room_messages_type ON study_room_messages(message_type, created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery ON notifications(is_delivered, scheduled_for) WHERE is_delivered = false;

-- Friend Requests indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient ON friend_requests(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_pending ON friend_requests(status, expires_at) WHERE status = 'pending';

-- User Activity Log indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_public ON user_activity_log(is_public, is_feed_visible, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type, created_at DESC);

-- ===================================================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE TRIGGER trigger_study_rooms_updated_at
  BEFORE UPDATE ON study_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_study_room_participants_updated_at
  BEFORE UPDATE ON study_room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- UTILITY FUNCTIONS FOR SOCIAL FEATURES
-- ===================================================================

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character code (letters and numbers)
    v_code := UPPER(
      SUBSTR(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT), 1, 6)
    );

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM study_rooms WHERE room_code = v_code) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$;

-- Function to create study room
CREATE OR REPLACE FUNCTION create_study_room(
  p_owner_id UUID,
  p_room_name TEXT,
  p_room_type TEXT DEFAULT 'private',
  p_max_participants INTEGER DEFAULT 8,
  p_primary_subject TEXT DEFAULT NULL,
  p_study_topics TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
  v_subject_id UUID;
  v_room_code TEXT;
BEGIN
  -- Get subject ID if provided
  IF p_primary_subject IS NOT NULL THEN
    SELECT id INTO v_subject_id FROM subjects WHERE name = p_primary_subject AND is_active = true;
  END IF;

  -- Generate unique room code
  v_room_code := generate_room_code();

  -- Create room
  INSERT INTO study_rooms (
    owner_id, room_name, room_code, room_type, max_participants,
    primary_subject_id, study_topics
  ) VALUES (
    p_owner_id, p_room_name, v_room_code, p_room_type, p_max_participants,
    v_subject_id, p_study_topics
  )
  RETURNING id INTO v_room_id;

  -- Add owner as participant
  INSERT INTO study_room_participants (
    room_id, user_id, role, status
  ) VALUES (
    v_room_id, p_owner_id, 'owner', 'active'
  );

  -- Log activity
  INSERT INTO user_activity_log (
    user_id, activity_type, activity_description, room_id
  ) VALUES (
    p_owner_id, 'room_created', 'Yeni çalışma odası oluşturdu: ' || p_room_name, v_room_id
  );

  RETURN v_room_id;
END;
$$;

-- Function to join study room
CREATE OR REPLACE FUNCTION join_study_room(
  p_user_id UUID,
  p_room_code TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
  v_current_count INTEGER;
  v_max_count INTEGER;
  v_room_name TEXT;
BEGIN
  -- Find room by code
  SELECT id, current_participants, max_participants, room_name
  INTO v_room_id, v_current_count, v_max_count, v_room_name
  FROM study_rooms
  WHERE room_code = p_room_code AND is_active = true;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room not found or inactive';
  END IF;

  -- Check if room is full
  IF v_current_count >= v_max_count THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Check if user is already in room
  IF EXISTS(SELECT 1 FROM study_room_participants WHERE room_id = v_room_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already in room';
  END IF;

  -- Add participant
  INSERT INTO study_room_participants (
    room_id, user_id, role, status
  ) VALUES (
    v_room_id, p_user_id, 'participant', 'active'
  );

  -- Update room participant count
  UPDATE study_rooms
  SET current_participants = current_participants + 1
  WHERE id = v_room_id;

  -- Log activity
  INSERT INTO user_activity_log (
    user_id, activity_type, activity_description, room_id
  ) VALUES (
    p_user_id, 'room_joined', 'Çalışma odasına katıldı: ' || v_room_name, v_room_id
  );

  RETURN v_room_id;
END;
$$;

-- Function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(
  p_requester_id UUID,
  p_recipient_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_recipient_name TEXT;
BEGIN
  -- Check if users are already friends
  IF EXISTS(
    SELECT 1 FROM user_friends
    WHERE ((user_id = p_requester_id AND friend_id = p_recipient_id) OR
           (user_id = p_recipient_id AND friend_id = p_requester_id))
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Users are already friends';
  END IF;

  -- Check if request already exists
  IF EXISTS(
    SELECT 1 FROM friend_requests
    WHERE requester_id = p_requester_id AND recipient_id = p_recipient_id
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Friend request already sent';
  END IF;

  -- Get recipient name for notification
  SELECT full_name INTO v_recipient_name
  FROM user_profiles
  WHERE user_id = p_recipient_id;

  -- Create friend request
  INSERT INTO friend_requests (
    requester_id, recipient_id, message
  ) VALUES (
    p_requester_id, p_recipient_id, p_message
  )
  RETURNING id INTO v_request_id;

  -- Create notification for recipient
  INSERT INTO notifications (
    user_id, notification_type, title, message,
    related_user_id, action_data
  ) VALUES (
    p_recipient_id, 'friend_request', 'Yeni Arkadaşlık İsteği',
    'Yeni bir arkadaşlık isteğin var!',
    p_requester_id, json_build_object('request_id', v_request_id)
  );

  RETURN v_request_id;
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_related_user_id UUID DEFAULT NULL,
  p_related_room_id UUID DEFAULT NULL,
  p_related_achievement_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, notification_type, title, message, action_url, priority_level,
    related_user_id, related_room_id, related_achievement_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_action_url, p_priority,
    p_related_user_id, p_related_room_id, p_related_achievement_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;