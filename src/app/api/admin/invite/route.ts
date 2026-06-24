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

async function findUserByEmail(email: string): Promise<string | null> {
  const supabase = adminClient()
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

async function sendInviteEmail(
  email: string,
  fullName: string | undefined,
  inviteUrl: string,
  role: string,
  resendKey: string,
) {
  const displayName = fullName ?? email.split('@')[0]
  const roleLabel   = role === 'admin' ? 'Administrator' : 'Team Member'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'GP Bookkeeper TrainHub <onboarding@resend.dev>',
      to: [email],
      subject: "You've been invited to GP Bookkeeper TrainHub",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="margin-bottom:8px">Welcome to GP Bookkeeper TrainHub</h2>
          <p style="color:#555">Hi ${displayName},</p>
          <p style="color:#555">You've been invited to join TrainHub as a <strong>${roleLabel}</strong>. Click the button below to set your password and get started.</p>
          <a href="${inviteUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Accept Invitation</a>
          <p style="color:#999;font-size:12px">This link expires in 24 hours. If you didn't expect this invitation, you can ignore this email.</p>
        </div>
      `,
    }),
  })
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

    const supabase  = adminClient()
    const resendKey = process.env.RESEND_API_KEY

    // Generate invite link (creates user if needed, returns link without sending email)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data:       { full_name: fullName },
        redirectTo: `${origin}/auth/callback`,
      },
    })

    let userId: string | null = (linkData as any)?.user?.id ?? null
    let inviteUrl: string | null = (linkData as any)?.properties?.action_link ?? null

    if (linkError) {
      // User may already exist — find them and generate a magic link instead
      userId = await findUserByEmail(email)
      if (!userId) {
        return NextResponse.json({ error: linkError.message }, { status: 400 })
      }
      // Generate a password-reset link so they can still set a password
      const { data: resetData } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${origin}/auth/callback` },
      })
      inviteUrl = (resetData as any)?.properties?.action_link ?? null
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

    // Send invite email via Resend (reliable delivery)
    if (resendKey && inviteUrl) {
      await sendInviteEmail(email, fullName, inviteUrl, role, resendKey)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
