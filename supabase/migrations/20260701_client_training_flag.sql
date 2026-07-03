-- Add flag to distinguish client-specific training modules from general KB modules
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_client_training BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast filtering on the client training page
CREATE INDEX IF NOT EXISTS idx_subjects_client_training ON subjects (is_client_training) WHERE is_client_training = TRUE;
