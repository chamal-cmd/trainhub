'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Building2, Users, CheckCircle2, Link2, Loader2,
  Video, Trash2, KeyRound, X, AlertTriangle, Play,
} from 'lucide-react'

type Params = { params: Promise<{ assignmentId: string }> }

// ── Types ──────────────────────────────────────────────────────────────────
interface SubtaskProgress {
  training_date: string | null
  hands_on_date: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  remarks: string
}
interface AccessProgress {
  status: 'pending' | 'completed'
  remarks: string
}

const DEFAULT_SUB: SubtaskProgress = { training_date: null, hands_on_date: null, status: 'not_started', remarks: '' }
const DEFAULT_ACC: AccessProgress  = { status: 'pending', remarks: '' }

const STATUS_OPTS = [
  { value: 'not_started' as const, label: 'Not started', cls: 'text-slate-600 bg-slate-100' },
  { value: 'in_progress' as const, label: 'In progress',  cls: 'text-amber-700 bg-amber-100'  },
  { value: 'completed'   as const, label: 'Completed',    cls: 'text-emerald-700 bg-emerald-100' },
]

// ── Converts any shareable video URL into its embeddable iframe src ────────
function resolveEmbedUrl(url: string): string | null {
  try {
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url).searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('vimeo.com/')) {
      const path = url.split('vimeo.com/')[1]?.split('?')[0] ?? ''
      const [vid, hash] = path.split('/')
      if (!vid) return null
      return hash
        ? `https://player.vimeo.com/video/${vid}?h=${hash}&badge=0&autopause=0&player_id=0`
        : `https://player.vimeo.com/video/${vid}?badge=0&autopause=0&player_id=0`
    }
    if (url.includes('loom.com/share/')) {
      const id = url.split('loom.com/share/')[1]?.split('?')[0]
      return id ? `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true` : null
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fid = url.split('/file/d/')[1]?.split('/')[0]
      return fid ? `https://drive.google.com/file/d/${fid}/preview` : null
    }
    return null
  } catch { return null }
}

type View = { type: 'overview' } | { type: 'task'; id: string } | { type: 'access' }

