'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, AlertCircle, Zap, GraduationCap } from 'lucide-react'

const DEMO = [
  { label: 'Admin Demo',  sub: 'Ridmal — Pod Leader',  email: 'ridmal@trainhub.demo',  password: 'Demo@2024', icon: '🛡️' },
  { label: 'User Demo',   sub: 'Chamal — Bookkeeper',  email: 'chamal@trainhub.demo',  password: 'Demo@2024', icon: '👤' },
]

function GoogleLogo() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState(() => {
    const raw = searchParams.get('error')
    if (!raw) return ''
    // Supabase passes error codes like "access_denied" — make them readable
    if (raw === 'access_denied') return 'Google sign-in was cancelled. Try again or use a demo account below.'
    if (raw === 'auth_failed')   return 'Sign-in failed. Google OAuth may not be configured yet — use a demo account below.'
    return `Sign-in error: ${decodeURIComponent(raw)}. Try a demo account below.`
  })
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [demoKey, setDemoKey]     = useState<string | null>(null)

  async function signInWithGoogle() {
    setGoogleLoading(true)
    setError('')

    // ── Step 1: open the popup SYNCHRONOUSLY inside the user-gesture context ──
    // Chrome drops the user-gesture flag after any `await`, so window.open()
    // called after an async call would be silently blocked. Opening to
    // 'about:blank' first guarantees Chrome allows it, then we navigate it
    // to the real OAuth URL once we have it.
    const w    = 480, h = 600
    const left = Math.round(window.screenX + (window.outerWidth  - w) / 2)
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2)
    const popup = window.open(
      'about:blank',
      'google-signin',
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    // ── Step 2: fetch the OAuth URL (async) ──
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?popup=1`,
        skipBrowserRedirect: true,
      },
    })

    if (err || !data?.url) {
      popup?.close()
      const msg = err?.message?.toLowerCase().includes('provider')
        ? "Google OAuth is not enabled yet in Supabase. Use a demo account below while that's being set up."
        : `Google sign-in failed: ${err?.message ?? 'Unknown error'}`
      setError(msg)
      setGoogleLoading(false)
      return
    }

    if (!popup || popup.closed) {
      // Popup was blocked by the browser — fall back to full-page redirect
      window.location.href = data.url
      return
    }

    // ── Step 3: navigate the already-open popup to Google's sign-in page ──
    popup.location.href = data.url

    // Listen for success message posted by /auth/popup-complete
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'GOOGLE_SIGNIN_SUCCESS') {
        window.removeEventListener('message', onMessage)
        clearInterval(pollTimer)
        popup?.close()
        router.push(event.data.role === 'admin' ? '/admin' : '/dashboard')
        router.refresh()
      }
    }
    window.addEventListener('message', onMessage)

    // Detect if user closes the popup without completing sign-in
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer)
        window.removeEventListener('message', onMessage)
        setGoogleLoading(false)
      }
    }, 500)
  }

  async function signIn(e_: string, p_: string, demo?: string) {
    if (demo) setDemoKey(demo); else setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email: e_, password: p_ })
    if (err) {
      setError(demo ? 'Demo account not set up yet — run the seed SQL first.' : 'Incorrect email or password.')
      setLoading(false); setDemoKey(null); return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
      router.refresh()
    }
  }

  const busy = loading || googleLoading || !!demoKey

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Left: hero panel ── */}
      <div className="hidden lg:flex w-[54%] relative flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" />
        <div className="absolute top-[-120px] left-[-60px] w-[500px] h-[500px] rounded-full bg-indigo-600/25 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-40px] w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">TrainHub</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full mb-6 w-fit">
              <Zap className="w-3 h-3" /> Training Platform
            </span>
            <h1 className="text-[42px] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Build a team that<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                actually knows
              </span><br />
              their job.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
              Training modules, quizzes, and progress tracking — built for the GP Bookkeeper team.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Rich content editor', 'Video embeds', 'Progress tracking', 'Quiz builder', 'Role-based access', 'Pod teams'].map(f => (
                <span key={f} className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 mt-10">
            {[{ n: '3', l: 'Pods' }, { n: '28+', l: 'Team members' }, { n: '13+', l: 'Modules' }].map(s => (
              <div key={s.l}>
                <p className="text-2xl font-bold text-white">{s.n}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">TrainHub</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your training portal</p>
          </div>

          {/* ── Google Sign-In (primary) ── */}
          <button
            onClick={signInWithGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 text-slate-700 text-sm font-semibold transition-all shadow-sm disabled:opacity-60 mb-3"
          >
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              : <GoogleLogo />}
            {googleLoading ? 'Redirecting to Google…' : 'Sign in with Google'}
          </button>

          <p className="text-[11px] text-center text-slate-400 mb-7 leading-relaxed px-2">
            Use your <span className="font-semibold text-slate-600">GP Bookkeeper Google Workspace account.</span>
            {' '}Your pod and role are assigned automatically.
          </p>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs font-medium text-slate-400">or demo / email access</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* ── Demo access ── */}
          <div className="mb-5 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-600">Quick Demo Access</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {DEMO.map(d => (
                <button
                  key={d.email}
                  onClick={() => signIn(d.email, d.password, d.email)}
                  disabled={busy}
                  className="flex flex-col items-start p-4 hover:bg-slate-50 transition-colors disabled:opacity-60 group"
                >
                  <span className="text-xl mb-2">{d.icon}</span>
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{d.label}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">{d.sub}</span>
                  {demoKey === d.email && (
                    <span className="text-[11px] text-indigo-500 mt-1 font-medium animate-pulse">Signing in…</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── UI Preview ── */}
          <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-indigo-100 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700">Preview UI (no login needed)</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-indigo-100">
              {[
                { href: '/preview/admin',     label: 'Admin View',  sub: 'Dashboard + library', icon: '🛡️' },
                { href: '/preview/dashboard', label: 'User View',   sub: 'Training dashboard',  icon: '👤' },
              ].map(p => (
                <a key={p.href} href={p.href} className="flex flex-col items-start p-4 hover:bg-indigo-50 transition-colors group">
                  <span className="text-xl mb-2">{p.icon}</span>
                  <span className="text-sm font-semibold text-indigo-800 group-hover:text-indigo-600 transition-colors">{p.label}</span>
                  <span className="text-[11px] text-indigo-400 mt-0.5">{p.sub}</span>
                </a>
              ))}
            </div>
          </div>

          {/* ── Email / password (for demo accounts) ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs font-medium text-slate-400">or continue with email</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <form onSubmit={e => { e.preventDefault(); signIn(email, password) }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email" required autoComplete="email"
                placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={busy}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold transition-all shadow-sm shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don't have an account?{' '}
            <span className="text-indigo-500 font-medium">Contact your administrator.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
