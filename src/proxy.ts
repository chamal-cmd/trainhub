import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && url !== PLACEHOLDER_URL && !url.includes('placeholder') && key !== 'placeholder_anon_key'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If Supabase isn't configured, allow /setup, /login and /preview/* through
  if (!isSupabaseConfigured()) {
    if (pathname === '/setup' || pathname === '/login' || pathname.startsWith('/preview')) return NextResponse.next({ request })
    if (pathname === '/') return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Public routes (auth callback must be allowed through unauthenticated)
    if (pathname === '/login' || pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/preview')) {
      if (user) {
        // Single profile lookup — used for the redirect decision
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        const redirectTo = profile?.role === 'admin' ? '/admin' : '/dashboard'
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      return supabaseResponse
    }

    // Protected routes — require auth
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin-only routes — one profile lookup covers both the public-route
    // redirect and the admin gate; only pay the DB cost when truly needed
    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return supabaseResponse
  } catch {
    // If Supabase connection fails, redirect to login
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
