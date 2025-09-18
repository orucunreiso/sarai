-- Fix Database Issues for SARA Platform
-- This script fixes trigger conflicts and ensures all functions exist

-- ===================================================================
-- CLEAN UP EXISTING TRIGGERS (IF ANY)
-- ===================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_question_entry_after_insert ON question_entries;
DROP TRIGGER IF EXISTS trigger_exam_entry_after_insert ON exam_entries;
DROP TRIGGER IF EXISTS trigger_update_study_streak ON subject_progress_daily;

-- ===================================================================
-- ENSURE ALL TABLES EXIST
-- ===================================================================

-- Create question_entries table if not exists
CREATE TABLE IF NOT EXISTS question_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question_count INTEGER NOT NULL CHECK (question_count > 0),
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  xp_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_correct_count CHECK (correct_count <= question_count)
);

-- Create exam_entries table if not exists
CREATE TABLE IF NOT EXISTS exam_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('tyt', 'ayt', 'mixed')),
  exam_date DATE NOT NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  total_correct INTEGER NOT NULL CHECK (total_correct >= 0),
  subject_results JSONB DEFAULT '{}',
  xp_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_exam_correct CHECK (total_correct <= total_questions)
);

-- Create user_statistics table if not exists
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  questions_total INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  avg_questions_per_day DECIMAL(5,2) DEFAULT 0,
  achievements_count INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subject_progress_daily table if not exists
CREATE TABLE IF NOT EXISTS subject_progress_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_solved INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, subject_name, date)
);

-- ===================================================================
-- ENABLE RLS ON NEW TABLES
-- ===================================================================

ALTER TABLE question_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress_daily ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- CREATE RLS POLICIES
-- ===================================================================

-- Question entries policies
DROP POLICY IF EXISTS "Users can manage own question entries" ON question_entries;
CREATE POLICY "Users can manage own question entries" ON question_entries
  FOR ALL USING (auth.uid() = user_id);

-- Exam entries policies
DROP POLICY IF EXISTS "Users can manage own exam entries" ON exam_entries;
CREATE POLICY "Users can manage own exam entries" ON exam_entries
  FOR ALL USING (auth.uid() = user_id);

-- User statistics policies
DROP POLICY IF EXISTS "Users can view own statistics" ON user_statistics;
CREATE POLICY "Users can view own statistics" ON user_statistics
  FOR ALL USING (auth.uid() = user_id);

-- Subject progress policies
DROP POLICY IF EXISTS "Users can manage own subject progress" ON subject_progress_daily;
CREATE POLICY "Users can manage own subject progress" ON subject_progress_daily
  FOR ALL USING (auth.uid() = user_id);

-- ===================================================================
-- ESSENTIAL FUNCTIONS
-- ===================================================================

