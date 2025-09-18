-- Create Surprise Box System Tables
-- Migration: 005_create_surprise_box_system.sql

-- Surprise Boxes Table
CREATE TABLE surprise_boxes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    box_type TEXT NOT NULL CHECK (box_type IN ('daily', 'weekly', 'achievement', 'milestone', 'special')),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    opened_at TIMESTAMP WITH TIME ZONE,
    reward JSONB, -- Stores the reward information when opened
    is_opened BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Effects Table (for temporary effects like double XP, streak freeze)
CREATE TABLE user_effects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    effect_type TEXT NOT NULL CHECK (effect_type IN ('double_xp', 'streak_freeze', 'bonus_multiplier')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effect_data JSONB DEFAULT '{}', -- Additional effect parameters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    UNIQUE(user_id, effect_type) -- Only one active effect per type per user
);

-- User Credits Table (for bonus questions, hints, etc.)
CREATE TABLE user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('questions', 'hints', 'skips', 'solutions')),
    amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    UNIQUE(user_id, credit_type)
);

-- Indexes for better performance
CREATE INDEX idx_surprise_boxes_user_id ON surprise_boxes(user_id);
CREATE INDEX idx_surprise_boxes_user_opened ON surprise_boxes(user_id, is_opened);
CREATE INDEX idx_surprise_boxes_type_date ON surprise_boxes(box_type, earned_at);

CREATE INDEX idx_user_effects_user_id ON user_effects(user_id);
CREATE INDEX idx_user_effects_active ON user_effects(user_id, is_active, expires_at);
CREATE INDEX idx_user_effects_type ON user_effects(effect_type, is_active);

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_type ON user_credits(credit_type);

-- RLS Policies
ALTER TABLE surprise_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Surprise Boxes Policies
CREATE POLICY "Users can view own surprise boxes" ON surprise_boxes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own surprise boxes" ON surprise_boxes
    FOR UPDATE USING (auth.uid() = user_id);

-- User Effects Policies
CREATE POLICY "Users can view own effects" ON user_effects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own effects" ON user_effects
    FOR ALL USING (auth.uid() = user_id);

-- User Credits Policies
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own credits" ON user_credits
    FOR ALL USING (auth.uid() = user_id);

-- Functions for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_effects()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Deactivate expired effects
    UPDATE user_effects
    SET is_active = false, updated_at = now()
    WHERE is_active = true
    AND expires_at < now();
END;
$$;

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_effects_updated_at
    BEFORE UPDATE ON user_effects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Schedule cleanup function to run every hour (requires pg_cron extension in production)
-- SELECT cron.schedule('cleanup-expired-effects', '0 * * * *', 'SELECT cleanup_expired_effects();');

-- Insert some initial user credits for existing users (optional)
-- This gives existing users some bonus credits to start with
INSERT INTO user_credits (user_id, credit_type, amount)
SELECT
    id as user_id,
    'questions' as credit_type,
    5 as amount
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM user_credits WHERE credit_type = 'questions')
ON CONFLICT (user_id, credit_type) DO NOTHING;