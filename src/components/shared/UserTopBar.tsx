'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Sparkles, Settings, LogOut, ShieldCheck,
  Layers, BookOpen, FileText, Wrench, Clock, ArrowRight, X,
} from 'lucide-react'
import { AiAssistantPanel } from './AiAssistantPanel'
import { cn } from '@/lib/utils'

interface UserTopBarProps {
  userName:       string
  userRole:       string
  completionRate: number
}

interface SearchResult {
  id:       string
  type:     'subject' | 'topic' | 'step' | 'tool'
  title:    string
  subtitle: string
  href:     string
  emoji?:   string
}

const RECENT_KEY = 'trainhub:recent_searches'

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const lo  = text.toLowerCase()
  const idx = lo.indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-violet-100 text-violet-800 rounded-sm not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function UserTopBar({ userName, userRole, completionRate }: UserTopBarProps) {
  const router   = useRouter()
  const supabase = createClient()

  const [aiOpen,   setAiOpen]   = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef   = useRef<HTMLDivElement>(null)

  // ── Search state ────────────────────────────────────────────────────────────
  const [query,    setQuery]    = useState('')
  const [focused,  setFocused]  = useState(false)
  const [index,    setIndex]    = useState<SearchResult[]>([])
  const [recent,   setRecent]   = useState<SearchResult[]>([])
  const [sel,      setSel]      = useState(0)
  const searchRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const itemRefs   = useRef<(HTMLButtonElement | null)[]>([])

  // ── Build search index once ─────────────────────────────────────────────────
  const buildIndex = useCallback(async () => {
    if (index.length > 0) return
    const results: SearchResult[] = []

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, title, emoji, order_index, topics(id, title, steps(id, title, order_index))')
      .order('order_index')

    for (const s of subjects ?? []) {
      results.push({ id: s.id, type: 'subject', title: s.title, subtitle: 'Module', href: `/training/${s.id}`, emoji: s.emoji ?? '📚' })
      for (const t of (s.topics as any[]) ?? []) {
        results.push({ id: t.id, type: 'topic', title: t.title, subtitle: s.title, href: `/training/${s.id}/${t.id}`, emoji: s.emoji ?? '📚' })
        const sorted = ((t.steps as any[]) ?? []).sort((a: any, b: any) => a.order_index - b.order_index)
        for (const step of sorted) {
          results.push({ id: step.id, type: 'step', title: step.title, subtitle: `${s.title} › ${t.title}`, href: `/training/${s.id}/${t.id}?step=${step.id}` })
        }
      }
    }

    const { data: tools } = await supabase.from('tools').select('id, name, category')
    for (const tool of tools ?? []) {
      results.push({ id: tool.id, type: 'tool', title: tool.name, subtitle: tool.category, href: `/tools` })
    }

    setIndex(results)
  }, [index.length, supabase])

  // Load recent + index on first focus
  function onFocus() {
    setFocused(true)
    buildIndex()
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {}
  }

  // Close on click-outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setFocused(false)
        setQuery('')
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Ctrl+K focuses the search input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setFocused(true)
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

  // ── Compute results ─────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase()
  const filtered = q
    ? index
        .filter(r => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q))
        .slice(0, 10)
    : []

  const showDropdown = focused && (query.trim() || recent.length > 0)
  const visibleList  = q ? filtered : recent
  const showEmpty    = q && filtered.length === 0

  // Reset selection when results change
  useEffect(() => { setSel(0) }, [query])

  // Scroll selected item into view
  useEffect(() => { itemRefs.current[sel]?.scrollIntoView({ block: 'nearest' }) }, [sel])

  // ── Keyboard navigation inside dropdown ────────────────────────────────────
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setFocused(false); setQuery(''); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, visibleList.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && visibleList[sel]) navigate(visibleList[sel])
  }

  // ── Navigate to result ──────────────────────────────────────────────────────
  function navigate(item: SearchResult) {
    try {
      const updated = [item, ...recent.filter(r => r.id !== item.id)].slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
    setFocused(false)
    setQuery('')
    router.push(item.href)
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Top bar ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0 z-20">

        {/* ── Search bar ── */}
        <div ref={searchRef} className="flex-1 max-w-xl relative">
          <div className={cn(
            'flex items-center gap-2.5 px-3 h-9 rounded-full border transition-all',
            focused
              ? 'bg-white border-violet-300 shadow-sm shadow-violet-100 ring-2 ring-violet-100'
              : 'bg-slate-100 border-transparent hover:bg-slate-200'
          )}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={onFocus}
              onKeyDown={onKeyDown}
              placeholder="Search modules, steps, tools…"
              className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
            />
            {query ? (
              <button onClick={() => { setQuery(''); inputRef.current?.focus() }} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:flex items-center h-5 px-1.5 rounded border border-slate-300/60 bg-slate-50 text-[10px] font-medium text-slate-400 shrink-0">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* ── Dropdown ── */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden z-50 max-h-[480px] flex flex-col">

              {/* Empty state */}
              {showEmpty && (
                <div className="py-10 text-center text-sm text-slate-400">
                  No results for <span className="font-semibold text-slate-600">"{query}"</span>
                </div>
              )}

              {/* Recent label */}
              {!q && recent.length > 0 && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">Recent</p>
              )}

              {/* Results */}
              <div className="overflow-y-auto py-1">
                {/* Grouped results when searching */}
                {q && !showEmpty && (() => {
                  const byType = (type: string) => filtered.filter(r => r.type === type)
                  const groups = [
                    { label: 'Modules', items: byType('subject') },
                    { label: 'Units',   items: byType('topic') },
                    { label: 'Steps',   items: byType('step').slice(0, 5) },
                    { label: 'Tools',   items: byType('tool') },
                  ].filter(g => g.items.length > 0)

                  let gi = 0
                  return groups.map(group => (
                    <div key={group.label}>
                      <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
                      {group.items.map(item => {
                        const idx = filtered.indexOf(item)
                        return (
                          <ResultRow
                            key={item.id}
                            ref={el => { itemRefs.current[idx] = el }}
                            item={item}
                            query={query}
                            selected={idx === sel}
                            onClick={() => navigate(item)}
                          />
                        )
                      })}
                    </div>
                  ))
                })()}

                {/* Recent list when no query */}
                {!q && recent.map((item, i) => (
                  <ResultRow
                    key={item.id}
                    ref={el => { itemRefs.current[i] = el }}
                    item={item}
                    query=""
                    selected={i === sel}
                    onClick={() => navigate(item)}
                    isRecent
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-slate-100 px-4 py-2 flex items-center gap-3 bg-slate-50/60">
                {[['↑↓', 'navigate'], ['↵', 'open'], ['Esc', 'close']].map(([k, l]) => (
                  <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400">
                    <kbd className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded border border-slate-200 bg-white text-[10px] font-medium text-slate-500">{k}</kbd>
                    {l}
                  </span>
                ))}
                {index.length > 0 && (
                  <span className="ml-auto text-[10px] text-slate-300">{index.length} items</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right icons ── */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            title="AI Assistant"
            onClick={() => setAiOpen(v => !v)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              aiOpen
                ? 'bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            <Sparkles className={cn('w-5 h-5', aiOpen && 'text-white')} />
          </button>

          {userRole === 'Administrator' && (
            <Link href="/admin" className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold bg-violet-700 text-white hover:bg-violet-800 transition-colors ml-1 shrink-0">
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
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{userRole}</p>
                </div>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button onClick={() => { setMenuOpen(false); handleSignOut() }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <AiAssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} userName={userName} completionRate={completionRate} />
    </>
  )
}

// ── Shared result row ───────────────────────────────────────────────────────────
import { forwardRef } from 'react'

const ResultRow = forwardRef<
  HTMLButtonElement,
  { item: SearchResult; query: string; selected: boolean; onClick: () => void; isRecent?: boolean }
>(function ResultRow({ item, query, selected, onClick, isRecent }, ref) {
  function icon() {
    if (isRecent) return <Clock className="w-3.5 h-3.5" />
    if (item.type === 'subject' && item.emoji) return <span className="text-sm leading-none">{item.emoji}</span>
    if (item.type === 'subject') return <Layers   className="w-3.5 h-3.5" />
    if (item.type === 'topic')   return <BookOpen  className="w-3.5 h-3.5" />
    if (item.type === 'step')    return <FileText  className="w-3.5 h-3.5" />
    if (item.type === 'tool')    return <Wrench    className="w-3.5 h-3.5" />
    return null
  }
  const iconStyle = isRecent ? 'bg-slate-100 text-slate-400' : typeStyle(item.type)

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors group',
        selected ? 'bg-violet-50' : 'hover:bg-slate-50'
      )}
    >
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', iconStyle)}>
        {icon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', selected ? 'text-violet-900' : 'text-slate-800')}>
          <Highlight text={item.title} query={query} />
        </p>
        {item.subtitle && <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>}
      </div>
      <ArrowRight className={cn('w-3.5 h-3.5 shrink-0 transition-opacity text-slate-400', selected ? 'opacity-100 text-violet-400' : 'opacity-0 group-hover:opacity-40')} />
    </button>
  )
})

function typeStyle(type: string) {
  if (type === 'subject') return 'bg-violet-100 text-violet-600'
  if (type === 'topic')   return 'bg-blue-100 text-blue-600'
  if (type === 'step')    return 'bg-slate-100 text-slate-500'
  if (type === 'tool')    return 'bg-emerald-100 text-emerald-600'
  return 'bg-slate-100 text-slate-500'
}
