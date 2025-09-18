-- Migration: 015_create_user_goals_table.sql
-- Description: Create user_goals table for manual goals functionality
-- Created: 2025-01-20

-- User Goals Table (Manuel hedefler için)
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal details
  goal_title TEXT NOT NULL,
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
  unit TEXT NOT NULL DEFAULT 'adet',
  
  -- Goal status
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Manual approval system
  manual_approval_required BOOLEAN DEFAULT true,
  is_manually_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_note TEXT,
  
  -- Date tracking
  goal_date DATE DEFAULT CURRENT_DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_current_value_not_exceed_target CHECK (current_value <= target_value)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_date ON user_goals(goal_date, user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active, goal_date);
CREATE INDEX IF NOT EXISTS idx_user_goals_approval ON user_goals(user_id, manual_approval_required, is_manually_approved);

-- Trigger for updated_at column
CREATE TRIGGER trigger_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_goals IS 'Manuel kullanıcı hedefleri tablosu';
COMMENT ON COLUMN user_goals.goal_title IS 'Hedef başlığı';
COMMENT ON COLUMN user_goals.target_value IS 'Hedef değer (kaç adet/sayfa/dakika vb.)';
COMMENT ON COLUMN user_goals.current_value IS 'Mevcut ilerleme değeri';
COMMENT ON COLUMN user_goals.unit IS 'Hedef birimi (adet, sayfa, dakika vb.)';
COMMENT ON COLUMN user_goals.manual_approval_required IS 'Manuel onay gerekip gerekmediği';
COMMENT ON COLUMN user_goals.is_manually_approved IS 'Manuel olarak onaylanıp onaylanmadığı';
COMMENT ON COLUMN user_goals.is_active IS 'Hedefin aktif olup olmadığı (silme yerine deaktif etme)';
