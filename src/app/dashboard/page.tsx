// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getUser, getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import {
  Clock, BookOpen, Zap,
  CheckCircle2, ArrowRight, Trophy, Flame, TrendingUp
} from 'lucide-react'
import { AiLaunchCard } from '@/components/shared/AiLaunchCard'
import { cn } from '@/lib/utils'

export default async function UserDashboard() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  const [subjectsRes, progressRes, profile] = await Promise.all([
    supabase
      .from('subjects')
      .select('id, title, emoji, cover_color, order_index, topics(id, steps(id))')
      .order('order_index', { ascending: true }),
    supabase
      .from('step_progress')
      .select('step_id, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
    getProfile(user.id),
  ])

  const subjects    = subjectsRes.data ?? []
  const stepProgress = progressRes.data ?? []
  const completedIds = new Set(stepProgress.map((p: any) => p.step_id))
  const firstName    = (profile?.full_name ?? '').split(' ')[0] || 'there'

  const modules = subjects.map((subject: any) => {
    const allSteps: string[] = subject?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
    const completed = allSteps.filter(id => completedIds.has(id)).length
    const total     = allSteps.length
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0
    const readMins  = Math.max(2, total * 3)
    const color     = subject?.cover_color || '#7C3AED'
    return { subject, readMins, percent, completed, total, color }
  })

  const inProgress = modules.filter(m => m.percent > 0 && m.percent < 100)
  const todo       = modules.filter(m => m.percent === 0)
  const done       = modules.filter(m => m.percent === 100)

  const allTodo = [...inProgress, ...todo]

  // Overall stats
  const totalSteps     = modules.reduce((s, m) => s + m.total, 0)
  const completedSteps = modules.reduce((s, m) => s + m.completed, 0)
  const overallPct     = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // Most recently active module (Jump Back In)
  const stepToSubjectId = new Map<string, string>()
  for (const subject of subjects) {
    for (const t of (subject as any).topics ?? [])
      for (const step of t.steps ?? [])
        stepToSubjectId.set(step.id, (subject as any).id)
  }
  const modBySubjectId = new Map(modules.map(m => [m.subject.id, m]))
  let jumpBackMod: typeof modules[0] | null = null
  for (const sp of stepProgress) {
    const subjectId = stepToSubjectId.get(sp.step_id)
    if (subjectId) {
      const mod = modBySubjectId.get(subjectId)
      if (mod && mod.percent > 0 && mod.percent < 100) { jumpBackMod = mod; break }
    }
  }

  // Streak weeks
  const weekStarts: Date[] = []
  const now = new Date()
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay() - i * 7); d.setHours(0,0,0,0)
    weekStarts.push(d)
  }

  return (
    <div className="min-h-full bg-[#f8f9fc]">

      {/* ── Hero header ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-7">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Good {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm">
              {allTodo.length > 0
                ? `You have ${allTodo.length} module${allTodo.length !== 1 ? 's' : ''} to work through.${inProgress.length > 0 ? ` ${inProgress.length} in progress.` : ''}`
                : done.length > 0
                ? 'All modules complete — amazing work! 🏆'
                : 'No modules available yet.'}
            </p>
          </div>

          {modules.length > 0 && (
            <div className="flex items-center gap-4 shrink-0">
              <StatPill icon={<BookOpen className="w-3.5 h-3.5" />} value={modules.length} label="Modules" color="violet" />
              <StatPill icon={<Zap className="w-3.5 h-3.5" />} value={inProgress.length} label="In progress" color="orange" />
              <StatPill icon={<CheckCircle2 className="w-3.5 h-3.5" />} value={done.length} label="Completed" color="emerald" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-7">
        <div className="flex gap-7 items-start">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 space-y-7">

            {/* Jump back in */}
            {jumpBackMod && (
              <section>
                <SectionLabel icon={<Flame className="w-3.5 h-3.5 text-orange-500" />} text="Jump back in" />
                <JumpBackCard m={jumpBackMod} />
              </section>
            )}

            {/* Up next / To do grid */}
            {allTodo.length > 0 && (
              <section>
                <SectionLabel
                  icon={<TrendingUp className="w-3.5 h-3.5 text-violet-600" />}
                  text={jumpBackMod ? 'Up next' : 'Your training'}
                  count={allTodo.length}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allTodo
                    .filter(m => m.subject.id !== jumpBackMod?.subject.id)
                    .map(m => <ModuleCard key={m.subject.id} m={m} />)}
                </div>
              </section>
            )}

            {/* Completed */}
            {done.length > 0 && (
              <section>
                <SectionLabel icon={<Trophy className="w-3.5 h-3.5 text-amber-500" />} text="Completed" count={done.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {done.map(m => <ModuleCard key={m.subject.id} m={m} isDone />)}
                </div>
              </section>
            )}

            {modules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-violet-400" />
                </div>
                <p className="font-bold text-slate-700 text-lg">No modules available yet</p>
                <p className="text-slate-400 text-sm mt-1.5">Check back soon.</p>
              </div>
            )}
          </div>

          {/* ── Right: sidebar widgets ── */}
          <div className="w-60 shrink-0 space-y-4">

            <AiLaunchCard />

            {modules.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Overall progress</p>
                <ProgressRing pct={overallPct} inProgress={inProgress.length} done={done.length} total={modules.length} />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekly streak</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {weekStarts.map((d, i) => {
                  const isActive = i === 3 && overallPct === 100
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">
                        {d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                      </p>
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        isActive ? 'bg-orange-400' : 'bg-slate-100 border-2 border-slate-200'
                      )}>
                        {isActive && <Flame className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  )
                })}
              </div>
              {overallPct < 100 && (
                <p className="text-[11px] text-slate-400 mt-3 text-center leading-relaxed">
                  Complete all modules this week to light your streak 🔥
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon, text, count }: { icon: React.ReactNode; text: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-sm font-bold text-slate-700">{text}</h2>
      {count !== undefined && (
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{count}</span>
      )}
    </div>
  )
}

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: 'violet' | 'orange' | 'emerald' }) {
  const styles = {
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  icon: 'text-violet-500'  },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  icon: 'text-orange-500'  },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
  }[color]

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl', styles.bg)}>
      <span className={styles.icon}>{icon}</span>
      <span className={cn('text-sm font-bold', styles.text)}>{value}</span>
      <span className={cn('text-xs', styles.text, 'opacity-70')}>{label}</span>
    </div>
  )
}

