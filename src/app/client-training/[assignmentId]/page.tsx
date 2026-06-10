'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Building2, Users, CheckCircle2,
  Link2, Loader2, ChevronDown, ChevronRight,
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

const DEFAULT_SUB_PROGRESS: SubtaskProgress = {
  training_date: null, hands_on_date: null, status: 'not_started', remarks: '',
}
const DEFAULT_ACCESS_PROGRESS: AccessProgress = { status: 'pending', remarks: '' }

const STATUS_OPTS: { value: SubtaskProgress['status']; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not started', color: 'text-slate-500 bg-slate-100' },
  { value: 'in_progress', label: 'In progress',  color: 'text-amber-700 bg-amber-100'  },
  { value: 'completed',   label: 'Completed',    color: 'text-emerald-700 bg-emerald-100' },
]

export default function ClientTrackerPage({ params }: Params) {
  const { assignmentId } = use(params)
  const searchParams = useSearchParams()
  const backHref = searchParams.get('back') ?? '/client-training'

  const supabase = createClient()
  const [loading, setLoading]     = useState(true)
  const [clientName, setClientName] = useState('')
  const [xeroFile,   setXeroFile]   = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [tasks, setTasks]           = useState<any[]>([])   // [{id, title, subtasks:[...]}]
  const [accessTools, setAccessTools] = useState<any[]>([]) // [{id, tool_name}]
  const [openTasks, setOpenTasks]   = useState<Set<string>>(new Set())

  // Progress maps: keyed by subtask_id / access_tool_id
  const [subProgress,    setSubProgress]    = useState<Record<string, SubtaskProgress>>({})
  const [accessProgress, setAccessProgress] = useState<Record<string, AccessProgress>>({})

  // Debounce timers for remarks
  const remarksTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => { loadAll() }, [assignmentId])

  async function loadAll() {
    setLoading(true)

    const [assignRes, taskRes, toolRes, subProgRes, accProgRes] = await Promise.all([
      supabase.from('client_training_assignments')
        .select(`client_id,
                 client:clients(name, xero_file),
                 trainer:profiles!client_training_assignments_trainer_id_fkey(full_name)`)
        .eq('id', assignmentId).single(),
      supabase.from('client_tasks')
        .select(`id, title, order_index,
                 client_subtasks(id, title, video_url, order_index)`)
        .order('order_index'),
      supabase.from('client_access_tools').select('id, tool_name, order_index').order('order_index'),
      supabase.from('client_subtask_progress')
        .select('subtask_id, training_date, hands_on_date, status, remarks')
        .eq('assignment_id', assignmentId),
      supabase.from('client_access_progress')
        .select('access_tool_id, status, remarks')
        .eq('assignment_id', assignmentId),
    ])

    const assignment = assignRes.data as any
    if (!assignment) { setLoading(false); return }

    const clientId = assignment.client_id
    setClientName(assignment.client?.name ?? '')
    setXeroFile(assignment.client?.xero_file ?? '')
    setTrainerName(assignment.trainer?.full_name ?? '')

    // Filter tasks/tools to this client
    const filteredTasks = (taskRes.data ?? [])
      .filter((t: any) => {
        // We need to join via client — reload with client_id filter
        return true // will re-fetch below
      })

    // Re-fetch tasks for this specific client
    const [clientTaskRes, clientToolRes] = await Promise.all([
      supabase.from('client_tasks')
        .select('id, title, order_index, client_subtasks(id, title, video_url, order_index)')
        .eq('client_id', clientId).order('order_index'),
      supabase.from('client_access_tools')
        .select('id, tool_name, order_index')
        .eq('client_id', clientId).order('order_index'),
    ])

    const sortedTasks = (clientTaskRes.data ?? []).map((t: any) => ({
      ...t,
      client_subtasks: [...(t.client_subtasks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index),
    }))
    setTasks(sortedTasks)
    setAccessTools(clientToolRes.data ?? [])

    // Open all tasks by default
    setOpenTasks(new Set(sortedTasks.map((t: any) => t.id)))

    // Build progress maps
    const subMap: Record<string, SubtaskProgress> = {}
    for (const p of (subProgRes.data ?? []) as any[]) {
      subMap[p.subtask_id] = {
        training_date: p.training_date,
        hands_on_date: p.hands_on_date,
        status:        p.status,
        remarks:       p.remarks ?? '',
      }
    }
    setSubProgress(subMap)

    const accMap: Record<string, AccessProgress> = {}
    for (const p of (accProgRes.data ?? []) as any[]) {
      accMap[p.access_tool_id] = { status: p.status, remarks: p.remarks ?? '' }
    }
    setAccessProgress(accMap)

    setLoading(false)
  }

  // ── Update subtask progress ────────────────────────────────────────────
  async function updateSubtask(subtaskId: string, patch: Partial<SubtaskProgress>) {
    const current = subProgress[subtaskId] ?? DEFAULT_SUB_PROGRESS
    const updated = { ...current, ...patch }
    setSubProgress(prev => ({ ...prev, [subtaskId]: updated }))
    await supabase.from('client_subtask_progress').upsert({
      assignment_id: assignmentId,
      subtask_id:    subtaskId,
      ...updated,
    }, { onConflict: 'assignment_id,subtask_id' })
  }

  function updateSubtaskRemarks(subtaskId: string, value: string) {
    setSubProgress(prev => ({ ...prev, [subtaskId]: { ...(prev[subtaskId] ?? DEFAULT_SUB_PROGRESS), remarks: value } }))
    clearTimeout(remarksTimers.current[subtaskId])
    remarksTimers.current[subtaskId] = setTimeout(() => {
      updateSubtask(subtaskId, { remarks: value })
    }, 800)
  }

  // ── Update access progress ─────────────────────────────────────────────
  async function updateAccess(toolId: string, patch: Partial<AccessProgress>) {
    const current = accessProgress[toolId] ?? DEFAULT_ACCESS_PROGRESS
    const updated = { ...current, ...patch }
    setAccessProgress(prev => ({ ...prev, [toolId]: updated }))
    await supabase.from('client_access_progress').upsert({
      assignment_id:  assignmentId,
      access_tool_id: toolId,
      ...updated,
    }, { onConflict: 'assignment_id,access_tool_id' })
  }

  function updateAccessRemarks(toolId: string, value: string) {
    setAccessProgress(prev => ({ ...prev, [toolId]: { ...(prev[toolId] ?? DEFAULT_ACCESS_PROGRESS), remarks: value } }))
    clearTimeout(remarksTimers.current['acc_' + toolId])
    remarksTimers.current['acc_' + toolId] = setTimeout(() => {
      updateAccess(toolId, { remarks: value })
    }, 800)
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  const allSubtasks = tasks.flatMap(t => t.client_subtasks ?? [])
  const totalTasks  = allSubtasks.length
  const doneTasks   = allSubtasks.filter(s => subProgress[s.id]?.status === 'completed').length
  const totalAccess = accessTools.length
  const doneAccess  = accessTools.filter(t => accessProgress[t.id]?.status === 'completed').length

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full" />
        <p className="text-slate-400 text-sm">Loading tracker…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-full bg-[#f8f8f8]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="flex items-center gap-3 px-6 h-14">
          <Link href={backHref}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors group shrink-0">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">{clientName}</span>
            {xeroFile && <span className="text-xs text-slate-400 hidden sm:block">({xeroFile})</span>}
          </div>
          {trainerName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 hidden sm:flex">
              <Users className="w-3.5 h-3.5" />
              Trainer: <span className="font-medium text-slate-700">{trainerName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 font-medium">Tasks completed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{doneTasks}<span className="text-sm text-slate-400 font-normal">/{totalTasks}</span></p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full transition-all"
                style={{ width: totalTasks > 0 ? `${Math.round(doneTasks / totalTasks * 100)}%` : '0%' }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 font-medium">Access setup</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{doneAccess}<span className="text-sm text-slate-400 font-normal">/{totalAccess}</span></p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: totalAccess > 0 ? `${Math.round(doneAccess / totalAccess * 100)}%` : '0%' }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-400 font-medium">Overall</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {(totalTasks + totalAccess) > 0
                ? Math.round((doneTasks + doneAccess) / (totalTasks + totalAccess) * 100)
                : 0}%
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all',
                  (doneTasks + doneAccess) === (totalTasks + totalAccess) && totalTasks + totalAccess > 0
                    ? 'bg-emerald-500' : 'bg-violet-600')}
                style={{ width: (totalTasks + totalAccess) > 0
                  ? `${Math.round((doneTasks + doneAccess) / (totalTasks + totalAccess) * 100)}%`
                  : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* ── Task sections ── */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">No tasks set up for this client yet.</p>
          </div>
        ) : tasks.map(task => {
          const subtasks: any[] = task.client_subtasks ?? []
          const taskDone = subtasks.filter(s => subProgress[s.id]?.status === 'completed').length
          const isOpen   = openTasks.has(task.id)

          return (
            <div key={task.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Task header */}
              <button
                onClick={() => setOpenTasks(prev => {
                  const s = new Set(prev)
                  s.has(task.id) ? s.delete(task.id) : s.add(task.id)
                  return s
                })}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-800">{task.title}</span>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full shrink-0',
                  taskDone === subtasks.length && subtasks.length > 0
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-slate-500 bg-slate-100'
                )}>
                  {taskDone}/{subtasks.length} done
                </span>
              </button>

              {isOpen && (
                <>
                  {/* Column headers */}
                  <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 px-5 py-2 border-t border-slate-100 bg-slate-50/70">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Sub-task</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Training Date</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Hands-on Date</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Remarks</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {subtasks.map(sub => {
                      const prog = subProgress[sub.id] ?? DEFAULT_SUB_PROGRESS
                      const statusOpt = STATUS_OPTS.find(s => s.value === prog.status) ?? STATUS_OPTS[0]

                      return (
                        <div key={sub.id} className={cn(
                          'px-5 py-3 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 items-center transition-colors',
                          prog.status === 'completed' ? 'bg-emerald-50/30' : ''
                        )}>
                          {/* Subtask title */}
                          <div className="flex items-start gap-2 min-w-0">
                            <button
                              onClick={() => updateSubtask(sub.id, {
                                status: prog.status === 'completed' ? 'not_started' : 'completed',
                              })}
                              className={cn(
                                'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                prog.status === 'completed'
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-slate-300 hover:border-violet-400'
                              )}
                            >
                              {prog.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </button>
                            <div className="min-w-0">
                              <p className={cn('text-sm font-medium leading-snug',
                                prog.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
                              )}>
                                {sub.title}
                              </p>
                              {sub.video_url && (
                                <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-0.5">
                                  <Link2 className="w-3 h-3" /> Video
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Training Date */}
                          <div>
                            <label className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Training Date</label>
                            <input
                              type="date"
                              value={prog.training_date ?? ''}
                              onChange={e => updateSubtask(sub.id, { training_date: e.target.value || null })}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>

                          {/* Hands-on Date */}
                          <div>
                            <label className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Hands-on Date</label>
                            <input
                              type="date"
                              value={prog.hands_on_date ?? ''}
                              onChange={e => updateSubtask(sub.id, { hands_on_date: e.target.value || null })}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>

                          {/* Status */}
                          <div>
                            <label className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Status</label>
                            <select
                              value={prog.status}
                              onChange={e => updateSubtask(sub.id, { status: e.target.value as SubtaskProgress['status'] })}
                              className={cn(
                                'w-full text-xs font-semibold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer',
                                statusOpt.color,
                                'border-transparent'
                              )}
                            >
                              {STATUS_OPTS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Remarks */}
                          <div>
                            <label className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Remarks</label>
                            <input
                              type="text"
                              placeholder="Remarks…"
                              value={prog.remarks}
                              onChange={e => updateSubtaskRemarks(sub.id, e.target.value)}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* ── Access Checklist ── */}
        {accessTools.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Access Checklist</h2>
              <p className="text-xs text-slate-400 mt-0.5">Software access set up for this client</p>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr] gap-2 px-5 py-2 bg-slate-50/70 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tool</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Remarks</span>
            </div>

            <div className="divide-y divide-slate-100">
              {accessTools.map(tool => {
                const prog = accessProgress[tool.id] ?? DEFAULT_ACCESS_PROGRESS
                const done = prog.status === 'completed'

                return (
                  <div key={tool.id} className={cn(
                    'px-5 py-3 grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr] gap-2 items-center transition-colors',
                    done ? 'bg-emerald-50/30' : ''
                  )}>
                    {/* Tool name */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateAccess(tool.id, { status: done ? 'pending' : 'completed' })}
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-violet-400'
                        )}
                      >
                        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <span className={cn('text-sm font-medium', done ? 'text-slate-400 line-through' : 'text-slate-800')}>
                        {tool.tool_name}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div>
                      <label className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Status</label>
                      <span className={cn(
                        'inline-block text-xs font-semibold px-2.5 py-1 rounded-full',
                        done ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                      )}>
                        {done ? 'Completed' : 'Pending'}
                      </span>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Remarks</label>
                      <input
                        type="text"
                        placeholder="Remarks…"
                        value={prog.remarks}
                        onChange={e => updateAccessRemarks(tool.id, e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
