'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AcceptInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    async function run() {
      const supabase = createClient()

      // Supabase invite redirects use implicit flow: tokens arrive as URL hash (#access_token=...)
      // We must explicitly parse and set the session — relying on auto-detection is a race condition
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) { window.location.href = '/login?error=auth_failed'; return }
      } else {
        // Fallback: PKCE code flow
        const code = searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) { window.location.href = '/login?error=auth_failed'; return }
        } else {
          // No token in URL — link is invalid or already used
          window.location.href = '/login?error=auth_failed'
          return
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login?error=auth_failed'; return }

      if (user.app_metadata?.onboarding_pending) {
        await fetch('/api/auth/accept-invite', { method: 'POST' }).catch(() => {})
        window.location.href = '/auth/welcome'
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard'
    }

    run()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Setting up your account…</p>
      </div>
    </div>
  )
}

export default function AcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcceptInner />
    </Suspense>
  )
}
