'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, CheckCircle2, Loader2, ChevronRight } from 'lucide-react'

export default function ClientTrainingPage() {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<any[]>([])
  const [progress,    setProgress]    = useState<Record<string, { completed: number; total: number }>>({})
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch assignments with full task/subtask tree for progress counts
    const { data: asgns } = await supabase
      .from('client_training_assignments')
      .select(`
        id,
        notes,
        clients (
          id,
          name,
          xero_file,
          description,
          client_tasks (
            id,
            title,
            order_index,
            client_subtasks ( id )
          )
        ),
        trainer:trainer_id ( full_name )
      `)
      .eq('trainee_id', user.id)
      .order('created_at', { ascending: true })

    if (!asgns || asgns.length === 0) {
      setLoading(false)
      return
    }

    // Fetch completed subtask progress for all assignments
    const ids = asgns.map((a: any) => a.id)
    const { data: progRows } = await supabase
      .from('client_subtask_progress')
      .select('assignment_id, status')
      .in('assignment_id', ids)

    // Build progress map: assignmentId → { completed, total }
    const progMap: Record<string, { completed: number; total: number }> = {}
    for (const asgn of asgns) {
      const client = asgn.clients as any
      const total = (client?.client_tasks ?? []).reduce(
        (sum: number, t: any) => sum + (t.client_subtasks?.length ?? 0), 0
      )
      const completed = (progRows ?? []).filter(
        (r: any) => r.assignment_id === asgn.id && r.status === 'completed'
      ).length
      progMap[asgn.id] = { completed, total }
    }

    setAssignments(asgns)
    setProgress(progMap)
    setLoading(false)
  }

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Client Training</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your assigned client training modules — track your progress for each client.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && assignments.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <Building2 className="w-9 h-9 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No client assignments yet</p>
          <p className="text-xs text-slate-400 mt-1">Your administrator will assign you to a client when you're ready.</p>
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((asgn: any) => {
            const client  = asgn.clients as any
            const trainer = asgn.trainer as any
            const prog    = progress[asgn.id] ?? { completed: 0, total: 0 }
            const pct     = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
            const isDone  = pct === 100 && prog.total > 0
            const taskCount = (client?.client_tasks ?? []).length

            return (
              <Link key={asgn.id} href={`/client-training/${asgn.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md transition-all p-5 group cursor-pointer h-full flex flex-col">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-violet-500" />
                    </div>
                    {isDone ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </span>
                    ) : pct > 0 ? (
                      <span className="text-[11px] font-bold text-violet-600 bg-violet-50 rounded-lg px-2 py-1 shrink-0">
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-50 rounded-lg px-2 py-1 shrink-0">
                        Not started
                      </span>
                    )}
                  </div>

                  {/* Client name */}
                  <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-slate-900">
                    {client?.name ?? 'Unknown Client'}
                  </h3>

                  {/* Xero file */}
                  {client?.xero_file && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Xero: {client.xero_file}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 mb-3 flex-1">
                    <span className="text-xs text-slate-400">
                      {taskCount} task{taskCount !== 1 ? 's' : ''} · {prog.total} step{prog.total !== 1 ? 's' : ''}
                    </span>
                    {trainer?.full_name && (
                      <span className="text-xs text-slate-400">
                        · Trainer: {trainer.full_name}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {prog.total > 0 && (
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isDone ? '#10b981' : '#6366f1',
                        }}
                      />
                    </div>
                  )}

                  {/* CTA row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {prog.completed} / {prog.total} completed
                    </span>
                    <span className="text-xs font-semibold text-violet-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      Open tracker <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
