import { NextRequest, NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifyAdmin(token: string): Promise<boolean> {
  const r1 = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${token}` },
  })
  if (!r1.ok) return false
  const user = await r1.json()
  if (!user?.id) return false
  const r2 = await fetch(`${SB_URL}/rest/v1/profiles?select=role&id=eq.${user.id}&limit=1`, {
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
  })
  if (!r2.ok) return false
  const profiles = await r2.json()
  return profiles?.[0]?.role === 'admin'
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    if (!await verifyAdmin(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Delete profile first (FK constraint)
    await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
    })

    // Delete auth user
    const res = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
    })
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
