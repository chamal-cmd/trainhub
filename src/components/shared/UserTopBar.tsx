'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Sparkles, Settings, LogOut, ShieldCheck,
} from 'lucide-react'
import { AiAssistantPanel } from './AiAssistantPanel'
import { CommandPalette } from './CommandPalette'

interface UserTopBarProps {
  userName: string
  userRole: string
  completionRate: number
}

export function UserTopBar({ userName, userRole, completionRate }: UserTopBarProps) {
  const [aiOpen,     setAiOpen]     = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menuOpen])

  // Ctrl+K → open search palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Open AI panel when launch card fires custom event
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
    .slice(0, 2)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }


  return (
    <>
      {/* ── Top bar ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0 z-20">
        {/* Search trigger */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full h-9 flex items-center gap-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 border border-transparent transition-all group text-left"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-sm text-slate-400 truncate">Search modules, steps, tools…</span>
            <kbd className="hidden sm:flex items-center gap-0.5 h-5 px-1.5 rounded border border-slate-300/60 bg-white/80 text-[10px] font-medium text-slate-400 shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            title="AI Assistant (Ctrl+K)"
            onClick={() => setAiOpen(v => !v)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              aiOpen
                ? 'bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${aiOpen ? 'text-white' : ''}`} />
          </button>

          {/* Admin view toggle — only visible to admins */}
          {userRole === 'Administrator' && (
            <Link
              href="/admin"
              title="Switch to Admin View"
              className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold bg-violet-700 text-white hover:bg-violet-800 transition-colors ml-1 shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin View
            </Link>
          )}

          {/* Avatar + dropdown */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-violet-300 transition-all"
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in zoom-in-95 duration-100">
                {/* User info */}
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{userRole}</p>
                </div>
                {/* Settings */}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── AI Assistant Panel ── */}
      <AiAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        userName={userName}
        completionRate={completionRate}
      />

      {/* ── Command Palette ── */}
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  )
}

function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      {children}
    </button>
  )
}
