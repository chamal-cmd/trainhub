export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Verify the caller is an admin using pure fetch (no supabase-js package)
async function verifyAdmin(token: string): Promise<string | null> {
  // Get user from JWT
  const r1 = await fetch(`${URL}/auth/v1/user`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${token}` },
  })
  if (!r1.ok) return null
  const user = await r1.json()
  if (!user?.id) return null

  // Check admin role in profiles
  const r2 = await fetch(`${URL}/rest/v1/profiles?select=role&id=eq.${user.id}&limit=1`, {
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
  })
  if (!r2.ok) return null
  const profiles = await r2.json()
  return profiles?.[0]?.role === 'admin' ? user.id : null
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

    // Send invite via Supabase Admin API
    const invRes = await fetch(`${URL}/auth/v1/admin/invite`, {
      method: 'POST',
      headers: {
        'apikey': SVC,
        'Authorization': `Bearer ${SVC}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        data: { full_name: fullName },
        redirect_to: `${origin}/auth/callback`,
      }),
    })
    const invData = await invRes.json()
    if (!invRes.ok) return NextResponse.json({ error: invData?.msg || invData?.message || 'Invite failed' }, { status: 400 })

    const userId = invData.id
    if (!userId) return NextResponse.json({ error: 'No user id from invite' }, { status: 500 })

    // Set role in profiles
    await fetch(`${URL}/rest/v1/profiles`, {
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
