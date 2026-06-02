// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getUser, getProfile, getCompletedStepIds } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Calendar, Clock, AlertTriangle, FileText, ArrowUpDown, BookOpen, SlidersHorizontal, ExternalLink, Wrench } from 'lucide-react'
import { AiLaunchCard } from '@/components/shared/AiLaunchCard'

export default async function UserDashboard() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  // Parallel fetch — uses cached getUser/getProfile so layout deduplicates
  const [assignmentsRes, progressRes, profile] = await Promise.all([
    supabase
      .from('assignments')
      .select('id, due_date, subjects(id, title, emoji, cover_color, topics(id, steps(id)))')
      .eq('user_id', user.id),
    supabase
      .from('step_progress')
      .select('step_id, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
    getProfile(user.id),
  ])

  // Tools fetched separately so a missing table never crashes the whole page
  let toolsRes: { data: any[] | null } = { data: [] }
  try {
    toolsRes = await supabase
      .from('tools')
      .select('id, name, emoji, category, website_url')
      .order('name')
      .limit(8)
  } catch { toolsRes = { data: [] } }

  const assignments   = assignmentsRes.data ?? []
  const stepProgress  = progressRes.data ?? []
  const completedIds  = new Set(stepProgress.map((p: any) => p.step_id))
  const firstName     = (profile?.full_name ?? '').split(' ')[0] || 'there'
  const tools         = toolsRes.data ?? []

  // Build module list
  const modules = assignments.map(a => {
    const subject   = a.subjects as any
    const allSteps: string[] = subject?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
    const completed = allSteps.filter(id => completedIds.has(id)).length
    const total     = allSteps.length
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0
    const readMins  = Math.max(2, total * 3)
    const dueDate   = a.due_date ? new Date(a.due_date) : null
    const now       = new Date()
    const overdueDays = dueDate && dueDate < now && percent < 100
      ? Math.floor((now.getTime() - dueDate.getTime()) / 86400000) : 0
    return { subject, dueDate, readMins, overdueDays, percent, completed, total }
  })

  const todo = modules
    .filter(m => m.percent < 100)
    .sort((a, b) => {
      if (a.overdueDays > 0 && b.overdueDays <= 0) return -1
      if (b.overdueDays > 0 && a.overdueDays <= 0) return 1
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
      if (a.dueDate) return -1; if (b.dueDate) return 1; return 0
    })
  const done = modules.filter(m => m.percent === 100)

  // Overall completion
  const totalSteps     = modules.reduce((s, m) => s + m.total, 0)
  const completedSteps = modules.reduce((s, m) => s + m.completed, 0)
  const overallPct     = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // Build a step→subjectId map once — O(n) instead of O(n²)
  const stepToSubjectId = new Map<string, string>()
  for (const a of assignments) {
    const s = a.subjects as any
    for (const t of s?.topics ?? [])
      for (const step of t.steps ?? [])
        stepToSubjectId.set(step.id, s.id)
  }
  const modBySubjectId = new Map(modules.map(m => [m.subject.id, m]))

  // Recently viewed (last 3 unique subjects, ordered by last step completed)
  const seen = new Set<string>(); const recentMods: typeof modules = []
  for (const sp of stepProgress) {
    const subjectId = stepToSubjectId.get(sp.step_id)
    if (!subjectId) continue
    const mod = modBySubjectId.get(subjectId)
    if (mod && !seen.has(subjectId)) { seen.add(subjectId); recentMods.push(mod); if (recentMods.length >= 3) break }
  }

  // Streak weeks (last 4 week start dates)
  const weekStarts: Date[] = []
  const now = new Date()
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay() - i * 7); d.setHours(0,0,0,0)
    weekStarts.push(d)
  }

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">

      {/* ── Header ── */}
      <h1 className="text-2xl font-bold text-slate-900 mb-5">
        Home
      </h1>

      {/* ── Recently viewed chips ── */}
      {recentMods.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {recentMods.map(m => (
            <Link key={m.subject.id} href={`/training/${m.subject.id}`}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1.5 text-xs text-slate-600 font-medium transition-all shadow-sm hover:shadow">
              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[140px]">{m.subject.title}</span>
            </Link>
          ))}
          <button className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex gap-5 items-start">

        {/* ── Left: To Do + Completed ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* To Do card */}
          {todo.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">To do</h2>
                <button className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition-colors">
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {todo.map(m => <ModuleRow key={m.subject.id} m={m} />)}
              </div>
            </div>
          )}

          {/* Completed card */}
          {done.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Completed</h2>
                <span className="text-xs text-slate-400 font-medium">{done.length} module{done.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {done.map(m => <ModuleRow key={m.subject.id} m={m} isDone />)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {modules.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-20">
              <BookOpen className="w-9 h-9 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No training assigned yet</p>
              <p className="text-xs text-slate-400 mt-1">Your administrator will assign modules soon.</p>
            </div>
          )}
        </div>

        {/* ── Right: AI + Streak + Progress ring + Software & Tools ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* AI Assistant card */}
          <AiLaunchCard />

          {/* Streak card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 text-sm font-bold">
                {firstName.slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No streak yet</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Get to 100% completion on your training to start your streak.
                </p>
              </div>
            </div>
            {/* Week dots */}
            <div className="grid grid-cols-4 gap-1 text-center">
              {weekStarts.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <div className={`w-5 h-5 rounded-full border-2 ${i === 3 && overallPct === 100 ? 'bg-orange-400 border-orange-400' : 'bg-white border-slate-200'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Progress ring card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">My Progress</p>
            <div className="flex flex-col items-center">
              <ProgressRing pct={overallPct} todo={todo.length} done={done.length} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  In progress
                </span>
                <span className="font-semibold text-slate-700">{todo.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  Completed
                </span>
                <span className="font-semibold text-slate-700">{done.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                  Not started
                </span>
                <span className="font-semibold text-slate-700">
                  {todo.filter(m => m.percent === 0).length}
                </span>
              </div>
            </div>
          </div>

          {/* Software & Tools card */}
          {tools.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Software &amp; Tools</p>
                </div>
                <Link href="/tools" className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                  View all
                </Link>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {tools.map((tool: any) => (
                  <div key={tool.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group">
                    <span className="text-base leading-none shrink-0">{tool.emoji}</span>
                    <span className="text-xs font-medium text-slate-700 flex-1 truncate">{tool.name}</span>
                    {tool.website_url && (
                      <a
                        href={tool.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`Open ${tool.name}`}
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ── Module row ── */
function ModuleRow({ m, isDone = false }: { m: any; isDone?: boolean }) {
  const { subject, dueDate, readMins, overdueDays, percent } = m
  return (
    <Link href={`/training/${subject.id}`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group ${isDone ? 'opacity-60' : ''}`}>
        {/* Icon */}
        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-sm">
          {subject.emoji || <BookOpen className="w-4 h-4 text-slate-400" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-slate-900'}`}>
            {subject.title}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
              Subject
            </span>
            {dueDate && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="w-3 h-3" />
                Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              {readMins} min read
            </span>
          </div>
        </div>

        {/* Right badge */}
        <div className="shrink-0">
          {overdueDays > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-50 rounded-lg px-2.5 py-1">
              <AlertTriangle className="w-3 h-3" />
              {overdueDays} day{overdueDays !== 1 ? 's' : ''} overdue
            </span>
          ) : percent > 0 && !isDone ? (
            <span className="text-[11px] font-bold text-orange-500 bg-orange-50 rounded-lg px-2.5 py-1">
              {percent}%
            </span>
          ) : isDone ? (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1">
              ✓ Done
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

/* ── SVG Donut ring ── */
function ProgressRing({ pct, todo, done }: { pct: number; todo: number; done: number }) {
  const r = 54
  const cx = 70; const cy = 70
  const circumference = 2 * Math.PI * r

  const donePct   = pct
  const todoPct   = Math.max(0, Math.min(100 - donePct, (todo / Math.max(todo + done, 1)) * (100 - donePct + 10)))
  const emptyPct  = 100 - donePct - todoPct

  const doneStroke  = (donePct / 100)  * circumference
  const todoStroke  = (todoPct / 100)  * circumference
  const emptyStroke = (emptyPct / 100) * circumference

  const doneOffset  = circumference * 0.25
  const todoOffset  = doneOffset - doneStroke
  const emptyOffset = todoOffset - todoStroke

  return (
    <div className="relative">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {/* Empty arc */}
        {emptyPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="14"
            strokeDasharray={`${emptyStroke} ${circumference - emptyStroke}`}
            strokeDashoffset={emptyOffset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }} />
        )}
        {/* In-progress arc (orange) */}
        {todoPct > 1 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fb923c" strokeWidth="14"
            strokeDasharray={`${todoStroke} ${circumference - todoStroke}`}
            strokeDashoffset={todoOffset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }} />
        )}
        {/* Completed arc (green) */}
        {donePct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth="14"
            strokeDasharray={`${doneStroke} ${circumference - doneStroke}`}
            strokeDashoffset={doneOffset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }} />
        )}
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-800" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'inherit' }}>{pct}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10, fontFamily: 'inherit' }}>complete</text>
      </svg>
    </div>
  )
}
