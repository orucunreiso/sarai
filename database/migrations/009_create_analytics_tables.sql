-- Create Analytics and Performance Tracking Tables
-- Migration: 009_create_analytics_tables.sql
-- Description: Comprehensive analytics system for SARA dashboard performance tracking
-- Purpose: Weekly stats, user analytics, leaderboard cache, and reporting

-- ===================================================================
-- USER STATISTICS TABLE - Aggregated user performance data
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Question solving stats
  total_questions INTEGER DEFAULT 0 CHECK (total_questions >= 0),
  total_correct INTEGER DEFAULT 0 CHECK (total_correct >= 0),
  total_wrong INTEGER DEFAULT 0 CHECK (total_wrong >= 0),
  overall_success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN total_questions > 0 THEN ROUND((total_correct::decimal / total_questions::decimal) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Study time and engagement
  total_study_time_minutes INTEGER DEFAULT 0 CHECK (total_study_time_minutes >= 0),
  active_days INTEGER DEFAULT 0 CHECK (active_days >= 0),
  study_streak INTEGER DEFAULT 0 CHECK (study_streak >= 0),

  -- Subject performance
  strongest_subject TEXT,
  weakest_subject TEXT,
  subjects_studied INTEGER DEFAULT 0 CHECK (subjects_studied >= 0),

  -- Gamification stats
  xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
  achievements_unlocked INTEGER DEFAULT 0 CHECK (achievements_unlocked >= 0),
  badges_earned INTEGER DEFAULT 0 CHECK (badges_earned >= 0),

  -- Exam performance
  exams_taken INTEGER DEFAULT 0 CHECK (exams_taken >= 0),
  avg_exam_score DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  rank_position INTEGER,
  percentile DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

-- ===================================================================
-- WEEKLY PERFORMANCE TABLE - Detailed 7-day performance tracking
-- ===================================================================
CREATE TABLE IF NOT EXISTS weekly_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  day_offset INTEGER NOT NULL CHECK (day_offset BETWEEN 0 AND 6), -- 0=Monday, 6=Sunday
  performance_date DATE GENERATED ALWAYS AS (week_start_date + day_offset) STORED,

  -- Daily metrics
  questions_solved INTEGER DEFAULT 0 CHECK (questions_solved >= 0),
  correct_answers INTEGER DEFAULT 0 CHECK (correct_answers >= 0),
  study_minutes INTEGER DEFAULT 0 CHECK (study_minutes >= 0),
  subjects_touched INTEGER DEFAULT 0 CHECK (subjects_touched >= 0),

  -- Performance indicators
  daily_goal_achieved BOOLEAN DEFAULT false,
  streak_maintained BOOLEAN DEFAULT false,
  peak_performance_hour INTEGER CHECK (peak_performance_hour BETWEEN 0 AND 23),

  -- Quality metrics
  focus_score DECIMAL(3,2) DEFAULT 0 CHECK (focus_score BETWEEN 0 AND 1), -- 0-1 scale
  efficiency_score DECIMAL(3,2) DEFAULT 0 CHECK (efficiency_score BETWEEN 0 AND 1), -- 0-1 scale

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, week_start_date, day_offset)
);

-- ===================================================================
-- LEADERBOARD CACHE TABLE - Pre-computed leaderboard rankings
-- ===================================================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('global', 'friends', 'weekly', 'monthly')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Ranking metrics
  rank_position INTEGER NOT NULL CHECK (rank_position > 0),
  total_participants INTEGER NOT NULL CHECK (total_participants > 0),
  percentile DECIMAL(5,2) GENERATED ALWAYS AS (
    ROUND(((total_participants - rank_position + 1)::decimal / total_participants::decimal) * 100, 2)
  ) STORED,

  -- Performance metrics for ranking
  primary_score INTEGER NOT NULL DEFAULT 0, -- Usually XP or questions solved
  secondary_score INTEGER DEFAULT 0, -- Tiebreaker (study time, streak, etc.)
  tertiary_score DECIMAL(5,2) DEFAULT 0, -- Second tiebreaker (success rate, etc.)

  -- Additional stats for display
  total_questions INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  study_time_minutes INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,

  -- Cache metadata
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_valid BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(leaderboard_type, user_id, period_start, period_end)
);

