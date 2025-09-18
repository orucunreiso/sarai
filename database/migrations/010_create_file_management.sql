-- Create File Management and AI Solutions Tables
-- Migration: 010_create_file_management.sql
-- Description: File upload tracking, AI solution storage, and content management
-- Purpose: Track uploaded files, store AI responses, and manage user-generated content

-- ===================================================================
-- FILE UPLOADS TABLE - Track all uploaded files and metadata
-- ===================================================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File identification
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0), -- Size in bytes

  -- Storage information
  storage_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage
  storage_bucket TEXT NOT NULL DEFAULT 'user-uploads',
  public_url TEXT, -- Public URL if file is public

  -- File categorization
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'document', 'audio', 'video', 'other')),
  file_purpose TEXT NOT NULL CHECK (file_purpose IN ('question_image', 'solution_pdf', 'note_attachment', 'profile_avatar', 'content_media')),

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'archived')),
  ai_processed BOOLEAN DEFAULT false,
  ocr_extracted BOOLEAN DEFAULT false, -- Whether text was extracted from image

  -- Content analysis
  extracted_text TEXT, -- OCR or text extraction results
  content_tags TEXT[] DEFAULT '{}', -- Auto-generated tags
  detected_subjects TEXT[] DEFAULT '{}', -- Detected academic subjects
  quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1), -- Image/content quality score

  -- Metadata and context
  upload_context JSONB DEFAULT '{}', -- Additional context data
  processing_metadata JSONB DEFAULT '{}', -- Processing results and logs

  -- Security and access
  is_public BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  access_count INTEGER DEFAULT 0 CHECK (access_count >= 0),
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- AI SOLUTIONS TABLE - Store AI-generated solutions and responses
-- ===================================================================
CREATE TABLE IF NOT EXISTS ai_solutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request identification
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,

  -- Question and context
  question_text TEXT,
  question_subject TEXT,
  question_topic TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),

  -- File attachments
  source_file_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
  additional_files UUID[] DEFAULT '{}', -- Array of file_upload IDs

  -- AI response data
  ai_provider TEXT NOT NULL DEFAULT 'gemini' CHECK (ai_provider IN ('gemini', 'claude', 'openai', 'local')),
  model_version TEXT NOT NULL,
  solution_text TEXT NOT NULL,
  solution_steps JSONB, -- Structured step-by-step solution

  -- Solution categorization
  solution_type TEXT NOT NULL CHECK (solution_type IN ('step_by_step', 'concept_explanation', 'quick_answer', 'hint', 'verification')),
  concepts_covered TEXT[] DEFAULT '{}', -- Academic concepts explained
  formulas_used TEXT[] DEFAULT '{}', -- Mathematical formulas referenced

  -- Quality and feedback
  solution_quality DECIMAL(3,2) CHECK (solution_quality BETWEEN 0 AND 1),
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  is_helpful BOOLEAN,

  -- Processing metrics
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  token_count INTEGER CHECK (token_count >= 0),
  cost_usd DECIMAL(8,4) CHECK (cost_usd >= 0),

  -- Usage and analytics
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
  bookmark_count INTEGER DEFAULT 0 CHECK (bookmark_count >= 0),

  -- Metadata
  solution_metadata JSONB DEFAULT '{}',
  processing_logs JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- SOLUTION BOOKMARKS TABLE - User bookmarks for AI solutions
-- ===================================================================
CREATE TABLE IF NOT EXISTS solution_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solution_id UUID NOT NULL REFERENCES ai_solutions(id) ON DELETE CASCADE,

  -- Bookmark organization
  bookmark_name TEXT,
  bookmark_tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Access tracking
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, solution_id)
);

-- ===================================================================
-- CONTENT LIBRARY TABLE - User-generated and curated content
-- ===================================================================
CREATE TABLE IF NOT EXISTS content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content identification
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('note', 'formula_card', 'summary', 'flashcard', 'mind_map', 'cheat_sheet')),

  -- Academic categorization
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  grade_level INTEGER CHECK (grade_level BETWEEN 9 AND 12),

  -- Content data
  content_text TEXT,
  content_html TEXT, -- Rich text/HTML version
  content_json JSONB, -- Structured content (for flashcards, etc.)

  -- Attachments and media
  attached_files UUID[] DEFAULT '{}', -- Array of file_upload IDs
  cover_image_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,

  -- Organization and sharing
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',

  -- Quality and engagement
  quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
  bookmark_count INTEGER DEFAULT 0 CHECK (bookmark_count >= 0),

  -- Version control
  version INTEGER DEFAULT 1 CHECK (version > 0),
  parent_content_id UUID REFERENCES content_library(id) ON DELETE SET NULL,
  is_latest_version BOOLEAN DEFAULT true,

  -- Metadata
  content_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- CONTENT INTERACTIONS TABLE - Track user interactions with content
