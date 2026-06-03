export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, fullName, role = 'user', sendInvite = true } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let userId: string
  if (sendInvite) {
    const origin = req.headers.get('x-forwarded-host')
      ? `https://${req.headers.get('x-forwarded-host')}`
      : new URL(req.url).origin
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${origin}/auth/callback`,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { full_name: fullName },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id
  }

  await admin.from('profiles').upsert({
    id: userId, email,
    full_name: fullName ?? email.split('@')[0],
    role,
  })

  // Notify admin — fire and forget
  if (process.env.RESEND_API_KEY) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TrainHub <onboarding@resend.dev>',
        to: ['chamal@gpbookkeeper.com.au'],
        subject: `✅ Invite sent: ${fullName ?? email} (${role === 'admin' ? 'Admin' : 'Team Member'})`,
        html: `<div style="font-family:sans-serif;padding:24px"><h2>Invite Sent 🎉</h2><p><b>${fullName ?? '—'}</b><br/>${email}<br/><span style="background:${role==='admin'?'#f3e8ff':'#eef2ff'};padding:4px 10px;border-radius:20px;font-size:12px">${role==='admin'?'🛡️ Admin':'👤 Team Member'}</span></p></div>`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
