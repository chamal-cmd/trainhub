export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Clock, BookOpen, Circle } from 'lucide-react'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [assignmentsRes, progressRes] = await Promise.all([
    supabase
      .from('assignments')
      .select('id, due_date, subjects(id, title, description, emoji, cover_color, topics(id, steps(id)))')
      .eq('user_id', user.id),
    supabase
      .from('step_progress')
      .select('step_id')
      .eq('user_id', user.id),
  ])

  const assignments  = assignmentsRes.data ?? []
  const completedIds = new Set((progressRes.data ?? []).map(p => p.step_id))

  const modules = assignments.map(a => {
    const subject  = a.subjects as any
    const allSteps: string[] = subject?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
    const completed = allSteps.filter(id => completedIds.has(id)).length
    const total     = allSteps.length
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0
    const readMins  = Math.max(2, total * 3)
    const dueDate   = a.due_date ? new Date(a.due_date) : null
    const status    = percent === 100 ? 'done' : percent > 0 ? 'in-progress' : 'not-started'
    return { subject, dueDate, readMins, percent, completed, total, status }
  }).sort((a, b) => {
    // in-progress first, then not-started, then done
    const order: Record<string, number> = { 'in-progress': 0, 'not-started': 1, 'done': 2 }
    return order[a.status] - order[b.status]
  })

  const inProgress  = modules.filter(m => m.status === 'in-progress')
  const notStarted  = modules.filter(m => m.status === 'not-started')
  const completed   = modules.filter(m => m.status === 'done')

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Library</h1>
        <span className="text-sm text-slate-400">{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
      </div>

      {modules.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <BookOpen className="w-9 h-9 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No modules assigned yet</p>
          <p className="text-xs text-slate-400 mt-1">Your administrator will assign modules to you soon.</p>
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <Section title="Continue Learning" count={inProgress.length}>
          {inProgress.map(m => <ModuleCard key={m.subject.id} m={m} />)}
        </Section>
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <Section title="Not Started" count={notStarted.length}>
          {notStarted.map(m => <ModuleCard key={m.subject.id} m={m} />)}
        </Section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Section title="Completed" count={completed.length}>
          {completed.map(m => <ModuleCard key={m.subject.id} m={m} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-slate-400 font-medium bg-slate-100 rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  )
}

function ModuleCard({ m }: { m: any }) {
  const { subject, readMins, percent, completed, total, status } = m

  return (
    <Link href={`/training/${subject.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group overflow-hidden h-full flex flex-col">
        {/* Colour bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: subject.cover_color ?? '#6366f1' }} />

        <div className="p-4 flex flex-col flex-1">
          {/* Icon + title */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: (subject.cover_color ?? '#6366f1') + '20' }}
            >
              {subject.emoji ?? '📖'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 group-hover:text-violet-800 transition-colors leading-snug line-clamp-2">
                {subject.title}
              </p>
              {subject.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{subject.description}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-auto">
            {total > 0 && (
              <>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] text-slate-400">{completed}/{total} steps</span>
                  <span className="text-[11px] font-bold" style={{ color: status === 'done' ? '#10b981' : status === 'in-progress' ? '#f97316' : '#94a3b8' }}>
                    {percent}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: status === 'done' ? '#10b981' : status === 'in-progress' ? '#f97316' : '#e2e8f0'
                    }}
                  />
                </div>
              </>
            )}

            {/* Meta row */}
            <div className="flex items-center justify-between mt-2.5">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" /> {readMins} min read
              </span>
              {status === 'done'
                ? <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Done</span>
                : status === 'in-progress'
                ? <span className="text-[11px] font-semibold text-orange-500">In progress</span>
                : <span className="flex items-center gap-1 text-[11px] text-slate-400"><Circle className="w-3 h-3" /> Start</span>
              }
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
