export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
    const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !svcKey) {
      return NextResponse.json({ error: `Missing env: url=${!!url} svc=${!!svcKey}` }, { status: 500 })
    }

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    const admin = createAdmin(url, svcKey, { auth: { persistSession: false, autoRefreshToken: false } })

    // Verify caller is admin
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: `Auth failed: ${userErr?.message ?? 'no user'}` }, { status: 401 })
    }
    const caller = userData.user

    const { data: profile, error: profErr } = await admin
      .from('profiles').select('role').eq('id', caller.id).single()
    if (profErr) return NextResponse.json({ error: `Profile lookup: ${profErr.message}` }, { status: 500 })
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

    const body = await req.json()
    const { email, fullName, role = 'user' } = body
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const origin = req.headers.get('x-forwarded-host')
      ? `https://${req.headers.get('x-forwarded-host')}`
      : new URL(req.url).origin

    // Invite the user
    const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${origin}/auth/callback`,
    })
    if (invErr) return NextResponse.json({ error: `Invite failed: ${invErr.message}` }, { status: 400 })

    // Set role
    const { error: upErr } = await admin.from('profiles').upsert({
      id: inv.user.id, email,
      full_name: fullName ?? email.split('@')[0],
      role,
    })
    if (upErr) return NextResponse.json({ error: `Profile upsert: ${upErr.message}` }, { status: 500 })

    // Notify admin (fire-and-forget, errors ignored)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'TrainHub <onboarding@resend.dev>',
            to: ['chamal@gpbookkeeper.com.au'],
            subject: `Invite sent: ${fullName ?? email} (${role === 'admin' ? 'Admin' : 'Team Member'})`,
            html: `<div style="font-family:sans-serif;padding:24px"><h2>Invite Sent</h2><p><b>${fullName ?? '—'}</b><br/>${email}<br/>Role: ${role === 'admin' ? 'Admin' : 'Team Member'}</p></div>`,
          }),
        })
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}`, stack: e?.stack?.slice(0, 300) }, { status: 500 })
  }
}