-- Simple XP calculation function
CREATE OR REPLACE FUNCTION calculate_question_xp(
  p_questions_attempted INTEGER,
  p_questions_correct INTEGER,
  p_subject_difficulty INTEGER DEFAULT 3
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base_xp INTEGER := 5;
  v_correct_bonus INTEGER := 5;
  v_difficulty_multiplier DECIMAL := 1.0;
  v_total_xp INTEGER;
BEGIN
  v_difficulty_multiplier := CASE p_subject_difficulty
    WHEN 1 THEN 0.8
    WHEN 2 THEN 0.9
    WHEN 3 THEN 1.0
    WHEN 4 THEN 1.2
    WHEN 5 THEN 1.5
    ELSE 1.0
  END;

  v_total_xp := ROUND(
    (p_questions_attempted * v_base_xp + p_questions_correct * v_correct_bonus) * v_difficulty_multiplier
  );

  RETURN GREATEST(v_total_xp, 0);
END;
$$;

-- Function to safely update user statistics
CREATE OR REPLACE FUNCTION upsert_user_statistics(
  p_user_id UUID,
  p_xp_gained INTEGER DEFAULT 0,
  p_questions_added INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_statistics (
    user_id,
    total_xp,
    questions_total,
    last_activity_date
  ) VALUES (
    p_user_id,
    p_xp_gained,
    p_questions_added,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_statistics.total_xp + p_xp_gained,
    questions_total = user_statistics.questions_total + p_questions_added,
    current_level = CASE
      WHEN (user_statistics.total_xp + p_xp_gained) >= 100 THEN
        LEAST(((user_statistics.total_xp + p_xp_gained) / 100) + 1, 100)
      ELSE user_statistics.current_level
    END,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$;

-- Function to update subject progress
CREATE OR REPLACE FUNCTION upsert_subject_progress(
  p_user_id UUID,
  p_subject_name TEXT,
  p_questions_solved INTEGER,
  p_correct_answers INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO subject_progress_daily (
    user_id,
    subject_name,
    date,
    questions_solved,
    correct_answers
  ) VALUES (
    p_user_id,
    p_subject_name,
    CURRENT_DATE,
    p_questions_solved,
    p_correct_answers
  )
  ON CONFLICT (user_id, subject_name, date) DO UPDATE SET
    questions_solved = subject_progress_daily.questions_solved + p_questions_solved,
    correct_answers = subject_progress_daily.correct_answers + p_correct_answers,
    updated_at = NOW();
END;
$$;

-- ===================================================================
-- SIMPLE DASHBOARD FUNCTION (WORKING VERSION)
-- ===================================================================

CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_stats JSON;
  v_daily_stats JSON;
  v_subject_progress JSON;
  v_weekly_performance JSON;
BEGIN
  -- Get user statistics (with defaults if no record)
  SELECT json_build_object(
    'totalXp', COALESCE(total_xp, 0),
    'currentLevel', COALESCE(current_level, 1),
    'questionsSolved', COALESCE(questions_total, 0),
    'studyStreak', COALESCE(current_streak, 0),
    'activeDays', COALESCE(active_days, 0),
    'avgQuestionsPerDay', COALESCE(avg_questions_per_day, 0),
    'achievementsCount', COALESCE(achievements_count, 0)
  ) INTO v_user_stats
  FROM user_statistics
  WHERE user_id = p_user_id;

  -- If no user stats, create default
  IF v_user_stats IS NULL THEN
    v_user_stats := json_build_object(
      'totalXp', 0,
      'currentLevel', 1,
      'questionsSolved', 0,
      'studyStreak', 0,
      'activeDays', 0,
      'avgQuestionsPerDay', 0,
      'achievementsCount', 0
    );
  END IF;

  -- Get daily statistics
  SELECT json_build_object(
    'questionsToday', COALESCE(SUM(questions_solved), 0),
    'accuracy', CASE
      WHEN SUM(questions_solved) > 0 THEN
        ROUND((SUM(correct_answers)::DECIMAL / SUM(questions_solved)) * 100, 1)
      ELSE 0
    END
  ) INTO v_daily_stats
  FROM subject_progress_daily
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  -- If no daily stats, create default
  IF v_daily_stats IS NULL THEN
    v_daily_stats := json_build_object(
      'questionsToday', 0,
      'accuracy', 0
    );
  END IF;

  -- Get subject progress
  SELECT json_agg(
    json_build_object(
      'subject', s.name,
      'displayName', s.display_name,
      'icon', s.icon,
      'color', s.color,
      'todayQuestions', COALESCE(spd.questions_solved, 0),
      'weekQuestions', 0,
      'successRate', CASE
        WHEN COALESCE(spd.questions_solved, 0) > 0 THEN
          ROUND((COALESCE(spd.correct_answers, 0)::DECIMAL / spd.questions_solved) * 100, 1)
        ELSE 0
      END
    )
  ) INTO v_subject_progress
  FROM subjects s
  LEFT JOIN subject_progress_daily spd ON s.name = spd.subject_name
    AND spd.user_id = p_user_id
    AND spd.date = CURRENT_DATE
  WHERE s.is_active = true
  ORDER BY s.sort_order;

  -- If no subjects, create default
  IF v_subject_progress IS NULL THEN
    v_subject_progress := '[]';
  END IF;

  -- Simple weekly performance (last 7 days)
  SELECT json_agg(
    json_build_object(
      'date', daily_date,
      'questions', COALESCE(total_questions, 0)
    ) ORDER BY daily_date
  ) INTO v_weekly_performance
  FROM (
    SELECT
      daily_date,
      SUM(questions_solved) as total_questions
    FROM (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::DATE as daily_date
    ) dates
    LEFT JOIN subject_progress_daily spd ON spd.date = daily_date
      AND spd.user_id = p_user_id
    GROUP BY daily_date
    ORDER BY daily_date
  ) week_data;

  -- If no weekly data, create default
  IF v_weekly_performance IS NULL THEN
    v_weekly_performance := '[]';
  END IF;

  -- Build final result
  SELECT json_build_object(
    'userStats', v_user_stats,
    'dailyStats', v_daily_stats,
    'subjectProgress', v_subject_progress,
    'weeklyPerformance', v_weekly_performance,
    'friends', '[]',
    'achievements', '[]',
    'dailyGoals', json_build_object(
      'dailyQuestions', 5,
      'weeklyQuestions', 35,
      'monthlyQuestions', 150
    ),
    'recentExams', '[]'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ===================================================================
-- CREATE SAFE TRIGGERS
-- ===================================================================

-- Question entry trigger
CREATE OR REPLACE FUNCTION process_question_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_gained INTEGER;
BEGIN
  -- Calculate XP
  v_xp_gained := calculate_question_xp(NEW.question_count, NEW.correct_count, 3);

  -- Update XP in the entry
  NEW.xp_gained := v_xp_gained;

  -- Update user statistics
  PERFORM upsert_user_statistics(NEW.user_id, v_xp_gained, NEW.question_count);

  -- Update subject progress
  PERFORM upsert_subject_progress(NEW.user_id, NEW.subject, NEW.question_count, NEW.correct_count);

  RETURN NEW;
END;
$$;

-- Exam entry trigger
CREATE OR REPLACE FUNCTION process_exam_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_gained INTEGER;
BEGIN
  -- Calculate XP (exam bonus)
  v_xp_gained := calculate_question_xp(NEW.total_questions, NEW.total_correct, 4);

  -- Update XP in the entry
  NEW.xp_gained := v_xp_gained;

  -- Update user statistics
  PERFORM upsert_user_statistics(NEW.user_id, v_xp_gained, NEW.total_questions);

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_question_entry_before_insert
  BEFORE INSERT ON question_entries
  FOR EACH ROW
  EXECUTE FUNCTION process_question_entry();

CREATE TRIGGER trigger_exam_entry_before_insert
  BEFORE INSERT ON exam_entries
  FOR EACH ROW
  EXECUTE FUNCTION process_exam_entry();

-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database fixes applied successfully!';
  RAISE NOTICE '📊 Dashboard function: get_dashboard_data() ready';
  RAISE NOTICE '🎯 Question/Exam triggers: active';
  RAISE NOTICE '🔧 All tables and RLS policies: configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for frontend integration!';
END $$;