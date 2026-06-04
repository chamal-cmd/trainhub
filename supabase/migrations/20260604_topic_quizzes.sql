-- Migration: per-topic AI quizzes
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Store AI-generated quiz questions on each topic row (JSONB)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS ai_quiz JSONB;

-- 2. Track which users completed each topic's quiz
CREATE TABLE IF NOT EXISTS topic_quiz_completions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  topic_id    UUID REFERENCES topics(id)    ON DELETE CASCADE NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed      BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE topic_quiz_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tqc_own"         ON topic_quiz_completions FOR ALL     USING (auth.uid() = user_id);
CREATE POLICY "tqc_admin_read"  ON topic_quiz_completions FOR SELECT  USING (is_admin());
