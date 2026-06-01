-- ============================================================
-- TrainHub — Google OAuth Setup + Team Roster
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Add pod columns to profiles ──────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pod TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pod_leader_name TEXT;

-- ── 2. Create team_roster lookup table ──────────────────────
CREATE TABLE IF NOT EXISTS team_roster (
  first_name       TEXT PRIMARY KEY,          -- lowercase, used for email matching
  full_name        TEXT NOT NULL,
  pod              TEXT,                       -- 'mas_legato' | 'jemajo' | 'philippines' | 'management'
  pod_display      TEXT,                       -- Human readable pod name
  role             TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  pod_leader_name  TEXT                        -- Full name of their pod leader (NULL if they are the leader)
);

-- ── 3. Seed the roster ──────────────────────────────────────
INSERT INTO team_roster (first_name, full_name, pod, pod_display, role, pod_leader_name) VALUES

  -- ── Directors ─────────────────────────────────────────────
  ('todd',     'Todd Cameron',             'management',  'GP Bookkeeper Directors',  'admin', NULL),
  ('sachin',   'Sachin Patel',             'management',  'GP Bookkeeper Directors',  'admin', NULL),

  -- ── General Manager ───────────────────────────────────────
  ('ryan',     'Ryan Sela',               'management',  'GP Bookkeeper Management', 'admin', NULL),

  -- ── MAS Legato — Sri Lanka ────────────────────────────────
  ('ridmal',      'Ridmal Perera',          'mas_legato',  'MAS Legato',  'admin', NULL),
  ('chamal',      'Chamal Abeytunga',       'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('abdullah',    'Abdullah Fazeel',        'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('thamuditha',  'Thamuditha Dodanwatte',  'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('fazeen',      'Fazeen Fawmy',           'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('nidusha',     'Nidusha Sekar',          'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('odara',       'Odara Kalansooriya',     'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('ammar',       'Ammar Tharick',          'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),
  ('ranindu',     'Ranindu Jayathilake',    'mas_legato',  'MAS Legato',  'user',  'Ridmal Perera'),

  -- ── Jemajo — Sri Lanka ────────────────────────────────────
  ('mahesh',    'Mahesh Kumara',         'jemajo',  'Jemajo',  'admin', NULL),
  ('tharushi',  'Tharushi Atukorala',    'jemajo',  'Jemajo',  'user',  'Mahesh Kumara'),
  ('tania',     'Tania Weerasinghe',     'jemajo',  'Jemajo',  'user',  'Mahesh Kumara'),
  ('kalani',    'Kalani Fernando',       'jemajo',  'Jemajo',  'user',  'Mahesh Kumara'),
  ('megha',     'Megha Fernando',        'jemajo',  'Jemajo',  'user',  'Mahesh Kumara'),
  ('anupama',   'Anupama Amarasekara',   'jemajo',  'Jemajo',  'user',  'Mahesh Kumara'),

  -- ── Philippines ──────────────────────────────────────────
  ('jobelle',   'Jobelle Abano',         'philippines',  'Philippines',  'admin', NULL),
  ('luisa',     'Luisa',                 'philippines',  'Philippines',  'user',  'Jobelle Abano'),
  ('catherine', 'Catherine Rose Alforque','philippines', 'Philippines',  'user',  'Jobelle Abano'),
  ('eleazar',   'Eleazar Llorin',         'philippines', 'Philippines',  'user',  'Jobelle Abano'),
  ('john',      'John Nestor',            'philippines', 'Philippines',  'user',  'Jobelle Abano'),
  ('melody',    'Melody Aquino',          'philippines', 'Philippines',  'user',  'Jobelle Abano')

ON CONFLICT (first_name) DO UPDATE SET
  full_name       = EXCLUDED.full_name,
  pod             = EXCLUDED.pod,
  pod_display     = EXCLUDED.pod_display,
  role            = EXCLUDED.role,
  pod_leader_name = EXCLUDED.pod_leader_name;


-- ── 4. Update the handle_new_user() trigger ─────────────────
-- This fires on every new Supabase Auth signup (email OR Google)
-- and auto-assigns pod + role from the roster.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_first   TEXT;   -- first segment of email local part
  v_display_first TEXT;   -- first word of Google display name
  v_display_name  TEXT;   -- full name from Google OAuth metadata
  v_roster        team_roster%ROWTYPE;
BEGIN
  -- ── Extract display name from OAuth metadata (Google provides this) ──
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- ── Method 1: first segment of email before '.' or '_' ──────────────
  -- e.g. "chamal.abeytunga@..." → "chamal"
  -- e.g. "chamal_abeytunga@..." → "chamal"
  v_email_first := lower(regexp_replace(split_part(NEW.email, '@', 1), '[._-].*$', ''));

  -- ── Method 2: first word of Google display name ─────────────────────
  -- e.g. "Chamal Abeytunga" → "chamal"
  v_display_first := lower(split_part(v_display_name, ' ', 1));

  -- ── Roster lookup (try email first, then display name) ──────────────
  SELECT * INTO v_roster
  FROM team_roster
  WHERE lower(first_name) = v_email_first
     OR lower(first_name) = v_display_first
  ORDER BY
    -- prefer the email match over the display name match
    CASE WHEN lower(first_name) = v_email_first THEN 0 ELSE 1 END
  LIMIT 1;

  -- ── Insert profile ───────────────────────────────────────────────────
  IF FOUND THEN
    INSERT INTO profiles (id, full_name, email, role, pod, pod_leader_name)
    VALUES (
      NEW.id,
      COALESCE(v_display_name, v_roster.full_name),
      NEW.email,
      v_roster.role,
      v_roster.pod,
      v_roster.pod_leader_name
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Unknown person — create with basic user role, no pod
    -- Admin can manually assign them later
    INSERT INTO profiles (id, full_name, email, role)
    VALUES (
      NEW.id,
      v_display_name,
      NEW.email,
      'user'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger is attached (re-creates if already exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 5. Verification query — run after seeding to check ───────
SELECT
  first_name,
  full_name,
  pod_display AS pod,
  role,
  COALESCE(pod_leader_name, '— (leader)') AS reports_to
FROM team_roster
ORDER BY pod, role DESC, first_name;
