import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Clear onboarding flag so this page never shows again
  await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_metadata: { onboarding_pending: false } }),
  })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const destination = profile?.role === 'admin' ? '/admin' : '/dashboard'

  return NextResponse.json({ destination })
}
