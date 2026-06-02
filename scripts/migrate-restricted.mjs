import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  'https://yqefhohpfdcfripuswpw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ'
)

const { error } = await admin.rpc('exec_sql', {
  sql: `
    ALTER TABLE subjects
      ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS client_tag TEXT DEFAULT NULL;
  `
})

if (error) {
  // Try via direct query if rpc not available
  const r = await admin.from('subjects').select('is_restricted').limit(1)
  if (r.error?.message?.includes('column "is_restricted" does not exist')) {
    console.error('Migration needed but exec_sql not available. Run this SQL manually in Supabase:')
    console.log(`
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS client_tag TEXT DEFAULT NULL;
    `)
  } else {
    console.log('Columns already exist or migration succeeded ✅')
  }
} else {
  console.log('Migration complete ✅')
}
