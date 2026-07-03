-- Rich text content per client subtask, matching the regular training step editor
ALTER TABLE client_subtasks ADD COLUMN IF NOT EXISTS content JSONB;
