import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/google
 *
 * Initiates the Google OAuth flow SERVER-SIDE so the PKCE code verifier is
 * stored in a proper Set-Cookie header (not browser localStorage). This
 * solves "PKCE code verifier not found in storage" errors on Cloudflare Workers.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Resolve origin the same way /auth/callback does
  const forwardedHost  = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (() => { const u = new URL(request.url); u.port = ''; return u.origin })()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  })

  if (error || !data.url) {
    const msg = error?.message ?? 'oauth_failed'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, origin)
    )
  }

  // The server client's setAll() callback already wrote the code-verifier
  // cookie to the cookieStore — Next.js will include it as a Set-Cookie
  // header on this redirect response.
  return NextResponse.redirect(data.url)
}
