-- SARA Platform Database Migration Runner
-- Run all migrations in correct order
-- Execute this file in Supabase SQL Editor

-- Migration 008: Core Subjects and Topics
\i '/Users/eventify/Desktop/sarai/database/migrations/008_create_core_subjects.sql';

-- Migration 009: Analytics Tables
\i '/Users/eventify/Desktop/sarai/database/migrations/009_create_analytics_tables.sql';

-- Migration 010: File Management
\i '/Users/eventify/Desktop/sarai/database/migrations/010_create_file_management.sql';

-- Migration 011: Social Features
\i '/Users/eventify/Desktop/sarai/database/migrations/011_create_social_extended.sql';

-- Migration 012: Triggers and Functions
\i '/Users/eventify/Desktop/sarai/database/migrations/012_create_triggers_functions.sql';

-- Migration 013: Test Data (Optional - for testing only)
-- \i '/Users/eventify/Desktop/sarai/database/migrations/013_test_schema_sample_data.sql';