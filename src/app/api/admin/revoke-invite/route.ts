import { NextRequest, NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Verify caller is an admin — pure fetch, no supabase-js
async function verifyAdmin(token: string): Promise<{ id: string; email: string } | null> {
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
  return profiles?.[0]?.role === 'admin' ? { id: user.id, email: user.email } : null
}

// GET — list pending invites (invited but never accepted)
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    const caller = await verifyAdmin(token)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all users from admin API
    const r = await fetch(`${SB_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
    })
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      return NextResponse.json({ error: e?.message ?? 'Failed to list users' }, { status: 500 })
    }
    const body = await r.json()
    const users: any[] = body.users ?? body ?? []

    const pending = users
      .filter((u: any) => u.invited_at && !u.email_confirmed_at)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name ?? u.email?.split('@')[0],
        role: 'user',
        invited_at: u.invited_at,
      }))

    if (pending.length > 0) {
      const ids = pending.map((p: any) => p.id).join(',')
      const r2 = await fetch(`${SB_URL}/rest/v1/profiles?select=id,role,full_name&id=in.(${ids})`, {
        headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
      })
      if (r2.ok) {
        const profiles: any[] = await r2.json()
        const pm = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
        pending.forEach((p: any) => {
          if (pm[p.id]) {
            p.role = pm[p.id].role ?? 'user'
            p.full_name = pm[p.id].full_name || p.full_name
          }
        })
      }
    }

    return NextResponse.json({ pending })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}

// DELETE — revoke a pending invite by deleting the unconfirmed user
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    const caller = await verifyAdmin(token)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === caller.id) return NextResponse.json({ error: 'Cannot revoke your own account' }, { status: 400 })

    // Fetch user to confirm they haven't accepted yet
    const r1 = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
    })
    if (r1.ok) {
      const target = await r1.json()
      if (target?.email_confirmed_at) {
        return NextResponse.json({ error: 'User already accepted — remove from Users instead' }, { status: 400 })
      }
    }

    // Delete the user
    const r2 = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
    })
    if (!r2.ok) {
      const e = await r2.json().catch(() => ({}))
      return NextResponse.json({ error: e?.message ?? 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
