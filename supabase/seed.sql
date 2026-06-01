-- TrainHub Demo Seed
-- Run AFTER schema.sql
-- Creates demo accounts for the Guest Access buttons on the login page

-- Step 1: Create auth users via Supabase Dashboard > Authentication > Users
-- Or run this in the SQL editor (requires service_role key, not anon):

-- Demo Admin: admin@trainhub.demo / Demo@2024
-- Demo User:  user@trainhub.demo  / Demo@2024

-- After creating auth users, insert their profiles:
-- (Replace the UUIDs below with the actual user IDs from auth.users)

-- INSERT INTO profiles (id, full_name, email, role) VALUES
--   ('YOUR-ADMIN-UUID', 'Demo Admin', 'admin@trainhub.demo', 'admin'),
--   ('YOUR-USER-UUID',  'Demo User',  'user@trainhub.demo',  'user');


-- ─── Quick demo data ───────────────────────────────────────────────
-- After creating users, run this to seed example content:

-- Example subject
-- INSERT INTO subjects (title, description, emoji, cover_color, created_by)
-- VALUES ('Employee Onboarding', 'Everything new team members need to know.', '🚀', '#4F46E5', 'YOUR-ADMIN-UUID');

-- ─── HOW TO CREATE DEMO USERS ──────────────────────────────────────
-- 1. Go to your Supabase Dashboard
-- 2. Click Authentication → Users
-- 3. Click "Add user" → Fill in email/password for each demo account
-- 4. The on_auth_user_created trigger will auto-create their profile rows
-- 5. Manually update the role for the admin:
--    UPDATE profiles SET role = 'admin' WHERE email = 'admin@trainhub.demo';
