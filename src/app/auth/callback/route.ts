import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  // Use forwarded host (Netlify proxy strips the port) to avoid :80 in redirect URLs
  const forwardedHost  = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (() => { const u = new URL(request.url); u.port = ''; return u.origin })()


  // OAuth error from provider (e.g. user cancelled Google sign-in)
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, origin)
    )
  }

  if (code) {
    const supabase = await createClient()

    // Exchange the OAuth code for a Supabase session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Fetch the user's profile to determine redirect destination
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role        = profile?.role ?? 'user'
        const destination = role === 'admin' ? '/admin' : '/dashboard'
        const isPopup     = searchParams.get('popup') === '1'

        if (isPopup) {
          // Popup flow: redirect to a tiny client page that signals the opener
          return NextResponse.redirect(new URL(`/auth/popup-complete?role=${role}`, origin))
        }

        return NextResponse.redirect(new URL(destination, origin))
      }
    } else {
      // Pass the real exchange error back to the login page
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin)
      )
    }
  }

  // Fallback — something went wrong
  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}
