import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  'https://yqefhohpfdcfripuswpw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ'
)
const { data, error } = await admin.from('subjects').select('id, title, is_restricted, client_tag').limit(3)
if (error) console.error('ERROR:', error.message)
else console.log('OK columns exist. Sample:', JSON.stringify(data, null, 2))
