-- Migration: 002_create_rls_policies.sql
-- Description: Create RLS policies for chat tables (only if they don't exist)
-- Created: 2025-01-14

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;

-- Create policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for chat_messages
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );