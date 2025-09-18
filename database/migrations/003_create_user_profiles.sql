-- Migration: 003_create_user_profiles.sql
-- Description: Create user profiles and preferences tables
-- Created: 2025-01-14

-- User profiles table for additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  grade INTEGER CHECK (grade IN (9, 10, 11, 12)),
  target_university TEXT,
  target_department TEXT,
  study_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table for app settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  daily_goal INTEGER DEFAULT 5 CHECK (daily_goal > 0),
  preferred_subjects TEXT[] DEFAULT '{}',
  study_reminders BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00:00',
  language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification tables for XP and achievements
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level > 0),
  questions_solved INTEGER DEFAULT 0 CHECK (questions_solved >= 0),
  study_streak INTEGER DEFAULT 0 CHECK (study_streak >= 0),
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- XP activity log for tracking XP gains
CREATE TABLE IF NOT EXISTS xp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_gained INTEGER NOT NULL CHECK (xp_gained > 0),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('question_solved', 'daily_goal', 'streak_bonus', 'first_login', 'achievement')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements/Badges system
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('progress', 'streak', 'milestone', 'special')),
  condition_type TEXT NOT NULL CHECK (condition_type IN ('questions_count', 'streak_days', 'xp_total', 'daily_goals')),
  condition_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON user_xp(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON xp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- Insert some default achievements
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('İlk Adım', 'Platform''a hoş geldin! İlk giriş yaptın.', '🎉', 'milestone', 'questions_count', 0, 10, 'common'),
('Başlangıç', 'İlk sorunu çözdün!', '🎯', 'milestone', 'questions_count', 1, 25, 'common'),
('Çalışkan', '5 soru çözdün!', '📚', 'progress', 'questions_count', 5, 50, 'common'),
('Kararlı', '10 soru çözdün!', '💪', 'progress', 'questions_count', 10, 100, 'rare'),
('Azimli', '25 soru çözdün!', '🚀', 'progress', 'questions_count', 25, 200, 'rare'),
('Ustalaşan', '50 soru çözdün!', '⭐', 'progress', 'questions_count', 50, 500, 'epic'),
('Efsane', '100 soru çözdün!', '👑', 'progress', 'questions_count', 100, 1000, 'legendary'),
('İstikrar', '3 gün üst üste çalıştın!', '🔥', 'streak', 'streak_days', 3, 75, 'common'),
('Disiplin', '7 gün üst üste çalıştın!', '💎', 'streak', 'streak_days', 7, 200, 'rare'),
('Efsane Seri', '30 gün üst üste çalıştın!', '🏆', 'streak', 'streak_days', 30, 1000, 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION calculate_level(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, (total_xp / 100) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to update user level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_level = calculate_level(NEW.total_xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update level when XP changes
CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF total_xp ON user_xp
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_xp_updated_at
  BEFORE UPDATE ON user_xp
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();