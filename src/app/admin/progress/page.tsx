export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Users, TrendingUp, CheckCircle2, Clock, Award, ChevronRight } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function sbFetch(path: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
    cache: 'no-store',
  })
  if (!r.ok) return []
  return r.json()
}

function pct(done: number, total: number) {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

function statusOf(done: number, total: number, started: boolean) {
  if (!total) return 'no-content'
  if (done >= total) return 'complete'
  if (started) return 'in-progress'
  return 'not-started'
}

export default async function ProgressPage() {
  const [profiles, assignments, subjects, topics, steps, rawProgress, attempts] = await Promise.all([
    sbFetch('profiles?role=neq.admin&select=id,full_name,email,created_at&order=full_name.asc'),
    sbFetch('assignments?select=user_id,subject_id'),
    sbFetch('subjects?select=id,title,emoji,cover_color'),
    sbFetch('topics?select=id,subject_id'),
    sbFetch('steps?select=id,topic_id'),
    sbFetch('step_progress?select=user_id,step_id,completed_at'),
    sbFetch('quiz_attempts?select=user_id,passed,score,completed_at'),
  ])

  // Build lookup maps
  const subjectMap: Record<string, any> = Object.fromEntries(subjects.map((s: any) => [s.id, s]))
  const topicToSubject: Record<string, string> = {}
  for (const t of topics) topicToSubject[t.id] = t.subject_id

  // subjectId → Set<stepId>
  const subjectSteps: Record<string, Set<string>> = {}
  for (const s of steps) {
    const sid = topicToSubject[s.topic_id]
    if (!sid) continue
    if (!subjectSteps[sid]) subjectSteps[sid] = new Set()
    subjectSteps[sid].add(s.id)
  }

  // userId → Set<stepId completed> + last active date
  const userCompletedSteps: Record<string, Set<string>> = {}
  const userLastActive: Record<string, string> = {}
  for (const p of rawProgress) {
    if (!userCompletedSteps[p.user_id]) userCompletedSteps[p.user_id] = new Set()
    userCompletedSteps[p.user_id].add(p.step_id)
    if (!userLastActive[p.user_id] || p.completed_at > userLastActive[p.user_id]) {
      userLastActive[p.user_id] = p.completed_at
    }
  }

  // userId → { passed, total } quiz counts
  const userQuizzes: Record<string, { passed: number; total: number }> = {}
  for (const a of attempts) {
    if (!userQuizzes[a.user_id]) userQuizzes[a.user_id] = { passed: 0, total: 0 }
    userQuizzes[a.user_id].total++
    if (a.passed) userQuizzes[a.user_id].passed++
  }

  // userId → subjectId[]
  const userSubjects: Record<string, string[]> = {}
  for (const a of assignments) {
    if (!userSubjects[a.user_id]) userSubjects[a.user_id] = []
    userSubjects[a.user_id].push(a.subject_id)
  }

  // Build per-user stats
  const learners = (profiles as any[]).map(p => {
    const sids = userSubjects[p.id] ?? []
    const completedSteps = userCompletedSteps[p.id] ?? new Set()

    let totalSteps = 0
    let doneSteps  = 0
    const moduleStats = sids.map(sid => {
      const all  = subjectSteps[sid] ?? new Set()
      const done = [...all].filter(id => completedSteps.has(id)).length
      totalSteps += all.size
      doneSteps  += done
      return {
        subjectId: sid,
        subject:   subjectMap[sid],
        total:     all.size,
        done,
      }
    })

    const started = doneSteps > 0
    return {
      profile:    p,
      sids,
      moduleStats,
      totalSteps,
      doneSteps,
      pct:        pct(doneSteps, totalSteps),
      status:     statusOf(doneSteps, totalSteps, started),
      lastActive: userLastActive[p.id] ?? null,
      quizzes:    userQuizzes[p.id] ?? { passed: 0, total: 0 },
    }
  })

  // Summary cards
  const total       = learners.length
  const notStarted  = learners.filter(l => l.status === 'not-started').length
  const inProgress  = learners.filter(l => l.status === 'in-progress').length
  const complete    = learners.filter(l => l.status === 'complete').length
  const avgPct      = total ? Math.round(learners.reduce((s, l) => s + l.pct, 0) / total) : 0

  const statusConfig = {
    'complete':    { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
    'in-progress': { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
    'not-started': { label: 'Not Started', cls: 'bg-slate-100 text-slate-500' },
    'no-content':  { label: 'No Modules',  cls: 'bg-slate-100 text-slate-400' },
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learner Progress</h1>
        <p className="text-slate-400 text-sm mt-1">Track how your team is progressing through their training.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Learners',  value: total,       icon: Users,        color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Avg Completion',  value: `${avgPct}%`, icon: TrendingUp,  color: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-100' },
          { label: 'Completed All',   value: complete,    icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'In Progress',     value: inProgress,  icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Learner table */}
      {learners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No learners yet</p>
          <p className="text-slate-300 text-sm mt-1">Invite team members to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {learners.map(l => {
            const sc = statusConfig[l.status as keyof typeof statusConfig]
            const initials = l.profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

            return (
              <div key={l.profile.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* User row */}
                <div className="flex items-center gap-4 px-5 py-4">

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {initials}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{l.profile.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{l.profile.email}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${sc.cls}`}>
                    {sc.label}
                  </span>

                  {/* Overall progress bar */}
                  <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-36">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${l.pct}%`,
                            backgroundColor: l.pct === 100 ? '#10b981' : l.pct > 0 ? '#7c3aed' : '#e2e8f0'
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 tabular-nums w-8 text-right">{l.pct}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{l.doneSteps}/{l.totalSteps} steps</p>
                  </div>

                  {/* Quiz results */}
                  {l.quizzes.total > 0 && (
                    <div className="hidden lg:flex items-center gap-1 shrink-0">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-slate-600 tabular-nums">
                        {l.quizzes.passed}/{l.quizzes.total}
                      </span>
                    </div>
                  )}

                  {/* Last active */}
                  <p className="hidden lg:block text-xs text-slate-400 shrink-0 w-24 text-right">
                    {l.lastActive ? formatRelativeDate(l.lastActive) : 'Never'}
                  </p>

                  {/* Detail link */}
                  <Link href={`/admin/progress/${l.profile.id}`} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>

                {/* Module breakdown */}
                {l.moduleStats.length > 0 && (
                  <div className="border-t border-slate-50 px-5 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {l.moduleStats.map(m => {
                      if (!m.subject) return null
                      const p = pct(m.done, m.total)
                      return (
                        <div key={m.subjectId} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
                          <span className="text-base shrink-0">{m.subject.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{m.subject.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${p}%`,
                                    backgroundColor: p === 100 ? '#10b981' : p > 0 ? '#7c3aed' : '#e2e8f0'
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500 tabular-nums shrink-0">{m.done}/{m.total}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {l.sids.length === 0 && (
                  <div className="border-t border-slate-50 px-5 py-3">
                    <p className="text-xs text-slate-400">No modules assigned yet. <Link href="/admin/assignments" className="text-violet-600 hover:underline">Assign one →</Link></p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
