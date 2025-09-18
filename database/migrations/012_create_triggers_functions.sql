-- Create Automated Triggers and Functions for SARA Platform
-- Migration: 012_create_triggers_functions.sql
-- Description: Automated XP calculation, achievement triggers, and real-time updates
-- Purpose: Enable automatic backend integration for modal saves and dashboard updates

-- ===================================================================
-- AUTOMATED XP CALCULATION FUNCTIONS
-- ===================================================================

-- Function to calculate XP reward for question solving
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
  v_base_xp INTEGER := 5; -- Base XP per question
  v_correct_bonus INTEGER := 5; -- Bonus for correct answers
  v_difficulty_multiplier DECIMAL := 1.0;
  v_total_xp INTEGER;
BEGIN
  -- Apply difficulty multiplier
  v_difficulty_multiplier := CASE p_subject_difficulty
    WHEN 1 THEN 0.8
    WHEN 2 THEN 0.9
    WHEN 3 THEN 1.0
    WHEN 4 THEN 1.2
    WHEN 5 THEN 1.5
    ELSE 1.0
  END;

  -- Calculate total XP
  v_total_xp := ROUND(
    (p_questions_attempted * v_base_xp + p_questions_correct * v_correct_bonus) * v_difficulty_multiplier
  );

  RETURN GREATEST(v_total_xp, 0);
END;
$$;

-- Function to update user XP and trigger achievements
CREATE OR REPLACE FUNCTION update_user_xp_and_achievements(
  p_user_id UUID,
  p_xp_gained INTEGER,
  p_activity_type TEXT DEFAULT 'question_solved',
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_xp INTEGER;
  v_old_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_questions_solved INTEGER;
  v_streak_days INTEGER;
BEGIN
  -- Get current XP and level
  SELECT total_xp, current_level, questions_solved, study_streak
  INTO v_old_xp, v_old_level, v_questions_solved, v_streak_days
  FROM user_xp
  WHERE user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_xp (user_id, total_xp, current_level, questions_solved, study_streak)
    VALUES (p_user_id, 0, 1, 0, 0);
    v_old_xp := 0;
    v_old_level := 1;
    v_questions_solved := 0;
    v_streak_days := 0;
  END IF;

  -- Calculate new values
  v_new_xp := v_old_xp + p_xp_gained;
  v_new_level := calculate_level(v_new_xp);

  -- Update user XP record
  UPDATE user_xp
  SET
    total_xp = v_new_xp,
    current_level = v_new_level,
    questions_solved = CASE WHEN p_activity_type = 'question_solved' THEN questions_solved + 1 ELSE questions_solved END,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log XP gain
  INSERT INTO xp_logs (user_id, xp_gained, activity_type, description)
  VALUES (p_user_id, p_xp_gained, p_activity_type, COALESCE(p_description, 'XP earned from ' || p_activity_type));

  -- Check for level up achievement
  IF v_new_level > v_old_level THEN
    PERFORM check_and_unlock_achievements(p_user_id, 'level_up', v_new_level);
  END IF;

  -- Check for XP milestone achievements
  PERFORM check_and_unlock_achievements(p_user_id, 'xp_total', v_new_xp);

  -- Check for question count achievements if applicable
  IF p_activity_type = 'question_solved' THEN
    PERFORM check_and_unlock_achievements(p_user_id, 'questions_count', v_questions_solved + 1);
  END IF;
END;
$$;

-- ===================================================================
-- ACHIEVEMENT CHECKING AND UNLOCKING FUNCTIONS
-- ===================================================================

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_user_id UUID,
  p_condition_type TEXT,
  p_current_value INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement RECORD;
  v_unlocked_count INTEGER := 0;
BEGIN
  -- Find eligible achievements that user hasn't earned yet
  FOR v_achievement IN
    SELECT a.id, a.name, a.description, a.xp_reward
    FROM achievements a
    WHERE a.condition_type = p_condition_type
      AND a.condition_value <= p_current_value
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
      )
  LOOP
    -- Unlock the achievement
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, v_achievement.id);

    -- Award XP bonus if applicable
    IF v_achievement.xp_reward > 0 THEN
      PERFORM update_user_xp_and_achievements(
        p_user_id,
        v_achievement.xp_reward,
        'achievement',
        'Achievement unlocked: ' || v_achievement.name
      );
    END IF;

    -- Create notification
    PERFORM create_notification(
      p_user_id,
      'achievement',
      'Yeni Başarım! 🏆',
      'Tebrikler! "' || v_achievement.name || '" başarımını kazandın!',
      '/dashboard?tab=achievements',
      'high',
      NULL,
      NULL,
      v_achievement.id
    );

    -- Log activity
    INSERT INTO user_activity_log (
      user_id, activity_type, activity_description, achievement_id, activity_value
    ) VALUES (
      p_user_id, 'achievement_earned', 'Başarım kazandı: ' || v_achievement.name,
      v_achievement.id, v_achievement.xp_reward
    );

    v_unlocked_count := v_unlocked_count + 1;
  END LOOP;

  RETURN v_unlocked_count;
