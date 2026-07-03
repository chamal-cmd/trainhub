import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { welcomeEmail, newMemberEmail } from '@/lib/emails'

export async function GET(request: NextRequest) {
  // Read secrets at request time — Cloudflare Workers secrets aren't available at module load
  const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM = process.env.RESEND_FROM ?? 'TrainHub <onboarding@resend.dev>'

  async function sbAdmin(path: string, opts?: RequestInit) {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      ...opts,
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    })
    if (!r.ok) return null
    return r.json()
  }
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

    // 1. Look up profile by user ID
    const profiles1: any[] = await sbAdmin(`profiles?id=eq.${user.id}&select=id,role`) ?? []
    let profile: { id: string; role: string } | null = profiles1[0] ?? null

    // 2. If not found by ID, look up by email (handles Google re-auth creating a new UUID)
    if (!profile && user.email) {
      const profiles2: any[] = await sbAdmin(`profiles?email=eq.${encodeURIComponent(user.email)}&select=id,role`) ?? []
      const byEmail = profiles2[0] ?? null
      if (byEmail) {
        await sbAdmin(`profiles?id=eq.${byEmail.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ id: user.id }),
        })
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
        headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_metadata: { onboarding_pending: false } }),
      })

      // Send welcome email + admin notification
      if (RESEND_KEY && user.email) {
        const pRows: any[] = await sbAdmin(`profiles?id=eq.${user.id}&select=full_name`) ?? []
        const fullName = pRows[0]?.full_name ?? user.email.split('@')[0]

        // Get all admin emails to notify
        const adminRows: any[] = await sbAdmin(`profiles?role=eq.admin&select=email`) ?? []
        const adminEmails = adminRows.map((a: any) => a.email).filter(Boolean)

        await Promise.allSettled([
          // Welcome email to new user
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM, to: user.email, subject: 'Welcome to TrainHub! 🎉', html: welcomeEmail({ fullName, appUrl: origin }) }),
          }),
          // Notification to all admins
          ...adminEmails.map(adminEmail =>
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: FROM, to: adminEmail, subject: `${fullName} just joined TrainHub 👋`, html: newMemberEmail({ userName: fullName, userEmail: user.email!, appUrl: origin }) }),
            })
          ),
        ])
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
