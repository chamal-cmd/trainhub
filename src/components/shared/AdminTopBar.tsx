'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AiAssistantPanel } from './AiAssistantPanel'

interface Props {
  userName: string
  userEmail: string
}

export function AdminTopBar({ userName, userEmail }: Props) {
  const [aiOpen,   setAiOpen]   = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router  = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menuOpen])

  // Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setAiOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Listen for AI launch card events
  useEffect(() => {
    function onQuery() { setAiOpen(true) }
    window.addEventListener('ai-panel-query', onQuery)
    return () => window.removeEventListener('ai-panel-query', onQuery)
  }, [])

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        {/* Left: page title area (empty — pages render their own headings) */}
        <div />

        {/* Right: AI + avatar */}
        <div className="flex items-center gap-2">
          {/* AI Assistant — same style as user view */}
          <button
            onClick={() => setAiOpen(v => !v)}
            title="AI Assistant (Ctrl+K)"
            className={`flex items-center gap-2 px-3 h-9 rounded-full text-sm font-semibold transition-all ${
              aiOpen
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${aiOpen ? 'text-white' : ''}`} />
            <span>AI Assistant</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${aiOpen ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
              ⌘K
            </span>
          </button>

          {/* Avatar + dropdown */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-violet-400 transition-all"
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                </div>
                <Link href="/admin/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings className="w-4 h-4 text-slate-400" /> Settings
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <AiAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        userName={userName || 'Admin'}
        completionRate={0}
      />
    </>
  )
}