END;
$$;

-- Function to check streak-based achievements
CREATE OR REPLACE FUNCTION check_streak_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER;
BEGIN
  -- Get current streak
  SELECT study_streak INTO v_current_streak
  FROM user_xp
  WHERE user_id = p_user_id;

  IF v_current_streak IS NOT NULL THEN
    PERFORM check_and_unlock_achievements(p_user_id, 'streak_days', v_current_streak);
  END IF;
END;
$$;

-- ===================================================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC PROCESSING
-- ===================================================================

-- Trigger function for question entry XP calculation
CREATE OR REPLACE FUNCTION trigger_question_entry_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_gained INTEGER;
  v_subject_difficulty INTEGER;
BEGIN
  -- Get subject difficulty
  SELECT difficulty_level INTO v_subject_difficulty
  FROM subjects
  WHERE name = NEW.subject;

  -- Calculate XP
  v_xp_gained := calculate_question_xp(
    NEW.question_count,
    NEW.correct_count,
    COALESCE(v_subject_difficulty, 3)
  );

  -- Update user XP
  PERFORM update_user_xp_and_achievements(
    NEW.user_id,
    v_xp_gained,
    'question_solved',
    'Solved ' || NEW.question_count || ' questions in ' || NEW.subject
  );

  -- Update subject progress
  PERFORM upsert_subject_progress(
    NEW.user_id,
    NEW.subject,
    NEW.question_count,
    NEW.correct_count,
    0, -- study time (will be updated separately)
    NEW.entry_date
  );

  -- Update daily goals progress
  PERFORM update_daily_goals_progress(NEW.user_id, NEW.entry_date);

  RETURN NEW;
END;
$$;

-- Trigger function for exam entry processing
CREATE OR REPLACE FUNCTION trigger_exam_entry_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_gained INTEGER;
  v_base_xp INTEGER := 3; -- Lower XP for exam practice
BEGIN
  -- Calculate XP based on performance
  v_xp_gained := ROUND(NEW.total_questions * v_base_xp * (NEW.success_rate / 100.0));

  -- Update user XP
  PERFORM update_user_xp_and_achievements(
    NEW.user_id,
    v_xp_gained,
    'exam_completed',
    NEW.exam_type || ' exam completed with ' || NEW.success_rate || '% success'
  );

  -- Log activity
  INSERT INTO user_activity_log (
    user_id, activity_type, activity_description, activity_value
  ) VALUES (
    NEW.user_id, 'exam_completed',
    NEW.exam_type || ' sınavı tamamlandı (' || NEW.success_rate || '% başarı)',
    NEW.total_questions
  );

  RETURN NEW;
END;
$$;

