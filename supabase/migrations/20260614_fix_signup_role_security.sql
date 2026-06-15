-- Remove the ability to self-assign roles via signup metadata.
-- Role is now ONLY set by the admin invite flow (service-role direct insert).
-- Self-signup always gets 'user'; inherited_role still handles Google ↔ password
-- same-account linking.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  inherited_role TEXT;
BEGIN
  SELECT role INTO inherited_role FROM profiles WHERE email = NEW.email LIMIT 1;

  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(inherited_role, 'user')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
