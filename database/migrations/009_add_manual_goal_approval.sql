-- Add Manual Goal Approval System
-- Migration: 009_add_manual_goal_approval.sql
-- Description: Add manual approval system for daily goals to prevent automatic completion

-- Add manual approval fields to daily_goals table
ALTER TABLE daily_goals
ADD COLUMN manual_approval_required BOOLEAN DEFAULT true,
ADD COLUMN is_manually_approved BOOLEAN DEFAULT false,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approval_note TEXT;

-- Update the is_completed calculation to require manual approval when enabled
-- First drop the existing generated column
ALTER TABLE daily_goals DROP COLUMN is_completed;

-- Add the new calculated column that considers manual approval
ALTER TABLE daily_goals
ADD COLUMN is_completed BOOLEAN GENERATED ALWAYS AS (
  achieved_questions >= target_questions AND
  achieved_duration >= target_duration AND
  achieved_subjects >= target_subjects AND
  (NOT manual_approval_required OR is_manually_approved)
) STORED;

-- Create index for better performance on approval queries
CREATE INDEX IF NOT EXISTS idx_daily_goals_manual_approval
ON daily_goals(user_id, goal_date, manual_approval_required, is_manually_approved);

-- Add comment for documentation
COMMENT ON COLUMN daily_goals.manual_approval_required IS 'Whether this goal requires manual approval to be marked as completed';
COMMENT ON COLUMN daily_goals.is_manually_approved IS 'Whether this goal has been manually approved by the user';
COMMENT ON COLUMN daily_goals.approved_at IS 'Timestamp when the goal was manually approved';
COMMENT ON COLUMN daily_goals.approval_note IS 'Optional note added during manual approval';