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

    // Try invite (sends email via Supabase's own email service)
    const { data: invData, error: invError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${origin}/auth/callback`,
    })

    let userId: string | null = invData?.user?.id ?? null

    if (invError) {
      // User already exists — find them, generate a recovery link they can use to set password
      userId = await findUserByEmail(email)
      if (!userId) return NextResponse.json({ error: invError.message }, { status: 400 })
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

    // Always return a link as fallback (expires 24h)
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: invError ? 'recovery' : 'invite',
      email,
      options: { redirectTo: `${origin}/auth/callback` },
    })
    const inviteUrl = (linkData as any)?.properties?.action_link ?? null

    return NextResponse.json({ ok: true, inviteUrl })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
