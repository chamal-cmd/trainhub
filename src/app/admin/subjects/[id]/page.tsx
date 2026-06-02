'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import type { Subject, Topic, Step } from '@/lib/types'
import {
  Plus, ChevronDown, ChevronRight, Pencil, Trash2, ArrowLeft, HelpCircle,
  Eye, Check, X, Upload, FileText, Video, Loader2, File, Paperclip,
  GripVertical, ChevronUp, ExternalLink, Save, Sparkles, Settings,
  ArrowUp, ArrowDown, Users
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { COVER_COLORS, COVER_EMOJIS } from '@/lib/utils'
import { ManageAccessModal } from '@/components/shared/ManageAccessModal'

type AttachmentType = 'pdf' | 'video_url' | 'file'
interface Attachment { type: AttachmentType; name: string; url: string; size?: number }

type PageParams = { params: Promise<{ id: string }> }

function detectPlatformName(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube Video'
  if (url.includes('vimeo.com')) return 'Vimeo Video'
  if (url.includes('loom.com')) return 'Loom Recording'
  if (url.includes('drive.google.com')) return 'Google Drive Video'
  return 'Video'
}

export default function SubjectEditorPage({ params }: PageParams) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // ── Core state ──────────────────────────────────────────────────────────────
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<(Topic & { steps: Step[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [activeStep, setActiveStep] = useState<Step | null>(null)
  const [stepContent, setStepContent] = useState<object>({})
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'attachments'>('content')

  // ── Save state ───────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Topic / step inline editing ──────────────────────────────────────────────
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [editingTopicTitle, setEditingTopicTitle] = useState('')
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editingStepTitle, setEditingStepTitle] = useState('')
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [addingTopic, setAddingTopic] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState<Record<string, string>>({})
  const [addingStep, setAddingStep] = useState<string | null>(null)

  // ── Subject metadata editing ─────────────────────────────────────────────────
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [metaEmoji, setMetaEmoji] = useState('')
  const [metaColor, setMetaColor] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  // ── Manage Access modal ───────────────────────────────────────────────────────
  const [showAccessModal, setShowAccessModal] = useState(false)

  // ── Video input ──────────────────────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState('')
  const [videoName, setVideoName] = useState('')
  const [showVideoInput, setShowVideoInput] = useState(false)

  // ── Drag-to-reorder ───────────────────────────────────────────────────────────
  const [dragTopic, setDragTopic] = useState<string | null>(null)
  const [dragOverTopic, setDragOverTopic] = useState<string | null>(null)
  const [dragStep, setDragStep] = useState<string | null>(null)
  const [dragOverStep, setDragOverStep] = useState<string | null>(null)
  const [dragStepTopic, setDragStepTopic] = useState<string | null>(null)

  useEffect(() => { loadData() }, [id])

  // Auto-open Manage Access when arriving from "Specific people" module creation
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('access') === '1') {
      setShowAccessModal(true)
      // Clean the query param so a refresh doesn't reopen it
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  async function loadData() {
    const { data } = await supabase
      .from('subjects')
      .select(`*, topics(*, steps(*))`)
      .eq('id', id)
      .single()

    if (data) {
      setSubject(data)
      const sorted = (data.topics || [])
        .sort((a: Topic, b: Topic) => a.order_index - b.order_index)
        .map((t: any) => ({ ...t, steps: (t.steps || []).sort((a: Step, b: Step) => a.order_index - b.order_index) }))
      setTopics(sorted)
      if (sorted.length > 0) setExpandedTopics(new Set([sorted[0].id]))
    }
    setLoading(false)
  }

  // ── Auto-save content ─────────────────────────────────────────────────────────
  function triggerAutoSave(content: object, atts: Attachment[]) {
    if (!activeStep) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaveStatus('saving')
    autoSaveTimer.current = setTimeout(async () => {
      await supabase.from('steps').update({
        content: { ...content, attachments: atts },
        updated_at: new Date().toISOString()
      }).eq('id', activeStep.id)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1500)
  }

  function handleContentChange(c: object) {
    setStepContent(c)
    triggerAutoSave(c, attachments)
  }

  // ── Topic CRUD ────────────────────────────────────────────────────────────────
  async function addTopic() {
    if (!newTopicTitle.trim()) return
    const { data } = await supabase
      .from('topics')
      .insert({ subject_id: id, title: newTopicTitle.trim(), order_index: topics.length })
      .select().single()
    if (data) {
      const newTopic = { ...data, steps: [] }
      setTopics([...topics, newTopic])
      setExpandedTopics(new Set([...expandedTopics, data.id]))
      setNewTopicTitle('')
      setAddingTopic(false)
    }
  }

  async function saveTopic(topicId: string) {
    await supabase.from('topics').update({ title: editingTopicTitle }).eq('id', topicId)
    setTopics(topics.map(t => t.id === topicId ? { ...t, title: editingTopicTitle } : t))
    setEditingTopic(null)
  }

  async function deleteTopic(topicId: string) {
    if (!confirm('Delete this topic and all its steps?')) return
    await supabase.from('topics').delete().eq('id', topicId)
    const remaining = topics.filter(t => t.id !== topicId)
    setTopics(remaining)
    if (activeStep && topics.find(t => t.id === topicId)?.steps.find(s => s.id === activeStep.id)) setActiveStep(null)
  }

  async function moveTopicUp(topicId: string) {
    const idx = topics.findIndex(t => t.id === topicId)
    if (idx <= 0) return
    const updated = [...topics]
    ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
    const reindexed = updated.map((t, i) => ({ ...t, order_index: i }))
    setTopics(reindexed)
    await Promise.all(reindexed.map(t => supabase.from('topics').update({ order_index: t.order_index }).eq('id', t.id)))
  }

  async function moveTopicDown(topicId: string) {
    const idx = topics.findIndex(t => t.id === topicId)
    if (idx >= topics.length - 1) return
    const updated = [...topics]
    ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
    const reindexed = updated.map((t, i) => ({ ...t, order_index: i }))
    setTopics(reindexed)
    await Promise.all(reindexed.map(t => supabase.from('topics').update({ order_index: t.order_index }).eq('id', t.id)))
  }

  // ── Step CRUD ─────────────────────────────────────────────────────────────────
  async function addStep(topicId: string) {
    const title = newStepTitle[topicId]?.trim()
    if (!title) return
    const topic = topics.find(t => t.id === topicId)
    const { data } = await supabase
      .from('steps')
      .insert({ topic_id: topicId, title, order_index: topic?.steps.length ?? 0, content: {} })
      .select().single()
    if (data) {
      setTopics(topics.map(t => t.id === topicId ? { ...t, steps: [...t.steps, data] } : t))
      setNewStepTitle({ ...newStepTitle, [topicId]: '' })
      setAddingStep(null)
      loadStep(data)
    }
  }

  async function saveStepTitle(stepId: string, topicId: string) {
    await supabase.from('steps').update({ title: editingStepTitle }).eq('id', stepId)
    setTopics(topics.map(t => t.id === topicId ? { ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, title: editingStepTitle } : s) } : t))
    if (activeStep?.id === stepId) setActiveStep(s => s ? { ...s, title: editingStepTitle } : s)
    setEditingStep(null)
  }

  async function deleteStep(stepId: string, topicId: string) {
    if (!confirm('Delete this step?')) return
    await supabase.from('steps').delete().eq('id', stepId)
    setTopics(topics.map(t => t.id === topicId ? { ...t, steps: t.steps.filter(s => s.id !== stepId) } : t))
    if (activeStep?.id === stepId) setActiveStep(null)
  }

  async function moveStepUp(stepId: string, topicId: string) {
    const topic = topics.find(t => t.id === topicId)!
    const idx = topic.steps.findIndex(s => s.id === stepId)
    if (idx <= 0) return
    const updated = [...topic.steps]
    ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
    const reindexed = updated.map((s, i) => ({ ...s, order_index: i }))
    setTopics(topics.map(t => t.id === topicId ? { ...t, steps: reindexed } : t))
    await Promise.all(reindexed.map(s => supabase.from('steps').update({ order_index: s.order_index }).eq('id', s.id)))
  }

  async function moveStepDown(stepId: string, topicId: string) {
    const topic = topics.find(t => t.id === topicId)!
    const idx = topic.steps.findIndex(s => s.id === stepId)
    if (idx >= topic.steps.length - 1) return
    const updated = [...topic.steps]
    ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
    const reindexed = updated.map((s, i) => ({ ...s, order_index: i }))
    setTopics(topics.map(t => t.id === topicId ? { ...t, steps: reindexed } : t))
    await Promise.all(reindexed.map(s => supabase.from('steps').update({ order_index: s.order_index }).eq('id', s.id)))
  }

  function loadStep(step: Step) {
    setActiveStep(step)
    setStepContent(step.content ?? {})
    setAttachments((step.content as any)?.attachments ?? [])
    setActiveTab('content')
    setSaveStatus('idle')
  }

  // ── Topic drag-and-drop ───────────────────────────────────────────────────────
  function onTopicDragStart(e: React.DragEvent, topicId: string) {
    setDragTopic(topicId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onTopicDragOver(e: React.DragEvent, topicId: string) {
    e.preventDefault()
    setDragOverTopic(topicId)
  }

  async function onTopicDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!dragTopic || dragTopic === targetId) { setDragTopic(null); setDragOverTopic(null); return }
    const from = topics.findIndex(t => t.id === dragTopic)
    const to = topics.findIndex(t => t.id === targetId)
    const updated = [...topics]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    const reindexed = updated.map((t, i) => ({ ...t, order_index: i }))
    setTopics(reindexed)
    setDragTopic(null); setDragOverTopic(null)
    await Promise.all(reindexed.map(t => supabase.from('topics').update({ order_index: t.order_index }).eq('id', t.id)))
  }

  // ── Step drag-and-drop ────────────────────────────────────────────────────────
  function onStepDragStart(e: React.DragEvent, stepId: string, topicId: string) {
    setDragStep(stepId); setDragStepTopic(topicId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onStepDragOver(e: React.DragEvent, stepId: string) {
    e.preventDefault(); setDragOverStep(stepId)
  }

  async function onStepDrop(e: React.DragEvent, targetId: string, topicId: string) {
    e.preventDefault()
    if (!dragStep || dragStep === targetId || dragStepTopic !== topicId) { setDragStep(null); setDragOverStep(null); return }
    const topic = topics.find(t => t.id === topicId)!
    const from = topic.steps.findIndex(s => s.id === dragStep)
    const to = topic.steps.findIndex(s => s.id === targetId)
    const updated = [...topic.steps]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    const reindexed = updated.map((s, i) => ({ ...s, order_index: i }))
    setTopics(topics.map(t => t.id === topicId ? { ...t, steps: reindexed } : t))
    setDragStep(null); setDragOverStep(null)
    await Promise.all(reindexed.map(s => supabase.from('steps').update({ order_index: s.order_index }).eq('id', s.id)))
  }

  // ── Subject metadata ──────────────────────────────────────────────────────────
  function openMetaEdit() {
    if (!subject) return
    setMetaTitle(subject.title)
    setMetaDesc((subject as any).description ?? '')
    setMetaEmoji(subject.emoji)
    setMetaColor(subject.cover_color)
    setEditingMeta(true)
  }

  async function saveSubjectMeta() {
    setSavingMeta(true)
    await supabase.from('subjects').update({
      title: metaTitle.trim(),
      description: metaDesc.trim() || null,
      emoji: metaEmoji,
      cover_color: metaColor
    }).eq('id', id)
    setSubject(s => s ? { ...s, title: metaTitle.trim(), emoji: metaEmoji, cover_color: metaColor } : s)
    setSavingMeta(false)
    setEditingMeta(false)
  }

  async function deleteSubject() {
    if (!confirm(`Delete "${subject?.title}" and all its topics, steps, and content? This cannot be undone.`)) return
    await supabase.from('subjects').delete().eq('id', id)
    router.push('/admin/subjects')
  }

  // ── Attachments ───────────────────────────────────────────────────────────────
  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const path = `steps/${activeStep!.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('training-files').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('training-files').getPublicUrl(path)
      const type: AttachmentType = file.type === 'application/pdf' ? 'pdf' : 'file'
      const newAtt: Attachment = { type, name: file.name, url: publicUrl, size: file.size }
      const updated = [...attachments, newAtt]
      setAttachments(updated)
      await supabase.from('steps').update({ content: { ...stepContent, attachments: updated } }).eq('id', activeStep!.id)
    } catch (e: any) { alert('Upload failed: ' + e.message) }
    setUploading(false)
  }

  async function addVideoLink() {
    if (!videoUrl.trim()) return
    const name = videoName.trim() || detectPlatformName(videoUrl)
    const newAtt: Attachment = { type: 'video_url', name, url: videoUrl.trim() }
    const updated = [...attachments, newAtt]
    setAttachments(updated)
    setVideoUrl(''); setVideoName(''); setShowVideoInput(false)
    await supabase.from('steps').update({ content: { ...stepContent, attachments: updated } }).eq('id', activeStep!.id)
  }

  async function removeAttachment(idx: number) {
    const updated = attachments.filter((_, i) => i !== idx)
    setAttachments(updated)
    await supabase.from('steps').update({ content: { ...stepContent, attachments: updated } }).eq('id', activeStep!.id)
  }

  async function moveAttachment(idx: number, dir: -1 | 1) {
    const updated = [...attachments]
    ;[updated[idx], updated[idx + dir]] = [updated[idx + dir], updated[idx]]
    setAttachments(updated)
    await supabase.from('steps').update({ content: { ...stepContent, attachments: updated } }).eq('id', activeStep!.id)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!subject) return <div className="p-8 text-slate-500">Module not found.</div>

  return (
    <>
    <div className="flex h-screen flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/subjects" className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {/* Clickable subject icon + title */}
          <button
            onClick={openMetaEdit}
            className="flex items-center gap-2.5 group hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors min-w-0"
            title="Edit module settings"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: subject.cover_color + '25' }}
            >
              {subject.emoji}
            </div>
            <span className="font-semibold text-slate-900 text-sm truncate">{subject.title}</span>
            <Settings className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Save status indicator */}
          {saveStatus !== 'idle' && (
            <span className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 transition-all',
              saveStatus === 'saving' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
            )}>
              {saveStatus === 'saving' ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : <><Check className="w-3 h-3" /> Saved</>}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAccessModal(true)} title="Manage who can access this module">
            <Users className="w-3.5 h-3.5" /> Manage Access
          </Button>
          <a href={`/training/${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" title="Preview as user">
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
          </a>
          <Link href={`/admin/subjects/${id}/quiz`}>
            <Button variant="outline" size="sm">
              <HelpCircle className="w-3.5 h-3.5" /> Quiz Builder
            </Button>
          </Link>
          <button
            onClick={deleteSubject}
            className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Subject metadata edit panel ── */}
      {editingMeta && (
        <div className="bg-white border-b border-slate-200 px-6 py-5 shrink-0 shadow-sm">
          <div className="max-w-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Edit Module Settings</p>
              <button onClick={() => setEditingMeta(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-3">
              <input
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                placeholder="Module title"
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <textarea
                value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={1}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setMetaEmoji(e)}
                      className={cn('w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all',
                        metaEmoji === e ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200'
                      )}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setMetaColor(c)}
                      className={cn('w-7 h-7 rounded-lg transition-all', metaColor === c ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : 'hover:scale-105')}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Live preview chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold mr-auto"
                style={{ backgroundColor: metaColor + '20', color: metaColor }}>
                <span>{metaEmoji}</span> {metaTitle || 'Preview'}
              </div>
              <Button size="sm" onClick={saveSubjectMeta} loading={savingMeta}>
                <Check className="w-3.5 h-3.5" /> Save changes
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingMeta(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: Topics & Steps ── */}
        <div className="w-72 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Structure</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {topics.map((topic, topicIdx) => (
              <div
                key={topic.id}
                draggable
                onDragStart={e => onTopicDragStart(e, topic.id)}
                onDragOver={e => onTopicDragOver(e, topic.id)}
                onDrop={e => onTopicDrop(e, topic.id)}
                onDragLeave={() => setDragOverTopic(null)}
                className={cn('rounded-xl transition-all', dragOverTopic === topic.id && dragTopic !== topic.id && 'ring-2 ring-indigo-400 ring-offset-1')}
              >
                {/* Topic row */}
                <div className="flex items-center gap-1 group rounded-lg hover:bg-slate-50 px-1.5 py-1.5">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
                  <button
                    onClick={() => setExpandedTopics(prev => {
                      const n = new Set(prev); n.has(topic.id) ? n.delete(topic.id) : n.add(topic.id); return n
                    })}
                    className="flex items-center gap-1.5 flex-1 text-left min-w-0"
                  >
                    {expandedTopics.has(topic.id)
                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    }
                    {editingTopic === topic.id ? (
                      <input
                        autoFocus
                        value={editingTopicTitle}
                        onChange={e => setEditingTopicTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTopic(topic.id); if (e.key === 'Escape') setEditingTopic(null) }}
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-semibold text-slate-700 bg-transparent border-b border-indigo-400 outline-none flex-1 min-w-0"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-700 truncate leading-snug">{topic.title}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => moveTopicUp(topic.id)} disabled={topicIdx === 0}
                      className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-25">
                      <ArrowUp className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => moveTopicDown(topic.id)} disabled={topicIdx === topics.length - 1}
                      className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-25">
                      <ArrowDown className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => { setEditingTopic(topic.id); setEditingTopicTitle(topic.title) }}
                      className="p-0.5 rounded hover:bg-slate-100">
                      <Pencil className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => deleteTopic(topic.id)} className="p-0.5 rounded hover:bg-red-50">
                      <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Steps */}
                {expandedTopics.has(topic.id) && (
                  <div className="ml-6 mt-0.5 space-y-0.5 pb-1">
                    {topic.steps.map((step, stepIdx) => (
                      <div
                        key={step.id}
                        draggable
                        onDragStart={e => onStepDragStart(e, step.id, topic.id)}
                        onDragOver={e => onStepDragOver(e, step.id)}
                        onDrop={e => onStepDrop(e, step.id, topic.id)}
                        onDragLeave={() => setDragOverStep(null)}
                        onClick={() => { if (editingStep !== step.id) loadStep(step) }}
                        className={cn(
                          'flex items-center gap-1.5 group px-2 py-1.5 rounded-lg cursor-pointer transition-all',
                          activeStep?.id === step.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600',
                          dragOverStep === step.id && dragStep !== step.id && 'ring-2 ring-indigo-300'
                        )}
                      >
                        <GripVertical className="w-3 h-3 text-slate-300 shrink-0 cursor-grab" />
                        {editingStep === step.id ? (
                          <input
                            autoFocus
                            value={editingStepTitle}
                            onChange={e => setEditingStepTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveStepTitle(step.id, topic.id)
                              if (e.key === 'Escape') setEditingStep(null)
                            }}
                            onClick={e => e.stopPropagation()}
                            className="text-xs flex-1 bg-transparent border-b border-indigo-400 outline-none min-w-0"
                          />
                        ) : (
                          <span className="text-xs flex-1 truncate">{step.title}</span>
                        )}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={e => { e.stopPropagation(); moveStepUp(step.id, topic.id) }} disabled={stepIdx === 0}
                            className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20">
                            <ArrowUp className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); moveStepDown(step.id, topic.id) }} disabled={stepIdx === topic.steps.length - 1}
                            className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20">
                            <ArrowDown className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setEditingStep(step.id); setEditingStepTitle(step.title) }}
                            className="p-0.5 rounded hover:bg-slate-100">
                            <Pencil className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteStep(step.id, topic.id) }}
                            className="p-0.5 rounded hover:bg-red-50">
                            <Trash2 className="w-2.5 h-2.5 text-slate-300 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add step */}
                    {addingStep === topic.id ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <input
                          autoFocus
                          placeholder="Step title…"
                          value={newStepTitle[topic.id] || ''}
                          onChange={e => setNewStepTitle({ ...newStepTitle, [topic.id]: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') addStep(topic.id); if (e.key === 'Escape') setAddingStep(null) }}
                          className="text-xs flex-1 border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                        <button onClick={() => addStep(topic.id)} className="p-1 rounded bg-indigo-600 text-white">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setAddingStep(null)} className="p-1 rounded hover:bg-slate-100">
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingStep(topic.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-indigo-600 w-full rounded-lg hover:bg-indigo-50/60 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add step
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add topic */}
            {addingTopic ? (
              <div className="flex items-center gap-1 px-2 py-1 mt-1">
                <input
                  autoFocus
                  placeholder="Topic title…"
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTopic(); if (e.key === 'Escape') setAddingTopic(false) }}
                  className="text-xs flex-1 border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button onClick={addTopic} className="p-1 rounded bg-indigo-600 text-white"><Check className="w-3 h-3" /></button>
                <button onClick={() => setAddingTopic(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-3 h-3 text-slate-400" /></button>
              </div>
            ) : (
              <button
                onClick={() => setAddingTopic(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-indigo-600 w-full rounded-xl hover:bg-indigo-50 transition-colors mt-1 font-semibold border border-dashed border-slate-200 hover:border-indigo-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add Topic
              </button>
            )}
          </div>
        </div>

        {/* ── Right panel: Step editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {activeStep ? (
            <>
              {/* Step header */}
              <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Editing step</p>
                  {editingStep === activeStep.id ? (
                    <input
                      autoFocus
                      value={editingStepTitle}
                      onChange={e => setEditingStepTitle(e.target.value)}
                      onKeyDown={e => {
                        const topicId = topics.find(t => t.steps.some(s => s.id === activeStep.id))?.id ?? ''
                        if (e.key === 'Enter') saveStepTitle(activeStep.id, topicId)
                        if (e.key === 'Escape') setEditingStep(null)
                      }}
                      className="text-lg font-bold text-slate-900 bg-transparent border-b-2 border-indigo-400 outline-none w-full"
                    />
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h2 className="text-lg font-bold text-slate-900 truncate">{activeStep.title}</h2>
                      <button
                        onClick={() => { setEditingStep(activeStep.id); setEditingStepTitle(activeStep.title) }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-8 py-2 bg-white border-b border-slate-200 shrink-0">
                <button
                  onClick={() => setActiveTab('content')}
                  className={cn('px-4 py-1.5 rounded-full text-xs font-semibold transition-colors',
                    activeTab === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  ✏️ Content
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={cn('px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5',
                    activeTab === 'attachments' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  <Paperclip className="w-3 h-3" />
                  Videos & Files
                  {attachments.length > 0 && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                      activeTab === 'attachments' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    )}>
                      {attachments.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'content' ? (
                  <div className="max-w-3xl mx-auto p-8">
                    <RichTextEditor
                      key={activeStep.id}
                      content={activeStep.content}
                      onChange={handleContentChange}
                      placeholder="Write training content here…"
                    />
                    <p className="text-[11px] text-slate-300 mt-4 text-center">Auto-saves as you type</p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto p-8 space-y-5">

                    {/* Video URL input */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Video className="w-3.5 h-3.5 text-purple-500" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">Add Video</span>
                        </div>
                        <button
                          onClick={() => setShowVideoInput(!showVideoInput)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {showVideoInput ? 'Cancel' : '+ Add video'}
                        </button>
                      </div>
                      {showVideoInput && (
                        <div className="px-5 py-4 space-y-3">
                          <input
                            type="url"
                            placeholder="Paste YouTube, Vimeo, Loom, or Google Drive URL…"
                            value={videoUrl}
                            onChange={e => {
                              setVideoUrl(e.target.value)
                              if (!videoName) setVideoName(detectPlatformName(e.target.value))
                            }}
                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <input
                            type="text"
                            placeholder="Display name (e.g. Introduction Recording)"
                            value={videoName}
                            onChange={e => setVideoName(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={addVideoLink} disabled={!videoUrl.trim()}>
                              <Check className="w-3.5 h-3.5" /> Add Video
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setShowVideoInput(false); setVideoUrl(''); setVideoName('') }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      {!showVideoInput && (
                        <p className="text-xs text-slate-400 px-5 py-2.5">Supports YouTube, Vimeo, Loom, Google Drive</p>
                      )}
                    </div>

                    {/* File upload */}
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(uploadFile) }}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <input id="file-upload" type="file" multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={e => Array.from(e.target.files ?? []).forEach(uploadFile)}
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                          <p className="text-sm text-slate-500">Uploading…</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 bg-slate-100 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <p className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700 transition-colors">Drop files or click to upload</p>
                          <p className="text-xs text-slate-400">PDF, Word, PowerPoint, Excel, MP4, images</p>
                        </div>
                      )}
                    </div>

                    {/* Attached files list */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Attached ({attachments.length})</p>
                        {attachments.map((att, idx) => (
                          <div key={idx} className={cn(
                            'flex items-center gap-3 bg-white border rounded-xl p-3 group transition-all',
                            dragOverStep === `att-${idx}` ? 'border-indigo-300 shadow-sm' : 'border-slate-100'
                          )}>
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                              att.type === 'pdf' ? 'bg-red-50' : att.type === 'video_url' ? 'bg-purple-50' : 'bg-blue-50'
                            )}>
                              {att.type === 'pdf' && <FileText className="w-4 h-4 text-red-500" />}
                              {att.type === 'video_url' && <Video className="w-4 h-4 text-purple-500" />}
                              {att.type === 'file' && <File className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{att.name}</p>
                              <p className="text-xs text-slate-400 truncate">{att.url}</p>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveAttachment(idx, -1)} disabled={idx === 0}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-20 text-slate-400">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveAttachment(idx, 1)} disabled={idx === attachments.length - 1}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-20 text-slate-400">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <a href={att.url} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button onClick={() => removeAttachment(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-indigo-300" />
                </div>
                <p className="text-slate-600 font-semibold">Select a step to edit</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">
                  Pick a step from the left, or add a new topic and step to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Manage Access modal */}
    {showAccessModal && subject && (
      <ManageAccessModal
        subjectId={id}
        subjectTitle={subject.title}
        onClose={() => setShowAccessModal(false)}
      />
    )}
    </>
  )
}
