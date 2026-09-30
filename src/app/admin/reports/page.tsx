// Auth-gated page — must always be dynamic, never cached (progress data changes constantly)
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { getLearnerReports, getAllStepProgress } from '@/lib/reports'
import { cn, getInitials } from '@/lib/utils'
import {
  Users, CheckCircle2, TrendingUp,
  Building2, AlertTriangle,
} from 'lucide-react'
import ReportsDownloads from './ReportsDownloads'

// ── Helpers ───────────────────────────────────────────────────────────────────

type Status = 'completed' | 'on_track' | 'in_progress' | 'not_started'

function StatusBadge({ status }: { status: Status }) {
  const map = {
    completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
    on_track:    { label: 'On Track',    cls: 'bg-violet-100 text-violet-700'   },
    in_progress: { label: 'In Progress', cls: 'bg-amber-100  text-amber-700'   },
    not_started: { label: 'Not Started', cls: 'bg-slate-100  text-slate-500'   },
  }
  const s = map[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', s.cls)}>
      {s.label}
    </span>
  )
}

function ProgressBar({ value, status }: { value: number; status: string }) {
  const color =
    status === 'completed'   ? 'bg-emerald-500' :
    status === 'on_track'    ? 'bg-violet-500'  :
    status === 'in_progress' ? 'bg-amber-400'   :
    'bg-slate-200'
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
    </div>
  )
}

