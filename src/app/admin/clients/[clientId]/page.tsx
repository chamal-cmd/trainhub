'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, Building2, Users, Shield, Link2, Check, Pencil, X,
} from 'lucide-react'

type Params = { params: Promise<{ clientId: string }> }

// ── Types ──────────────────────────────────────────────────────────────────
interface Subtask { id: string; title: string; video_url: string | null; order_index: number }
interface Task    { id: string; title: string; order_index: number; subtasks: Subtask[]; open: boolean }
interface AccessTool { id: string; tool_name: string; order_index: number }
interface Assignment {
  id: string; trainee_id: string; trainer_id: string | null; notes: string | null; created_at: string
  trainee: { full_name: string; email: string }
  trainer: { full_name: string } | null
}
interface Profile { id: string; full_name: string; email: string }

export default function AdminClientDetailPage({ params }: Params) {
  const { clientId } = use(params)
  const supabase = createClient()

  const [loading, setLoading]       = useState(true)
  const [clientName, setClientName] = useState('')
  const [xeroFile,   setXeroFile]   = useState('')
  const [description,setDescription]= useState('')
  const [editingInfo,setEditingInfo] = useState(false)
  const [savingInfo, setSavingInfo]  = useState(false)

  const [tasks,       setTasks]       = useState<Task[]>([])
  const [accessTools, setAccessTools] = useState<AccessTool[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])

  // Add task
  const [showAddTask,  setShowAddTask]  = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [savingTask,   setSavingTask]   = useState(false)

  // Add subtask (per task)
  const [addSubtaskForTask,   setAddSubtaskForTask]   = useState<string | null>(null)
  const [newSubtaskTitle,     setNewSubtaskTitle]     = useState('')
  const [newSubtaskVideo,     setNewSubtaskVideo]     = useState('')
  const [savingSubtask,       setSavingSubtask]       = useState(false)

  // Add access tool
  const [showAddTool,  setShowAddTool]  = useState(false)
  const [newToolName,  setNewToolName]  = useState('')
  const [savingTool,   setSavingTool]   = useState(false)

  // Add assignment
  const [showAssign,    setShowAssign]    = useState(false)
  const [assignTrainee, setAssignTrainee] = useState('')
  const [assignTrainer, setAssignTrainer] = useState('')
  const [savingAssign,  setSavingAssign]  = useState(false)
  const [assignError,   setAssignError]   = useState('')

  useEffect(() => { load() }, [clientId])

  async function load() {
    setLoading(true)
    const [clientRes, taskRes, toolRes, assignRes, profileRes] = await Promise.all([
      supabase.from('clients').select('name, xero_file, description').eq('id', clientId).single(),
      supabase.from('client_tasks')
        .select('id, title, order_index, client_subtasks(id, title, video_url, order_index)')
        .eq('client_id', clientId).order('order_index'),
      supabase.from('client_access_tools').select('id, tool_name, order_index')
        .eq('client_id', clientId).order('order_index'),
      supabase.from('client_training_assignments')
        .select(`id, trainee_id, trainer_id, notes, created_at,
                 trainee:profiles!client_training_assignments_trainee_id_fkey(full_name, email),
                 trainer:profiles!client_training_assignments_trainer_id_fkey(full_name)`)
        .eq('client_id', clientId).order('created_at'),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
    ])

    if (clientRes.data) {
      setClientName(clientRes.data.name)
      setXeroFile(clientRes.data.xero_file ?? '')
      setDescription(clientRes.data.description ?? '')
    }

    setTasks((taskRes.data ?? []).map((t: any) => ({
      id:         t.id,
      title:      t.title,
      order_index: t.order_index,
      open:       false,
      subtasks:   [...(t.client_subtasks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index),
    })))

    setAccessTools(toolRes.data ?? [])
    setAssignments((assignRes.data ?? []) as any)
    setAllProfiles(profileRes.data ?? [])
    setLoading(false)
  }

  // ── Client info ────────────────────────────────────────────────────────
  async function saveInfo() {
    setSavingInfo(true)
    await supabase.from('clients').update({
      name:        clientName.trim(),
      xero_file:   xeroFile.trim() || null,
      description: description.trim() || null,
    }).eq('id', clientId)
    setSavingInfo(false)
    setEditingInfo(false)
  }

  // ── Tasks ──────────────────────────────────────────────────────────────
  async function addTask() {
    if (!newTaskTitle.trim()) return
    setSavingTask(true)
    const nextIdx = tasks.length
    await supabase.from('client_tasks').insert({ client_id: clientId, title: newTaskTitle.trim(), order_index: nextIdx })
    setNewTaskTitle(''); setShowAddTask(false); setSavingTask(false)
    await load()
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task and all its subtasks?')) return
    await supabase.from('client_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // ── Subtasks ───────────────────────────────────────────────────────────
  async function addSubtask(taskId: string) {
    if (!newSubtaskTitle.trim()) return
    setSavingSubtask(true)
    const task    = tasks.find(t => t.id === taskId)
    const nextIdx = task?.subtasks.length ?? 0
    await supabase.from('client_subtasks').insert({
      client_task_id: taskId,
      title:          newSubtaskTitle.trim(),
      video_url:      newSubtaskVideo.trim() || null,
      order_index:    nextIdx,
    })
    setNewSubtaskTitle(''); setNewSubtaskVideo(''); setAddSubtaskForTask(null); setSavingSubtask(false)
    await load()
  }

  async function deleteSubtask(subtaskId: string) {
    await supabase.from('client_subtasks').delete().eq('id', subtaskId)
    setTasks(prev => prev.map(t => ({ ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) })))
  }

  // ── Access Tools ───────────────────────────────────────────────────────
  async function addTool() {
    if (!newToolName.trim()) return
    setSavingTool(true)
    const nextIdx = accessTools.length
    await supabase.from('client_access_tools').insert({ client_id: clientId, tool_name: newToolName.trim(), order_index: nextIdx })
    setNewToolName(''); setShowAddTool(false); setSavingTool(false)
    await load()
  }

  async function deleteTool(toolId: string) {
    await supabase.from('client_access_tools').delete().eq('id', toolId)
    setAccessTools(prev => prev.filter(t => t.id !== toolId))
  }

  // ── Assignments ────────────────────────────────────────────────────────
  async function addAssignment() {
    if (!assignTrainee) { setAssignError('Select a trainee'); return }
    setSavingAssign(true); setAssignError('')
    const { error } = await supabase.from('client_training_assignments').insert({
      client_id:  clientId,
      trainee_id: assignTrainee,
      trainer_id: assignTrainer || null,
    })
    if (error) { setAssignError(error.message); setSavingAssign(false); return }
    setAssignTrainee(''); setAssignTrainer(''); setShowAssign(false); setSavingAssign(false)
    await load()
  }

  async function deleteAssignment(assignId: string) {
    if (!confirm('Remove this trainee assignment? Their progress will be deleted.')) return
    await supabase.from('client_training_assignments').delete().eq('id', assignId)
    setAssignments(prev => prev.filter(a => a.id !== assignId))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-full py-24">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  )

  const assignedIds = new Set(assignments.map(a => a.trainee_id))

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8] space-y-6">

      {/* Back + Header */}
      <div>
        <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Clients
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {!editingInfo ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{clientName}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {xeroFile && <span className="mr-3">Xero: <span className="font-medium text-slate-700">{xeroFile}</span></span>}
                    {description && <span>{description}</span>}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingInfo(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Client Name</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Xero File Name</Label>
                  <Input value={xeroFile} onChange={e => setXeroFile(e.target.value)} className="mt-1" placeholder="e.g. MC Monavale" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} className="mt-1" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveInfo} loading={savingInfo}><Check className="w-3.5 h-3.5" /> Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingInfo(false)}><X className="w-3.5 h-3.5" /> Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tasks Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Task Template</h2>
            <p className="text-xs text-slate-400 mt-0.5">Main tasks and sub-tasks trainees will learn for this client</p>
          </div>
          <Button size="sm" onClick={() => setShowAddTask(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-sm text-slate-400">No tasks yet — add your first main task.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task, ti) => (
              <div key={task.id}>
                {/* Task header */}
                <div className="flex items-center gap-3 px-6 py-3.5 group">
                  <button
                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, open: !t.open } : t))}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {task.open
                      ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="font-semibold text-slate-800 text-sm">{task.title}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 ml-1">
                      {task.subtasks.length} sub-task{task.subtasks.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <button onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtask list */}
                {task.open && (
                  <div className="bg-slate-50/60 border-t border-slate-100 pb-3">
                    {task.subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 pl-12 pr-6 py-2.5 group/sub">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">{sub.title}</p>
                          {sub.video_url && (
                            <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-0.5">
                              <Link2 className="w-3 h-3" /> Training video
                            </a>
                          )}
                        </div>
                        <button onClick={() => deleteSubtask(sub.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover/sub:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add subtask inline */}
                    {addSubtaskForTask === task.id ? (
                      <div className="pl-12 pr-6 pt-2 space-y-2">
                        <Input size={1} placeholder="Sub-task title" value={newSubtaskTitle}
                          onChange={e => setNewSubtaskTitle(e.target.value)} autoFocus
                          className="h-8 text-sm" />
                        <Input size={1} placeholder="Training video URL (optional)" value={newSubtaskVideo}
                          onChange={e => setNewSubtaskVideo(e.target.value)} className="h-8 text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => addSubtask(task.id)} loading={savingSubtask}>Add</Button>
                          <Button size="sm" variant="outline" onClick={() => { setAddSubtaskForTask(null); setNewSubtaskTitle(''); setNewSubtaskVideo('') }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddSubtaskForTask(task.id); setNewSubtaskTitle(''); setNewSubtaskVideo('') }}
                        className="flex items-center gap-2 pl-12 pr-6 py-2 text-xs text-slate-400 hover:text-violet-600 transition-colors w-full text-left"
                      >
                        <Plus className="w-3 h-3" /> Add sub-task
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add task inline dialog */}
        {showAddTask && (
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/60">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">New Main Task</p>
            <div className="flex gap-2">
              <Input placeholder="e.g. Pay Runs" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus className="h-8 text-sm" />
              <Button size="sm" onClick={addTask} loading={savingTask}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAddTask(false); setNewTaskTitle('') }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Access Tools Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Access Checklist</h2>
            <p className="text-xs text-slate-400 mt-0.5">Software tools the trainee needs access to for this client</p>
          </div>
          <Button size="sm" onClick={() => setShowAddTool(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Tool
          </Button>
        </div>

        {accessTools.length === 0 ? (
          <p className="text-sm text-slate-400 px-6 py-6 text-center">No tools yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {accessTools.map(tool => (
              <div key={tool.id} className="flex items-center px-6 py-3 group">
                <div className="w-2 h-2 rounded-full bg-slate-300 mr-3 shrink-0" />
                <span className="flex-1 text-sm text-slate-700">{tool.tool_name}</span>
                <button onClick={() => deleteTool(tool.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddTool && (
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/60">
            <div className="flex gap-2">
              <Input placeholder="e.g. Xero, Asana, Dext" value={newToolName}
                onChange={e => setNewToolName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTool()} autoFocus className="h-8 text-sm" />
              <Button size="sm" onClick={addTool} loading={savingTool}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAddTool(false); setNewToolName('') }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Assignments Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Trainees</h2>
            <p className="text-xs text-slate-400 mt-0.5">Team members assigned to train on this client</p>
          </div>
          <Button size="sm" onClick={() => { setShowAssign(true); setAssignError('') }}>
            <Users className="w-3.5 h-3.5" /> Assign Trainee
          </Button>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-slate-400 px-6 py-6 text-center">No trainees assigned yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center px-6 py-4 group">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0 mr-3">
                  {a.trainee?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{a.trainee?.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {a.trainer ? <>Trainer: <span className="text-slate-600">{a.trainer.full_name}</span></> : 'No trainer assigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/clients/${clientId}/tracker/${a.id}`}>
                    <Button size="sm" variant="outline">View Tracker</Button>
                  </Link>
                  <button onClick={() => deleteAssignment(a.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Trainee *</Label>
              <select
                value={assignTrainee}
                onChange={e => setAssignTrainee(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="">Select trainee…</option>
                {allProfiles.filter(p => !assignedIds.has(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Trainer <span className="text-slate-400">(optional)</span></Label>
              <select
                value={assignTrainer}
                onChange={e => setAssignTrainer(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="">Select trainer…</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            {assignError && <p className="text-sm text-red-600">{assignError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={addAssignment} loading={savingAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
