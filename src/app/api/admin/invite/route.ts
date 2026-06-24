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

// Find an existing auth user by email (handles re-invite case)
async function findUserByEmail(email: string): Promise<string | null> {
  const supabase = adminClient()
  // Page through users to find by email (Supabase has no direct email lookup)
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    const match = data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (data.users.length < 1000) break
    page++
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    const callerId = await verifyAdmin(token)
    if (!callerId) return NextResponse.json({ error: 'Unauthorized — not admin' }, { status: 401 })

    const { email, fullName, role = 'user' } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const origin = req.headers.get('x-forwarded-host')
      ? `https://${req.headers.get('x-forwarded-host')}`
      : new URL(req.url).origin

    const supabase = adminClient()

    // Try to send invite
    const { data: invData, error: invError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${origin}/auth/callback`,
    })

    let userId: string | null = invData?.user?.id ?? null

    if (invError) {
      // User already exists in auth.users — find them and update their profile/role
      userId = await findUserByEmail(email)
      if (!userId) {
        return NextResponse.json({ error: invError.message }, { status: 400 })
      }
      // Update the user's metadata so the name is current
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: fullName },
      })
    }

    if (!userId) return NextResponse.json({ error: 'No user id from invite' }, { status: 500 })

    // Upsert profile with the requested role
    await fetch(`${SB_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SVC,
        'Authorization': `Bearer ${SVC}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ id: userId, email, full_name: fullName ?? email.split('@')[0], role }),
    })

    // Notify admin (fire and forget)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TrainHub <onboarding@resend.dev>',
          to: ['chamal@gpbookkeeper.com.au'],
          subject: `Invite sent: ${fullName ?? email} (${role === 'admin' ? 'Admin' : 'Team Member'})`,
          html: `<div style="font-family:sans-serif;padding:24px"><h2>Invite Sent</h2><p><b>${fullName ?? '—'}</b><br/>${email}<br/>Role: ${role}</p></div>`,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