function toStatus(pct: number, started: boolean): Status {
  if (pct === 100) return 'completed'
  if (pct >= 50)   return 'on_track'
  if (started)     return 'in_progress'
  return 'not_started'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: users },
    { data: subjects },
    stepProgress,
    learnerReports,
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, pod').eq('role', 'user').order('full_name'),
    supabase.from('subjects').select('id, title, emoji, order_index, is_client_training, topics(id, title, steps(id))').order('order_index'),
    // Paginated — an unfiltered Supabase query silently caps at ~1000 rows,
    // which was quietly dropping the team's most recent step completions.
    getAllStepProgress(),
    // Same computation the "Download PDF" button re-fetches fresh at click
    // time — kept in one place (src/lib/reports.ts) so the two can never disagree.
    getLearnerReports(),
  ])

  // ── Categorise modules (for the module/client breakdown sections below) ────
  const stepIdsOf = (s: any): string[] =>
    (s.topics ?? []).flatMap((t: any) => (t.steps ?? []).map((st: any) => st.id))

  const pathModules = (subjects ?? []).filter(
    (s: any) => !s.is_client_training && s.order_index < 1000 && s.title !== 'General SOPs'
  )
  const clientModules = (subjects ?? []).filter((s: any) => s.is_client_training)

  // Step completions per user
  const doneByUser = new Map<string, Map<string, string>>()
  for (const p of stepProgress ?? []) {
    if (!doneByUser.has(p.user_id)) doneByUser.set(p.user_id, new Map())
    doneByUser.get(p.user_id)!.set(p.step_id, p.completed_at)
  }

  // ── Module breakdown across the team ───────────────────────────────────────
  const moduleStats = pathModules.map((s: any) => {
    const ids = stepIdsOf(s)
    let completedCount = 0, inProgressCount = 0
    for (const user of users ?? []) {
      const done = doneByUser.get((user as any).id) ?? new Map()
      const d = ids.filter(id => done.has(id)).length
      if (ids.length > 0 && d === ids.length) completedCount++
      else if (d > 0) inProgressCount++
    }
    const total = (users ?? []).length
    return {
      id: s.id, title: s.title, emoji: s.emoji ?? '📚',
      completedCount, inProgressCount,
      notStarted: total - completedCount - inProgressCount,
      completionRate: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    }
  }).filter((m: any) => m.completedCount + m.inProgressCount + m.notStarted > 0)

  // ── Client training breakdown ──────────────────────────────────────────────
  const clientStats = clientModules.map((s: any) => {
    const ids = stepIdsOf(s)
    const rows = (users ?? []).map((user: any) => {
      const done = doneByUser.get(user.id) ?? new Map()
      const d = ids.filter(id => done.has(id)).length
      return { name: user.full_name ?? user.email, done: d, total: ids.length, pct: ids.length > 0 ? Math.round((d / ids.length) * 100) : 0 }
    }).filter(r => r.done > 0)
    const avgPct = rows.length > 0 ? Math.round(rows.reduce((x, r) => x + r.pct, 0) / rows.length) : 0
    return { id: s.id, title: s.title, emoji: s.emoji ?? '🏢', totalSteps: ids.length, trainees: rows, avgPct }
  }).filter((c: any) => c.trainees.length > 0)

  // ── Summary numbers ────────────────────────────────────────────────────────
  const totalUsers    = learnerReports.length
  const fullyTrained  = learnerReports.filter(l => l.overallPct === 100 && l.stepsTotal > 0).length
  const notStarted    = learnerReports.filter(l => l.stepsDone === 0).length
  const avgCompletion = totalUsers > 0
    ? Math.round(learnerReports.reduce((s, l) => s + l.overallPct, 0) / totalUsers)
    : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-8 py-8 max-w-6xl mx-auto min-h-full" style={{ backgroundColor: '#f8f8f8' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Training Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Learner progress across the learning path, client training and quizzes — with downloadable PDF reports.
        </p>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Team Members',  value: totalUsers,          sub: `${totalUsers - notStarted} have started training`, icon: Users,        color: 'text-violet-600 bg-violet-50' },
          { label: 'Avg Completion', value: `${avgCompletion}%`, sub: 'of all learning-path steps',                        icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Fully Trained', value: fullyTrained,        sub: `of ${totalUsers} team members`,                     icon: CheckCircle2, color: 'text-sky-600 bg-sky-50' },
          { label: 'Not Started',   value: notStarted,          sub: 'no steps completed yet',                            icon: AlertTriangle, color: notStarted > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</p>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Downloadable PDF reports ────────────────────────────────────── */}
      <ReportsDownloads learners={learnerReports} />

      {/* ── Staff Progress ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Staff Progress</h2>
            <p className="text-xs text-slate-400 mt-0.5">Learning-path completion per team member</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            {totalUsers} members
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {learnerReports.length === 0 && (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No learners yet.</p>
          )}
          {learnerReports.map(user => {
            const status = toStatus(user.overallPct, user.stepsDone > 0)
            return (
              <div key={user.id} className="px-6 py-4 flex items-center gap-5 hover:bg-slate-50/60 transition-colors">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-sm font-bold text-violet-700">
                  {getInitials(user.name)}
                </div>

                <div className="w-52 shrink-0 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user.modulesDone} / {user.modulesTotal} module{user.modulesTotal !== 1 ? 's' : ''} · {user.stepsDone}/{user.stepsTotal} steps
                    {user.quizAverage != null && <> · {user.quizAverage}% avg quiz score</>}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {user.moduleEmojis.slice(0, 5).map((m, i) => (
                      <span
                        key={i}
                        title={m.title}
                        className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md',
                          m.pct === 100 ? 'bg-emerald-50 text-emerald-700'
                          : m.done > 0  ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-400'
                        )}
                      >
                        <span>{m.emoji}</span>
                        <span className="max-w-[80px] truncate">{m.title}</span>
                      </span>
                    ))}
                    {user.moduleEmojis.length > 5 && (
                      <span className="text-[11px] text-slate-400">+{user.moduleEmojis.length - 5} more</span>
                    )}
                  </div>
                  <ProgressBar value={user.overallPct} status={status} />
                </div>

                <div className="w-12 text-right shrink-0">
                  <span className={cn(
                    'text-sm font-bold',
                    user.overallPct === 100 ? 'text-emerald-600' :
                    user.overallPct >= 50   ? 'text-violet-600'  :
                    user.overallPct > 0     ? 'text-amber-600'   :
                    'text-slate-300'
                  )}>
                    {user.overallPct}%
                  </span>
                </div>

                <div className="w-28 shrink-0 flex justify-end">
                  <StatusBadge status={status} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Learning Path Modules ────────────────────────────────────────── */}
      {moduleStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Learning Path Modules</h2>
            <p className="text-xs text-slate-400 mt-0.5">How many team members have fully completed each module</p>
          </div>

          <div className="divide-y divide-slate-100">
            {moduleStats.map((s: any) => (
              <div key={s.id} className="px-6 py-4 flex items-center gap-5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-lg">
                  {s.emoji}
                </div>

                <div className="w-48 shrink-0 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      {s.completedCount} done
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      {s.inProgressCount} in progress
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />
                      {s.notStarted} not started
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    {totalUsers > 0 && (
                      <>
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(s.completedCount / totalUsers) * 100}%` }} />
                        <div className="h-full bg-amber-400 transition-all"   style={{ width: `${(s.inProgressCount / totalUsers) * 100}%` }} />
                      </>
                    )}
                  </div>
                </div>

                <div className="w-14 text-right shrink-0">
                  <span className={cn(
                    'text-sm font-bold',
                    s.completionRate === 100 ? 'text-emerald-600' :
                    s.completionRate >= 50   ? 'text-violet-600'  :
                    s.completionRate > 0     ? 'text-amber-600'   :
                    'text-slate-300'
                  )}>
                    {s.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Client Training ─────────────────────────────────────────────── */}
      {clientStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Client Training</h2>
              <p className="text-xs text-slate-400 mt-0.5">Progress per client module — showing team members who have started</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              {clientStats.length} module{clientStats.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {clientStats.map((client: any) => (
              <div key={client.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{client.title}</p>
                  <span className="text-xs text-slate-400">
                    {client.trainees.length} learner{client.trainees.length !== 1 ? 's' : ''} started · {client.totalSteps} steps
                  </span>
                  <div className="ml-auto">
                    <span className={cn(
                      'text-xs font-bold',
                      client.avgPct === 100 ? 'text-emerald-600' :
                      client.avgPct >= 50   ? 'text-violet-600'  :
                      client.avgPct > 0     ? 'text-amber-600'   :
                      'text-slate-300'
                    )}>
                      {client.avgPct}% avg
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pl-10">
                  {client.trainees.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 shrink-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{t.name}</p>
                      </div>
                      <div className="flex-1">
                        <ProgressBar value={t.pct} status={toStatus(t.pct, t.done > 0)} />
                      </div>
                      <div className="w-16 text-right shrink-0">
                        <span className="text-xs text-slate-400">{t.done}/{t.total}</span>
                      </div>
                      <div className="w-10 text-right shrink-0">
                        <span className={cn(
                          'text-xs font-bold',
                          t.pct === 100 ? 'text-emerald-600' :
                          t.pct >= 50   ? 'text-violet-600'  :
                          t.pct > 0     ? 'text-amber-600'   :
                          'text-slate-300'
                        )}>
                          {t.pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
