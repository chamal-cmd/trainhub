-- Add completed_at to assignments so users can tick off nudges
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Allow users to mark their own assignments as completed (update completed_at only)
CREATE POLICY "assignments_user_complete" ON assignments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
