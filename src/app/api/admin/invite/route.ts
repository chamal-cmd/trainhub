import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { resend, FROM } from '@/lib/resend'
import { inviteEmail, welcomeEmail } from '@/lib/emails'

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

    // Generate a PKCE-compatible invite link (no email sent by Supabase)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { full_name: fullName },
        redirectTo: `${origin}/auth/accept`,
      },
    })

    if (linkError || !linkData) {
      return NextResponse.json({ error: linkError?.message ?? 'Failed to generate link' }, { status: 400 })
    }

    const userId: string      = (linkData as any).user?.id
    const hashedToken: string = (linkData as any)?.properties?.hashed_token

    if (!userId)      return NextResponse.json({ error: 'Could not determine user id' }, { status: 500 })
    if (!hashedToken) return NextResponse.json({ error: 'Could not generate invite token' }, { status: 500 })

    // Manually build the verify URL so type=invite is always present
    const inviteUrl = `${SB_URL}/auth/v1/verify?token=${encodeURIComponent(hashedToken)}&type=invite&redirect_to=${encodeURIComponent(`${origin}/auth/accept`)}`

    // Upsert profile so the user is recognised on first sign-in
    await fetch(`${SB_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SVC,
        'Authorization': `Bearer ${SVC}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ id: userId, email, full_name: fullName ?? email.split('@')[0], role }),
    })

    // Flag so the callback shows the welcome/setup page on first sign-in
    await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_metadata: { onboarding_pending: true } }),
    })

    // Send invite email via Resend
    if (resend) {
      const callerProfile = await fetch(
        `${SB_URL}/rest/v1/profiles?select=full_name&id=eq.${callerId}&limit=1`,
        { headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } }
      ).then(r => r.json())
      const invitedByName: string = callerProfile?.[0]?.full_name ?? 'Your admin'

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `You've been invited to TrainHub`,
        html: inviteEmail({ fullName: fullName ?? email.split('@')[0], inviteUrl, invitedByName }),
      })
    }

    return NextResponse.json({ ok: true, inviteUrl })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
