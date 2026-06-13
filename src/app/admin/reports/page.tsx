// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { cn, getInitials } from '@/lib/utils'
import {
  Users, BookOpen, CheckCircle2, TrendingUp,
  Building2, ChevronRight, AlertTriangle,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'completed' | 'on_track' | 'in_progress' | 'not_started' }) {
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: users },
    { data: assignments },
    { data: stepProgress },
    { data: clients },
    { data: clientAssignments },
    { data: subtaskProgress },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('role', 'user').order('full_name'),
    supabase.from('assignments').select(`
      user_id, subject_id,
      subjects(id, title, emoji, topics(steps(id)))
    `),
    supabase.from('step_progress').select('user_id, step_id'),
    supabase.from('clients')
      .select('id, name, client_tasks(id, client_subtasks(id, video_url))')
      .order('name'),
    supabase.from('client_training_assignments').select(`
      id, trainee_id, client_id,
      trainee:profiles!client_training_assignments_trainee_id_fkey(full_name)
    `),
    supabase.from('client_subtask_progress').select('assignment_id, status'),
  ])

  // ── KB: per-user stats ────────────────────────────────────────────────────

  const userStats = (users ?? []).map(user => {
    const userAssignments = (assignments ?? []).filter(a => a.user_id === user.id)
    const doneStepIds = new Set((stepProgress ?? []).filter(p => p.user_id === user.id).map(p => p.step_id))

    const moduleProgress = userAssignments.map(a => {
      const allSteps: string[] = (a.subjects as any)?.topics
        ?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
      const completed  = allSteps.filter(id => doneStepIds.has(id)).length
      const isComplete = allSteps.length > 0 && completed === allSteps.length
      return {
        subjectId: (a.subjects as any)?.id as string,
        title:     (a.subjects as any)?.title  ?? '' as string,
        emoji:     (a.subjects as any)?.emoji  ?? '📚' as string,
        total:     allSteps.length,
        completed,
        isComplete,
        stepPercent: allSteps.length > 0 ? Math.round((completed / allSteps.length) * 100) : 0,
      }
    })

    const totalAssigned    = moduleProgress.length
    const completedModules = moduleProgress.filter(m => m.isComplete).length
    // Completion rate = completed modules / total assigned modules × 100
    const overallPercent   = totalAssigned > 0 ? Math.round((completedModules / totalAssigned) * 100) : 0

    let status: 'completed' | 'on_track' | 'in_progress' | 'not_started'
    if (totalAssigned === 0) status = 'not_started'
    else if (overallPercent === 100) status = 'completed'
    else if (overallPercent >= 50)   status = 'on_track'
    else if (moduleProgress.some(m => m.completed > 0)) status = 'in_progress'
    else status = 'not_started'

    return { ...user, moduleProgress, totalAssigned, completedModules, overallPercent, status }
  })

  // ── KB: module breakdown ──────────────────────────────────────────────────

  const subjectMap = new Map<string, {
    id: string; title: string; emoji: string
    assignedSet: Set<string>; completedCount: number; inProgressCount: number
  }>()

  for (const a of (assignments ?? [])) {
    const s = a.subjects as any
    if (!s?.id) continue
    if (!subjectMap.has(s.id)) {
      subjectMap.set(s.id, { id: s.id, title: s.title, emoji: s.emoji ?? '📚', assignedSet: new Set(), completedCount: 0, inProgressCount: 0 })
    }
    subjectMap.get(s.id)!.assignedSet.add(a.user_id)
  }

  for (const user of userStats) {
    for (const mod of user.moduleProgress) {
      const entry = subjectMap.get(mod.subjectId)
      if (!entry) continue
      if (mod.isComplete) entry.completedCount++
      else if (mod.completed > 0) entry.inProgressCount++
    }
  }

  const subjectStats = [...subjectMap.values()]
    .map(s => ({
      ...s,
      assignedCount:  s.assignedSet.size,
      notStarted:     s.assignedSet.size - s.completedCount - s.inProgressCount,
      completionRate: s.assignedSet.size > 0 ? Math.round((s.completedCount / s.assignedSet.size) * 100) : 0,
    }))
    .sort((a, b) => b.assignedCount - a.assignedCount)

  // ── Client training stats ─────────────────────────────────────────────────

  const clientStats = (clients ?? [])
    .map(client => {
      const videoSubs = (client.client_tasks ?? []).flatMap((t: any) =>
        (t.client_subtasks ?? []).filter((s: any) => s.video_url)
      )
      const totalVideoSubs = videoSubs.length
      const asgnForClient  = (clientAssignments ?? []).filter(a => a.client_id === client.id)

      const trainees = asgnForClient.map(asgn => {
        const prog      = (subtaskProgress ?? []).filter(p => p.assignment_id === asgn.id)
        const completed = prog.filter(p => p.status === 'completed').length
        const percent   = totalVideoSubs > 0 ? Math.round((completed / totalVideoSubs) * 100) : 0
        const status: 'completed' | 'on_track' | 'in_progress' | 'not_started' =
          totalVideoSubs === 0      ? 'not_started' :
          percent === 100           ? 'completed'   :
          percent >= 50             ? 'on_track'    :
          completed > 0             ? 'in_progress' :
          'not_started'
        return { name: (asgn.trainee as any)?.full_name ?? '—', completed, totalVideoSubs, percent, status }
      })

      const avgPercent = trainees.length > 0
        ? Math.round(trainees.reduce((s, t) => s + t.percent, 0) / trainees.length)
        : 0

      return { id: client.id, name: client.name, totalVideoSubs, trainees, avgPercent }
    })
    .filter(c => c.trainees.length > 0)

  // ── Summary numbers ────────────────────────────────────────────────────────

  const totalUsers      = userStats.length
  const fullyTrained    = userStats.filter(u => u.overallPercent === 100 && u.totalAssigned > 0).length
  const notStarted      = userStats.filter(u => u.status === 'not_started' && u.totalAssigned > 0).length
  const avgCompletion   = totalUsers > 0
    ? Math.round(userStats.reduce((s, u) => s + u.overallPercent, 0) / totalUsers)
    : 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto min-h-full" style={{ backgroundColor: '#f8f8f8' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Training Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Completion rates are based on fully finished modules — all steps done counts as one complete module.
        </p>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Team Members',
            value: totalUsers,
            sub: `${totalUsers - notStarted} have started training`,
            icon: Users,
            color: 'text-violet-600 bg-violet-50',
          },
          {
            label: 'Avg Completion',
            value: `${avgCompletion}%`,
            sub: 'across all assigned modules',
            icon: TrendingUp,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'Fully Trained',
            value: fullyTrained,
            sub: `of ${totalUsers} staff members`,
            icon: CheckCircle2,
            color: 'text-sky-600 bg-sky-50',
          },
          {
            label: 'Not Started',
            value: notStarted,
            sub: 'have 0% on assigned modules',
            icon: AlertTriangle,
            color: notStarted > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-50',
          },
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

      {/* ── Staff Progress ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Staff Progress</h2>
            <p className="text-xs text-slate-400 mt-0.5">Knowledge base module completion per team member</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            {totalUsers} members
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {userStats.length === 0 && (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No staff with training assigned yet.</p>
          )}
          {userStats.map(user => (
            <div key={user.id} className="px-6 py-4 flex items-center gap-5 hover:bg-slate-50/60 transition-colors">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-sm font-bold text-violet-700">
                {getInitials(user.full_name)}
              </div>

              {/* Name + modules */}
              <div className="w-52 shrink-0 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user.totalAssigned === 0
                    ? 'No modules assigned'
                    : `${user.completedModules} / ${user.totalAssigned} module${user.totalAssigned !== 1 ? 's' : ''} done`
                  }
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {user.moduleProgress.slice(0, 5).map((m, i) => (
                      <span
                        key={i}
                        title={m.title}
                        className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md',
                          m.isComplete
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.completed > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-400'
                        )}
                      >
                        <span>{m.emoji}</span>
                        <span className="max-w-[80px] truncate">{m.title}</span>
                      </span>
                    ))}
                    {user.moduleProgress.length > 5 && (
                      <span className="text-[11px] text-slate-400">+{user.moduleProgress.length - 5} more</span>
                    )}
                  </div>
                </div>
                <ProgressBar value={user.overallPercent} status={user.status} />
              </div>

              {/* % */}
              <div className="w-12 text-right shrink-0">
                <span className={cn(
                  'text-sm font-bold',
                  user.overallPercent === 100 ? 'text-emerald-600' :
                  user.overallPercent >= 50   ? 'text-violet-600'  :
                  user.overallPercent > 0     ? 'text-amber-600'   :
                  'text-slate-300'
                )}>
                  {user.overallPercent}%
                </span>
              </div>

              {/* Status badge */}
              <div className="w-28 shrink-0 flex justify-end">
                <StatusBadge status={user.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Knowledge Base Modules ──────────────────────────────────────── */}
      {subjectStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Knowledge Base Modules</h2>
            <p className="text-xs text-slate-400 mt-0.5">How many assigned staff have fully completed each module</p>
          </div>

          <div className="divide-y divide-slate-100">
            {subjectStats.map(s => (
              <div key={s.id} className="px-6 py-4 flex items-center gap-5">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-lg">
                  {s.emoji}
                </div>

                {/* Title */}
                <div className="w-48 shrink-0 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.assignedCount} staff assigned</p>
                </div>

                {/* Progress bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
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
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    {s.assignedCount > 0 && (
                      <>
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(s.completedCount / s.assignedCount) * 100}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${(s.inProgressCount / s.assignedCount) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* % */}
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
              <p className="text-xs text-slate-400 mt-0.5">Trainee progress per client</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              {clientStats.length} client{clientStats.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {clientStats.map(client => (
              <div key={client.id} className="px-6 py-4">
                {/* Client header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{client.name}</p>
                  <span className="text-xs text-slate-400">
                    {client.trainees.length} trainee{client.trainees.length !== 1 ? 's' : ''}
                    {client.totalVideoSubs > 0 && ` · ${client.totalVideoSubs} video steps`}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-bold',
                      client.avgPercent === 100 ? 'text-emerald-600' :
                      client.avgPercent >= 50   ? 'text-violet-600'  :
                      client.avgPercent > 0     ? 'text-amber-600'   :
                      'text-slate-300'
                    )}>
                      {client.avgPercent}% avg
                    </span>
                  </div>
                </div>

                {/* Trainee rows */}
                <div className="space-y-2 pl-10">
                  {client.trainees.map((t, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{t.name}</p>
                      </div>
                      <div className="flex-1">
                        <ProgressBar value={t.percent} status={t.status} />
                      </div>
                      <div className="w-10 text-right shrink-0">
                        <span className={cn(
                          'text-xs font-bold',
                          t.percent === 100 ? 'text-emerald-600' :
                          t.percent >= 50   ? 'text-violet-600'  :
                          t.percent > 0     ? 'text-amber-600'   :
                          'text-slate-300'
                        )}>
                          {t.percent}%
                        </span>
                      </div>
                      <div className="w-24 shrink-0 flex justify-end">
                        <StatusBadge status={t.status} />
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
