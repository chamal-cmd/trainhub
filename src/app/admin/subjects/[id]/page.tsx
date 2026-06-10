'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { ManageAccessModal } from '@/components/shared/ManageAccessModal'
import { COVER_COLORS, COVER_EMOJIS, cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Trash2,
  Pencil,
  Users,
  AlertTriangle,
  Check,
  ArrowLeft,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = {
  id: string
  topic_id: string
  title: string
  order_index: number
  content: object | null
}

type Topic = {
  id: string
  subject_id: string
  title: string
  order_index: number
  steps: Step[]
}

type Subject = {
  id: string
  title: string
  description: string | null
  emoji: string
  cover_color: string
  updated_at: string
}

type SelectedStep = {
  step: Step
  topicId: string
}

// ── Suspense wrapper (required for useSearchParams in Next.js App Router) ─────

export default function SubjectEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
      </div>
    }>
      <SubjectEditorInner />
    </Suspense>
  )
}

function SubjectEditorInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subjectId = params.id as string

  const supabase = createClient()

  // Data state
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  // Subject info edit state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editColor, setEditColor] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)

  // Tree state
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [selectedStep, setSelectedStep] = useState<SelectedStep | null>(null)

  // Inline rename state
  const [renamingTopicId, setRenamingTopicId] = useState<string | null>(null)
  const [renamingStepId, setRenamingStepId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Add topic/step state
  const [addingTopic, setAddingTopic] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [addingStepForTopic, setAddingStepForTopic] = useState<string | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')

  // Step title edit
  const [editingStepTitle, setEditingStepTitle] = useState(false)
  const [stepTitleValue, setStepTitleValue] = useState('')

  // Auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [savedIndicator, setSavedIndicator] = useState(false)

  // Modals
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Load data ────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadData()
  }, [subjectId])

  // Auto-open access modal if ?access=1
  useEffect(() => {
    if (searchParams.get('access') === '1') {
      setShowAccessModal(true)
    }
  }, [searchParams])

  async function loadData() {
    setLoading(true)
    const [subjectRes, topicsRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('id', subjectId).single(),
      supabase
        .from('topics')
        .select('*, steps(*)')
        .eq('subject_id', subjectId)
        .order('order_index'),
    ])

    if (subjectRes.data) {
      const s = subjectRes.data as Subject
      setSubject(s)
      setEditTitle(s.title)
      setEditDescription(s.description ?? '')
      setEditEmoji(s.emoji)
      setEditColor(s.cover_color)
    }

    if (topicsRes.data) {
      const sortedTopics = (topicsRes.data as Topic[]).map((t) => ({
        ...t,
        steps: [...(t.steps ?? [])].sort((a, b) => a.order_index - b.order_index),
      }))
      setTopics(sortedTopics)
      // Auto-expand all topics
      setExpandedTopics(new Set(sortedTopics.map((t) => t.id)))
    }

    setLoading(false)
  }

  // ── Subject info save ────────────────────────────────────────────────────────

  async function saveSubjectInfo() {
    if (!editTitle.trim()) return
    setSavingInfo(true)
    await supabase
      .from('subjects')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        emoji: editEmoji,
        cover_color: editColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subjectId)
    setSubject((prev) =>
      prev
        ? {
            ...prev,
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            emoji: editEmoji,
            cover_color: editColor,
          }
        : prev
    )
    setSavingInfo(false)
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2000)
  }

  // ── Topic tree ops ───────────────────────────────────────────────────────────

  function toggleTopicExpand(topicId: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  async function addTopic() {
    if (!newTopicTitle.trim()) return
    const maxOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.order_index)) + 1 : 0
    const { data } = await supabase
      .from('topics')
      .insert({ subject_id: subjectId, title: newTopicTitle.trim(), order_index: maxOrder })
      .select('*, steps(*)')
      .single()
    if (data) {
      const newTopic = { ...data, steps: [] } as Topic
      setTopics((prev) => [...prev, newTopic])
      setExpandedTopics((prev) => new Set([...prev, newTopic.id]))
    }
    setNewTopicTitle('')
    setAddingTopic(false)
  }

  async function deleteTopic(topicId: string, topicTitle: string) {
    if (!confirm(`Delete topic "${topicTitle}" and all its steps? This cannot be undone.`)) return
    await supabase.from('topics').delete().eq('id', topicId)
    setTopics((prev) => prev.filter((t) => t.id !== topicId))
    if (selectedStep?.topicId === topicId) setSelectedStep(null)
  }

  async function renameTopic(topicId: string) {
    if (!renameValue.trim()) {
      setRenamingTopicId(null)
      return
    }
    await supabase.from('topics').update({ title: renameValue.trim() }).eq('id', topicId)
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, title: renameValue.trim() } : t))
    )
    setRenamingTopicId(null)
  }

  // ── Step ops ─────────────────────────────────────────────────────────────────

  async function addStep(topicId: string) {
    if (!newStepTitle.trim()) return
    const topic = topics.find((t) => t.id === topicId)
    const maxOrder =
      topic && topic.steps.length > 0
        ? Math.max(...topic.steps.map((s) => s.order_index)) + 1
        : 0
    const { data } = await supabase
      .from('steps')
      .insert({ topic_id: topicId, title: newStepTitle.trim(), order_index: maxOrder, content: null })
      .select()
      .single()
    if (data) {
      const newStep = data as Step
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId ? { ...t, steps: [...t.steps, newStep] } : t
        )
      )
      setSelectedStep({ step: newStep, topicId })
    }
    setNewStepTitle('')
    setAddingStepForTopic(null)
  }

  async function deleteStep(stepId: string, topicId: string, stepTitle: string) {
    if (!confirm(`Delete step "${stepTitle}"? This cannot be undone.`)) return
    await supabase.from('steps').delete().eq('id', stepId)
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) } : t
      )
    )
    if (selectedStep?.step.id === stepId) setSelectedStep(null)
  }

  async function renameStep(stepId: string, topicId: string) {
    if (!renameValue.trim()) {
      setRenamingStepId(null)
      return
    }
    await supabase.from('steps').update({ title: renameValue.trim() }).eq('id', stepId)
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? {
              ...t,
              steps: t.steps.map((s) =>
                s.id === stepId ? { ...s, title: renameValue.trim() } : s
              ),
            }
          : t
      )
    )
    if (selectedStep?.step.id === stepId) {
      setSelectedStep((prev) =>
        prev ? { ...prev, step: { ...prev.step, title: renameValue.trim() } } : prev
      )
    }
    setRenamingStepId(null)
  }

  // ── Step title edit (right panel) ────────────────────────────────────────────

  async function saveStepTitle() {
    if (!selectedStep || !stepTitleValue.trim()) {
      setEditingStepTitle(false)
      return
    }
    await supabase.from('steps').update({ title: stepTitleValue.trim() }).eq('id', selectedStep.step.id)
    const updated = { ...selectedStep.step, title: stepTitleValue.trim() }
    setSelectedStep({ ...selectedStep, step: updated })
    setTopics((prev) =>
      prev.map((t) =>
        t.id === selectedStep.topicId
          ? {
              ...t,
              steps: t.steps.map((s) =>
                s.id === selectedStep.step.id ? { ...s, title: stepTitleValue.trim() } : s
              ),
            }
          : t
      )
    )
    setEditingStepTitle(false)
  }

  // ── Content auto-save ────────────────────────────────────────────────────────

  const handleContentChange = useCallback(
    (content: object) => {
      if (!selectedStep) return
      // Optimistic local update
      setSelectedStep((prev) => (prev ? { ...prev, step: { ...prev.step, content } } : prev))
      setTopics((prev) =>
        prev.map((t) =>
          t.id === selectedStep.topicId
            ? {
                ...t,
                steps: t.steps.map((s) =>
                  s.id === selectedStep.step.id ? { ...s, content } : s
                ),
              }
            : t
        )
      )
      // Debounced save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        await supabase
          .from('steps')
          .update({ content })
          .eq('id', selectedStep.step.id)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
      }, 1000)
    },
    [selectedStep, supabase]
  )

  // ── Delete module ────────────────────────────────────────────────────────────

  async function deleteModule() {
    setDeleting(true)
    await supabase.from('subjects').delete().eq('id', subjectId)
    router.push('/admin/subjects')
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <AlertTriangle className="w-8 h-8 text-slate-400" />
        <p className="text-slate-600 font-medium">Module not found</p>
        <Link href="/admin/subjects" className="text-sm text-violet-700 hover:underline">
          Back to Library
        </Link>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left sidebar ──────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden">

        {/* Back nav */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <Link
            href="/admin/subjects"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Training Library
          </Link>
        </div>

        {/* ── Subject info section ─────────────────────────────────────────── */}
        <div className="px-4 pb-3 shrink-0 border-b border-slate-100">

          {/* Emoji + color strip */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl hover:ring-2 hover:ring-violet-400 transition-all"
                style={{ backgroundColor: editColor + '22' }}
                title="Change emoji"
              >
                {editEmoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-12 left-0 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-2 w-52">
                  <div className="grid grid-cols-8 gap-1">
                    {COVER_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setEditEmoji(e)
                          setShowEmojiPicker(false)
                        }}
                        className={cn(
                          'w-6 h-6 rounded text-sm flex items-center justify-center transition-colors',
                          editEmoji === e
                            ? 'bg-violet-100 ring-1 ring-violet-500'
                            : 'hover:bg-slate-100'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color dots */}
            <div className="flex flex-wrap gap-1.5">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    editColor === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Editable title */}
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-1 -mx-1.5 placeholder-slate-300 resize-none"
            placeholder="Module title"
          />

          {/* Editable description */}
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full text-xs text-slate-500 bg-transparent border-0 outline-none focus:bg-slate-50 rounded-lg px-1.5 py-1 -mx-1.5 placeholder-slate-300 resize-none mt-0.5"
            placeholder="Add a description..."
          />

          {/* Save info button */}
          <button
            onClick={saveSubjectInfo}
            disabled={savingInfo}
            className={cn(
              'mt-2 w-full h-7 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
              infoSaved
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-violet-700 hover:bg-violet-800 text-white disabled:opacity-60'
            )}
          >
            {savingInfo ? (
              <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
            ) : infoSaved ? (
              <><Check className="w-3 h-3" /> Saved</>
            ) : (
              'Save Info'
            )}
          </button>
        </div>

        {/* ── Topic / step tree ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2">

          {topics.map((topic) => {
            const isExpanded = expandedTopics.has(topic.id)
            const isRenamingThisTopic = renamingTopicId === topic.id

            return (
              <div key={topic.id}>
                {/* Topic row */}
                <div className="group flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                  <button
                    onClick={() => toggleTopicExpand(topic.id)}
                    className="shrink-0 text-slate-400"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isRenamingThisTopic ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameTopic(topic.id)
                        if (e.key === 'Escape') setRenamingTopicId(null)
                      }}
                      onBlur={() => renameTopic(topic.id)}
                      className="flex-1 text-xs font-semibold text-slate-700 bg-white border border-violet-400 rounded px-1.5 py-0.5 outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setRenamingTopicId(topic.id)
                        setRenameValue(topic.title)
                      }}
                      className="flex-1 text-xs font-semibold text-slate-700 truncate"
                    >
                      {topic.title}
                    </span>
                  )}

                  {/* Hover actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddingStepForTopic(topic.id)
                        setNewStepTitle('')
                        if (!isExpanded) toggleTopicExpand(topic.id)
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                      title="Add step"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTopic(topic.id, topic.title)
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete topic"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Steps list */}
                {isExpanded && (
                  <div className="pl-6">
                    {topic.steps.map((step) => {
                      const isSelected = selectedStep?.step.id === step.id
                      const isRenamingThisStep = renamingStepId === step.id

                      return (
                        <div
                          key={step.id}
                          onClick={() => {
                            if (!isRenamingThisStep) {
                              setSelectedStep({ step, topicId: topic.id })
                            }
                          }}
                          className={cn(
                            'group flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-1 cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-violet-100 text-violet-800'
                              : 'hover:bg-slate-50 text-slate-600'
                          )}
                        >
                          <FileText
                            className={cn(
                              'w-3 h-3 shrink-0',
                              isSelected ? 'text-violet-600' : 'text-slate-400'
                            )}
                          />

                          {isRenamingThisStep ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') renameStep(step.id, topic.id)
                                if (e.key === 'Escape') setRenamingStepId(null)
                              }}
                              onBlur={() => renameStep(step.id, topic.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-xs text-slate-700 bg-white border border-violet-400 rounded px-1.5 py-0.5 outline-none"
                            />
                          ) : (
                            <span
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                setRenamingStepId(step.id)
                                setRenameValue(step.title)
                              }}
                              className="flex-1 text-xs truncate"
                            >
                              {step.title}
                            </span>
                          )}

                          {/* Step hover actions */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteStep(step.id, topic.id, step.title)
                            }}
                            className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                            title="Delete step"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )
                    })}

                    {/* Add step inline input */}
                    {addingStepForTopic === topic.id ? (
                      <div className="px-3 py-1.5 mx-1">
                        <input
                          autoFocus
                          value={newStepTitle}
                          onChange={(e) => setNewStepTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addStep(topic.id)
                            if (e.key === 'Escape') setAddingStepForTopic(null)
                          }}
                          onBlur={() => {
                            if (newStepTitle.trim()) addStep(topic.id)
                            else setAddingStepForTopic(null)
                          }}
                          placeholder="Step title..."
                          className="w-full text-xs border border-violet-400 rounded-lg px-2 py-1 outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingStepForTopic(topic.id)
                          setNewStepTitle('')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg w-full transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add step
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add topic */}
          <div className="px-3 mt-1">
            {addingTopic ? (
              <input
                autoFocus
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTopic()
                  if (e.key === 'Escape') setAddingTopic(false)
                }}
                onBlur={() => {
                  if (newTopicTitle.trim()) addTopic()
                  else setAddingTopic(false)
                }}
                placeholder="Topic title..."
                className="w-full text-xs border border-violet-400 rounded-lg px-2.5 py-1.5 outline-none bg-white"
              />
            ) : (
              <button
                onClick={() => {
                  setAddingTopic(true)
                  setNewTopicTitle('')
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg px-2 py-1.5 w-full transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Topic
              </button>
            )}
          </div>
        </div>

        {/* ── Bottom actions ──────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 space-y-2 shrink-0">
          <Link href={`/training/${subjectId}`} target="_blank">
            <button className="w-full flex items-center justify-center gap-2 h-8 rounded-xl bg-slate-100 hover:bg-violet-50 text-slate-600 hover:text-violet-700 text-xs font-semibold transition-colors">
              <Eye className="w-3.5 h-3.5" />
              Preview as Learner
            </button>
          </Link>
          <button
            onClick={() => setShowAccessModal(true)}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-xl bg-slate-100 hover:bg-violet-50 text-slate-600 hover:text-violet-700 text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Access
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Module
          </button>
        </div>
      </div>

      {/* ── Right main area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f8f8f8' }}>
        {selectedStep ? (
          <div className="max-w-3xl mx-auto px-8 py-8">

            {/* Step title row */}
            <div className="flex items-center gap-2 mb-6">
              {editingStepTitle ? (
                <input
                  autoFocus
                  value={stepTitleValue}
                  onChange={(e) => setStepTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveStepTitle()
                    if (e.key === 'Escape') setEditingStepTitle(false)
                  }}
                  onBlur={saveStepTitle}
                  className="flex-1 text-xl font-bold text-slate-900 bg-white border border-violet-400 rounded-xl px-3 py-2 outline-none"
                />
              ) : (
                <h1
                  onDoubleClick={() => {
                    setEditingStepTitle(true)
                    setStepTitleValue(selectedStep.step.title)
                  }}
                  className="flex-1 text-xl font-bold text-slate-900 cursor-text"
                  title="Double-click to rename"
                >
                  {selectedStep.step.title}
                </h1>
              )}
              <button
                onClick={() => {
                  setEditingStepTitle(true)
                  setStepTitleValue(selectedStep.step.title)
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Edit title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto-save indicator */}
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs text-emerald-600 mb-3 transition-opacity duration-300',
                savedIndicator ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Check className="w-3 h-3" />
              Saved
            </div>

            {/* Rich text editor — key forces remount when step changes */}
            <RichTextEditor
              key={selectedStep.step.id}
              content={selectedStep.step.content}
              onChange={handleContentChange}
              placeholder="Start writing your step content here..."
            />
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-sm"
              style={{ backgroundColor: (editColor || subject.cover_color) + '22' }}
            >
              {editEmoji || subject.emoji}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{editTitle || subject.title}</h2>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Select a step from the left sidebar to start editing its content, or add a new topic and step to get started.
            </p>
          </div>
        )}
      </div>

      {/* ── Manage Access modal ──────────────────────────────────────────────── */}
      {showAccessModal && (
        <ManageAccessModal
          subjectId={subjectId}
          subjectTitle={subject.title}
          onClose={() => setShowAccessModal(false)}
        />
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
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Module</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">&ldquo;{subject.title}&rdquo;</span>?
                All topics, steps and content will be permanently removed.
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
                  onClick={deleteModule}
                  disabled={deleting}
                  className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5" /> Delete</>
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