-- ===================================================================
-- SUBJECT ANALYTICS TABLE - Detailed subject-wise analytics
-- ===================================================================
CREATE TABLE IF NOT EXISTS subject_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Performance metrics
  questions_attempted INTEGER DEFAULT 0 CHECK (questions_attempted >= 0),
  questions_correct INTEGER DEFAULT 0 CHECK (questions_correct >= 0),
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN questions_attempted > 0 THEN ROUND((questions_correct::decimal / questions_attempted::decimal) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Time and engagement
  total_study_time INTEGER DEFAULT 0 CHECK (total_study_time >= 0),
  avg_session_duration INTEGER DEFAULT 0 CHECK (avg_session_duration >= 0),
  study_sessions INTEGER DEFAULT 0 CHECK (study_sessions >= 0),

  -- Progress indicators
  topics_mastered INTEGER DEFAULT 0 CHECK (topics_mastered >= 0),
  difficulty_trend DECIMAL(3,2) DEFAULT 0, -- Average difficulty of solved questions
  improvement_rate DECIMAL(5,2) DEFAULT 0, -- Success rate change over period

  -- Behavioral patterns
  preferred_study_time TIME, -- Peak study hours for this subject
  avg_questions_per_session DECIMAL(5,2) DEFAULT 0,
  consistency_score DECIMAL(3,2) DEFAULT 0 CHECK (consistency_score BETWEEN 0 AND 1),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, subject_id, period_type, period_start)
);

-- ===================================================================
-- PERFORMANCE MILESTONES TABLE - Track significant achievements
-- ===================================================================
CREATE TABLE IF NOT EXISTS performance_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('first_question', 'streak_record', 'xp_milestone', 'subject_mastery', 'exam_improvement')),
  milestone_name TEXT NOT NULL,
  description TEXT,

  -- Milestone data
  metric_value INTEGER NOT NULL,
  previous_value INTEGER DEFAULT 0,
  improvement_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN previous_value > 0 THEN ROUND(((metric_value - previous_value)::decimal / previous_value::decimal) * 100, 2)
      ELSE 100
    END
  ) STORED,

  -- Context
  subject_id UUID REFERENCES subjects(id),
  related_data JSONB DEFAULT '{}',
  is_personal_best BOOLEAN DEFAULT false,
  is_celebrated BOOLEAN DEFAULT false, -- Whether user has been notified

  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_milestones ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- RLS POLICIES - User-specific data access
-- ===================================================================

-- User Statistics policies
CREATE POLICY "Users can view own statistics" ON user_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own statistics" ON user_statistics
  FOR ALL USING (auth.uid() = user_id);

-- Weekly Performance policies
CREATE POLICY "Users can view own weekly performance" ON weekly_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weekly performance" ON weekly_performance
  FOR ALL USING (auth.uid() = user_id);

