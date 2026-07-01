-- 1. Convert bookkeeper from free-text to a profile reference
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bookkeeper_id UUID REFERENCES profiles(id);

-- 2. Comment thread between trainer and bookkeeper on a client
CREATE TABLE IF NOT EXISTS client_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES profiles(id) NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Allow any authenticated user to read/write comments for their clients
ALTER TABLE client_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read client_comments"
  ON client_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert client_comments"
  ON client_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own comments"
  ON client_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
