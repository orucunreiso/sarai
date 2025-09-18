-- Create Core Subjects and Topics Tables
-- Migration: 008_create_core_subjects.sql
-- Description: Subject hierarchy, topics, and content structure for SARA platform
-- Purpose: Replace hard-coded subjects with database-driven system

-- ===================================================================
-- SUBJECTS TABLE - Master data for TYT/AYT subjects
-- ===================================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  color TEXT NOT NULL, -- Hex color for UI theming
  exam_type TEXT NOT NULL CHECK (exam_type IN ('tyt', 'ayt', 'both')),
  question_count_tyt INTEGER DEFAULT 0 CHECK (question_count_tyt >= 0),
  question_count_ayt INTEGER DEFAULT 0 CHECK (question_count_ayt >= 0),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- TOPICS TABLE - Subject topics and subtopics hierarchy
-- ===================================================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES topics(id) ON DELETE CASCADE, -- For subtopics
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_time_minutes INTEGER DEFAULT 30 CHECK (estimated_time_minutes > 0),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional topic metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(subject_id, name),
  CHECK (parent_topic_id != id) -- Prevent self-reference
);

-- ===================================================================
-- SUBJECT PROGRESS DAILY - Daily progress tracking per subject
-- ===================================================================
CREATE TABLE IF NOT EXISTS subject_progress_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  progress_date DATE DEFAULT CURRENT_DATE,
  questions_attempted INTEGER DEFAULT 0 CHECK (questions_attempted >= 0),
  questions_correct INTEGER DEFAULT 0 CHECK (questions_correct >= 0),
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN questions_attempted > 0 THEN ROUND((questions_correct::decimal / questions_attempted::decimal) * 100, 2)
      ELSE 0
    END
  ) STORED,
  study_time_minutes INTEGER DEFAULT 0 CHECK (study_time_minutes >= 0),
  topics_studied INTEGER DEFAULT 0 CHECK (topics_studied >= 0),
  xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, subject_id, progress_date)
);

-- ===================================================================
-- ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress_daily ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- RLS POLICIES - Subjects (public read, admin write)
-- ===================================================================
CREATE POLICY "Everyone can view active subjects" ON subjects
  FOR SELECT USING (is_active = true);

-- ===================================================================
-- RLS POLICIES - Topics (public read, admin write)
-- ===================================================================
CREATE POLICY "Everyone can view active topics" ON topics
  FOR SELECT USING (is_active = true);

-- ===================================================================
-- RLS POLICIES - Subject Progress Daily (user-specific)
-- ===================================================================
CREATE POLICY "Users can view own subject progress" ON subject_progress_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subject progress" ON subject_progress_daily
  FOR ALL USING (auth.uid() = user_id);