function JumpBackCard({ m }: { m: any }) {
  const color = m.color || '#7C3AED'
  const href = `/training/${m.subject.id}`

  return (
    <Link href={href}>
      <div
        className="group relative rounded-2xl overflow-hidden border border-white/20 hover:shadow-xl transition-all duration-300"
        style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`, borderColor: `${color}30` }}
      >
        <div className="flex items-center gap-6 px-6 py-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
            style={{ background: `${color}25` }}
          >
            {m.subject.emoji || '📚'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color }}>Continue learning</p>
            <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{m.subject.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden max-w-[180px]">
                <div className="h-full rounded-full transition-all" style={{ width: `${m.percent}%`, background: color }} />
              </div>
              <span className="text-sm font-bold" style={{ color }}>{m.percent}%</span>
              <span className="text-xs text-slate-500">{m.completed}/{m.total} steps</span>
            </div>
          </div>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
            style={{ background: color }}
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function ModuleCard({ m, isDone = false }: { m: any; isDone?: boolean }) {
  const color = isDone ? '#10b981' : (m.color || '#7C3AED')
  const { subject, readMins, percent, completed, total } = m

  return (
    <Link href={`/training/${subject.id}`}>
      <div className={cn(
        'group bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg',
        isDone ? 'border-emerald-100 opacity-80 hover:opacity-100' : 'border-slate-200 hover:border-violet-200',
      )}>
        <div
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: `2px solid ${color}20` }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `${color}18` }}
            >
              {subject.emoji || <BookOpen className="w-5 h-5" />}
            </div>
            {isDone ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            ) : percent > 0 ? (
              <span className="text-[11px] font-bold rounded-lg px-2 py-1 shrink-0" style={{ color, background: `${color}15` }}>
                {percent}%
              </span>
            ) : null}
          </div>
          <h3 className={cn(
            'font-bold text-sm leading-snug',
            isDone ? 'text-slate-500 line-through' : 'text-slate-800 group-hover:text-slate-900'
          )}>
            {subject.title}
          </h3>
        </div>

        <div className="px-5 py-3.5">
          {!isDone && (
            <div className="mb-3">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, background: color }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <BookOpen className="w-3 h-3" />
                {total} steps
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                {readMins} min
              </span>
            </div>
            <span
              className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
              style={{ color }}
            >
              {isDone ? 'Review' : percent > 0 ? 'Continue' : 'Start'}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function ProgressRing({ pct, inProgress, done, total }: { pct: number; inProgress: number; done: number; total: number }) {
  const r = 52; const cx = 68; const cy = 68
  const circ = 2 * Math.PI * r
  const doneFrac     = pct / 100
  const progressFrac = total > 0 ? inProgress / total : 0
  const remaining    = Math.max(0, 1 - doneFrac - progressFrac)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="136" height="136" viewBox="0 0 136 136">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="13" />
          {remaining > 0.01 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="13"
              strokeDasharray={`${remaining * circ} ${circ}`}
              strokeDashoffset={-(doneFrac + progressFrac) * circ + circ * 0.25}
              strokeLinecap="round" />
          )}
          {progressFrac > 0.01 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fb923c" strokeWidth="13"
              strokeDasharray={`${progressFrac * circ} ${circ}`}
              strokeDashoffset={-doneFrac * circ + circ * 0.25}
              strokeLinecap="round" />
          )}
          {doneFrac > 0.01 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#7C3AED" strokeWidth="13"
              strokeDasharray={`${doneFrac * circ} ${circ}`}
              strokeDashoffset={circ * 0.25}
              strokeLinecap="round" />
          )}
          <text x={cx} y={cy - 5} textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: '#0f172a', fontFamily: 'inherit' }}>{pct}%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'inherit' }}>complete</text>
        </svg>
      </div>
      <div className="w-full mt-3 space-y-1.5">
        <LegendRow color="#7C3AED" label="Completed" value={done} />
        <LegendRow color="#fb923c" label="In progress" value={inProgress} />
        <LegendRow color="#e2e8f0" label="Not started" value={total - done - inProgress} />
      </div>
    </div>
  )
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        {label}
      </span>
      <span className="font-bold text-slate-700">{value}</span>
    </div>
  )
}

import React from 'react'