-- Leaderboard Cache policies (users can see friends' data)
CREATE POLICY "Users can view relevant leaderboard data" ON leaderboard_cache
  FOR SELECT USING (
    auth.uid() = user_id OR
    leaderboard_type IN ('global', 'friends') OR
    user_id IN (
      SELECT CASE WHEN user_id = auth.uid() THEN friend_id ELSE user_id END
      FROM user_friends
      WHERE (user_id = auth.uid() OR friend_id = auth.uid()) AND status = 'active'
    )
  );

-- Subject Analytics policies
CREATE POLICY "Users can view own subject analytics" ON subject_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subject analytics" ON subject_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Performance Milestones policies
CREATE POLICY "Users can view own milestones" ON performance_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own milestones" ON performance_milestones
  FOR ALL USING (auth.uid() = user_id);

-- ===================================================================
-- PERFORMANCE INDEXES
-- ===================================================================

-- User Statistics indexes
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_period ON user_statistics(user_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_period_rank ON user_statistics(period_type, period_start, rank_position);

-- Weekly Performance indexes
CREATE INDEX IF NOT EXISTS idx_weekly_performance_user_week ON weekly_performance(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_date ON weekly_performance(performance_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_goals ON weekly_performance(daily_goal_achieved, performance_date DESC);

-- Leaderboard Cache indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_type_period ON leaderboard_cache(leaderboard_type, period_start DESC, rank_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_user ON leaderboard_cache(user_id, leaderboard_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_valid ON leaderboard_cache(is_valid, expires_at);

-- Subject Analytics indexes
CREATE INDEX IF NOT EXISTS idx_subject_analytics_user_subject ON subject_analytics(user_id, subject_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_subject_analytics_performance ON subject_analytics(success_rate DESC, improvement_rate DESC);

-- Performance Milestones indexes
CREATE INDEX IF NOT EXISTS idx_performance_milestones_user ON performance_milestones(user_id, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_milestones_type ON performance_milestones(milestone_type, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_milestones_celebrated ON performance_milestones(is_celebrated, achieved_at DESC);

-- ===================================================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE TRIGGER trigger_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_weekly_performance_updated_at
  BEFORE UPDATE ON weekly_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subject_analytics_updated_at
  BEFORE UPDATE ON subject_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- MATERIALIZED VIEWS FOR DASHBOARD PERFORMANCE
-- ===================================================================

-- Current week performance summary for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_weekly_summary AS
SELECT
  user_id,
  week_start_date,
  SUM(questions_solved) as total_questions,
  SUM(correct_answers) as total_correct,
  ROUND(AVG(CASE WHEN questions_solved > 0 THEN (correct_answers::decimal / questions_solved::decimal) * 100 ELSE 0 END), 2) as avg_success_rate,
  SUM(study_minutes) as total_study_time,
  COUNT(CASE WHEN daily_goal_achieved THEN 1 END) as goals_achieved,
  COUNT(CASE WHEN questions_solved > 0 THEN 1 END) as active_days,
  MAX(questions_solved) as best_day_questions,
  ROUND(AVG(focus_score), 2) as avg_focus_score
FROM weekly_performance
WHERE week_start_date >= CURRENT_DATE - INTERVAL '8 weeks'
GROUP BY user_id, week_start_date;

-- Friends leaderboard for current week
CREATE MATERIALIZED VIEW IF NOT EXISTS friends_leaderboard_current AS
SELECT
  lc.user_id,
  up.full_name,
  up.avatar_url,
  lc.rank_position,
  lc.primary_score as weekly_xp,
  lc.total_questions,
  lc.success_rate,
  lc.streak_days,
  lc.computed_at
FROM leaderboard_cache lc
JOIN user_profiles up ON lc.user_id = up.user_id
WHERE lc.leaderboard_type = 'friends'
  AND lc.period_start = DATE_TRUNC('week', CURRENT_DATE)::date
  AND lc.is_valid = true
ORDER BY lc.rank_position;

-- ===================================================================
-- UTILITY FUNCTIONS FOR ANALYTICS
-- ===================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_weekly_summary;
  REFRESH MATERIALIZED VIEW friends_leaderboard_current;
END;
$$;

-- Function to compute weekly performance for a user
CREATE OR REPLACE FUNCTION compute_weekly_performance(
  p_user_id UUID,
  p_week_start DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_day_offset INTEGER;
  v_current_date DATE;
BEGIN
  -- Clear existing data for this week
  DELETE FROM weekly_performance
  WHERE user_id = p_user_id AND week_start_date = p_week_start;

  -- Compute performance for each day of the week
  FOR v_day_offset IN 0..6 LOOP
    v_current_date := p_week_start + v_day_offset;

    -- Skip future dates
    CONTINUE WHEN v_current_date > CURRENT_DATE;

    -- Aggregate daily data
    SELECT
      COALESCE(SUM(spd.questions_attempted), 0) as questions,
      COALESCE(SUM(spd.questions_correct), 0) as correct,
      COALESCE(SUM(spd.study_time_minutes), 0) as study_time,
      COUNT(DISTINCT spd.subject_id) as subjects,
      EXISTS(SELECT 1 FROM daily_goals dg WHERE dg.user_id = p_user_id AND dg.goal_date = v_current_date AND dg.is_completed) as goal_achieved
    INTO r
    FROM subject_progress_daily spd
    WHERE spd.user_id = p_user_id AND spd.progress_date = v_current_date;

    -- Insert weekly performance record
    INSERT INTO weekly_performance (
      user_id, week_start_date, day_offset,
      questions_solved, correct_answers, study_minutes, subjects_touched,
      daily_goal_achieved, focus_score, efficiency_score
    ) VALUES (
      p_user_id, p_week_start, v_day_offset,
      r.questions, r.correct, r.study_time, r.subjects,
      r.goal_achieved,
      CASE WHEN r.study_time > 0 THEN LEAST(1.0, r.questions::decimal / (r.study_time / 60.0)) ELSE 0 END, -- Focus: questions per hour
      CASE WHEN r.questions > 0 THEN r.correct::decimal / r.questions::decimal ELSE 0 END -- Efficiency: success rate
    );
  END LOOP;
END;
$$;

-- Function to update user statistics for a period
CREATE OR REPLACE FUNCTION update_user_statistics(
  p_user_id UUID,
  p_period_type TEXT DEFAULT 'weekly',
  p_period_start DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::date
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_end DATE;
  v_stats_id UUID;
  v_total_questions INTEGER;
  v_total_correct INTEGER;
  v_total_study_time INTEGER;
  v_active_days INTEGER;
  v_xp_earned INTEGER;
  v_achievements INTEGER;
  v_exams_taken INTEGER;
  v_avg_exam_score DECIMAL;
BEGIN
  -- Calculate period end
  v_period_end := CASE p_period_type
    WHEN 'daily' THEN p_period_start
    WHEN 'weekly' THEN p_period_start + INTERVAL '6 days'
    WHEN 'monthly' THEN p_period_start + INTERVAL '1 month' - INTERVAL '1 day'
    WHEN 'yearly' THEN p_period_start + INTERVAL '1 year' - INTERVAL '1 day'
  END;

  -- Aggregate subject progress data
  SELECT
    COALESCE(SUM(questions_attempted), 0),
    COALESCE(SUM(questions_correct), 0),
    COALESCE(SUM(study_time_minutes), 0),
    COUNT(DISTINCT progress_date)
  INTO v_total_questions, v_total_correct, v_total_study_time, v_active_days
  FROM subject_progress_daily
  WHERE user_id = p_user_id
    AND progress_date BETWEEN p_period_start AND v_period_end;

  -- Get XP earned in period
  SELECT COALESCE(SUM(xp_gained), 0)
  INTO v_xp_earned
  FROM xp_logs
  WHERE user_id = p_user_id
    AND created_at BETWEEN p_period_start AND v_period_end + INTERVAL '1 day';

  -- Get achievements earned in period
  SELECT COUNT(*)
  INTO v_achievements
  FROM user_achievements
  WHERE user_id = p_user_id
    AND earned_at BETWEEN p_period_start AND v_period_end + INTERVAL '1 day';

  -- Get exam statistics
  SELECT
    COUNT(*),
    COALESCE(AVG(success_rate), 0)
  INTO v_exams_taken, v_avg_exam_score
  FROM exam_entries
  WHERE user_id = p_user_id
    AND exam_date BETWEEN p_period_start AND v_period_end;

  -- Upsert statistics record
  INSERT INTO user_statistics (
    user_id, period_type, period_start, period_end,
    total_questions, total_correct, total_study_time_minutes, active_days,
    xp_earned, achievements_unlocked, exams_taken, avg_exam_score
  ) VALUES (
    p_user_id, p_period_type, p_period_start, v_period_end,
    v_total_questions, v_total_correct, v_total_study_time, v_active_days,
    v_xp_earned, v_achievements, v_exams_taken, v_avg_exam_score
  )
  ON CONFLICT (user_id, period_type, period_start)
  DO UPDATE SET
    total_questions = EXCLUDED.total_questions,
    total_correct = EXCLUDED.total_correct,
    total_study_time_minutes = EXCLUDED.total_study_time_minutes,
    active_days = EXCLUDED.active_days,
    xp_earned = EXCLUDED.xp_earned,
    achievements_unlocked = EXCLUDED.achievements_unlocked,
    exams_taken = EXCLUDED.exams_taken,
    avg_exam_score = EXCLUDED.avg_exam_score,
    updated_at = NOW()
  RETURNING id INTO v_stats_id;

  RETURN v_stats_id;
END;
$$;