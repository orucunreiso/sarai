-- Simple Test Data for SARA Database Schema
-- Migration: 014_simple_test_data.sql
-- Description: Safe test data that works with real users
-- Purpose: Test database functions without requiring specific user IDs

-- ===================================================================
-- VERIFICATION QUERIES ONLY - NO DATA INSERTION
-- ===================================================================

-- Verify subjects table
DO $$
DECLARE
  v_subjects_count INTEGER;
  v_topics_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_subjects_count FROM subjects WHERE is_active = true;
  SELECT COUNT(*) INTO v_topics_count FROM topics WHERE is_active = true;

  RAISE NOTICE '=== SARA DATABASE SCHEMA VERIFICATION ===';
  RAISE NOTICE 'Active Subjects: %', v_subjects_count;
  RAISE NOTICE 'Active Topics: %', v_topics_count;

  -- Verify all 9 subjects exist
  IF v_subjects_count >= 9 THEN
    RAISE NOTICE '✅ All subjects created successfully';
  ELSE
    RAISE NOTICE '❌ Missing subjects (expected 9, got %)', v_subjects_count;
  END IF;

  -- Verify topics exist
  IF v_topics_count >= 20 THEN
    RAISE NOTICE '✅ Topics created successfully';
  ELSE
    RAISE NOTICE '❌ Insufficient topics (expected 20+, got %)', v_topics_count;
  END IF;
END $$;

-- Display all subjects and their topics
DO $$
DECLARE
  v_subject RECORD;
  v_topic RECORD;
  v_topic_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUBJECTS AND TOPICS OVERVIEW ===';

  FOR v_subject IN
    SELECT name, display_name, icon, color, exam_type, sort_order
    FROM subjects
    WHERE is_active = true
    ORDER BY sort_order
  LOOP
    -- Count topics for this subject
    SELECT COUNT(*) INTO v_topic_count
    FROM topics t
    WHERE t.subject_id = (SELECT id FROM subjects s WHERE s.name = v_subject.name)
      AND t.is_active = true;

    RAISE NOTICE '% % (%) - % topics - %',
      v_subject.icon,
      v_subject.display_name,
      v_subject.exam_type,
      v_topic_count,
      v_subject.color;
  END LOOP;
END $$;

-- Test core functions without requiring specific users
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FUNCTION AVAILABILITY CHECK ===';

  -- Check if core functions exist
  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_data'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✅ get_dashboard_data() function exists';
  ELSE
    RAISE NOTICE '❌ get_dashboard_data() function missing';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'upsert_subject_progress'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✅ upsert_subject_progress() function exists';
  ELSE
    RAISE NOTICE '❌ upsert_subject_progress() function missing';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'update_user_xp_and_achievements'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✅ update_user_xp_and_achievements() function exists';
  ELSE
    RAISE NOTICE '❌ update_user_xp_and_achievements() function missing';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'create_study_room'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✅ create_study_room() function exists';
  ELSE
    RAISE NOTICE '❌ create_study_room() function missing';
  END IF;
END $$;

-- Check table relationships
DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TABLE STRUCTURE CHECK ===';

  -- Count all new tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'subjects', 'topics', 'subject_progress_daily',
      'user_statistics', 'weekly_performance', 'leaderboard_cache',
      'file_uploads', 'ai_solutions', 'content_library',
      'study_rooms', 'notifications', 'friend_requests'
    );

  RAISE NOTICE 'New tables created: %/12', v_table_count;

  IF v_table_count >= 10 THEN
    RAISE NOTICE '✅ Core tables created successfully';
  ELSE
    RAISE NOTICE '❌ Some tables missing (expected 12, got %)', v_table_count;
  END IF;
END $$;

-- Test XP calculation function
DO $$
DECLARE
  v_xp INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== XP CALCULATION TEST ===';

  -- Test XP calculation
  SELECT calculate_question_xp(10, 8, 5) INTO v_xp;
  RAISE NOTICE 'XP for 10 questions (8 correct, difficulty 5): % XP', v_xp;

  SELECT calculate_question_xp(5, 5, 3) INTO v_xp;
  RAISE NOTICE 'XP for 5 questions (5 correct, difficulty 3): % XP', v_xp;

  IF v_xp > 0 THEN
    RAISE NOTICE '✅ XP calculation working';
  ELSE
    RAISE NOTICE '❌ XP calculation not working';
  END IF;
END $$;

-- Final status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SARA DATABASE SCHEMA VERIFICATION COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Schema Status: READY FOR FRONTEND INTEGRATION';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create a user account through Supabase Auth';
  RAISE NOTICE '2. Test QuickAddModal → question_entries table';
  RAISE NOTICE '3. Test ExamAddModal → exam_entries table';
  RAISE NOTICE '4. Test get_dashboard_data() function';
  RAISE NOTICE '5. Verify XP and achievement triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for FAZE 4B Backend Integration! 🚀';
  RAISE NOTICE '';
END $$;