-- ===================================================================
-- PERFORMANCE INDEXES
-- ===================================================================
-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_exam_type ON subjects(exam_type, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_active_sort ON subjects(is_active, sort_order);

-- Topics indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_active ON topics(subject_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON topics(difficulty_level);

-- Subject progress indexes
CREATE INDEX IF NOT EXISTS idx_subject_progress_user_date ON subject_progress_daily(user_id, progress_date DESC);
CREATE INDEX IF NOT EXISTS idx_subject_progress_subject_date ON subject_progress_daily(subject_id, progress_date DESC);
CREATE INDEX IF NOT EXISTS idx_subject_progress_success_rate ON subject_progress_daily(success_rate DESC);

-- ===================================================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE TRIGGER trigger_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subject_progress_daily_updated_at
  BEFORE UPDATE ON subject_progress_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- INSERT INITIAL SUBJECTS DATA (SARA Dashboard 9 subjects)
-- ===================================================================
INSERT INTO subjects (name, display_name, icon, color, exam_type, question_count_tyt, question_count_ayt, difficulty_level, sort_order, description) VALUES
-- TYT & AYT Subjects (All 9 subjects)
('matematik', 'Matematik', '🔢', '#FF6B6B', 'both', 40, 30, 5, 1, 'Temel matematik ve geometri konuları'),
('fizik', 'Fizik', '⚛️', '#4ECDC4', 'both', 7, 14, 5, 2, 'Fizik yasaları ve uygulamaları'),
('kimya', 'Kimya', '🧪', '#45B7D1', 'both', 7, 13, 4, 3, 'Kimyasal reaksiyonlar ve bileşikler'),
('biyoloji', 'Biyoloji', '🧬', '#96CEB4', 'both', 6, 13, 3, 4, 'Canlılar ve yaşam süreçleri'),
('turkce', 'Türkçe', '📚', '#FECA57', 'tyt', 40, 0, 3, 5, 'Dil ve anlatım becerileri'),
('tarih', 'Tarih', '🏛️', '#FF9FF3', 'ayt', 0, 10, 2, 6, 'Tarihsel olaylar ve dönemler'),
('cografya', 'Coğrafya', '🌍', '#54A0FF', 'ayt', 0, 6, 2, 7, 'Dünya coğrafyası ve beşeri coğrafya'),
('felsefe', 'Felsefe', '🤔', '#5F27CD', 'ayt', 0, 12, 3, 8, 'Felsefi düşünce ve mantık'),
('dil', 'Yabancı Dil', '🗣️', '#00D2D3', 'ayt', 0, 80, 4, 9, 'İngilizce dil becerileri')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  exam_type = EXCLUDED.exam_type,
  question_count_tyt = EXCLUDED.question_count_tyt,
  question_count_ayt = EXCLUDED.question_count_ayt,
  difficulty_level = EXCLUDED.difficulty_level,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ===================================================================
-- INSERT INITIAL TOPICS DATA (All 9 subjects with topics)
-- ===================================================================

-- Matematik topics
INSERT INTO topics (subject_id, name, display_name, description, difficulty_level, estimated_time_minutes, sort_order)
SELECT s.id, 'temel_matematik', 'Temel Matematik', 'Sayılar, denklemler, cebirsel işlemler', 2, 45, 1
FROM subjects s WHERE s.name = 'matematik'
UNION ALL
SELECT s.id, 'geometri', 'Geometri', 'Şekiller, alan, hacim hesaplamaları', 4, 60, 2
FROM subjects s WHERE s.name = 'matematik'
UNION ALL
SELECT s.id, 'fonksiyonlar', 'Fonksiyonlar', 'Fonksiyon türleri ve grafikleri', 5, 90, 3
FROM subjects s WHERE s.name = 'matematik'
UNION ALL
SELECT s.id, 'turev_integral', 'Türev ve İntegral', 'Türev alma ve integral hesaplama', 5, 120, 4
FROM subjects s WHERE s.name = 'matematik'

-- Fizik topics
UNION ALL
SELECT s.id, 'mekanik', 'Mekanik', 'Hareket, kuvvet, enerji', 3, 60, 1
FROM subjects s WHERE s.name = 'fizik'
UNION ALL
SELECT s.id, 'termodinamik', 'Termodinamik', 'Isı, sıcaklık ve hal değişimleri', 4, 75, 2
FROM subjects s WHERE s.name = 'fizik'
UNION ALL
SELECT s.id, 'elektrik_magnetizma', 'Elektrik ve Manyetizma', 'Elektrik akımı ve manyetik alanlar', 5, 90, 3
FROM subjects s WHERE s.name = 'fizik'
UNION ALL
SELECT s.id, 'optik', 'Optik', 'Işık, mercekler, aynalar', 4, 60, 4
FROM subjects s WHERE s.name = 'fizik'

-- Kimya topics
UNION ALL
SELECT s.id, 'atom_molekul', 'Atom ve Molekül', 'Atom yapısı ve periyodik sistem', 3, 45, 1
FROM subjects s WHERE s.name = 'kimya'
UNION ALL
SELECT s.id, 'kimyasal_baglar', 'Kimyasal Bağlar', 'İyonik, kovalent, metalik bağlar', 4, 60, 2
FROM subjects s WHERE s.name = 'kimya'
UNION ALL
SELECT s.id, 'asit_baz', 'Asit ve Baz', 'pH, asitlik, bazlık', 3, 45, 3
FROM subjects s WHERE s.name = 'kimya'
UNION ALL
SELECT s.id, 'organik_kimya', 'Organik Kimya', 'Karbon bileşikleri ve reaksiyonlar', 5, 90, 4
FROM subjects s WHERE s.name = 'kimya'

-- Biyoloji topics
UNION ALL
SELECT s.id, 'hucre_biyolojisi', 'Hücre Biyolojisi', 'Hücre yapısı ve organelleri', 2, 30, 1
FROM subjects s WHERE s.name = 'biyoloji'
UNION ALL
SELECT s.id, 'genetik', 'Genetik', 'Kalıtım, DNA, genler', 4, 60, 2
FROM subjects s WHERE s.name = 'biyoloji'
UNION ALL
SELECT s.id, 'ekoloji', 'Ekoloji', 'Ekosistem ve çevre ilişkileri', 3, 45, 3
FROM subjects s WHERE s.name = 'biyoloji'
UNION ALL
SELECT s.id, 'insan_sistemi', 'İnsan ve Sağlık', 'Vücut sistemleri ve hastalıklar', 3, 45, 4
FROM subjects s WHERE s.name = 'biyoloji'

-- Türkçe topics
UNION ALL
SELECT s.id, 'okudugun_anlama', 'Okuduğunu Anlama', 'Metin anlama ve yorumlama', 3, 60, 1
FROM subjects s WHERE s.name = 'turkce'
UNION ALL
SELECT s.id, 'dil_bilgisi', 'Dil Bilgisi', 'Gramer kuralları ve yazım', 2, 30, 2
FROM subjects s WHERE s.name = 'turkce'
UNION ALL
SELECT s.id, 'edebiyat', 'Edebiyat', 'Edebi eserler ve sanatçılar', 4, 90, 3
FROM subjects s WHERE s.name = 'turkce'

-- Tarih topics
UNION ALL
SELECT s.id, 'genel_tarih', 'Genel Tarih', 'Dünya ve Türk tarihi', 2, 45, 1
FROM subjects s WHERE s.name = 'tarih'
UNION ALL
SELECT s.id, 'cagdas_tarih', 'Çağdaş Tarih', 'Modern dönem tarihi', 3, 60, 2
FROM subjects s WHERE s.name = 'tarih'

-- Coğrafya topics
UNION ALL
SELECT s.id, 'fiziki_cografya', 'Fiziki Coğrafya', 'Dünya coğrafyası', 2, 45, 1
FROM subjects s WHERE s.name = 'cografya'
UNION ALL
SELECT s.id, 'beseri_cografya', 'Beşeri Coğrafya', 'İnsan ve çevre ilişkileri', 3, 50, 2
FROM subjects s WHERE s.name = 'cografya'

-- Felsefe topics
UNION ALL
SELECT s.id, 'mantik', 'Mantık', 'Mantık kuralları ve çıkarım', 3, 45, 1
FROM subjects s WHERE s.name = 'felsefe'
UNION ALL
SELECT s.id, 'felsefe_tarihi', 'Felsefe Tarihi', 'Felsefi akımlar ve düşünürler', 4, 60, 2
FROM subjects s WHERE s.name = 'felsefe'

-- Yabancı Dil topics
UNION ALL
SELECT s.id, 'grammar', 'Grammar', 'İngilizce gramer kuralları', 3, 45, 1
FROM subjects s WHERE s.name = 'dil'
UNION ALL
SELECT s.id, 'reading', 'Reading', 'Okuduğunu anlama ve kelime', 4, 60, 2
FROM subjects s WHERE s.name = 'dil'

ON CONFLICT (subject_id, name) DO NOTHING;

-- ===================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ===================================================================

-- View for dashboard subject progress (with today's data)
CREATE OR REPLACE VIEW dashboard_subject_progress AS
SELECT
  s.id as subject_id,
  s.name,
  s.display_name,
  s.icon,
  s.color,
  COALESCE(spd.questions_attempted, 0) as today_questions,
  COALESCE(spd.success_rate, 0) as today_success_rate,
  COALESCE(spd.study_time_minutes, 0) as today_study_time
FROM subjects s
LEFT JOIN subject_progress_daily spd ON s.id = spd.subject_id
  AND spd.progress_date = CURRENT_DATE
  AND spd.user_id = auth.uid()
WHERE s.is_active = true
ORDER BY s.sort_order;

-- View for weekly subject performance
CREATE OR REPLACE VIEW weekly_subject_performance AS
SELECT
  s.id as subject_id,
  s.name,
  s.display_name,
  DATE_TRUNC('week', spd.progress_date)::date as week_start,
  SUM(spd.questions_attempted) as week_questions,
  ROUND(AVG(spd.success_rate), 2) as week_avg_success_rate,
  SUM(spd.study_time_minutes) as week_study_time,
  COUNT(DISTINCT spd.progress_date) as active_days
FROM subjects s
LEFT JOIN subject_progress_daily spd ON s.id = spd.subject_id
WHERE s.is_active = true
  AND spd.progress_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.id, s.name, s.display_name, DATE_TRUNC('week', spd.progress_date)
ORDER BY week_start DESC, s.sort_order;

-- ===================================================================
-- HELPFUL FUNCTIONS
-- ===================================================================

-- Function to get user's subject progress for specific date range
CREATE OR REPLACE FUNCTION get_user_subject_progress(
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  subject_name TEXT,
  display_name TEXT,
  icon TEXT,
  total_questions INTEGER,
  total_correct INTEGER,
  avg_success_rate DECIMAL,
  total_study_time INTEGER,
  active_days INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    s.name,
    s.display_name,
    s.icon,
    COALESCE(SUM(spd.questions_attempted), 0)::INTEGER,
    COALESCE(SUM(spd.questions_correct), 0)::INTEGER,
    COALESCE(ROUND(AVG(spd.success_rate), 2), 0),
    COALESCE(SUM(spd.study_time_minutes), 0)::INTEGER,
    COUNT(DISTINCT spd.progress_date)::INTEGER
  FROM subjects s
  LEFT JOIN subject_progress_daily spd ON s.id = spd.subject_id
    AND spd.user_id = p_user_id
    AND spd.progress_date BETWEEN p_start_date AND p_end_date
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.display_name, s.icon, s.sort_order
  ORDER BY s.sort_order;
$$;

-- Function to update or insert daily subject progress
CREATE OR REPLACE FUNCTION upsert_subject_progress(
  p_user_id UUID,
  p_subject_name TEXT,
  p_questions_attempted INTEGER DEFAULT 0,
  p_questions_correct INTEGER DEFAULT 0,
  p_study_time_minutes INTEGER DEFAULT 0,
  p_progress_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subject_id UUID;
  v_progress_id UUID;
BEGIN
  -- Get subject ID
  SELECT id INTO v_subject_id
  FROM subjects
  WHERE name = p_subject_name AND is_active = true;

  IF v_subject_id IS NULL THEN
    RAISE EXCEPTION 'Subject not found: %', p_subject_name;
  END IF;

  -- Upsert progress record
  INSERT INTO subject_progress_daily (
    user_id, subject_id, progress_date,
    questions_attempted, questions_correct, study_time_minutes,
    topics_studied
  ) VALUES (
    p_user_id, v_subject_id, p_progress_date,
    p_questions_attempted, p_questions_correct, p_study_time_minutes,
    1
  )
  ON CONFLICT (user_id, subject_id, progress_date)
  DO UPDATE SET
    questions_attempted = subject_progress_daily.questions_attempted + EXCLUDED.questions_attempted,
    questions_correct = subject_progress_daily.questions_correct + EXCLUDED.questions_correct,
    study_time_minutes = subject_progress_daily.study_time_minutes + EXCLUDED.study_time_minutes,
    topics_studied = GREATEST(subject_progress_daily.topics_studied, EXCLUDED.topics_studied),
    updated_at = NOW()
  RETURNING id INTO v_progress_id;

  RETURN v_progress_id;
END;
$$;