import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

function adminClient() {
  return createSupabaseClient(SB_URL, SVC, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function verifyAdmin(token: string): Promise<string | null> {
  const r1 = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${token}` },
  })
  if (!r1.ok) return null
  const user = await r1.json()
  if (!user?.id) return null

  const r2 = await fetch(`${SB_URL}/rest/v1/profiles?select=role&id=eq.${user.id}&limit=1`, {
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
  })
  if (!r2.ok) return null
  const profiles = await r2.json()
  return profiles?.[0]?.role === 'admin' ? user.id : null
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    const callerId = await verifyAdmin(token)
    if (!callerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === callerId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    const supabase = adminClient()
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
