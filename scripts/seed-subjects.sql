-- ============================================================
-- TrainHub — Seed Subjects from Trainual
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
  admin_id UUID;
  s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID;
  s6 UUID; s7 UUID; s8 UUID; s9 UUID; s10 UUID;
  s11 UUID; s12 UUID; s13 UUID;
BEGIN

  -- Get first admin user
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Make sure users have been seeded first.';
  END IF;

  -- Generate subject IDs
  s1  := gen_random_uuid(); s2  := gen_random_uuid(); s3  := gen_random_uuid();
  s4  := gen_random_uuid(); s5  := gen_random_uuid(); s6  := gen_random_uuid();
  s7  := gen_random_uuid(); s8  := gen_random_uuid(); s9  := gen_random_uuid();
  s10 := gen_random_uuid(); s11 := gen_random_uuid(); s12 := gen_random_uuid();
  s13 := gen_random_uuid();

  -- ── Insert subjects ──────────────────────────────────────────────────────────
  INSERT INTO subjects (id, title, emoji, cover_color, created_by) VALUES
    (s1,  'How to Get Started With Trainual',             '🚀', '#6366F1', admin_id),
    (s2,  'How to Structure Your New Client''s Asana Board', '📋', '#0EA5E9', admin_id),
    (s3,  'Client Meeting Structure',                      '📲', '#10B981', admin_id),
    (s4,  'Leave Policy',                                  '🌴', '#F59E0B', admin_id),
    (s5,  'Email Templates',                               '📩', '#8B5CF6', admin_id),
    (s6,  'Team Training',                                 '👥', '#EC4899', admin_id),
    (s7,  'Dext Prepare',                                  '🧾', '#14B8A6', admin_id),
    (s8,  'Quick Tips — Trick Bytes Video Series',         '💡', '#F97316', admin_id),
    (s9,  'Fathom Reporting',                              '📊', '#6366F1', admin_id),
    (s10, 'Applying Leave',                                '📝', '#10B981', admin_id),
    (s11, 'Payroll',                                       '💰', '#F59E0B', admin_id),
    (s12, 'Employee Onboarding',                           '🎉', '#8B5CF6', admin_id),
    (s13, 'Client Onboarding',                             '🤝', '#0EA5E9', admin_id)
  ON CONFLICT (id) DO NOTHING;

  -- ── Insert placeholder topics for each subject ───────────────────────────────
  -- Admins will fill these in. Each subject gets a default "Overview" topic
  -- so staff can start uploading content immediately.

  INSERT INTO topics (id, subject_id, title, order_index) VALUES
    (gen_random_uuid(), s1,  'Overview',             0),
    (gen_random_uuid(), s2,  'Overview',             0),
    (gen_random_uuid(), s3,  'Overview',             0),
    (gen_random_uuid(), s4,  'Leave Types',          0),
    (gen_random_uuid(), s4,  'How to Apply',         1),
    (gen_random_uuid(), s5,  'Standard Templates',   0),
    (gen_random_uuid(), s5,  'Client Emails',        1),
    (gen_random_uuid(), s6,  'Overview',             0),
    (gen_random_uuid(), s7,  'Getting Started',      0),
    (gen_random_uuid(), s7,  'Processing Receipts',  1),
    (gen_random_uuid(), s8,  'Video Tutorials',      0),
    (gen_random_uuid(), s9,  'Overview',             0),
    (gen_random_uuid(), s9,  'Running Reports',      1),
    (gen_random_uuid(), s10, 'Leave Process',        0),
    (gen_random_uuid(), s11, 'Payroll Overview',     0),
    (gen_random_uuid(), s11, 'Processing Payroll',   1),
    (gen_random_uuid(), s12, 'Onboarding Steps',     0),
    (gen_random_uuid(), s13, 'Onboarding Steps',     0)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Seeded 13 subjects with placeholder topics. Admin can now upload content.';

END $$;

-- ── Create Supabase Storage bucket for training files ────────────────────────
-- (Run separately if storage bucket doesn't exist yet)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('training-files', 'training-files', true)
-- ON CONFLICT (id) DO NOTHING;