-- Trigger function to update daily goals
CREATE OR REPLACE FUNCTION update_daily_goals_progress(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_questions INTEGER;
  v_total_study_time INTEGER;
  v_subjects_count INTEGER;
BEGIN
  -- Calculate today's totals
  SELECT
    COALESCE(SUM(questions_attempted), 0),
    COALESCE(SUM(study_time_minutes), 0),
    COUNT(DISTINCT subject_id)
  INTO v_total_questions, v_total_study_time, v_subjects_count
  FROM subject_progress_daily
  WHERE user_id = p_user_id AND progress_date = p_date;

  -- Update daily goals
  INSERT INTO daily_goals (
    user_id, goal_date, achieved_questions, achieved_duration, achieved_subjects
  ) VALUES (
    p_user_id, p_date, v_total_questions, v_total_study_time, v_subjects_count
  )
  ON CONFLICT (user_id, goal_date)
  DO UPDATE SET
    achieved_questions = EXCLUDED.achieved_questions,
    achieved_duration = EXCLUDED.achieved_duration,
    achieved_subjects = EXCLUDED.achieved_subjects,
    updated_at = NOW();

  -- Check if goal is newly completed
  IF EXISTS (
    SELECT 1 FROM daily_goals
    WHERE user_id = p_user_id AND goal_date = p_date AND is_completed = true
  ) THEN
    -- Award daily goal XP
    PERFORM update_user_xp_and_achievements(
      p_user_id, 50, 'daily_goal', 'Daily goal completed for ' || p_date
    );
  END IF;
END;
$$;

-- Trigger function for streak calculation
CREATE OR REPLACE FUNCTION trigger_update_study_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_yesterday DATE;
  v_had_activity_yesterday BOOLEAN;
  v_current_streak INTEGER;
BEGIN
  v_yesterday := NEW.last_activity_date - INTERVAL '1 day';

  -- Check if user had activity yesterday
  SELECT EXISTS(
    SELECT 1 FROM subject_progress_daily
    WHERE user_id = NEW.user_id AND progress_date = v_yesterday
  ) INTO v_had_activity_yesterday;

  -- Calculate new streak
  IF v_had_activity_yesterday THEN
    -- Continue streak
    v_current_streak := OLD.study_streak + 1;
  ELSE
    -- Reset streak
    v_current_streak := 1;
  END IF;

  -- Update streak
  NEW.study_streak := v_current_streak;

  -- Check for streak achievements
  PERFORM check_streak_achievements(NEW.user_id);

  RETURN NEW;
END;
$$;

-- ===================================================================
-- CREATE TRIGGERS
-- ===================================================================

-- Trigger for question entries
CREATE TRIGGER trigger_question_entry_after_insert
  AFTER INSERT ON question_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_question_entry_xp();

-- Trigger for exam entries
CREATE TRIGGER trigger_exam_entry_after_insert
  AFTER INSERT ON exam_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_exam_entry_xp();

-- Trigger for study streak updates
CREATE TRIGGER trigger_study_streak_update
  BEFORE UPDATE OF last_activity_date ON user_xp
  FOR EACH ROW
  WHEN (OLD.last_activity_date IS DISTINCT FROM NEW.last_activity_date)
  EXECUTE FUNCTION trigger_update_study_streak();

-- ===================================================================
-- REAL-TIME DASHBOARD UPDATE FUNCTIONS
-- ===================================================================

-- Function to get real-time dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_stats RECORD;
  v_subject_progress JSONB;
  v_weekly_performance JSONB;
  v_friends_data JSONB;
  v_recent_exams JSONB;
  v_daily_goals RECORD;
  v_achievements_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get user basic stats
  SELECT
    total_xp,
    current_level,
    questions_solved,
    study_streak
  INTO v_user_stats
  FROM user_xp
  WHERE user_id = p_user_id;

  -- Get subject progress (last 7 days)
  SELECT jsonb_agg(
    jsonb_build_object(
      'subject', s.name,
      'displayName', s.display_name,
      'icon', s.icon,
      'color', s.color,
      'todayQuestions', COALESCE(today_data.questions_attempted, 0),
      'weekQuestions', COALESCE(week_data.total_questions, 0),
      'successRate', COALESCE(week_data.avg_success_rate, 0)
    )
    ORDER BY s.sort_order
  ) INTO v_subject_progress
  FROM subjects s
  LEFT JOIN (
    SELECT subject_id, questions_attempted, success_rate
    FROM subject_progress_daily
    WHERE user_id = p_user_id AND progress_date = CURRENT_DATE
  ) today_data ON s.id = today_data.subject_id
  LEFT JOIN (
    SELECT
      subject_id,
      SUM(questions_attempted) as total_questions,
      ROUND(AVG(success_rate), 2) as avg_success_rate
    FROM subject_progress_daily
    WHERE user_id = p_user_id
      AND progress_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY subject_id
  ) week_data ON s.id = week_data.subject_id
  WHERE s.is_active = true;

  -- Get weekly performance
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', performance_date,
      'questions', questions_solved,
      'studyTime', study_minutes,
      'goalAchieved', daily_goal_achieved
    )
    ORDER BY day_offset
  ) INTO v_weekly_performance
  FROM weekly_performance
  WHERE user_id = p_user_id
    AND week_start_date = DATE_TRUNC('week', CURRENT_DATE)::date;

  -- Get friends data (top 5 by weekly XP)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', lc.user_id,
      'name', COALESCE(up.full_name, 'Anonymous'),
      'avatar', up.avatar_url,
      'weeklyXp', lc.primary_score,
      'rank', lc.rank_position
    )
    ORDER BY lc.rank_position
  ) INTO v_friends_data
  FROM leaderboard_cache lc
  JOIN user_profiles up ON lc.user_id = up.user_id
  WHERE lc.leaderboard_type = 'friends'
    AND lc.period_start = DATE_TRUNC('week', CURRENT_DATE)::date
    AND lc.is_valid = true
  LIMIT 5;

  -- Get recent exams (last 5)
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', exam_type,
      'date', exam_date,
      'totalQuestions', total_questions,
      'successRate', success_rate
    )
    ORDER BY exam_date DESC
  ) INTO v_recent_exams
  FROM exam_entries
  WHERE user_id = p_user_id
  ORDER BY exam_date DESC
  LIMIT 5;

  -- Get today's daily goals
  SELECT
    target_questions,
    target_duration,
    target_subjects,
    achieved_questions,
    achieved_duration,
    achieved_subjects,
    is_completed
  INTO v_daily_goals
  FROM daily_goals
  WHERE user_id = p_user_id AND goal_date = CURRENT_DATE;

  -- Get achievements count
  SELECT COUNT(*) INTO v_achievements_count
  FROM user_achievements
  WHERE user_id = p_user_id;

  -- Build result
  v_result := jsonb_build_object(
    'userStats', jsonb_build_object(
      'totalXp', COALESCE(v_user_stats.total_xp, 0),
      'currentLevel', COALESCE(v_user_stats.current_level, 1),
      'questionsSolved', COALESCE(v_user_stats.questions_solved, 0),
      'studyStreak', COALESCE(v_user_stats.study_streak, 0),
      'achievementsCount', v_achievements_count
    ),
    'subjectProgress', COALESCE(v_subject_progress, '[]'::jsonb),
    'weeklyPerformance', COALESCE(v_weekly_performance, '[]'::jsonb),
    'friendsData', COALESCE(v_friends_data, '[]'::jsonb),
    'recentExams', COALESCE(v_recent_exams, '[]'::jsonb),
    'dailyGoals', CASE
      WHEN v_daily_goals IS NOT NULL THEN
        jsonb_build_object(
          'targetQuestions', v_daily_goals.target_questions,
          'targetDuration', v_daily_goals.target_duration,
          'targetSubjects', v_daily_goals.target_subjects,
          'achievedQuestions', v_daily_goals.achieved_questions,
          'achievedDuration', v_daily_goals.achieved_duration,
          'achievedSubjects', v_daily_goals.achieved_subjects,
          'isCompleted', v_daily_goals.is_completed
        )
      ELSE
        jsonb_build_object(
          'targetQuestions', 5,
          'targetDuration', 45,
          'targetSubjects', 2,
          'achievedQuestions', 0,
          'achievedDuration', 0,
          'achievedSubjects', 0,
          'isCompleted', false
        )
    END
  );

  RETURN v_result;
