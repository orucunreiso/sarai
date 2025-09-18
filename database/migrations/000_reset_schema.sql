-- Reset Schema - Only use if you need to start fresh
-- WARNING: This will delete all data!

-- Drop all new tables in reverse dependency order
DROP TABLE IF EXISTS content_interactions CASCADE;
DROP TABLE IF EXISTS content_library CASCADE;
DROP TABLE IF EXISTS solution_bookmarks CASCADE;
DROP TABLE IF EXISTS ai_solutions CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;

DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS study_room_messages CASCADE;
DROP TABLE IF EXISTS study_room_participants CASCADE;
DROP TABLE IF EXISTS study_rooms CASCADE;

DROP TABLE IF EXISTS performance_milestones CASCADE;
DROP TABLE IF EXISTS subject_analytics CASCADE;
DROP TABLE IF EXISTS leaderboard_cache CASCADE;
DROP TABLE IF EXISTS weekly_performance CASCADE;
DROP TABLE IF EXISTS user_statistics CASCADE;

DROP TABLE IF EXISTS subject_progress_daily CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- Drop views and materialized views
DROP MATERIALIZED VIEW IF EXISTS friends_leaderboard_current CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dashboard_weekly_summary CASCADE;
DROP VIEW IF EXISTS weekly_subject_performance CASCADE;
DROP VIEW IF EXISTS dashboard_subject_progress CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_old_data() CASCADE;
DROP FUNCTION IF EXISTS process_daily_analytics() CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_daily_goals_progress(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS trigger_update_study_streak() CASCADE;
DROP FUNCTION IF EXISTS trigger_exam_entry_xp() CASCADE;
DROP FUNCTION IF EXISTS trigger_question_entry_xp() CASCADE;
DROP FUNCTION IF EXISTS check_streak_achievements(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_and_unlock_achievements(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_user_xp_and_achievements(UUID, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_question_xp(INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS record_content_interaction(UUID, UUID, UUID, TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS bookmark_solution(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS track_file_upload(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_ai_solution(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS send_friend_request(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS join_study_room(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_study_room(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS generate_room_code() CASCADE;
DROP FUNCTION IF EXISTS refresh_dashboard_analytics() CASCADE;
DROP FUNCTION IF EXISTS update_user_statistics(UUID, TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS compute_weekly_performance(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_user_subject_progress(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS upsert_subject_progress(UUID, TEXT, INTEGER, INTEGER, INTEGER, DATE) CASCADE;

NOTIFY 'schema_reset_complete';