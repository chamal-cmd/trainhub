-- Add pod, bookkeeper, trainer fields to clients
-- (required by the client editor added in commit 2eccda1)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS pod        TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bookkeeper TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id);

-- Backfill pod / bookkeeper from the legacy "Pod: X | Bookkeeper: Y" description format
UPDATE clients
SET
  pod        = NULLIF(TRIM(substring(description FROM 'Pod:\s*([^|]+)')), ''),
  bookkeeper = NULLIF(TRIM(substring(description FROM 'Bookkeeper:\s*(.+)$')), '')
WHERE description LIKE 'Pod:%'
  AND pod IS NULL;
