'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { resolveEmbedUrl } from '@/lib/resolveEmbedUrl'
import {
  ArrowLeft, ArrowRight, Building2, CheckCircle2,
  Menu, X, Video, Trash2, AlertTriangle, Loader2, Check,
} from 'lucide-react'

type Params = { params: Promise<{ assignmentId: string }> }

interface SubtaskProgress {
  training_date: string | null
  hands_on_date: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  remarks: string
}

const DEFAULT_SUB: SubtaskProgress = { training_date: null, hands_on_date: null, status: 'not_started', remarks: '' }

const STATUS_OPTS = [
  { value: 'not_started' as const, label: 'Not started',  cls: 'text-slate-600 bg-slate-100' },
  { value: 'in_progress' as const, label: 'In progress',  cls: 'text-amber-700 bg-amber-100'  },
  { value: 'completed'   as const, label: 'Completed',    cls: 'text-emerald-700 bg-emerald-100' },
]

export default function ClientTrackerPage({ params }: Params) {
  const { assignmentId } = use(params)
  const searchParams = useSearchParams()
  const backHref     = searchParams.get('back') ?? '/client-training'
  const router       = useRouter()
  const supabase     = createClient()

  const [loading,     setLoading]     = useState(true)
  const [clientName,  setClientName]  = useState('')
  const [xeroFile,    setXeroFile]    = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [tasks,       setTasks]       = useState<any[]>([])
  const [subProg,     setSubProg]     = useState<Record<string, SubtaskProgress>>({})
  const [showDel,     setShowDel]     = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => { loadAll() }, [assignmentId])

  async function loadAll() {
    setLoading(true)

    const { data: asgn } = await supabase
      .from('client_training_assignments')
      .select(`
        client_id,
        client:clients(name, xero_file),
        trainer:profiles!client_training_assignments_trainer_id_fkey(full_name)
      `)
      .eq('id', assignmentId).single()

    if (!asgn) { setLoading(false); return }

    const cid = (asgn as any).client_id
    setClientName((asgn as any).client?.name ?? '')
    setXeroFile((asgn as any).client?.xero_file ?? '')
    setTrainerName((asgn as any).trainer?.full_name ?? '')

    const [tRes, spRes] = await Promise.all([
      supabase.from('client_tasks')
        .select('id, title, order_index, client_subtasks(id, title, video_url, order_index)')
        .eq('client_id', cid).order('order_index'),
      supabase.from('client_subtask_progress')
        .select('subtask_id, training_date, hands_on_date, status, remarks')
        .eq('assignment_id', assignmentId),
    ])

    const sorted = (tRes.data ?? []).map((t: any) => ({
      ...t,
      client_subtasks: [...(t.client_subtasks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index),
    }))
    setTasks(sorted)

    const sm: Record<string, SubtaskProgress> = {}
    for (const p of (spRes.data ?? []) as any[]) {
      sm[p.subtask_id] = {
        training_date: p.training_date,
        hands_on_date: p.hands_on_date,
        status:        p.status,
        remarks:       p.remarks ?? '',
      }
    }
    setSubProg(sm)
    setLoading(false)
  }

  async function upsertSub(id: string, patch: Partial<SubtaskProgress>) {
    const updated = { ...(subProg[id] ?? DEFAULT_SUB), ...patch }
    setSubProg(p => ({ ...p, [id]: updated }))
    await supabase.from('client_subtask_progress').upsert(
      { assignment_id: assignmentId, subtask_id: id, ...updated },
      { onConflict: 'assignment_id,subtask_id' }
    )
  }

  function remarksChange(id: string, v: string) {
    setSubProg(p => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_SUB), remarks: v } }))
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => upsertSub(id, { remarks: v }), 800)
  }

  async function deleteAssignment() {
    setDeleting(true)
    await Promise.all([
      supabase.from('client_subtask_progress').delete().eq('assignment_id', assignmentId),
      supabase.from('client_access_progress').delete().eq('assignment_id', assignmentId),
    ])
    await supabase.from('client_training_assignments').delete().eq('id', assignmentId)
    router.push('/client-training')
  }

  // Flatten all video subtasks into a sequential list
  const allVideoSubs: { sub: any; task: any }[] = tasks
    .filter(t => (t.client_subtasks ?? []).some((s: any) => s.video_url))
    .flatMap(t =>
      (t.client_subtasks ?? [])
        .filter((s: any) => s.video_url)
        .map((s: any) => ({ sub: s, task: t }))
    )

  const totalSubs  = allVideoSubs.length
  const doneSubs   = allVideoSubs.filter(e => subProg[e.sub.id]?.status === 'completed').length
  const pct        = totalSubs > 0 ? Math.round(doneSubs / totalSubs * 100) : 0

  const safeIdx  = Math.min(currentIdx, Math.max(0, totalSubs - 1))
  const current  = allVideoSubs[safeIdx] ?? null
  const embedUrl = current?.sub.video_url ? resolveEmbedUrl(current.sub.video_url) : null
  const prog     = current ? (subProg[current.sub.id] ?? DEFAULT_SUB) : DEFAULT_SUB
  const sOpt     = STATUS_OPTS.find(o => o.value === prog.status) ?? STATUS_OPTS[0]

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex h-screen bg-white overflow-hidden">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r border-slate-100 bg-slate-50 shrink-0 transition-all duration-300 overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-slate-100 shrink-0">
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-600 mb-3 group transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to list
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-tight truncate">{clientName}</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Progress</span>
                <span className={cn('font-bold', pct === 100 ? 'text-emerald-600' : 'text-violet-700')}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">{doneSubs} of {totalSubs} completed</p>
            </div>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto py-2">
            {tasks
              .filter(t => (t.client_subtasks ?? []).some((s: any) => s.video_url))
              .map(task => (
                <div key={task.id}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {task.title}
                  </p>
                  {(task.client_subtasks ?? [])
                    .filter((s: any) => s.video_url)
                    .map((sub: any) => {
                      const idx    = allVideoSubs.findIndex(e => e.sub.id === sub.id)
                      const done   = subProg[sub.id]?.status === 'completed'
                      const active = idx === safeIdx
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setCurrentIdx(idx)}
                          className={cn(
                            'w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-all border-r-2 group',
                            active
                              ? 'bg-violet-50 border-violet-500'
                              : 'border-transparent hover:bg-white hover:border-slate-200'
                          )}
                        >
                          {done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            : <div className={cn(
                                'w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                                active ? 'border-violet-500' : 'border-slate-300 group-hover:border-slate-400'
                              )} />
                          }
                          <span className={cn(
                            'text-xs font-medium flex-1 leading-snug text-left',
                            active ? 'text-violet-700' : done ? 'text-slate-400' : 'text-slate-600'
                          )}>
                            {sub.title}
                          </span>
                        </button>
                      )
                    })}
                </div>
              ))
            }
          </div>

          {/* Remove assignment */}
          <div className="p-4 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setShowDel(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2.5 px-3 rounded-xl border border-transparent hover:border-red-100 transition-all font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Assignment
            </button>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 h-14 border-b border-slate-100 bg-white shrink-0">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">
                {clientName}{current ? ` · ${current.task.title}` : ''}
              </p>
            </div>

            {totalSubs > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shrink-0">
                {safeIdx + 1} / {totalSubs}
              </div>
            )}
          </div>

          {/* Content */}
          {current ? (
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="max-w-2xl mx-auto px-8 py-8">

                {/* Step indicator + title */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                      Step {safeIdx + 1}
                    </span>
                    {prog.status === 'completed' && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{current.sub.title}</h1>
                </div>

                {/* Video */}
                {embedUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black mb-6">
                    <div className="aspect-video">
                      <iframe
                        key={embedUrl}
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 mb-6 flex items-center justify-center py-16">
                    <div className="text-center">
                      <Video className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No video available</p>
                    </div>
                  </div>
                )}

                {/* Progress tracking */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4">Track Your Progress</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Training Date</label>
                      <input
                        type="date"
                        value={prog.training_date ?? ''}
                        onChange={e => upsertSub(current.sub.id, { training_date: e.target.value || null })}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Hands-on Date</label>
                      <input
                        type="date"
                        value={prog.hands_on_date ?? ''}
                        onChange={e => upsertSub(current.sub.id, { hands_on_date: e.target.value || null })}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Status</label>
                      <select
                        value={prog.status}
                        onChange={e => upsertSub(current.sub.id, { status: e.target.value as SubtaskProgress['status'] })}
                        className={cn(
                          'w-full text-sm font-semibold border-0 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer',
                          sOpt.cls
                        )}
                      >
                        {STATUS_OPTS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Remarks</label>
                      <input
                        type="text"
                        placeholder="Add a note…"
                        value={prog.remarks}
                        onChange={e => remarksChange(current.sub.id, e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                    disabled={safeIdx === 0}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:text-violet-700 hover:border-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  {prog.status !== 'completed' ? (
                    <button
                      onClick={() => upsertSub(current.sub.id, { status: 'completed' })}
                      className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark done
                    </button>
                  ) : (
                    <button
                      onClick={() => upsertSub(current.sub.id, { status: 'not_started' })}
                      className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentIdx(i => Math.min(totalSubs - 1, i + 1))}
                    disabled={safeIdx === totalSubs - 1}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:text-violet-700 hover:border-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No training videos assigned yet</p>
                <p className="text-xs text-slate-300 mt-1">Check back when your trainer has added content.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Remove Assignment?</p>
                <p className="text-xs text-slate-500 mt-0.5">For <strong>{clientName}</strong></p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              All training progress — dates, status updates, and remarks — will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDel(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAssignment}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing…</>
                  : <><Trash2 className="w-4 h-4" /> Remove</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