-- ===================================================================
CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES ai_solutions(id) ON DELETE CASCADE,

  -- Interaction type
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'bookmark', 'share', 'comment', 'rate')),

  -- Interaction data
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment_text TEXT,
  interaction_metadata JSONB DEFAULT '{}',

  -- Context
  session_duration_seconds INTEGER CHECK (session_duration_seconds >= 0),
  device_type TEXT,
  referrer_source TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (
    (content_id IS NOT NULL AND solution_id IS NULL) OR
    (content_id IS NULL AND solution_id IS NOT NULL)
  ) -- Ensure interaction is with exactly one content type
);

-- ===================================================================
-- ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- RLS POLICIES - File Uploads
-- ===================================================================
CREATE POLICY "Users can view own files" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON file_uploads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public files are viewable by all" ON file_uploads
  FOR SELECT USING (is_public = true AND processing_status = 'completed');

-- ===================================================================
-- RLS POLICIES - AI Solutions
-- ===================================================================
CREATE POLICY "Users can view own solutions" ON ai_solutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own solutions" ON ai_solutions
  FOR ALL USING (auth.uid() = user_id);

-- ===================================================================
-- RLS POLICIES - Solution Bookmarks
-- ===================================================================
CREATE POLICY "Users can view own bookmarks" ON solution_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON solution_bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- ===================================================================
-- RLS POLICIES - Content Library
-- ===================================================================
CREATE POLICY "Users can view own content" ON content_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content" ON content_library
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public content is viewable by all" ON content_library
  FOR SELECT USING (is_public = true);

-- ===================================================================
-- RLS POLICIES - Content Interactions
-- ===================================================================
CREATE POLICY "Users can view own interactions" ON content_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interactions" ON content_interactions
  FOR ALL USING (auth.uid() = user_id);

-- ===================================================================
-- PERFORMANCE INDEXES
-- ===================================================================

-- File Uploads indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type_purpose ON file_uploads(file_type, file_purpose);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(processing_status, ai_processed);
CREATE INDEX IF NOT EXISTS idx_file_uploads_storage_path ON file_uploads(storage_path);
CREATE INDEX IF NOT EXISTS idx_file_uploads_subjects ON file_uploads USING GIN(detected_subjects);

-- AI Solutions indexes
CREATE INDEX IF NOT EXISTS idx_ai_solutions_user_id ON ai_solutions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_solutions_session ON ai_solutions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_solutions_subject_topic ON ai_solutions(question_subject, question_topic);
CREATE INDEX IF NOT EXISTS idx_ai_solutions_quality ON ai_solutions(solution_quality DESC, user_rating DESC);
CREATE INDEX IF NOT EXISTS idx_ai_solutions_source_file ON ai_solutions(source_file_id);

