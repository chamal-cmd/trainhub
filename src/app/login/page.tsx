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
  const [mode, setMode]           = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [fullName, setFullName]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState(() => {
    const raw = searchParams.get('error')
    if (!raw) return ''
    if (raw === 'access_denied') return 'Google sign-in was cancelled.'
    if (raw === 'auth_failed')   return 'Sign-in failed. Please try again.'
    return `Sign-in error: ${decodeURIComponent(raw)}.`
  })
  const [success, setSuccess]     = useState('')
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
      setError(demo ? 'Demo account not set up yet.' : 'Incorrect email or password.')
      setLoading(false); setDemoKey(null); return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
      router.refresh()
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Account created! Check your email to confirm your address, then sign in.')
    setMode('signin')
  }

  const busy = loading || googleLoading || !!demoKey

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Left: hero panel ── */}
      <div className="hidden lg:flex w-[54%] relative flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-violet-950" />
        <div className="absolute top-[-120px] left-[-60px] w-[500px] h-[500px] rounded-full bg-violet-700/25 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-40px] w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">TrainHub</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-500 uppercase tracking-widest bg-violet-600/10 border border-violet-600/20 px-3 py-1.5 rounded-full mb-6 w-fit">
              <Zap className="w-3 h-3" /> Training Platform
            </span>
            <h1 className="text-[42px] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Build a team that<br />
              <span className="bg-gradient-to-r from-violet-500 to-violet-400 bg-clip-text text-transparent">
                actually knows
              </span><br />
              their job.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
              Training modules, quizzes, and progress tracking — built for the GP Bookkeeper team.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Rich content editor', 'Video embeds', 'Progress tracking', 'Quiz builder', 'Role-based access', 'Pod teams'].map(f => (
                <span key={f} className="text-xs text-violet-400 bg-violet-600/10 border border-violet-600/20 px-3 py-1.5 rounded-full font-medium">{f}</span>
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-violet-600" />

        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-violet-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">TrainHub</span>
          </div>

          {/* ── Mode toggle ── */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-7">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'signin' ? 'Sign in to your training portal' : 'Join the GP Bookkeeper training portal'}
            </p>
          </div>

          {/* ── Google Sign-In (sign in only) ── */}
          {mode === 'signin' && (
            <>
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
              </p>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-medium text-slate-400">or continue with email</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
            </>
          )}

          {/* ── Success message ── */}
          {success && (
            <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {success}
            </div>
          )}

          {/* ── Email / password form ── */}
          <form onSubmit={mode === 'signup' ? signUp : e => { e.preventDefault(); signIn(email, password) }} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text" required autoComplete="name"
                  placeholder="Chamal Abeytunga"
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email" required autoComplete="email"
                placeholder="you@gpbookkeeper.com.au"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Password</label>
                {mode === 'signin' && (
                  <a href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 focus:bg-white transition-all"
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
              className="w-full h-11 rounded-xl bg-violet-700 hover:bg-violet-800 active:bg-violet-900 text-white text-sm font-semibold transition-all shadow-sm shadow-violet-300 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {mode === 'signup' ? 'Creating account…' : 'Signing in…'}</>
                : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            {mode === 'signin' ? (
              <>New here?{' '}
                <button onClick={() => setMode('signup')} className="text-violet-600 font-medium hover:text-violet-800">
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('signin')} className="text-violet-600 font-medium hover:text-violet-800">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
