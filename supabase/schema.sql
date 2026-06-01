-- TrainHub Database Schema
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor > New Query)

-- =============================================
-- 1. PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup.
-- If the same email already has a profile (e.g. user had email/password and now signs
-- in via Google for the first time), inherit their existing role so admins stay admins.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  inherited_role TEXT;
BEGIN
  -- Look up an existing role by email (handles Google ↔ password same-account case)
  SELECT role INTO inherited_role FROM profiles WHERE email = NEW.email LIMIT 1;

  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(inherited_role, NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 2. SUBJECTS
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_color TEXT DEFAULT '#4F46E5',
  emoji TEXT DEFAULT '📚',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TOPICS (chapters within subjects)
-- =============================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. STEPS (content pages within topics)
-- =============================================
CREATE TABLE IF NOT EXISTS steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. QUIZZES
-- =============================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Module Quiz',
  passing_score INTEGER DEFAULT 70 CHECK (passing_score BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id)
);

-- =============================================
-- 6. QUIZ QUESTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false')),
  order_index INTEGER DEFAULT 0,
  explanation TEXT
);

-- =============================================
-- 7. QUIZ OPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

-- =============================================
-- 8. ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, user_id)
);

-- =============================================
-- 9. STEP PROGRESS
-- =============================================
CREATE TABLE IF NOT EXISTS step_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES steps(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_id)
);

-- =============================================
-- 10. QUIZ ATTEMPTS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. QUIZ ATTEMPT ANSWERS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_id UUID REFERENCES quiz_options(id)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- subjects
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subjects_admin_write" ON subjects FOR ALL USING (is_admin());

-- topics
CREATE POLICY "topics_select" ON topics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "topics_admin_write" ON topics FOR ALL USING (is_admin());

-- steps
CREATE POLICY "steps_select" ON steps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "steps_admin_write" ON steps FOR ALL USING (is_admin());

-- quizzes
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quizzes_admin_write" ON quizzes FOR ALL USING (is_admin());

-- quiz_questions
CREATE POLICY "quiz_questions_select" ON quiz_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quiz_questions_admin_write" ON quiz_questions FOR ALL USING (is_admin());

-- quiz_options
CREATE POLICY "quiz_options_select" ON quiz_options FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quiz_options_admin_write" ON quiz_options FOR ALL USING (is_admin());

-- assignments
CREATE POLICY "assignments_select_own" ON assignments FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "assignments_admin_write" ON assignments FOR ALL USING (is_admin());

-- step_progress
CREATE POLICY "step_progress_own" ON step_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "step_progress_admin_read" ON step_progress FOR SELECT USING (is_admin());

-- quiz_attempts
CREATE POLICY "quiz_attempts_own" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quiz_attempts_admin_read" ON quiz_attempts FOR SELECT USING (is_admin());

-- quiz_attempt_answers
CREATE POLICY "quiz_attempt_answers_own" ON quiz_attempt_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND user_id = auth.uid()));
CREATE POLICY "quiz_attempt_answers_admin" ON quiz_attempt_answers FOR SELECT USING (is_admin());
