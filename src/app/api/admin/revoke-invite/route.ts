export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// GET — list pending invites (sent but not accepted)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Fetch all auth users — filter to those invited but not confirmed
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pending = users
    .filter(u => u.invited_at && !u.email_confirmed_at)
    .map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name ?? u.email?.split('@')[0],
      role: (u as any).app_metadata?.role ?? 'user', // fallback — check profile
      invited_at: u.invited_at,
    }))

  // Enrich with profile roles (more reliable)
  if (pending.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .in('id', pending.map(p => p.id))
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    pending.forEach(p => {
      if (profileMap[p.id]) {
        p.role = profileMap[p.id].role
        p.full_name = profileMap[p.id].full_name || p.full_name
      }
    })
  }

  return NextResponse.json({ pending })
}

// DELETE — revoke an invite (deletes user before they accept)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // Prevent self-deletion
  if (userId === user.id) return NextResponse.json({ error: 'Cannot revoke your own account' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Verify the user hasn't already accepted (still pending)
  const { data: { user: targetUser } } = await admin.auth.admin.getUserById(userId)
  if (targetUser?.email_confirmed_at) {
    return NextResponse.json({ error: 'Cannot revoke — user has already accepted the invite. Remove them from Users instead.' }, { status: 400 })
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
