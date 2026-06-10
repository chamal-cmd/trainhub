-- Client-wise training feature
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  xero_file    TEXT,
  description  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Main tasks per client (e.g. "Pay Runs", "Creditors Pay", "Month End")
CREATE TABLE IF NOT EXISTS client_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- Sub-tasks per main task (e.g. "Staff Payroll", "GP Payments")
CREATE TABLE IF NOT EXISTS client_subtasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_task_id UUID REFERENCES client_tasks(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  video_url      TEXT,
  order_index    INTEGER DEFAULT 0
);

-- Access tools per client (e.g. "Xero", "Asana", "Dext")
CREATE TABLE IF NOT EXISTS client_access_tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  tool_name   TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- Training assignments: a trainee assigned to a client with a trainer
CREATE TABLE IF NOT EXISTS client_training_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  trainee_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trainer_id  UUID REFERENCES profiles(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, trainee_id)
);

-- Subtask progress per assignment (training date, hands-on date, status, remarks)
CREATE TABLE IF NOT EXISTS client_subtask_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID REFERENCES client_training_assignments(id) ON DELETE CASCADE NOT NULL,
  subtask_id      UUID REFERENCES client_subtasks(id) ON DELETE CASCADE NOT NULL,
  training_date   DATE,
  hands_on_date   DATE,
  status          TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  remarks         TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, subtask_id)
);

-- Access tool progress per assignment
CREATE TABLE IF NOT EXISTS client_access_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID REFERENCES client_training_assignments(id) ON DELETE CASCADE NOT NULL,
  access_tool_id  UUID REFERENCES client_access_tools(id) ON DELETE CASCADE NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  remarks         TEXT,
  UNIQUE(assignment_id, access_tool_id)
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE clients                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subtasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_access_tools       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subtask_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_access_progress    ENABLE ROW LEVEL SECURITY;

-- Admins: full access to everything
CREATE POLICY "clients_admin"               ON clients                   FOR ALL USING (is_admin());
CREATE POLICY "client_tasks_admin"          ON client_tasks              FOR ALL USING (is_admin());
CREATE POLICY "client_subtasks_admin"       ON client_subtasks           FOR ALL USING (is_admin());
CREATE POLICY "client_access_tools_admin"   ON client_access_tools       FOR ALL USING (is_admin());
CREATE POLICY "cta_admin"                   ON client_training_assignments FOR ALL USING (is_admin());
CREATE POLICY "csp_admin"                   ON client_subtask_progress   FOR ALL USING (is_admin());
CREATE POLICY "cap_admin"                   ON client_access_progress    FOR ALL USING (is_admin());

-- Trainees: read clients they are assigned to
CREATE POLICY "clients_trainee_read" ON clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_training_assignments cta
          WHERE cta.client_id = clients.id AND cta.trainee_id = auth.uid())
);
CREATE POLICY "client_tasks_trainee_read" ON client_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_training_assignments cta
          WHERE cta.client_id = client_tasks.client_id AND cta.trainee_id = auth.uid())
);
CREATE POLICY "client_subtasks_trainee_read" ON client_subtasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_tasks ct
    JOIN client_training_assignments cta ON cta.client_id = ct.client_id
    WHERE ct.id = client_subtasks.client_task_id AND cta.trainee_id = auth.uid()
  )
);
CREATE POLICY "client_access_tools_trainee_read" ON client_access_tools FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_training_assignments cta
          WHERE cta.client_id = client_access_tools.client_id AND cta.trainee_id = auth.uid())
);

-- Trainees and trainers: read own assignments
CREATE POLICY "cta_own_read" ON client_training_assignments FOR SELECT USING (
  trainee_id = auth.uid() OR trainer_id = auth.uid()
);

-- Trainees: manage their own subtask progress
CREATE POLICY "csp_own" ON client_subtask_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM client_training_assignments cta
          WHERE cta.id = client_subtask_progress.assignment_id AND cta.trainee_id = auth.uid())
);

-- Trainees: manage their own access progress
CREATE POLICY "cap_own" ON client_access_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM client_training_assignments cta
          WHERE cta.id = client_access_progress.assignment_id AND cta.trainee_id = auth.uid())
);
