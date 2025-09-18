-- Create Dashboard Tables for Sara Dashboard
-- Migration: 006_create_dashboard_tables.sql
-- Description: Tables for manual question tracking, exam results, and friends system

-- Question Entries Table (Manual question tracking from QuickAddModal)
CREATE TABLE IF NOT EXISTS question_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT,
  question_count INTEGER NOT NULL CHECK (question_count > 0),
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN question_count > 0 THEN ROUND((correct_count::decimal / question_count::decimal) * 100, 2)
      ELSE 0
    END
  ) STORED,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Entries Table (Exam results from ExamAddModal)
CREATE TABLE IF NOT EXISTS exam_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('tyt', 'ayt', 'mixed')),
  exam_date DATE NOT NULL,
  subjects JSONB NOT NULL DEFAULT '{}', -- Subject-wise results {matematik: {total: 20, correct: 15}}
  total_questions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN total_questions > 0 THEN ROUND((total_correct::decimal / total_questions::decimal) * 100, 2)
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Friends Table (Friends system for dashboard)
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id) -- Can't be friends with yourself
);

-- Study Sessions Table (For tracking study time and activity)
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
  questions_solved INTEGER DEFAULT 0 CHECK (questions_solved >= 0),
  subjects_studied TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Goals Table (Smart goal management)
CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_date DATE DEFAULT CURRENT_DATE,
  target_questions INTEGER DEFAULT 5 CHECK (target_questions > 0),
  target_duration INTEGER DEFAULT 45 CHECK (target_duration > 0), -- minutes
  target_subjects INTEGER DEFAULT 2 CHECK (target_subjects > 0),
  achieved_questions INTEGER DEFAULT 0 CHECK (achieved_questions >= 0),
  achieved_duration INTEGER DEFAULT 0 CHECK (achieved_duration >= 0),
  achieved_subjects INTEGER DEFAULT 0 CHECK (achieved_subjects >= 0),
  is_completed BOOLEAN GENERATED ALWAYS AS (
    achieved_questions >= target_questions AND
    achieved_duration >= target_duration AND
    achieved_subjects >= target_subjects
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, goal_date)
);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE question_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Question Entries
CREATE POLICY "Users can view own question entries" ON question_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question entries" ON question_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question entries" ON question_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for Exam Entries
CREATE POLICY "Users can view own exam entries" ON exam_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam entries" ON exam_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam entries" ON exam_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for User Friends
CREATE POLICY "Users can view own friendships" ON user_friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON user_friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend requests" ON user_friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create RLS Policies for Study Sessions
CREATE POLICY "Users can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own study sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS Policies for Daily Goals
CREATE POLICY "Users can view own daily goals" ON daily_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily goals" ON daily_goals
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_entries_user_date ON question_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_question_entries_subject ON question_entries(subject, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_entries_user_date ON exam_entries(user_id, exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_entries_type ON exam_entries(exam_type, exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, goal_date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER trigger_question_entries_updated_at
  BEFORE UPDATE ON question_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_exam_entries_updated_at
  BEFORE UPDATE ON exam_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_daily_goals_updated_at
  BEFORE UPDATE ON daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial daily goal for all existing users
INSERT INTO daily_goals (user_id, goal_date, target_questions, target_duration, target_subjects)
SELECT
  id as user_id,
  CURRENT_DATE as goal_date,
  5 as target_questions,
  45 as target_duration,
  2 as target_subjects
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM daily_goals WHERE goal_date = CURRENT_DATE)
ON CONFLICT (user_id, goal_date) DO NOTHING;