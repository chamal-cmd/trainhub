'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { AiAssistantPanel } from './AiAssistantPanel'

interface Props {
  userName: string
  userEmail: string
}

export function AdminTopBar({ userName, userEmail }: Props) {
  const [aiOpen, setAiOpen] = useState(false)

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

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ml-1 select-none">
            {initials}
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
