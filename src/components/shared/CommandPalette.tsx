'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, ArrowRight, BookOpen, Layers, FileText,
  Wrench, Clock, X, CornerDownLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id:       string
  type:     'subject' | 'topic' | 'step' | 'tool'
  title:    string
  subtitle: string
  href:     string
  emoji?:   string
}

interface Props {
  open:    boolean
  onClose: () => void
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

function typeStyle(type: string) {
  if (type === 'subject') return 'bg-violet-100 text-violet-600'
  if (type === 'topic')   return 'bg-blue-100 text-blue-600'
  if (type === 'step')    return 'bg-slate-100 text-slate-500'
  if (type === 'tool')    return 'bg-emerald-100 text-emerald-600'
  return 'bg-slate-100 text-slate-500'
}

function TypeIcon({ type, emoji }: { type: string; emoji?: string }) {
  if (type === 'subject' && emoji) return <span className="text-base leading-none">{emoji}</span>
  if (type === 'subject') return <Layers   className="w-3.5 h-3.5" />
  if (type === 'topic')   return <BookOpen  className="w-3.5 h-3.5" />
  if (type === 'step')    return <FileText  className="w-3.5 h-3.5" />
  if (type === 'tool')    return <Wrench    className="w-3.5 h-3.5" />
  return null
}

export function CommandPalette({ open, onClose }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const [query,   setQuery]   = useState('')
  const [index,   setIndex]   = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sel,     setSel]     = useState(0)
  const [recent,  setRecent]  = useState<SearchResult[]>([])

  // ── Load full content index once per open ──────────────────────────────────
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSel(0)
    setTimeout(() => inputRef.current?.focus(), 60)

    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {}

