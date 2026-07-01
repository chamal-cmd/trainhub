import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM } from '@/lib/resend'
import { welcomeEmail } from '@/lib/emails'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

function adminClient() {
  return createAdmin(SB_URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  const forwardedHost  = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (() => { const u = new URL(request.url); u.port = ''; return u.origin })()

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin))
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin))
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login?error=auth_failed', origin))

    if (searchParams.get('type') === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', origin))
    }

    const admin = adminClient()

    // 1. Look up profile by user ID
    let { data: profile } = await admin.from('profiles').select('id, role').eq('id', user.id).single()

    // 2. If not found by ID, look up by email (handles Google re-auth creating a new UUID)
    if (!profile && user.email) {
      const { data: byEmail } = await admin.from('profiles').select('id, role').eq('email', user.email).single()
      if (byEmail) {
        await admin.from('profiles').update({ id: user.id }).eq('id', byEmail.id)
        profile = { ...byEmail, id: user.id }
      }
    }

    if (!profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=not_invited', origin))
    }

    // First-time invite acceptance — show welcome/setup page
    if (user.app_metadata?.onboarding_pending) {
      await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_metadata: { onboarding_pending: false } }),
      })

      // Send welcome email
      if (resend && user.email) {
        const { data: p } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: 'Welcome to TrainHub! 🎉',
          html: welcomeEmail({ fullName: p?.full_name ?? user.email.split('@')[0], appUrl: origin }),
        }).catch(() => {/* non-fatal */})
      }

      return NextResponse.redirect(new URL('/auth/welcome', origin))
    }

    const role        = profile.role
    const destination = role === 'admin' ? '/admin' : '/dashboard'
    const isPopup     = searchParams.get('popup') === '1'

    if (isPopup) {
      return NextResponse.redirect(new URL(`/auth/popup-complete?role=${role}`, origin))
    }

    return NextResponse.redirect(new URL(destination, origin))
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}
