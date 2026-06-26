'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, ArrowRight, Loader2 } from 'lucide-react'

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

export default function WelcomePage() {
  const [email,      setEmail]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [contBusy,   setContBusy]   = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
      setLoading(false)
    })
  }, [])

  function signInWithGoogle() {
    setGoogleBusy(true)
    window.location.href = `/api/auth/google?hint=${encodeURIComponent(email)}&from=invite`
  }

  async function continueWithEmail() {
    setContBusy(true)
    const res = await fetch('/api/auth/accept-invite', { method: 'POST' })
    const json = await res.json()
    window.location.href = json.destination ?? '/dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">

        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-700 flex items-center justify-center shadow-lg shadow-violet-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">TrainHub</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">You're invited!</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              This invite is locked to one email address.<br />You must sign up using it.
            </p>
          </div>

          {/* Locked email pill */}
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3.5 mb-7">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-violet-500 font-medium mb-0.5">Invited email</p>
              <p className="text-sm font-bold text-violet-900 truncate">{email}</p>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={signInWithGoogle}
            disabled={googleBusy || contBusy}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-semibold transition-all shadow-sm disabled:opacity-60 mb-1.5"
          >
            {googleBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo />}
            {googleBusy ? 'Redirecting…' : 'Sign up with Google'}
          </button>
          <p className="text-[11px] text-center text-slate-400 mb-5">
            Will sign you in as <span className="font-medium text-slate-500">{email}</span>
          </p>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={continueWithEmail}
            disabled={googleBusy || contBusy}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-all disabled:opacity-60"
          >
            {contBusy
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><ArrowRight className="w-4 h-4" /> Continue with email &amp; password</>}
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            You can set a password from your profile settings after signing in
          </p>
        </div>
      </div>
    </div>
  )
}