END;
$$;

-- ===================================================================
-- BATCH PROCESSING FUNCTIONS
-- ===================================================================

-- Function to process daily analytics (run nightly)
CREATE OR REPLACE FUNCTION process_daily_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Process weekly performance for all active users
  FOR v_user_id IN
    SELECT DISTINCT user_id
    FROM subject_progress_daily
    WHERE progress_date >= CURRENT_DATE - INTERVAL '7 days'
  LOOP
    PERFORM compute_weekly_performance(v_user_id);
    PERFORM update_user_statistics(v_user_id, 'weekly');
  END LOOP;

  -- Refresh materialized views
  PERFORM refresh_dashboard_analytics();

  -- Clean up expired data
  DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();
  DELETE FROM friend_requests WHERE status = 'pending' AND expires_at < NOW();
END;
$$;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive old activity logs (older than 1 year)
  UPDATE user_activity_log
  SET is_feed_visible = false
  WHERE created_at < NOW() - INTERVAL '1 year';

  -- Delete very old notifications (older than 6 months)
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '6 months' AND is_read = true;

  -- Delete expired friend requests
  DELETE FROM friend_requests
  WHERE status IN ('declined', 'cancelled', 'expired')
    AND created_at < NOW() - INTERVAL '30 days';

  -- Clean up inactive study rooms
  UPDATE study_rooms
  SET is_active = false
  WHERE updated_at < NOW() - INTERVAL '30 days'
    AND current_participants = 0;

  -- Cleanup expired user effects
  PERFORM cleanup_expired_effects();
