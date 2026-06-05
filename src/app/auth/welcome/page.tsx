'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'

function WelcomeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') ?? 'user'

  const [step, setStep]         = useState<'welcome' | 'password' | 'done'>('welcome')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      setUserName(profile?.full_name ?? user.email?.split('@')[0] ?? 'there')
    }
    loadUser()
  }, [router])

  async function setPasswordAndContinue(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep('done')
    setTimeout(() => router.push(role === 'admin' ? '/admin' : '/dashboard'), 2000)
  }

  const isAdmin = role === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute top-[-100px] left-[-60px] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-40px] w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TrainHub</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Step 1: Welcome ── */}
          {step === 'welcome' && (
            <div className="p-8">
              <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 ${
                isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-violet-100 text-violet-800'
              }`}>
                {isAdmin ? '🛡️ Admin Account' : '👤 Team Member Account'}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! 🎉
              </h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                You've been invited to join the <strong className="text-slate-700">GP Bookkeeper training portal</strong>
                {isAdmin ? ' as an Administrator.' : ' as a Team Member.'}
                {' '}Set a password to secure your account.
              </p>

              {/* Role card */}
              <div className={`rounded-xl p-4 mb-6 border ${
                isAdmin
                  ? 'bg-purple-50 border-purple-100'
                  : 'bg-violet-50 border-violet-100'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isAdmin ? 'text-purple-600' : 'text-violet-700'}`}>
                  Your access
                </p>
                <ul className={`space-y-1.5 text-sm ${isAdmin ? 'text-purple-800' : 'text-violet-900'}`}>
                  {isAdmin ? (
                    <>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Manage all training modules</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Invite and manage team members</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> View reports and analytics</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Configure AI knowledge base</li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Access all assigned training modules</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Track your progress</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Take quizzes and earn completions</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Ask the AI assistant anything</li>
                    </>
                  )}
                </ul>
              </div>

              <button
                onClick={() => setStep('password')}
                className={`w-full h-11 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  isAdmin
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-violet-700 hover:bg-violet-800'
                }`}
              >
                Set up my password <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                You can also sign in with Google using your GP Bookkeeper email.
              </p>
            </div>
          )}

          {/* ── Step 2: Set password ── */}
          {step === 'password' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Set your password</h2>
              <p className="text-slate-400 text-sm mb-6">Choose a strong password for your account.</p>

              <form onSubmit={setPasswordAndContinue} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required autoFocus minLength={8}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          i <= (password.length < 8 ? 1 : password.length < 12 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3)
                            ? ['','bg-red-400','bg-amber-400','bg-blue-400','bg-emerald-500'][password.length < 8 ? 1 : password.length < 12 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3]
                            : 'bg-slate-100'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl border text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all ${
                      confirm && confirm !== password ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className={`w-full h-11 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                    isAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-violet-700 hover:bg-violet-800'
                  }`}
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : 'Save password & continue'}
                </button>
              </form>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">All set! 🎉</h2>
              <p className="text-slate-500 text-sm">
                Taking you to your {isAdmin ? 'admin portal' : 'dashboard'}…
              </p>
              <div className="mt-4 flex justify-center">
                <span className="w-5 h-5 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return <Suspense><WelcomeInner /></Suspense>
}
