-- Create Missing RLS Policies for Gamification Tables
-- Migration: 007_create_missing_rls_policies.sql
-- Description: Add missing RLS policies for user_xp, xp_logs, achievements, and user_achievements tables

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own XP" ON user_xp;
DROP POLICY IF EXISTS "Users can insert own XP" ON user_xp;
DROP POLICY IF EXISTS "Users can update own XP" ON user_xp;
DROP POLICY IF EXISTS "Users can view own XP logs" ON xp_logs;
DROP POLICY IF EXISTS "Users can insert own XP logs" ON xp_logs;
DROP POLICY IF EXISTS "Everyone can view achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view own user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- Create policies for user_xp table
CREATE POLICY "Users can view own XP" ON user_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP" ON user_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own XP" ON user_xp
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for xp_logs table
CREATE POLICY "Users can view own XP logs" ON xp_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP logs" ON xp_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for achievements table (everyone can read achievements)
CREATE POLICY "Everyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- Create policies for user_achievements table
CREATE POLICY "Users can view own user achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user_profiles table
CREATE POLICY "Users can view own profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);