export default function ClientTrackerPage({ params }: Params) {
  const { assignmentId } = use(params)
  const searchParams = useSearchParams()
  const backHref     = searchParams.get('back') ?? '/client-training'
  const router       = useRouter()
  const supabase     = createClient()

  const [loading,      setLoading]      = useState(true)
  const [clientName,   setClientName]   = useState('')
  const [xeroFile,     setXeroFile]     = useState('')
  const [trainerName,  setTrainerName]  = useState('')
  const [tasks,        setTasks]        = useState<any[]>([])
  const [accessTools,  setAccessTools]  = useState<any[]>([])
  const [view,         setView]         = useState<View>({ type: 'overview' })
  const [expandedVids, setExpandedVids] = useState<Set<string>>(new Set())
  const [subProg,      setSubProg]      = useState<Record<string, SubtaskProgress>>({})
  const [accProg,      setAccProg]      = useState<Record<string, AccessProgress>>({})
  const [showDel,      setShowDel]      = useState(false)
  const [deleting,     setDeleting]     = useState(false)
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

    const [tRes, aRes, spRes, apRes] = await Promise.all([
      supabase.from('client_tasks')
        .select('id, title, order_index, client_subtasks(id, title, video_url, order_index)')
        .eq('client_id', cid).order('order_index'),
      supabase.from('client_access_tools')
        .select('id, tool_name, order_index')
        .eq('client_id', cid).order('order_index'),
      supabase.from('client_subtask_progress')
        .select('subtask_id, training_date, hands_on_date, status, remarks')
        .eq('assignment_id', assignmentId),
      supabase.from('client_access_progress')
        .select('access_tool_id, status, remarks')
        .eq('assignment_id', assignmentId),
    ])

    const sorted = (tRes.data ?? []).map((t: any) => ({
      ...t,
      client_subtasks: [...(t.client_subtasks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index),
    }))
    setTasks(sorted)
    setAccessTools(aRes.data ?? [])

    // Auto-select first task
    if (sorted.length > 0) setView({ type: 'task', id: sorted[0].id })

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

    const am: Record<string, AccessProgress> = {}
    for (const p of (apRes.data ?? []) as any[]) {
      am[p.access_tool_id] = { status: p.status, remarks: p.remarks ?? '' }
    }
    setAccProg(am)

    setLoading(false)
  }

  // ── Subtask progress upsert ───────────────────────────────────────────
  async function upsertSub(id: string, patch: Partial<SubtaskProgress>) {
    const updated = { ...(subProg[id] ?? DEFAULT_SUB), ...patch }
    setSubProg(p => ({ ...p, [id]: updated }))
    await supabase.from('client_subtask_progress').upsert(
      { assignment_id: assignmentId, subtask_id: id, ...updated },
      { onConflict: 'assignment_id,subtask_id' }
    )
  }
  function subRemarksChange(id: string, v: string) {
    setSubProg(p => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_SUB), remarks: v } }))
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => upsertSub(id, { remarks: v }), 800)
  }

  // ── Access progress upsert ────────────────────────────────────────────
  async function upsertAcc(id: string, patch: Partial<AccessProgress>) {
    const updated = { ...(accProg[id] ?? DEFAULT_ACC), ...patch }
    setAccProg(p => ({ ...p, [id]: updated }))
    await supabase.from('client_access_progress').upsert(
      { assignment_id: assignmentId, access_tool_id: id, ...updated },
      { onConflict: 'assignment_id,access_tool_id' }
    )
  }
  function accRemarksChange(id: string, v: string) {
    setAccProg(p => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_ACC), remarks: v } }))
    clearTimeout(timers.current['a' + id])
    timers.current['a' + id] = setTimeout(() => upsertAcc(id, { remarks: v }), 800)
  }

  function toggleVid(id: string) {
    setExpandedVids(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
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

  // ── Computed stats ───────────────────────────────────────────────────
  const allSubs    = tasks.flatMap(t => t.client_subtasks ?? [])
  const totalSubs  = allSubs.length
  const doneSubs   = allSubs.filter(s => subProg[s.id]?.status === 'completed').length
  const totalAcc   = accessTools.length
  const doneAcc    = accessTools.filter(t => accProg[t.id]?.status === 'completed').length
  const overallPct = (totalSubs + totalAcc) > 0
    ? Math.round((doneSubs + doneAcc) / (totalSubs + totalAcc) * 100) : 0

  const selTask     = view.type === 'task' ? (tasks.find(t => t.id === view.id) ?? null) : null
  const selTaskSubs: any[]  = selTask?.client_subtasks ?? []
  const selTaskDone = selTaskSubs.filter(s => subProg[s.id]?.status === 'completed').length
  const selTaskPct  = selTaskSubs.length > 0 ? Math.round(selTaskDone / selTaskSubs.length * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full" />
        <p className="text-slate-400 text-sm">Loading tracker…</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#f8f8f8]">

        {/* ─── Left Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 bg-white border-r border-slate-100 flex flex-col">

          {/* Client info */}
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
                {xeroFile && <p className="text-xs text-slate-400 truncate">{xeroFile}</p>}
              </div>
            </div>
            {trainerName && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3 h-3 shrink-0" />
                <span>Trainer: <span className="font-semibold text-slate-700">{trainerName}</span></span>
              </div>
            )}
            {/* Overall progress bar */}
            <div className="mt-3.5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Overall progress</span>
                <span className={cn('font-bold', overallPct === 100 ? 'text-emerald-600' : 'text-violet-700')}>
                  {overallPct}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    overallPct === 100 ? 'bg-emerald-500' : 'bg-violet-600'
                  )}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {doneSubs}/{totalSubs} tasks · {doneAcc}/{totalAcc} access items
              </p>
            </div>
          </div>

          {/* Navigation list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {tasks.length > 0 && (
              <>
                <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Training Tasks
                </p>
                {tasks.map(task => {
                  const subs: any[] = task.client_subtasks ?? []
                  const done    = subs.filter((s: any) => subProg[s.id]?.status === 'completed').length
                  const allDone = subs.length > 0 && done === subs.length
                  const active  = view.type === 'task' && view.id === task.id
                  return (
                    <button
                      key={task.id}
                      onClick={() => setView({ type: 'task', id: task.id })}
                      className={cn(
                        'w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-all border-r-2 group',
                        active
                          ? 'bg-violet-50 border-violet-500'
                          : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                      )}
                    >
                      {allDone
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <div className={cn(
                            'w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                            active ? 'border-violet-500' : 'border-slate-300 group-hover:border-slate-400'
                          )} />
                      }
                      <span className={cn(
                        'text-sm font-medium flex-1 truncate',
                        active ? 'text-violet-700' : allDone ? 'text-slate-400' : 'text-slate-700'
                      )}>
                        {task.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{done}/{subs.length}</span>
                    </button>
                  )
                })}
              </>
            )}

            {accessTools.length > 0 && (
              <>
                <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access</p>
                <button
                  onClick={() => setView({ type: 'access' })}
                  className={cn(
                    'w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-all border-r-2',
                    view.type === 'access'
                      ? 'bg-violet-50 border-violet-500'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  )}
                >
                  <KeyRound className={cn(
                    'w-4 h-4 shrink-0',
                    view.type === 'access' ? 'text-violet-500' : 'text-slate-400'
                  )} />
                  <span className={cn(
                    'text-sm font-medium flex-1',
                    view.type === 'access' ? 'text-violet-700' : 'text-slate-700'
                  )}>
                    Access Checklist
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">{doneAcc}/{totalAcc}</span>
                </button>
              </>
            )}
          </nav>

          {/* Remove assignment */}
          <div className="p-4 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setShowDel(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2.5 px-3 rounded-xl border border-transparent hover:border-red-100 transition-all font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Assignment
            </button>
          </div>
        </aside>

        {/* ─── Right Content ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Task view ── */}
          {view.type === 'task' && selTask && (
            <div className="max-w-3xl mx-auto px-6 py-8">

              {/* Task header + progress */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">{selTask.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-slate-500">
                    {selTaskDone}/{selTaskSubs.length} subtasks done
                  </span>
                  <div className="flex-1 max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all',
                        selTaskPct === 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                      style={{ width: `${selTaskPct}%` }}
                    />
                  </div>
                  <span className={cn('text-sm font-bold',
                    selTaskPct === 100 ? 'text-emerald-600' : 'text-violet-700')}>
                    {selTaskPct}%
                  </span>
                </div>
              </div>

              {selTaskSubs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex items-center justify-center py-12">
                  <p className="text-sm text-slate-400">No subtasks in this task yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selTaskSubs.map((sub: any) => {
                    const prog   = subProg[sub.id] ?? DEFAULT_SUB
                    const sOpt   = STATUS_OPTS.find(o => o.value === prog.status) ?? STATUS_OPTS[0]
                    const embed  = sub.video_url ? resolveEmbedUrl(sub.video_url) : null
                    const vidExp = expandedVids.has(sub.id)

                    return (
                      <div
                        key={sub.id}
                        className={cn(
                          'bg-white rounded-2xl border shadow-sm p-5 transition-all',
                          prog.status === 'completed'
                            ? 'border-emerald-100 bg-emerald-50/20'
                            : 'border-slate-200'
                        )}
                      >
                        {/* Title row */}
                        <div className="flex items-start gap-3 mb-4">
                          <button
                            onClick={() => upsertSub(sub.id, {
                              status: prog.status === 'completed' ? 'not_started' : 'completed',
                            })}
                            className={cn(
                              'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                              prog.status === 'completed'
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-300 hover:border-violet-400'
                            )}
                          >
                            {prog.status === 'completed' && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5"
                                  strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-base font-semibold leading-snug',
                              prog.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
                            )}>
                              {sub.title}
                            </p>
                            {sub.video_url && (
                              <button
                                onClick={() => toggleVid(sub.id)}
                                className={cn(
                                  'mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all',
                                  vidExp
                                    ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                                    : 'text-violet-600 bg-violet-50 hover:bg-violet-100'
                                )}
                              >
                                {vidExp
                                  ? <><X className="w-3 h-3" /> Hide video</>
                                  : <><Play className="w-3 h-3" /> Watch video</>
                                }
                              </button>
                            )}
                          </div>

                          <span className={cn(
                            'text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 mt-0.5',
                            sOpt.cls
                          )}>
                            {sOpt.label}
                          </span>
                        </div>

                        {/* ── Video embed ── */}
                        {sub.video_url && vidExp && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                            {embed ? (
                              <>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                                  <Video className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-xs font-medium text-slate-600 flex-1">Video</span>
                                  <button
                                    onClick={() => toggleVid(sub.id)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="aspect-video">
                                  <iframe
                                    src={embed}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                  />
                                </div>
                              </>
                            ) : (
                              /* URL that can't be embedded — show open-link fallback */
                              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                                <Video className="w-4 h-4 text-purple-500 shrink-0" />
                                <span className="text-sm text-slate-600 flex-1 truncate min-w-0">
                                  {sub.video_url}
                                </span>
                                <a
                                  href={sub.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                                >
                                  <Link2 className="w-3 h-3" /> Open link
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Progress tracking fields ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                              Training Date
                            </label>
                            <input
                              type="date"
                              value={prog.training_date ?? ''}
                              onChange={e => upsertSub(sub.id, { training_date: e.target.value || null })}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                              Hands-on Date
                            </label>
                            <input
                              type="date"
                              value={prog.hands_on_date ?? ''}
                              onChange={e => upsertSub(sub.id, { hands_on_date: e.target.value || null })}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                              Status
                            </label>
                            <select
                              value={prog.status}
                              onChange={e => upsertSub(sub.id, { status: e.target.value as SubtaskProgress['status'] })}
                              className={cn(
                                'w-full text-xs font-semibold border-0 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer',
                                sOpt.cls
                              )}
                            >
                              {STATUS_OPTS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                              Remarks
                            </label>
                            <input
                              type="text"
                              placeholder="Add note…"
                              value={prog.remarks}
                              onChange={e => subRemarksChange(sub.id, e.target.value)}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Access checklist view ── */}
          {view.type === 'access' && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Access Checklist</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {doneAcc} of {totalAcc} access items set up for {clientName}
                </p>
              </div>
              <div className="space-y-3">
                {accessTools.map(tool => {
                  const prog = accProg[tool.id] ?? DEFAULT_ACC
                  const done = prog.status === 'completed'
                  return (
                    <div
                      key={tool.id}
                      className={cn(
                        'bg-white rounded-2xl border shadow-sm p-5 transition-all',
                        done ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => upsertAcc(tool.id, { status: done ? 'pending' : 'completed' })}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                            done
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-300 hover:border-violet-400'
                          )}
                        >
                          {done && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span className={cn(
                          'text-base font-semibold flex-1',
                          done ? 'text-slate-400 line-through' : 'text-slate-900'
                        )}>
                          {tool.tool_name}
                        </span>
                        <span className={cn(
                          'text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0',
                          done ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                        )}>
                          {done ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                          Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="Add note…"
                          value={prog.remarks}
                          onChange={e => accRemarksChange(tool.id, e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Overview (fallback when nothing yet selected) ── */}
          {view.type === 'overview' && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 font-medium">Tasks completed</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {doneSubs}<span className="text-sm text-slate-400 font-normal">/{totalSubs}</span>
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full transition-all"
                      style={{ width: totalSubs > 0 ? `${Math.round(doneSubs / totalSubs * 100)}%` : '0%' }} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 font-medium">Access setup</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {doneAcc}<span className="text-sm text-slate-400 font-normal">/{totalAcc}</span>
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: totalAcc > 0 ? `${Math.round(doneAcc / totalAcc * 100)}%` : '0%' }} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-400 font-medium">Overall</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{overallPct}%</p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all',
                      overallPct === 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                      style={{ width: `${overallPct}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-dashed border-slate-200">
                <Building2 className="w-9 h-9 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-500">Select a task from the sidebar</p>
                <p className="text-xs text-slate-400 mt-1">to view and track its subtasks</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      {showDel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Remove Assignment?</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  For <strong>{clientName}</strong>
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              All training progress — dates, status updates, and remarks — will be permanently deleted.
              This cannot be undone.
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
