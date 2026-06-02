'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Sparkles,
  Settings, LogOut, PanelLeftOpen, PanelLeftClose, ShieldCheck, User, Bell, Shield,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { AiAssistantPanel } from './AiAssistantPanel'

interface UserTopBarProps {
  userName: string
  userRole: string
  completionRate: number
  sidebarOpen: boolean
  onToggle: () => void
}

export function UserTopBar({ userName, userRole, completionRate, sidebarOpen, onToggle }: UserTopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [aiOpen, setAiOpen]           = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Ctrl+K global shortcut to open/close AI panel
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

  // Open panel when AI launch card fires the custom event
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

  // Close panel when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [profileOpen])

  const menuItems = [
    { icon: User,     label: 'Edit profile',       href: '/settings' },
    { icon: Bell,     label: 'Notifications',       href: '/settings?tab=notifications' },
    { icon: Shield,   label: 'Security & password', href: '/settings?tab=security' },
    { icon: Settings, label: 'Account preferences', href: '/settings?tab=account' },
  ]

  return (
    <>
      {/* ── Top bar ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0 z-20">
        {/* Sidebar toggle */}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <PanelLeftClose className="w-5 h-5" />
            : <PanelLeftOpen  className="w-5 h-5" />}
        </button>

        {/* Search bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search or ask a question"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100 border border-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
            />
          </div>
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
              className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors ml-1 shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin View
            </Link>
          )}

          {/* Avatar */}
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ml-1 hover:ring-2 hover:ring-indigo-300 transition-all"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ── Profile panel (right drawer) ── */}
      {profileOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />

          {/* Panel */}
          <div
            ref={panelRef}
            className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl z-40 flex flex-col border-l border-slate-200 animate-in slide-in-from-right-2 duration-150"
          >
            {/* User info */}
            <div className="px-5 pt-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{userRole}</p>
                </div>
              </div>

              {/* Completion rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Completion rate</span>
                  <span className="text-xs font-bold text-orange-500">{completionRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Menu items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {menuItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => item.href !== '#' && setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
                  {item.label}
                </Link>
              ))}

            </nav>

            {/* Sign out */}
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── AI Assistant Panel ── */}
      <AiAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        userName={userName}
        completionRate={completionRate}
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