    if (index.length > 0) return   // already loaded
    buildIndex()
  }, [open])

  async function buildIndex() {
    setLoading(true)
    const results: SearchResult[] = []

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, title, emoji, order_index, topics(id, title, steps(id, title, order_index))')
      .order('order_index')

    for (const s of subjects ?? []) {
      results.push({
        id:       s.id,
        type:     'subject',
        title:    s.title,
        subtitle: 'Module',
        href:     `/training/${s.id}`,
        emoji:    s.emoji ?? '📚',
      })
      for (const t of (s.topics as any[]) ?? []) {
        results.push({
          id:       t.id,
          type:     'topic',
          title:    t.title,
          subtitle: s.title,
          href:     `/training/${s.id}/${t.id}`,
          emoji:    s.emoji ?? '📚',
        })
        const sortedSteps = ((t.steps as any[]) ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
        for (const step of sortedSteps) {
          results.push({
            id:       step.id,
            type:     'step',
            title:    step.title,
            subtitle: `${s.title} › ${t.title}`,
            href:     `/training/${s.id}/${t.id}?step=${step.id}`,
            emoji:    s.emoji ?? '📚',
          })
        }
      }
    }

    const { data: tools } = await supabase
      .from('tools')
      .select('id, name, category')
    for (const tool of tools ?? []) {
      results.push({
        id:       tool.id,
        type:     'tool',
        title:    tool.name,
        subtitle: tool.category,
        href:     `/tools`,
      })
    }

    setIndex(results)
    setLoading(false)
  }

  // ── Compute visible list ───────────────────────────────────────────────────
  const q = query.trim().toLowerCase()

  const filtered: SearchResult[] = q
    ? index
        .filter(r =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q)
        )
        .slice(0, 15)
    : []

  type Group = { label: string; items: SearchResult[] }
  const groups: Group[] = []
  if (filtered.length) {
    const byType = (type: SearchResult['type']) => filtered.filter(r => r.type === type)
    const subjects = byType('subject')
    const topics   = byType('topic')
    const steps    = byType('step')
    const tools    = byType('tool')
    if (subjects.length) groups.push({ label: 'Modules',  items: subjects })
    if (topics.length)   groups.push({ label: 'Units',    items: topics })
    if (steps.length)    groups.push({ label: 'Steps',    items: steps.slice(0, 6) })
    if (tools.length)    groups.push({ label: 'Tools',    items: tools })
  }

  // Flat ordered list for keyboard nav
  const flat: SearchResult[] = q
    ? groups.flatMap(g => g.items)
    : recent

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSel(s => Math.min(s + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSel(s => Math.max(s - 1, 0))
      } else if (e.key === 'Enter' && flat[sel]) {
        navigate(flat[sel])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat, sel])

  useEffect(() => { setSel(0) }, [query])

  // Scroll selected item into view
  useEffect(() => {
    itemRefs.current[sel]?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  // ── Navigate ───────────────────────────────────────────────────────────────
  function navigate(item: SearchResult) {
    try {
      const updated = [item, ...recent.filter(r => r.id !== item.id)].slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
    router.push(item.href)
    onClose()
  }

  if (!open) return null

  const showEmpty   = q && flat.length === 0 && !loading
  const showRecent  = !q && recent.length > 0
  const showHint    = !q && recent.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4"
      style={{ paddingTop: '12vh' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette card */}
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">

        {/* ── Search input row ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100">
          {loading
            ? <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin shrink-0" />
            : <Search className="w-5 h-5 text-slate-400 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search modules, units, steps, tools…"
            className="flex-1 text-[15px] text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-0.5 h-5 px-1.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-400 shrink-0">
              Esc
            </kbd>
          )}
        </div>

        {/* ── Results area ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto max-h-[420px] py-1.5">

          {/* Empty hint */}
          {showHint && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Search className="w-9 h-9 text-slate-200" />
              <p className="text-sm text-slate-400">Type to search across everything</p>
            </div>
          )}

          {/* No results */}
          {showEmpty && (
            <div className="flex flex-col items-center gap-2 py-12">
              <p className="text-sm text-slate-400">
                No results for <span className="font-semibold text-slate-600">"{query}"</span>
              </p>
            </div>
          )}

          {/* Recent searches */}
          {showRecent && (
            <section>
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Recent
              </p>
              {recent.map((item, i) => (
                <ResultRow
                  key={item.id}
                  ref={el => { itemRefs.current[i] = el }}
                  item={item}
                  query=""
                  selected={i === sel}
                  onClick={() => navigate(item)}
                  icon={<Clock className="w-3.5 h-3.5" />}
                  iconStyle="bg-slate-100 text-slate-400"
                />
              ))}
            </section>
          )}

          {/* Grouped search results */}
          {groups.map(group => {
            return (
              <section key={group.label}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                {group.items.map(item => {
                  const idx = flat.indexOf(item)
                  return (
                    <ResultRow
                      key={item.id}
                      ref={el => { itemRefs.current[idx] = el }}
                      item={item}
                      query={query}
                      selected={idx === sel}
                      onClick={() => navigate(item)}
                      icon={<TypeIcon type={item.type} emoji={item.emoji} />}
                      iconStyle={typeStyle(item.type)}
                    />
                  )
                })}
              </section>
            )
          })}

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 bg-slate-50/60">
          {[
            { keys: ['↑', '↓'], label: 'navigate' },
            { keys: ['↵'],       label: 'open' },
            { keys: ['Esc'],     label: 'close' },
          ].map(({ keys, label }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-slate-400">
              {keys.map(k => (
                <kbd key={k} className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-slate-200 bg-white text-[10px] font-medium text-slate-500">
                  {k}
                </kbd>
              ))}
              {label}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-slate-300 font-medium">
            {index.length > 0 && `${index.length} items indexed`}
          </span>
        </div>

      </div>
    </div>
  )
}

// ── Shared result row ──────────────────────────────────────────────────────────
import { forwardRef } from 'react'

const ResultRow = forwardRef<
  HTMLButtonElement,
  {
    item:       SearchResult
    query:      string
    selected:   boolean
    onClick:    () => void
    icon:       React.ReactNode
    iconStyle:  string
  }
>(function ResultRow({ item, query, selected, onClick, icon, iconStyle }, ref) {
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
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', selected ? 'text-violet-900' : 'text-slate-800')}>
          <Highlight text={item.title} query={query} />
        </p>
        {item.subtitle && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
        )}
      </div>
      <div className={cn('shrink-0 transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40')}>
        {selected
          ? <CornerDownLeft className="w-3.5 h-3.5 text-violet-400" />
          : <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        }
      </div>
    </button>
  )
})
