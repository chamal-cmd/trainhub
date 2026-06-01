-- ─────────────────────────────────────────────────────────────────────────────
-- TrainHub performance indexes
-- Run once against your Supabase project via the SQL editor or psql.
-- All statements use IF NOT EXISTS so they are safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- assignments.user_id
-- Most queries filter assignments by the current user; without this index every
-- assignment scan is a full-table sequential scan.
CREATE INDEX IF NOT EXISTS idx_assignments_user_id
  ON assignments (user_id);

-- assignments.subject_id
-- The training subject page looks up the assignment by (subject_id, user_id).
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id
  ON assignments (subject_id);

-- Composite: (user_id, subject_id) covers the single-row lookup in the training
-- subject page exactly and can replace both individual indexes above for that query.
CREATE INDEX IF NOT EXISTS idx_assignments_user_subject
  ON assignments (user_id, subject_id);

-- step_progress.user_id
-- Every dashboard / profile / training page filters step_progress by user.
CREATE INDEX IF NOT EXISTS idx_step_progress_user_id
  ON step_progress (user_id);

-- step_progress.step_id
-- Used when looking up whether a specific step is complete.
CREATE INDEX IF NOT EXISTS idx_step_progress_step_id
  ON step_progress (step_id);

-- Composite: (user_id, step_id) — covers the upsert in the topic page and the
-- completed-step lookup simultaneously.
CREATE INDEX IF NOT EXISTS idx_step_progress_user_step
  ON step_progress (user_id, step_id);

-- quiz_attempts.user_id
-- Profile and training subject pages filter by user.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id
  ON quiz_attempts (user_id);

-- quiz_attempts.passed
-- Admin dashboard counts passed attempts; this partial index keeps it fast.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed
  ON quiz_attempts (passed)
  WHERE passed = true;

-- quiz_attempts.completed_at (descending)
-- The admin page and profile page both ORDER BY completed_at DESC LIMIT N.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at_desc
  ON quiz_attempts (completed_at DESC);

-- profiles.id is the primary key — already indexed by Postgres automatically.

-- profiles.role
-- Admin dashboard counts users by role; middleware checks role for admin gate.
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles (role);

-- subjects.created_at (descending)
-- Admin dashboard selects the 6 most recent subjects.
CREATE INDEX IF NOT EXISTS idx_subjects_created_at_desc
  ON subjects (created_at DESC);

-- topics.order_index within a subject
-- Training subject page sorts topics by order_index for every page load.
CREATE INDEX IF NOT EXISTS idx_topics_order_index
  ON topics (order_index);

-- steps.order_index within a topic
-- Training topic page sorts steps by order_index on every load.
CREATE INDEX IF NOT EXISTS idx_steps_order_index
  ON steps (order_index);