END;
$$;

-- ===================================================================
-- COMPREHENSIVE DASHBOARD DATA FUNCTION
-- ===================================================================

-- Function to get all dashboard data in one call
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
  v_friends JSON;
  v_achievements JSON;
  v_daily_goals JSON;
  v_recent_exams JSON;
BEGIN
  -- Get user statistics
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

  -- Get daily statistics
  SELECT json_build_object(
    'questionsToday', COALESCE(SUM(questions_solved), 0),
    'studyTime', COALESCE(SUM(time_spent_minutes), 0),
    'accuracy', CASE
      WHEN SUM(questions_solved) > 0 THEN
        ROUND((SUM(correct_answers)::DECIMAL / SUM(questions_solved)) * 100, 1)
      ELSE 0
    END
  ) INTO v_daily_stats
  FROM subject_progress_daily
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  -- Get subject progress
  SELECT json_agg(
    json_build_object(
      'subject', s.name,
      'displayName', s.display_name,
      'icon', s.icon,
      'color', s.color,
      'todayQuestions', COALESCE(spd.questions_solved, 0),
      'weekQuestions', COALESCE(weekly.questions_solved, 0),
      'successRate', CASE
        WHEN COALESCE(spd.questions_solved, 0) > 0 THEN
          ROUND((COALESCE(spd.correct_answers, 0)::DECIMAL / spd.questions_solved) * 100, 1)
        ELSE 0
      END
    )
  ) INTO v_subject_progress
  FROM subjects s
  LEFT JOIN subject_progress_daily spd ON s.id = spd.subject_id
    AND spd.user_id = p_user_id
    AND spd.date = CURRENT_DATE
  LEFT JOIN (
    SELECT
      subject_id,
      SUM(questions_solved) as questions_solved
    FROM subject_progress_daily
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY subject_id
  ) weekly ON s.id = weekly.subject_id
  WHERE s.is_active = true
  ORDER BY s.sort_order;

  -- Get weekly performance (last 7 days)
  SELECT json_agg(
    json_build_object(
      'date', daily_date,
      'questions', COALESCE(total_questions, 0),
      'accuracy', COALESCE(accuracy, 0)
    ) ORDER BY daily_date
  ) INTO v_weekly_performance
  FROM (
    SELECT
      daily_date,
      SUM(questions_solved) as total_questions,
      CASE
        WHEN SUM(questions_solved) > 0 THEN
          ROUND((SUM(correct_answers)::DECIMAL / SUM(questions_solved)) * 100, 1)
        ELSE 0
      END as accuracy
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

  -- Get active friends
  SELECT json_agg(
    json_build_object(
      'name', up.full_name,
      'questionsToday', COALESCE(daily.questions_today, 0),
      'isActive', COALESCE(daily.questions_today, 0) > 0,
      'totalXP', COALESCE(us.total_xp, 0),
      'currentLevel', COALESCE(us.current_level, 1)
    )
  ) INTO v_friends
  FROM user_friends uf
  JOIN user_profiles up ON up.user_id = uf.friend_id
  LEFT JOIN user_statistics us ON us.user_id = uf.friend_id
  LEFT JOIN (
    SELECT
      user_id,
      SUM(questions_solved) as questions_today
    FROM subject_progress_daily
    WHERE date = CURRENT_DATE
    GROUP BY user_id
  ) daily ON daily.user_id = uf.friend_id
  WHERE uf.user_id = p_user_id
    AND uf.status = 'active'
  LIMIT 10;

  -- Get user achievements
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'displayName', a.display_name,
      'icon', a.icon,
      'earnedAt', ua.earned_at
    )
  ) INTO v_achievements
  FROM user_achievements ua
  JOIN achievements a ON a.id = ua.achievement_id
  WHERE ua.user_id = p_user_id
    AND ua.earned_at IS NOT NULL
  ORDER BY ua.earned_at DESC
  LIMIT 5;

  -- Get daily goals (with defaults if not set)
  SELECT json_build_object(
    'dailyQuestions', 5,
    'weeklyQuestions', 35,
    'monthlyQuestions', 150,
    'dailyStudyMinutes', 45,
    'weeklyStudyMinutes', 315
  ) INTO v_daily_goals;

  -- Get recent exam entries
  SELECT json_agg(
    json_build_object(
      'id', ee.id,
      'examType', ee.exam_type,
      'examDate', ee.exam_date,
      'totalQuestions', ee.total_questions,
      'totalCorrect', ee.total_correct,
      'successRate', ROUND((ee.total_correct::DECIMAL / ee.total_questions) * 100, 1),
      'createdAt', ee.created_at
    ) ORDER BY ee.created_at DESC
  ) INTO v_recent_exams
  FROM exam_entries ee
  WHERE ee.user_id = p_user_id
  LIMIT 5;

  -- Build final result
  SELECT json_build_object(
    'userStats', COALESCE(v_user_stats, '{}'),
    'dailyStats', COALESCE(v_daily_stats, '{}'),
    'subjectProgress', COALESCE(v_subject_progress, '[]'),
    'weeklyPerformance', COALESCE(v_weekly_performance, '[]'),
    'friends', COALESCE(v_friends, '[]'),
    'achievements', COALESCE(v_achievements, '[]'),
    'dailyGoals', COALESCE(v_daily_goals, '{}'),
    'recentExams', COALESCE(v_recent_exams, '[]')
  ) INTO v_result;

  RETURN v_result;
END;
$$;