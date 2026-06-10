'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, ChevronRight, Loader2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignmentCard {
  id: string
  client: { name: string; xero_file: string | null }
  trainer: { full_name: string } | null
  subtask_total: number
  subtask_done:  number
  created_at: string
}

export default function ClientTrainingPage() {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<AssignmentCard[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch assignments with related data
    const { data } = await supabase
      .from('client_training_assignments')
      .select(`
        id, created_at,
        client:clients(name, xero_file, client_tasks(client_subtasks(id))),
        trainer:profiles!client_training_assignments_trainer_id_fkey(full_name),
        client_subtask_progress(status)
      `)
      .eq('trainee_id', user.id)
      .order('created_at', { ascending: false })

    setAssignments((data ?? []).map((a: any) => {
      const allSubtasks: any[] = (a.client?.client_tasks ?? [])
        .flatMap((t: any) => t.client_subtasks ?? [])
      const progressRows: any[] = a.client_subtask_progress ?? []
      const done = progressRows.filter((p: any) => p.status === 'completed').length

      return {
        id:            a.id,
        client:        { name: a.client?.name ?? '?', xero_file: a.client?.xero_file ?? null },
        trainer:       a.trainer,
        subtask_total: allSubtasks.length,
        subtask_done:  done,
        created_at:    a.created_at,
      }
    }))
    setLoading(false)
  }

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Client Training</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your client-specific training assignments.
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
          <p className="text-xs text-slate-400 mt-1">Your administrator will assign you to a client when ready.</p>
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map(a => {
            const pct = a.subtask_total > 0 ? Math.round((a.subtask_done / a.subtask_total) * 100) : 0
            return (
              <Link key={a.id} href={`/client-training/${a.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-violet-200 hover:shadow-md transition-all p-5 flex items-center gap-5 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-violet-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{a.client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {a.client.xero_file && (
                        <span className="text-xs text-slate-400">Xero: {a.client.xero_file}</span>
                      )}
                      {a.trainer && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="w-3 h-3" /> Trainer: {a.trainer.full_name}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {a.subtask_total > 0 && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                          <div
                            className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={cn('text-xs font-semibold', pct === 100 ? 'text-emerald-600' : 'text-violet-700')}>
                          {pct}%
                        </span>
                        <span className="text-xs text-slate-400">{a.subtask_done}/{a.subtask_total} tasks</span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
