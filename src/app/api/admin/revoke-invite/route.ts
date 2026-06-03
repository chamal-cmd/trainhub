export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function getAdmin() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) return null
  return createAdmin(url, svcKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function verifyAdmin(req: NextRequest, admin: any) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) return null
  const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).single()
  return profile?.role === 'admin' ? data.user : null
}

export async function GET(req: NextRequest) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const caller = await verifyAdmin(req, admin)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const pending = data.users.filter(u => u.invited_at && !u.email_confirmed_at).map(u => ({
      id: u.id, email: u.email,
      full_name: u.user_metadata?.full_name ?? u.email?.split('@')[0],
      role: 'user', invited_at: u.invited_at,
    }))

    if (pending.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, role, full_name').in('id', pending.map(p => p.id))
      const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      pending.forEach(p => { if (pm[p.id]) { p.role = pm[p.id].role; p.full_name = pm[p.id].full_name || p.full_name } })
    }
    return NextResponse.json({ pending })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const caller = await verifyAdmin(req, admin)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === caller.id) return NextResponse.json({ error: 'Cannot revoke your own account' }, { status: 400 })

    const { data: target } = await admin.auth.admin.getUserById(userId)
    if (target?.user?.email_confirmed_at) {
      return NextResponse.json({ error: 'User already accepted — remove from Users instead' }, { status: 400 })
    }

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
