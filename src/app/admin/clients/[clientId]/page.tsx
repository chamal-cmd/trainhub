'use client'

import { useEffect, useRef, useState, Suspense, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Link2,
  Users,
  Shield,
  Check,
  Building2,
  BarChart2,
  Eye,
  Download,
  Upload,
  BookOpen,
  X,
  Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Subtask = {
  id: string
  client_task_id: string
  title: string
  video_url: string | null
  order_index: number
}

type Task = {
  id: string
  client_id: string
  title: string
  order_index: number
  subtasks: Subtask[]
}

type AccessTool = {
  id: string
  client_id: string
  tool_name: string
  order_index: number
}

type Assignment = {
  id: string
  client_id: string
  trainee_id: string
  trainer_id: string | null
  trainee: { full_name: string; email: string }
  trainer: { full_name: string } | null
}

type Profile = {
  id: string
  full_name: string
  email: string
}

type ActivePanel = 'overview' | 'tools' | 'assignments'

type Params = { params: Promise<{ clientId: string }> }

// ── Suspense wrapper ───────────────────────────────────────────────────────────

export default function AdminClientDetailPage({ params }: Params) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ClientDetailInner params={params} />
    </Suspense>
  )
}

// ── Inner component ────────────────────────────────────────────────────────────

function ClientDetailInner({ params }: Params) {
  const { clientId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // ── Loading / data ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)

  // Client info
  const [clientName,  setClientName]  = useState('')
  const [xeroFile,    setXeroFile]    = useState('')
  const [description, setDescription] = useState('')
  const [pod,         setPod]         = useState('')
  const [bookkeeper,  setBookkeeper]  = useState('')
  const [trainerId,   setTrainerId]   = useState<string | null>(null)
  const [infoSaved,   setInfoSaved]   = useState(false)
  const infoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Task tree
  const [tasks, setTasks] = useState<Task[]>([])
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // Rename task inline
  const [renamingTaskId, setRenamingTaskId] = useState<string | null>(null)
  const [renameTaskValue, setRenameTaskValue] = useState('')

  // Rename subtask inline
  const [renamingSubtaskId, setRenamingSubtaskId] = useState<string | null>(null)
  const [renameSubtaskValue, setRenameSubtaskValue] = useState('')

  // Subtask video URL edit inline
  const [editingVideoSubtaskId, setEditingVideoSubtaskId] = useState<string | null>(null)
  const [editingVideoValue, setEditingVideoValue] = useState('')

  // Add task inline
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Add subtask inline (keyed by task id)
  const [addingSubtaskForTask, setAddingSubtaskForTask] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  // Access tools
  const [accessTools, setAccessTools] = useState<AccessTool[]>([])
  const [renamingToolId, setRenamingToolId] = useState<string | null>(null)
  const [renameToolValue, setRenameToolValue] = useState('')
  const [addingTool, setAddingTool] = useState(false)
  const [newToolName, setNewToolName] = useState('')

  // Assignments
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignTrainee, setAssignTrainee] = useState('')
  const [assignTrainer, setAssignTrainer] = useState('')
  const [assignError, setAssignError] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)

  // Active panel
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview')

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // KB import / export
  const [showImportKB,      setShowImportKB]      = useState(false)
  const [kbSubjects,        setKbSubjects]        = useState<{ id: string; title: string }[]>([])
  const [selectedKBSubject, setSelectedKBSubject] = useState('')
  const [importMode,        setImportMode]        = useState<'add' | 'replace'>('add')
  const [importing,         setImporting]         = useState(false)
  const [showExportKB,      setShowExportKB]      = useState(false)
  const [exportTitle,       setExportTitle]       = useState('')
  const [exporting,         setExporting]         = useState(false)

  // ── Load all data ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadData()
  }, [clientId])

  async function loadData() {
    setLoading(true)
    const [clientRes, taskRes, toolRes, assignRes, profileRes] = await Promise.all([
      supabase.from('clients').select('id, name, xero_file, description, pod, bookkeeper, trainer_id').eq('id', clientId).single(),
      supabase
        .from('client_tasks')
        .select('id, client_id, title, order_index, client_subtasks(id, client_task_id, title, video_url, order_index)')
        .eq('client_id', clientId)
        .order('order_index'),
      supabase
        .from('client_access_tools')
        .select('id, client_id, tool_name, order_index')
        .eq('client_id', clientId)
        .order('order_index'),
      supabase
        .from('client_training_assignments')
        .select(
          `id, client_id, trainee_id, trainer_id,
           trainee:profiles!client_training_assignments_trainee_id_fkey(full_name, email),
           trainer:profiles!client_training_assignments_trainer_id_fkey(full_name)`
        )
        .eq('client_id', clientId),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
    ])

    if (clientRes.data) {
      setClientName(clientRes.data.name ?? '')
      setXeroFile(clientRes.data.xero_file ?? '')
      setDescription(clientRes.data.description ?? '')
      setPod(clientRes.data.pod ?? '')
      setBookkeeper(clientRes.data.bookkeeper ?? '')
      setTrainerId(clientRes.data.trainer_id ?? null)
    }

    if (taskRes.data) {
      const sorted = (taskRes.data as any[]).map((t) => ({
        id: t.id,
        client_id: t.client_id,
        title: t.title,
        order_index: t.order_index,
        subtasks: [...(t.client_subtasks ?? [])].sort(
          (a: Subtask, b: Subtask) => a.order_index - b.order_index
        ),
      })) as Task[]
      setTasks(sorted)
      // Auto-expand first task
      if (sorted.length > 0) {
        setExpandedTasks(new Set([sorted[0].id]))
      }
    }

    setAccessTools((toolRes.data ?? []) as AccessTool[])
    setAssignments((assignRes.data ?? []) as any)
    setAllProfiles(profileRes.data ?? [])
    setLoading(false)
  }

  // ── Client info auto-save on blur ─────────────────────────────────────────

  function flashSaved() {
    setInfoSaved(true)
    if (infoSaveTimer.current) clearTimeout(infoSaveTimer.current)
    infoSaveTimer.current = setTimeout(() => setInfoSaved(false), 2000)
  }

  async function saveClientField(field: string, value: string) {
    await supabase
      .from('clients')
      .update({ [field]: value.trim() || null })
      .eq('id', clientId)
    flashSaved()
  }

  async function saveTrainer(id: string | null) {
    setTrainerId(id)
    await supabase.from('clients').update({ trainer_id: id || null }).eq('id', clientId)
    flashSaved()
  }

  // ── Task tree ops ─────────────────────────────────────────────────────────

  function toggleTask(taskId: string) {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  async function renameTask(taskId: string) {
    if (!renameTaskValue.trim()) {
      setRenamingTaskId(null)
      return
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: renameTaskValue.trim() } : t))
    )
    setRenamingTaskId(null)
    await supabase.from('client_tasks').update({ title: renameTaskValue.trim() }).eq('id', taskId)
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order_index)) + 1 : 0
    const { data } = await supabase
      .from('client_tasks')
      .insert({ client_id: clientId, title: newTaskTitle.trim(), order_index: maxOrder })
      .select('id, client_id, title, order_index')
      .single()
    if (data) {
      const newTask: Task = { ...data, subtasks: [] }
      setTasks((prev) => [...prev, newTask])
      setExpandedTasks((prev) => new Set([...prev, newTask.id]))
    }
    setNewTaskTitle('')
    setAddingTask(false)
  }

  async function deleteTask(taskId: string, taskTitle: string) {
    if (!confirm(`Delete task "${taskTitle}" and all its subtasks? This cannot be undone.`)) return
    await supabase.from('client_tasks').delete().eq('id', taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  // ── Subtask ops ───────────────────────────────────────────────────────────

  async function renameSubtask(subtaskId: string, taskId: string) {
    if (!renameSubtaskValue.trim()) {
      setRenamingSubtaskId(null)
      return
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, title: renameSubtaskValue.trim() } : s
              ),
            }
          : t
      )
    )
    setRenamingSubtaskId(null)
    await supabase
      .from('client_subtasks')
      .update({ title: renameSubtaskValue.trim() })
      .eq('id', subtaskId)
  }

  async function saveSubtaskVideo(subtaskId: string, taskId: string) {
    const url = editingVideoValue.trim() || null
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, video_url: url } : s
              ),
            }
          : t
      )
    )
    setEditingVideoSubtaskId(null)
    await supabase.from('client_subtasks').update({ video_url: url }).eq('id', subtaskId)
  }

  async function addSubtask(taskId: string) {
    if (!newSubtaskTitle.trim()) return
    const task = tasks.find((t) => t.id === taskId)
    const maxOrder =
      task && task.subtasks.length > 0
        ? Math.max(...task.subtasks.map((s) => s.order_index)) + 1
        : 0
    const { data } = await supabase
      .from('client_subtasks')
      .insert({
        client_task_id: taskId,
        title: newSubtaskTitle.trim(),
        video_url: null,
        order_index: maxOrder,
      })
      .select('id, client_task_id, title, video_url, order_index')
      .single()
    if (data) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, data as Subtask] } : t
        )
      )
    }
    setNewSubtaskTitle('')
    setAddingSubtaskForTask(null)
  }

  async function deleteSubtask(subtaskId: string, taskId: string) {
    await supabase.from('client_subtasks').delete().eq('id', subtaskId)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t
      )
    )
  }

  // ── Access tool ops ───────────────────────────────────────────────────────

  async function renameTool(toolId: string) {
    if (!renameToolValue.trim()) {
      setRenamingToolId(null)
      return
    }
    setAccessTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, tool_name: renameToolValue.trim() } : t))
    )
    setRenamingToolId(null)
    await supabase
      .from('client_access_tools')
      .update({ tool_name: renameToolValue.trim() })
      .eq('id', toolId)
  }

  async function addTool() {
    if (!newToolName.trim()) return
    const maxOrder =
      accessTools.length > 0 ? Math.max(...accessTools.map((t) => t.order_index)) + 1 : 0
    const { data } = await supabase
      .from('client_access_tools')
      .insert({ client_id: clientId, tool_name: newToolName.trim(), order_index: maxOrder })
      .select('id, client_id, tool_name, order_index')
      .single()
    if (data) {
      setAccessTools((prev) => [...prev, data as AccessTool])
    }
    setNewToolName('')
    setAddingTool(false)
  }

  async function deleteTool(toolId: string) {
    await supabase.from('client_access_tools').delete().eq('id', toolId)
    setAccessTools((prev) => prev.filter((t) => t.id !== toolId))
  }

  // ── Assignment ops ────────────────────────────────────────────────────────

  async function addAssignment() {
    if (!assignTrainee) {
      setAssignError('Please select a trainee.')
      return
    }
    setSavingAssign(true)
    setAssignError('')
    const { data, error } = await supabase
      .from('client_training_assignments')
      .insert({
        client_id: clientId,
        trainee_id: assignTrainee,
        trainer_id: assignTrainer || null,
      })
      .select(
        `id, client_id, trainee_id, trainer_id,
         trainee:profiles!client_training_assignments_trainee_id_fkey(full_name, email),
         trainer:profiles!client_training_assignments_trainer_id_fkey(full_name)`
      )
      .single()
    setSavingAssign(false)
    if (error) {
      setAssignError(error.message)
      return
    }
    if (data) {
      setAssignments((prev) => [...prev, data as any])
    }
    setAssignTrainee('')
    setAssignTrainer('')
    setShowAssignForm(false)
  }

  async function deleteAssignment(assignId: string) {
    if (!confirm('Remove this trainee assignment?')) return
    await supabase.from('client_training_assignments').delete().eq('id', assignId)
    setAssignments((prev) => prev.filter((a) => a.id !== assignId))
  }

  // ── Delete client ─────────────────────────────────────────────────────────

  async function deleteClient() {
    setDeleting(true)
    await supabase.from('clients').delete().eq('id', clientId)
    router.push('/admin/clients')
  }

  // ── KB import / export ────────────────────────────────────────────────────

  async function openImportModal() {
    setShowImportKB(true)
    setSelectedKBSubject('')
    setImportMode('add')
    const { data } = await supabase.from('subjects').select('id, title').order('title')
    setKbSubjects(data ?? [])
  }

  async function importFromKB() {
    if (!selectedKBSubject || importing) return
    setImporting(true)
    try {
      const { data: subj } = await supabase
        .from('subjects')
        .select('title, topics(id, title, order_index, steps(id, title, order_index))')
        .eq('id', selectedKBSubject)
        .single()
      if (!subj) return

      if (importMode === 'replace') {
        await supabase.from('client_tasks').delete().eq('client_id', clientId)
        setTasks([])
      }

      const maxOrder =
        importMode === 'add' && tasks.length > 0
          ? Math.max(...tasks.map((t) => t.order_index)) + 1
          : 0
      const sortedTopics = [...((subj as any).topics as any[])].sort(
        (a, b) => a.order_index - b.order_index
      )

      const newTasks: Task[] = []
      for (let i = 0; i < sortedTopics.length; i++) {
        const topic = sortedTopics[i]
        const { data: newTask } = await supabase
          .from('client_tasks')
          .insert({ client_id: clientId, title: topic.title, order_index: maxOrder + i })
          .select('id, client_id, title, order_index')
          .single()
        if (!newTask) continue

        const sortedSteps = [...(topic.steps as any[])].sort((a, b) => a.order_index - b.order_index)
        const subtasks: Subtask[] = []
        for (let j = 0; j < sortedSteps.length; j++) {
          const step = sortedSteps[j]
          const { data: newSub } = await supabase
            .from('client_subtasks')
            .insert({ client_task_id: newTask.id, title: step.title, order_index: j, video_url: null })
            .select('id, client_task_id, title, video_url, order_index')
            .single()
          if (newSub) subtasks.push(newSub as Subtask)
        }
        newTasks.push({ ...(newTask as any), subtasks })
      }

      setTasks((prev) => (importMode === 'replace' ? newTasks : [...prev, ...newTasks]))
      setShowImportKB(false)
    } finally {
      setImporting(false)
    }
  }

  async function exportToKB() {
    const title = exportTitle.trim()
    if (!title || exporting) return
    setExporting(true)
    try {
      const { data: newSubject } = await supabase
        .from('subjects')
        .insert({ title })
        .select('id')
        .single()
      if (!newSubject) return

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        const { data: newTopic } = await supabase
          .from('topics')
          .insert({ subject_id: newSubject.id, title: task.title, order_index: i })
          .select('id')
          .single()
        if (!newTopic) continue

        for (let j = 0; j < task.subtasks.length; j++) {
          const sub = task.subtasks[j]
          await supabase.from('steps').insert({
            topic_id: newTopic.id,
            title: sub.title,
            order_index: j,
          })
        }
      }

      setShowExportKB(false)
      router.push(`/admin/subjects/${newSubject.id}`)
    } finally {
      setExporting(false)
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const totalSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.length, 0)
  const assignedIds = new Set(assignments.map((a) => a.trainee_id))

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden">

        {/* Back link */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Clients
          </Link>
        </div>

        {/* ── Client info ─────────────────────────────────────────────────── */}
        <div className="px-4 pb-3 shrink-0 border-b border-slate-100">
          {/* Icon row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5 text-violet-600" />
            </div>
            {/* Saved flash */}
            <div
              className={cn(
                'flex items-center gap-1 text-xs text-emerald-600 transition-opacity duration-300 ml-auto',
                infoSaved ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Check className="w-3 h-3" />
              Saved
            </div>
          </div>

          {/* Client name */}
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onBlur={() => saveClientField('name', clientName)}
            className="w-full text-sm font-bold text-slate-900 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-1 -mx-1.5 placeholder-slate-300"
            placeholder="Client name"
          />

          {/* Xero file */}
          <input
            value={xeroFile}
            onChange={(e) => setXeroFile(e.target.value)}
            onBlur={() => saveClientField('xero_file', xeroFile)}
            className="w-full text-xs text-slate-500 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-0.5 -mx-1.5 placeholder-slate-300 mt-0.5"
            placeholder="Xero file name"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => saveClientField('description', description)}
            rows={2}
            className="w-full text-xs text-slate-500 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-0.5 -mx-1.5 placeholder-slate-300 resize-none mt-0.5"
            placeholder="Add a description..."
          />

          {/* Divider */}
          <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">

            {/* Pod */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 px-1.5">Pod</p>
              <input
                value={pod}
                onChange={(e) => setPod(e.target.value)}
                onBlur={() => saveClientField('pod', pod)}
                className="w-full text-xs text-slate-700 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-0.5 -mx-1.5 placeholder-slate-300"
                placeholder="e.g. Jobelle"
              />
            </div>

            {/* Bookkeeper */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 px-1.5">Bookkeeper</p>
              <input
                value={bookkeeper}
                onChange={(e) => setBookkeeper(e.target.value)}
                onBlur={() => saveClientField('bookkeeper', bookkeeper)}
                className="w-full text-xs text-slate-700 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-0.5 -mx-1.5 placeholder-slate-300"
                placeholder="e.g. Catherine"
              />
            </div>

            {/* Trainer */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 px-1.5">Trainer</p>
              <select
                value={trainerId ?? ''}
                onChange={(e) => saveTrainer(e.target.value || null)}
                className="w-full text-xs text-slate-700 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-0.5 -mx-1.5 cursor-pointer"
              >
                <option value="">— Unassigned —</option>
                {allProfiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Task tree ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2">

          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task.id)
            const isRenamingTask = renamingTaskId === task.id

            return (
              <div key={task.id}>
                {/* Task row */}
                <div className="group flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="shrink-0 text-slate-400"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isRenamingTask ? (
                    <input
                      autoFocus
                      value={renameTaskValue}
                      onChange={(e) => setRenameTaskValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameTask(task.id)
                        if (e.key === 'Escape') setRenamingTaskId(null)
                      }}
                      onBlur={() => renameTask(task.id)}
                      className="flex-1 text-xs font-semibold text-slate-700 bg-white border border-violet-400 rounded px-1.5 py-0.5 outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setRenamingTaskId(task.id)
                        setRenameTaskValue(task.title)
                      }}
                      className="flex-1 text-xs font-semibold text-slate-700 truncate"
                    >
                      {task.title}
                    </span>
                  )}

                  {/* Hover actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddingSubtaskForTask(task.id)
                        setNewSubtaskTitle('')
                        if (!isExpanded) toggleTask(task.id)
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                      title="Add subtask"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.id, task.title)
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subtask list */}
                {isExpanded && (
                  <div className="pl-6">
                    {task.subtasks.map((sub) => {
                      const isRenamingSub = renamingSubtaskId === sub.id
                      const isEditingVideo = editingVideoSubtaskId === sub.id

                      return (
                        <div key={sub.id} className="group/sub">
                          <div
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-1 transition-colors',
                              'hover:bg-slate-50 text-slate-600'
                            )}
                          >
                            <FileText className="w-3 h-3 shrink-0 text-slate-400" />

                            {isRenamingSub ? (
                              <input
                                autoFocus
                                value={renameSubtaskValue}
                                onChange={(e) => setRenameSubtaskValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') renameSubtask(sub.id, task.id)
                                  if (e.key === 'Escape') setRenamingSubtaskId(null)
                                }}
                                onBlur={() => renameSubtask(sub.id, task.id)}
                                className="flex-1 text-xs text-slate-700 bg-white border border-violet-400 rounded px-1.5 py-0.5 outline-none"
                              />
                            ) : (
                              <span
                                onDoubleClick={() => {
                                  setRenamingSubtaskId(sub.id)
                                  setRenameSubtaskValue(sub.title)
                                }}
                                className="flex-1 text-xs truncate cursor-text"
                              >
                                {sub.title}
                              </span>
                            )}

                            {/* Subtask hover actions */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingVideoSubtaskId(sub.id)
                                  setEditingVideoValue(sub.video_url ?? '')
                                }}
                                className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                                title="Edit video URL"
                              >
                                <Link2 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSubtask(sub.id, task.id)
                                }}
                                className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete subtask"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline video URL editor */}
                          {isEditingVideo && (
                            <div className="pl-7 pr-3 pb-1.5 mx-1">
                              <input
                                autoFocus
                                value={editingVideoValue}
                                onChange={(e) => setEditingVideoValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveSubtaskVideo(sub.id, task.id)
                                  if (e.key === 'Escape') setEditingVideoSubtaskId(null)
                                }}
                                onBlur={() => saveSubtaskVideo(sub.id, task.id)}
                                placeholder="Video URL (blank to clear)"
                                className="w-full text-xs border border-violet-400 rounded-lg px-2 py-1 outline-none bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Add subtask inline input */}
                    {addingSubtaskForTask === task.id ? (
                      <div className="px-3 py-1.5 mx-1">
                        <input
                          autoFocus
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addSubtask(task.id)
                            if (e.key === 'Escape') setAddingSubtaskForTask(null)
                          }}
                          onBlur={() => {
                            if (newSubtaskTitle.trim()) addSubtask(task.id)
                            else setAddingSubtaskForTask(null)
                          }}
                          placeholder="Subtask title..."
                          className="w-full text-xs border border-violet-400 rounded-lg px-2 py-1 outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingSubtaskForTask(task.id)
                          setNewSubtaskTitle('')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg w-full transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add subtask
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add Task */}
          <div className="px-3 mt-1">
            {addingTask ? (
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTask()
                  if (e.key === 'Escape') setAddingTask(false)
                }}
                onBlur={() => {
                  if (newTaskTitle.trim()) addTask()
                  else setAddingTask(false)
                }}
                placeholder="Task title..."
                className="w-full text-xs border border-violet-400 rounded-lg px-2.5 py-1.5 outline-none bg-white"
              />
            ) : (
              <button
                onClick={() => {
                  setAddingTask(true)
                  setNewTaskTitle('')
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg px-2 py-1.5 w-full transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* ── Bottom actions ────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 space-y-2 shrink-0">
          <button
            onClick={() => setActivePanel('tools')}
            className={cn(
              'w-full flex items-center justify-center gap-2 h-8 rounded-xl text-xs font-semibold transition-colors',
              activePanel === 'tools'
                ? 'bg-violet-700 text-white'
                : 'bg-slate-100 hover:bg-violet-50 text-slate-600 hover:text-violet-700'
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            Manage Access Tools
          </button>
          <button
            onClick={() => setActivePanel('assignments')}
            className={cn(
              'w-full flex items-center justify-center gap-2 h-8 rounded-xl text-xs font-semibold transition-colors',
              activePanel === 'assignments'
                ? 'bg-violet-700 text-white'
                : 'bg-slate-100 hover:bg-violet-50 text-slate-600 hover:text-violet-700'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Manage Assignments
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Client
          </button>
        </div>
      </div>

      {/* ── Right main area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f8f8f8' }}>

        {/* ── Overview panel ──────────────────────────────────────────────── */}
        {activePanel === 'overview' && (
          <div className="max-w-3xl mx-auto px-8 py-8">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{clientName || 'Client'}</h1>
                {xeroFile && (
                  <p className="text-xs text-slate-400 mt-0.5">Xero: <span className="text-slate-600 font-medium">{xeroFile}</span></p>
                )}
              </div>
              <button
                onClick={() => setActivePanel('overview')}
                className={cn(
                  'ml-auto flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-colors',
                  activePanel === 'overview'
                    ? 'bg-violet-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-violet-700'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                Overview
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-violet-700">{tasks.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Subtasks</p>
                <p className="text-3xl font-bold text-violet-700">{totalSubtasks}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Assigned Trainees</p>
                <p className="text-3xl font-bold text-violet-700">{assignments.length}</p>
              </div>
            </div>

            {/* KB copy actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={openImportModal}
                className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Copy from Knowledge Base
              </button>
              <button
                onClick={() => { setExportTitle(clientName); setShowExportKB(true) }}
                disabled={tasks.length === 0}
                className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Copy to Knowledge Base
              </button>
            </div>

            {/* Task module cards — fully editable */}
            <div className="space-y-4">
              {tasks.length === 0 && !addingTask && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400">No modules yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Add a task below or copy from the Knowledge Base above.</p>
                </div>
              )}

              {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group/card">

                  {/* ── Task header ── */}
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-600 shrink-0" />

                    {renamingTaskId === task.id ? (
                      <input
                        autoFocus
                        value={renameTaskValue}
                        onChange={(e) => setRenameTaskValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameTask(task.id)
                          if (e.key === 'Escape') setRenamingTaskId(null)
                        }}
                        onBlur={() => renameTask(task.id)}
                        className="flex-1 text-sm font-semibold text-slate-800 border border-violet-400 rounded-lg px-2 py-0.5 outline-none bg-white"
                      />
                    ) : (
                      <h3
                        onDoubleClick={() => { setRenamingTaskId(task.id); setRenameTaskValue(task.title) }}
                        className="flex-1 font-semibold text-slate-800 text-sm cursor-text select-none"
                        title="Double-click to rename"
                      >
                        {task.title}
                      </h3>
                    )}

                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">
                      {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                    </span>

                    <button
                      onClick={() => deleteTask(task.id, task.title)}
                      className="opacity-0 group-hover/card:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all ml-1 shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ── Subtask list ── */}
                  <div className="divide-y divide-slate-100">
                    {task.subtasks.map((sub) => (
                      <div key={sub.id} className="group/sub px-5 py-3">

                        {/* Title row */}
                        <div className="flex items-start gap-3">
                          <div className="w-4 h-4 mt-0.5 rounded border border-slate-200 shrink-0 flex items-center justify-center bg-slate-50">
                            <div className="w-2 h-2 rounded-sm bg-slate-200" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {renamingSubtaskId === sub.id ? (
                              <input
                                autoFocus
                                value={renameSubtaskValue}
                                onChange={(e) => setRenameSubtaskValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') renameSubtask(sub.id, task.id)
                                  if (e.key === 'Escape') setRenamingSubtaskId(null)
                                }}
                                onBlur={() => renameSubtask(sub.id, task.id)}
                                className="w-full text-sm text-slate-700 border border-violet-400 rounded-lg px-2 py-0.5 outline-none bg-white"
                              />
                            ) : (
                              <p
                                onDoubleClick={() => { setRenamingSubtaskId(sub.id); setRenameSubtaskValue(sub.title) }}
                                className="text-sm text-slate-700 cursor-text"
                                title="Double-click to rename"
                              >
                                {sub.title}
                              </p>
                            )}

                            {/* Video URL display / inline editor */}
                            {editingVideoSubtaskId === sub.id ? (
                              <input
                                autoFocus
                                value={editingVideoValue}
                                onChange={(e) => setEditingVideoValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveSubtaskVideo(sub.id, task.id)
                                  if (e.key === 'Escape') setEditingVideoSubtaskId(null)
                                }}
                                onBlur={() => saveSubtaskVideo(sub.id, task.id)}
                                placeholder="Paste video URL (blank to remove)"
                                className="w-full text-xs border border-violet-400 rounded-lg px-2 py-1 outline-none bg-white mt-1.5"
                              />
                            ) : sub.video_url ? (
                              <button
                                onClick={() => { setEditingVideoSubtaskId(sub.id); setEditingVideoValue(sub.video_url ?? '') }}
                                className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-0.5"
                              >
                                <Link2 className="w-3 h-3" />
                                Training video
                              </button>
                            ) : null}
                          </div>

                          {/* Hover action buttons */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0 mt-0.5">
                            <button
                              onClick={() => { setEditingVideoSubtaskId(sub.id); setEditingVideoValue(sub.video_url ?? '') }}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                              title="Set video URL"
                            >
                              <Link2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteSubtask(sub.id, task.id)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Add subtask row ── */}
                  <div className="px-5 py-2.5 border-t border-dashed border-slate-100">
                    {addingSubtaskForTask === task.id ? (
                      <input
                        autoFocus
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addSubtask(task.id)
                          if (e.key === 'Escape') setAddingSubtaskForTask(null)
                        }}
                        onBlur={() => {
                          if (newSubtaskTitle.trim()) addSubtask(task.id)
                          else setAddingSubtaskForTask(null)
                        }}
                        placeholder="New subtask title…"
                        className="w-full text-sm border border-violet-400 rounded-xl px-3 py-1.5 outline-none bg-white"
                      />
                    ) : (
                      <button
                        onClick={() => { setAddingSubtaskForTask(task.id); setNewSubtaskTitle('') }}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg px-1.5 py-1 -mx-1.5 w-full transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add subtask
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* ── Add new task ── */}
              <div>
                {addingTask ? (
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTask()
                      if (e.key === 'Escape') setAddingTask(false)
                    }}
                    onBlur={() => {
                      if (newTaskTitle.trim()) addTask()
                      else setAddingTask(false)
                    }}
                    placeholder="New task title…"
                    className="w-full text-sm border border-violet-400 rounded-2xl px-4 py-3 outline-none bg-white shadow-sm"
                  />
                ) : (
                  <button
                    onClick={() => { setAddingTask(true); setNewTaskTitle('') }}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 bg-white hover:bg-violet-50 border-2 border-dashed border-slate-200 hover:border-violet-300 rounded-2xl px-4 py-3 w-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add task
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tools panel ────────────────────────────────────────────────── */}
        {activePanel === 'tools' && (
          <div className="max-w-2xl mx-auto px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Access Checklist</h2>
              <p className="text-sm text-slate-500 mt-1">Tools the trainee needs access to for this client</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {accessTools.length === 0 && !addingTool && (
                <p className="text-sm text-slate-400 px-6 py-8 text-center">No tools yet — add your first tool below.</p>
              )}

              {accessTools.map((tool) => {
                const isRenamingTool = renamingToolId === tool.id
                return (
                  <div key={tool.id} className="group flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-b-0">
                    <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />

                    {isRenamingTool ? (
                      <input
                        autoFocus
                        value={renameToolValue}
                        onChange={(e) => setRenameToolValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameTool(tool.id)
                          if (e.key === 'Escape') setRenamingToolId(null)
                        }}
                        onBlur={() => renameTool(tool.id)}
                        className="flex-1 text-sm text-slate-700 bg-white border border-violet-400 rounded px-2 py-0.5 outline-none"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setRenamingToolId(tool.id)
                          setRenameToolValue(tool.tool_name)
                        }}
                        className="flex-1 text-sm text-slate-700 cursor-text"
                      >
                        {tool.tool_name}
                      </span>
                    )}

                    <button
                      onClick={() => deleteTool(tool.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}

              {/* Add tool inline */}
              {addingTool ? (
                <div className="px-5 py-3 border-t border-slate-100">
                  <input
                    autoFocus
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTool()
                      if (e.key === 'Escape') setAddingTool(false)
                    }}
                    onBlur={() => {
                      if (newToolName.trim()) addTool()
                      else setAddingTool(false)
                    }}
                    placeholder="Tool name (e.g. Xero, Asana, Dext)..."
                    className="w-full text-sm border border-violet-400 rounded-lg px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddingTool(true)
                    setNewToolName('')
                  }}
                  className="flex items-center gap-2 px-5 py-3 text-sm text-slate-400 hover:text-violet-700 hover:bg-violet-50 w-full transition-colors border-t border-slate-100"
                >
                  <Plus className="w-4 h-4" />
                  Add Tool
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Assignments panel ───────────────────────────────────────────── */}
        {activePanel === 'assignments' && (
          <div className="max-w-2xl mx-auto px-8 py-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Trainees</h2>
                <p className="text-sm text-slate-500 mt-1">Team members assigned to train on this client</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignForm((v) => !v)
                  setAssignTrainee('')
                  setAssignTrainer('')
                  setAssignError('')
                }}
                className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Assign Trainee
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {assignments.length === 0 && !showAssignForm && (
                <p className="text-sm text-slate-400 px-6 py-8 text-center">No trainees assigned yet.</p>
              )}

              {assignments.map((a) => (
                <div key={a.id} className="group flex items-center gap-3 px-5 py-4 border-b border-slate-100 last:border-b-0">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
                    {a.trainee?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{a.trainee?.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{a.trainee?.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {a.trainer ? (
                        <>Trainer: <span className="text-slate-600">{a.trainer.full_name}</span></>
                      ) : (
                        'No trainer'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/clients/${clientId}/tracker/${a.id}`}
                      className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-violet-700 hover:border-violet-300 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View Tracker
                    </Link>
                    <button
                      onClick={() => deleteAssignment(a.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Assign form inline */}
              {showAssignForm && (
                <div className="px-5 py-4 bg-violet-50/50 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Assignment</p>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Trainee *</label>
                    <select
                      value={assignTrainee}
                      onChange={(e) => setAssignTrainee(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="">Select trainee…</option>
                      {allProfiles
                        .filter((p) => !assignedIds.has(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Trainer <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <select
                      value={assignTrainer}
                      onChange={(e) => setAssignTrainer(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="">Select trainer…</option>
                      {allProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {assignError && <p className="text-xs text-red-600">{assignError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={addAssignment}
                      disabled={savingAssign}
                      className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      {savingAssign ? (
                        <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAssignForm(false)
                        setAssignError('')
                      }}
                      className="px-4 h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Import from KB dialog ───────────────────────────────────────────── */}
      {showImportKB && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => !importing && setShowImportKB(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Copy from Knowledge Base</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Import a KB module's topics as client tasks</p>
                </div>
                <button
                  onClick={() => !importing && setShowImportKB(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KB subject select */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Which module?</label>
                {kbSubjects.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <span className="animate-spin w-3 h-3 border border-slate-300 border-t-violet-500 rounded-full inline-block" />
                    Loading modules…
                  </div>
                ) : (
                  <select
                    value={selectedKBSubject}
                    onChange={(e) => setSelectedKBSubject(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="">Select a module…</option>
                    {kbSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Import mode */}
              <div className="mb-5 space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">How to import?</label>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-violet-300 transition-colors">
                  <input
                    type="radio"
                    name="importMode"
                    value="add"
                    checked={importMode === 'add'}
                    onChange={() => setImportMode('add')}
                    className="mt-0.5 accent-violet-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Add to existing tasks</p>
                    <p className="text-xs text-slate-400">Appends the module's topics after current tasks</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-red-200 transition-colors">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 accent-violet-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Replace all tasks</p>
                    <p className="text-xs text-red-400">Deletes current tasks and imports fresh</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !importing && setShowImportKB(false)}
                  disabled={importing}
                  className="flex-1 h-9 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={importFromKB}
                  disabled={!selectedKBSubject || importing}
                  className="flex-1 h-9 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Export to KB dialog ──────────────────────────────────────────────── */}
      {showExportKB && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => !exporting && setShowExportKB(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Copy to Knowledge Base</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Creates a new KB module from this client's tasks</p>
                </div>
                <button
                  onClick={() => !exporting && setShowExportKB(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">New module name</label>
                <input
                  autoFocus
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') exportToKB() }}
                  placeholder="e.g. Client Onboarding"
                  className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} ({totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}) will be copied.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !exporting && setShowExportKB(false)}
                  disabled={exporting}
                  className="flex-1 h-9 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={exportToKB}
                  disabled={!exportTitle.trim() || exporting}
                  className="flex-1 h-9 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Create Module
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirm dialog ────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Client</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">&ldquo;{clientName}&rdquo;</span>?
                All tasks, subtasks, tools and assignments will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 h-9 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteClient}
                  disabled={deleting}
                  className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
