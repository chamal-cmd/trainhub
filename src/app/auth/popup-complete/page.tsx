'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function PopupCompleteInner() {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') ?? 'user'

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      // Tell the login page we succeeded, then close this popup
      window.opener.postMessage(
        { type: 'GOOGLE_SIGNIN_SUCCESS', role },
        window.location.origin
      )
      window.close()
    } else {
      // Opened directly (no parent) — just redirect
      window.location.href = role === 'admin' ? '/admin' : '/dashboard'
    }
  }, [role])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
      <div className="w-8 h-8 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Signing you in…</p>
    </div>
  )
}

export default function PopupCompletePage() {
  return (
    <Suspense>
      <PopupCompleteInner />
    </Suspense>
  )
}