-- Solution Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_solution_bookmarks_user ON solution_bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solution_bookmarks_solution ON solution_bookmarks(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_bookmarks_tags ON solution_bookmarks USING GIN(bookmark_tags);

-- Content Library indexes
CREATE INDEX IF NOT EXISTS idx_content_library_user_id ON content_library(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_library_subject_topic ON content_library(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(content_type, is_public);
CREATE INDEX IF NOT EXISTS idx_content_library_public ON content_library(is_public, quality_score DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_library_version ON content_library(parent_content_id, version DESC);

-- Content Interactions indexes
CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON content_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content ON content_interactions(content_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_solution ON content_interactions(solution_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON content_interactions(interaction_type, created_at DESC);

-- ===================================================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE TRIGGER trigger_file_uploads_updated_at
  BEFORE UPDATE ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ai_solutions_updated_at
  BEFORE UPDATE ON ai_solutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_solution_bookmarks_updated_at
  BEFORE UPDATE ON solution_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_content_library_updated_at
  BEFORE UPDATE ON content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- UTILITY FUNCTIONS
-- ===================================================================

-- Function to create AI solution record
CREATE OR REPLACE FUNCTION create_ai_solution(
  p_user_id UUID,
  p_session_id UUID,
  p_message_id UUID,
  p_question_text TEXT,
  p_solution_text TEXT,
  p_ai_provider TEXT DEFAULT 'gemini',
  p_model_version TEXT DEFAULT 'gemini-1.5-flash',
  p_processing_time_ms INTEGER DEFAULT 0,
  p_subject TEXT DEFAULT NULL,
  p_topic TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_solution_id UUID;
BEGIN
  INSERT INTO ai_solutions (
    user_id, session_id, message_id,
    question_text, solution_text,
    ai_provider, model_version, processing_time_ms,
    question_subject, question_topic,
    solution_type
  ) VALUES (
    p_user_id, p_session_id, p_message_id,
    p_question_text, p_solution_text,
    p_ai_provider, p_model_version, p_processing_time_ms,
    p_subject, p_topic,
    'step_by_step'
  )
  RETURNING id INTO v_solution_id;

  RETURN v_solution_id;
END;
$$;

-- Function to track file upload
CREATE OR REPLACE FUNCTION track_file_upload(
  p_user_id UUID,
  p_filename TEXT,
  p_original_filename TEXT,
  p_storage_path TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT,
  p_file_purpose TEXT DEFAULT 'question_image'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file_id UUID;
  v_file_extension TEXT;
  v_file_type TEXT;
BEGIN
  -- Extract file extension
  v_file_extension := LOWER(SUBSTRING(p_original_filename FROM '\\.([^\\.]*)$'));

  -- Determine file type
  v_file_type := CASE
    WHEN v_file_extension IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg') THEN 'image'
    WHEN v_file_extension IN ('pdf') THEN 'pdf'
    WHEN v_file_extension IN ('doc', 'docx', 'txt', 'rtf') THEN 'document'
    WHEN v_file_extension IN ('mp3', 'wav', 'ogg') THEN 'audio'
    WHEN v_file_extension IN ('mp4', 'avi', 'mov', 'webm') THEN 'video'
    ELSE 'other'
  END;

  INSERT INTO file_uploads (
    user_id, filename, original_filename, storage_path,
    file_size, mime_type, file_extension, file_type, file_purpose
  ) VALUES (
    p_user_id, p_filename, p_original_filename, p_storage_path,
    p_file_size, p_mime_type, v_file_extension, v_file_type, p_file_purpose
  )
  RETURNING id INTO v_file_id;

  RETURN v_file_id;
END;
$$;

-- Function to bookmark a solution
CREATE OR REPLACE FUNCTION bookmark_solution(
  p_user_id UUID,
  p_solution_id UUID,
  p_bookmark_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bookmark_id UUID;
BEGIN
  INSERT INTO solution_bookmarks (
    user_id, solution_id, bookmark_name, notes
  ) VALUES (
    p_user_id, p_solution_id, p_bookmark_name, p_notes
  )
  ON CONFLICT (user_id, solution_id)
  DO UPDATE SET
    bookmark_name = COALESCE(EXCLUDED.bookmark_name, solution_bookmarks.bookmark_name),
    notes = COALESCE(EXCLUDED.notes, solution_bookmarks.notes),
    updated_at = NOW()
  RETURNING id INTO v_bookmark_id;

  -- Update bookmark count on solution
  UPDATE ai_solutions
  SET bookmark_count = bookmark_count + 1
  WHERE id = p_solution_id;

  RETURN v_bookmark_id;
END;
$$;

-- Function to record content interaction
CREATE OR REPLACE FUNCTION record_content_interaction(
  p_user_id UUID,
  p_content_id UUID DEFAULT NULL,
  p_solution_id UUID DEFAULT NULL,
  p_interaction_type TEXT DEFAULT 'view',
  p_rating INTEGER DEFAULT NULL,
  p_comment_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO content_interactions (
    user_id, content_id, solution_id,
    interaction_type, rating, comment_text
  ) VALUES (
    p_user_id, p_content_id, p_solution_id,
    p_interaction_type, p_rating, p_comment_text
  )
  RETURNING id INTO v_interaction_id;

  -- Update counters based on interaction type
  IF p_interaction_type = 'view' AND p_content_id IS NOT NULL THEN
    UPDATE content_library SET view_count = view_count + 1 WHERE id = p_content_id;
  ELSIF p_interaction_type = 'view' AND p_solution_id IS NOT NULL THEN
    UPDATE ai_solutions SET view_count = view_count + 1 WHERE id = p_solution_id;
  ELSIF p_interaction_type = 'like' AND p_content_id IS NOT NULL THEN
    UPDATE content_library SET like_count = like_count + 1 WHERE id = p_content_id;
  END IF;

  RETURN v_interaction_id;
END;
$$;