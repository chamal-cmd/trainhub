'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, Clock, Search, ChevronLeft, ChevronRight, ChevronDown,
  Trophy, Medal,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileModule {
  id: string
  title: string
  emoji: string
  color: string | null
  completed: number
  total: number
  percent: number
  readMins: number
}

export interface LeaderboardEntry {
  userId: string
  name: string
  initials: string
  stepsCompleted: number
  rank: number
  isCurrentUser: boolean
}

interface Props {
  modules: ProfileModule[]
  leaderboard: LeaderboardEntry[]
}

const PAGE_SIZE = 8

// ── Main component ─────────────────────────────────────────────────────────────

export function ProfileClient({ modules, leaderboard }: Props) {
  const [page, setPage]                  = useState(1)
  const [sortValue, setSortValue]        = useState('Recently viewed')
  const [typeValue, setTypeValue]        = useState('All content')
  const [completedSearch, setCompSearch] = useState('')
  const [searchOpen, setSearchOpen]      = useState(false)

  // Split modules
  const inProgress = modules.filter(m => m.percent > 0 && m.percent < 100)
  const notStarted = modules.filter(m => m.percent === 0)
  const doneMods   = modules.filter(m => m.percent === 100)

  const assignedList = [...inProgress, ...notStarted]
  const totalPages   = Math.ceil(assignedList.length / PAGE_SIZE)
  const pageItems    = assignedList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Filtered completed list
  const filteredDone = useMemo(() => {
    let result = [...doneMods]
    if (completedSearch.trim()) {
      const q = completedSearch.toLowerCase()
      result = result.filter(m => m.title.toLowerCase().includes(q))
    }
    if (sortValue === 'Alphabetical') result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [doneMods, completedSearch, sortValue])

  // Leaderboard helpers
  const currentEntry = leaderboard.find(e => e.isCurrentUser)
  const top3         = leaderboard.slice(0, 3)
  const rest         = leaderboard.slice(3)
  // Podium order: silver(2nd), gold(1st), bronze(3rd)
  const podium: (LeaderboardEntry | null)[] =
    top3.length >= 3 ? [top3[1], top3[0], top3[2]] :
    top3.length === 2 ? [null, top3[0], top3[1]] :
    [null, top3[0] ?? null, null]

  return (
    // h-full fills the <main> element which is flex-1 in UserClientWrapper
    // Each column gets its own overflow-y-auto so they scroll independently
    <div className="flex h-full bg-[#f8f8f8]">

      {/* ── Left: module list + completed (scrollable) ── */}
      <div className="flex-1 min-w-0 overflow-y-auto px-8 py-7">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Progress</h1>

        {/* Assigned / in-progress modules */}
        {assignedList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="divide-y divide-slate-100">
              {pageItems.map(m => (
                <Link key={m.id} href={`/training/${m.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    {/* Circular progress ring */}
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle
                          cx="20" cy="20" r="16" fill="none"
                          stroke={m.percent > 0 ? '#f97316' : '#e2e8f0'}
                          strokeWidth="3"
                          strokeDasharray={`${(m.percent / 100) * 100.53} 100.53`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 truncate">{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">Subject</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" /> {m.readMins} min read
                        </span>
                      </div>
                    </div>

                    {m.percent > 0 && (
                      <span className="text-xs font-bold text-orange-500 shrink-0">{m.percent}%</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                <span className="text-xs text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, assignedList.length)} of {assignedList.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${page === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Completed section ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 mb-3">Completed</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <FilterDropdown label="Sort" value={sortValue} options={['Recently viewed', 'Alphabetical']} onChange={setSortValue} />
              <FilterDropdown label="Type" value={typeValue} options={['All content', 'Subject']} onChange={setTypeValue} />
              <button
                onClick={() => setSearchOpen(v => !v)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${searchOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {searchOpen && (
              <div className="relative mt-2 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  autoFocus type="text" placeholder="Search completed…"
                  value={completedSearch}
                  onChange={e => setCompSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                />
              </div>
            )}
          </div>

          {filteredDone.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">
                {doneMods.length === 0 ? 'No completed modules yet.' : 'No results match your search.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDone.map(m => (
                <Link key={m.id} href={`/training/${m.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base">{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 truncate">{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">Subject</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> {m.readMins} min read</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 shrink-0">✓ Done</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: leaderboard panel (independent scroll) ── */}
      <div className="w-72 shrink-0 border-l border-slate-200 bg-white overflow-y-auto py-7 px-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Leaderboard</h2>
          </div>
          {currentEntry && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-400 rounded-full px-2.5 py-1 shrink-0">
              <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-bold">
                {currentEntry.initials}
              </span>
              #{currentEntry.rank}
            </span>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400 font-medium">No activity yet</p>
            <p className="text-xs text-slate-300 mt-1">Complete steps to appear on the leaderboard</p>
          </div>
        ) : (
          <>
            {/* Podium (top 3) */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-3 mb-6 pt-2">
                {podium.map((entry, idx) => {
                  const isGold   = idx === 1
                  const isSilver = idx === 0
                  const isBronze = idx === 2

                  const podiumH  = isGold ? 'h-16' : 'h-11'
                  const avatarSz = isGold ? 'w-14 h-14 text-base' : 'w-10 h-10 text-xs'
                  const ringCol  = isGold ? 'ring-amber-400' : isSilver ? 'ring-slate-300' : 'ring-orange-400'
                  const medal    = isGold ? '🥇' : isSilver ? '🥈' : '🥉'
                  const bgCol    = isGold
                    ? 'bg-amber-50 border-amber-200'
                    : isSilver
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-orange-50 border-orange-200'

                  if (!entry) return <div key={idx} className="w-[72px]" />
                  return (
                    <div key={entry.userId} className="flex flex-col items-center gap-1">
                      <div className={`relative ${avatarSz} rounded-full flex items-center justify-center font-bold text-slate-700 ring-2 ${ringCol} bg-white shadow-sm`}>
                        {entry.initials}
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm">{medal}</span>
                      </div>
                      <div className={`w-[72px] ${podiumH} rounded-t-xl border flex flex-col items-center justify-end pb-2 mt-3 ${bgCol}`}>
                        <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center px-1">
                          {entry.name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-slate-400">{entry.stepsCompleted} steps</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Divider */}
            {rest.length > 0 && <div className="border-t border-slate-100 mb-2" />}

            {/* Ranked list (4th onwards) */}
            <div className="space-y-0.5">
              {rest.map(entry => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${entry.isCurrentUser ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">{entry.rank}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${entry.isCurrentUser ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                    {entry.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${entry.isCurrentUser ? 'font-bold text-indigo-700' : 'font-medium text-slate-700'}`}>
                      {entry.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{entry.stepsCompleted} steps</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Current user's rank if they're outside top visible */}
            {currentEntry && currentEntry.rank > 3 + rest.length && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-indigo-50">
                  <span className="text-xs font-bold text-indigo-400 w-5 text-center shrink-0">{currentEntry.rank}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white bg-indigo-500 shrink-0">
                    {currentEntry.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-700 truncate">You</p>
                    <p className="text-[10px] text-indigo-400">{currentEntry.stepsCompleted} steps</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Filter dropdown ────────────────────────────────────────────────────────────

function FilterDropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-500">{label}:</span>
        <span className="font-semibold text-indigo-600">{value}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[140px] py-1">
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition-colors ${opt === value ? 'font-semibold text-indigo-600' : 'text-slate-700'}`}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] ?? s[v] ?? s[0]
}
