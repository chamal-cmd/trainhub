import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verify caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, fullName, role = 'user', sendInvite = true } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let userId: string

  if (sendInvite) {
    // Send magic invite email — user sets their own password
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${req.headers.get('origin')}/auth/callback`,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id
  } else {
    // Create user immediately (admin sets password)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id
  }

  // Set profile with correct role
  await admin.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName ?? email.split('@')[0],
    role,
  })

  // Notify admin (chamal@gpbookkeeper.com.au) about the invite
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrainHub <onboarding@resend.dev>',
        to: ['chamal@gpbookkeeper.com.au'],
        subject: `✅ Invite sent: ${fullName ?? email} (${role === 'admin' ? 'Admin' : 'Team Member'})`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#1e1b4b;margin-bottom:8px">Invite Sent 🎉</h2>
            <p style="color:#64748b;margin-bottom:20px">You sent a TrainHub invite to:</p>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px">
              <p style="margin:0 0 6px;font-weight:600;color:#0f172a">${fullName ?? '—'}</p>
              <p style="margin:0 0 6px;color:#64748b">${email}</p>
              <span style="background:${role === 'admin' ? '#f3e8ff' : '#eef2ff'};color:${role === 'admin' ? '#7e22ce' : '#4338ca'};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600">
                ${role === 'admin' ? '🛡️ Admin' : '👤 Team Member'}
              </span>
            </div>
            <p style="color:#94a3b8;font-size:12px">They'll receive a separate invite email with a link to set their password.</p>
          </div>
        `,
      }),
    }).catch(() => { /* notification failure is non-fatal */ })
  }

  return NextResponse.json({ ok: true })
}
