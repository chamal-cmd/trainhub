'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2, ArrowLeft, ArrowRight, Check, BookOpen,
  Menu, X, FileText, Video, File, Download, Sparkles, ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import TopicQuizModal from '@/components/shared/TopicQuizModal'

type PageParams = { params: Promise<{ subjectId: string; topicId: string }> }

function extractYouTubeUrls(node: any, out: string[] = []): string[] {
  if (!node) return out
  if (node.type === 'youtube' && node.attrs?.src) out.push(node.attrs.src)
  if (Array.isArray(node.content)) node.content.forEach((c: any) => extractYouTubeUrls(c, out))
  return out
}

// ── Converts any shareable video URL into its embeddable iframe src ───────────
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
      const path  = url.split('vimeo.com/')[1]?.split('?')[0] ?? ''
      const parts = path.split('/')
      const videoId = parts[0]
      const hash    = parts[1]
      if (!videoId) return null
      return hash
        ? `https://player.vimeo.com/video/${videoId}?h=${hash}&badge=0&autopause=0&player_id=0`
        : `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0`
    }
    if (url.includes('loom.com/share/')) {
      const id = url.split('loom.com/share/')[1]?.split('?')[0]
      return id ? `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true` : null
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1]?.split('/')[0]
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null
    }
    return null
  } catch {
    return null
  }
}

export default function TopicPage({ params }: PageParams) {
  const { subjectId, topicId } = use(params)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const supabase     = createClient()

  const [steps,          setSteps]          = useState<any[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [completedIds,   setCompletedIds]   = useState<Set<string>>(new Set())
  const [topicTitle,     setTopicTitle]     = useState('')
  const [subjectTitle,   setSubjectTitle]   = useState('')
  const [subjectEmoji,   setSubjectEmoji]   = useState('📚')
  const [marking,        setMarking]        = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [userId,         setUserId]         = useState('')
  const [sidebarOpen,    setSidebarOpen]    = useState(false)

  // Next-topic info (for post-quiz navigation)
  const [nextTopicHref, setNextTopicHref]   = useState<string | undefined>(undefined)

  // Quiz modal
  const [showQuiz, setShowQuiz] = useState(false)

  // SOP expand state: set of attachment indices that are expanded
  const [expandedSops, setExpandedSops] = useState<Set<string>>(new Set())
  function toggleSop(key: string) {
    setExpandedSops(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  useEffect(() => { loadData() }, [topicId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: topic } = await supabase
      .from('topics')
      .select('title, subjects(title, emoji), steps(id, title, content, order_index)')
      .eq('id', topicId)
      .single()

    if (topic) {
      setTopicTitle(topic.title)
      setSubjectTitle((topic.subjects as any)?.title ?? '')
      setSubjectEmoji((topic.subjects as any)?.emoji ?? '📚')
      const sorted = ((topic.steps as any[]) ?? []).sort((a, b) => a.order_index - b.order_index)
      setSteps(sorted)

      const stepId = searchParams.get('step')
      if (stepId) {
        const idx = sorted.findIndex((s: any) => s.id === stepId)
        if (idx >= 0) setCurrentStepIdx(idx)
      }
    }

    // Load progress
    const { data: progress } = await supabase
      .from('step_progress').select('step_id').eq('user_id', user.id)
    setCompletedIds(new Set(progress?.map(p => p.step_id) ?? []))

    // Load sibling topics to find the next one
    const { data: allTopics } = await supabase
      .from('topics')
      .select('id, order_index, steps(id, order_index)')
      .eq('subject_id', subjectId)
      .order('order_index')

    if (allTopics) {
      const idx  = allTopics.findIndex(t => t.id === topicId)
      const next = allTopics[idx + 1]
      if (next) {
        const firstStep = ((next.steps as any[]) ?? []).sort((a: any, b: any) => a.order_index - b.order_index)[0]
        setNextTopicHref(
          firstStep
            ? `/training/${subjectId}/${next.id}?step=${firstStep.id}`
            : `/training/${subjectId}/${next.id}`
        )
      }
    }

    setLoading(false)
  }

  // ── Mark a step complete without navigating ──────────────────────────────
  async function markComplete(): Promise<Set<string>> {
    const step = steps[currentStepIdx]
    if (!step || completedIds.has(step.id)) return completedIds
    setMarking(true)
    await supabase.from('step_progress').upsert({ user_id: userId, step_id: step.id })
    const next = new Set([...completedIds, step.id])
    setCompletedIds(next)
    setMarking(false)
    return next
  }

  // ── Mark done + advance ──────────────────────────────────────────────────
  async function markAndNext() {
    const newCompleted = await markComplete()
    const allNowDone   = steps.length > 0 && steps.every(s => newCompleted.has(s.id))

    if (allNowDone) {
      // Topic complete — launch AI quiz
      setShowQuiz(true)
    } else if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
  }

  // ── "Mark done" only button (last step already complete but quiz not taken)
  async function markCompleteOnly() {
    const newCompleted = await markComplete()
    const allNowDone   = steps.length > 0 && steps.every(s => newCompleted.has(s.id))
    if (allNowDone) setShowQuiz(true)
  }

  const currentStep    = steps[currentStepIdx]
  const isCurrentDone  = currentStep ? completedIds.has(currentStep.id) : false
  const completedCount = steps.filter(s => completedIds.has(s.id)).length
  const percent        = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0
  const allDone        = steps.length > 0 && completedCount === steps.length

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full" />
        <p className="text-slate-400 text-sm">Loading content…</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex h-screen bg-white overflow-hidden">
        {/* ── Step sidebar ── */}
        <div className={cn(
          'flex flex-col border-r border-slate-100 bg-slate-50 shrink-0 transition-all duration-300 overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}>
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-slate-100 shrink-0">
            <Link href={`/training/${subjectId}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-600 mb-3 transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to module
            </Link>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{subjectEmoji}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 truncate">{subjectTitle}</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{topicTitle}</p>
              </div>
            </div>
            <Progress value={percent} className="h-1.5" />
            <p className="text-[10px] text-slate-400 mt-1.5">{completedCount} of {steps.length} complete · {percent}%</p>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto py-2">
            {steps.map((step, i) => {
              const done   = completedIds.has(step.id)
              const active = i === currentStepIdx
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIdx(i)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-left transition-all group border-r-2',
                    active ? 'bg-violet-50 border-violet-500' : 'border-transparent hover:bg-white hover:border-slate-200'
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                      active ? 'border-violet-500' : 'border-slate-300 group-hover:border-slate-400'
                    )} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs leading-snug font-medium truncate',
                      active ? 'text-violet-700' : done ? 'text-slate-400' : 'text-slate-600'
                    )}>
                      {step.title}
                    </p>
                  </div>
                </button>
              )
            })}

            {/* "Quiz available" indicator at bottom of step list */}
            {allDone && (
              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left transition-all group border-r-2 border-transparent hover:bg-white hover:border-violet-200 mt-1 border-t border-slate-100"
              >
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <p className="text-xs font-medium text-violet-600">Knowledge check quiz</p>
              </button>
            )}
          </div>
        </div>

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 h-14 border-b border-slate-100 bg-white shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">{subjectTitle} · {topicTitle}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              <BookOpen className="w-3 h-3" />
              {currentStepIdx + 1} / {steps.length}
            </div>
          </div>

          {/* Content */}
          {currentStep ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-8 py-10">
                {/* Step header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                      Step {currentStepIdx + 1}
                    </span>
                    {isCurrentDone && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{currentStep.title}</h1>
                </div>

                {/* Attachments */}
                {(() => {
                  const atts: any[] = (currentStep.content as any)?.attachments ?? []
                  if (atts.length === 0) return null
                  return (
                    <div className="mb-6 space-y-3">
                      {atts.map((att: any, idx: number) => {
                        const isVideo      = att.type === 'video_url'
                        const isPdf        = att.type === 'pdf'
                        const isSop        = att.type === 'sop' || att.type === 'docx'
                        const embedUrl     = isVideo ? resolveEmbedUrl(att.url) : null
                        const isEmbeddable = embedUrl !== null
                        const sopKey       = `${currentStep.id}-${idx}`
                        const sopExpanded  = expandedSops.has(sopKey)

                        if (isSop) return (
                          <div key={idx} className="border border-amber-200 bg-amber-50/30 rounded-xl overflow-hidden">
                            {/* SOP header row */}
                            <div className="flex items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">Standard Operating Procedure</p>
                                  <p className="text-xs text-slate-500">{att.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={att.url}
                                  download
                                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </a>
                                {att.content && (
                                  <button
                                    onClick={() => toggleSop(sopKey)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    <ChevronDown className={cn('w-3 h-3 transition-transform', sopExpanded && 'rotate-180')} />
                                    {sopExpanded ? 'Collapse' : 'View SOP'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Expandable SOP content */}
                            {sopExpanded && att.content && (
                              <div className="border-t border-amber-200 bg-white px-6 py-5">
                                <RichTextEditor content={att.content} readOnly />
                              </div>
                            )}
                          </div>
                        )

                        return (
                          <div key={idx} className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                            {isEmbeddable && embedUrl ? (
                              <div>
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
                                  <Video className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm font-medium text-slate-700 truncate">{att.name || 'Video'}</span>
                                </div>
                                <div className="aspect-video">
                                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="encrypted-media" />
                                </div>
                              </div>
                            ) : isPdf ? (
                              <div>
                                <div className="flex items-center justify-between px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{att.name}</p>
                                      <p className="text-xs text-slate-400">PDF Document</p>
                                    </div>
                                  </div>
                                  <a href={att.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <Download className="w-3 h-3" /> Open PDF
                                  </a>
                                </div>
                                <iframe src={att.url + '#toolbar=0'} className="w-full h-96 border-t border-slate-100" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <File className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">{att.name}</p>
                                    <p className="text-xs text-slate-400">Attachment</p>
                                  </div>
                                </div>
                                <a href={att.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
                                  <Download className="w-3 h-3" /> Download
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Text content */}
                {currentStep.content && (() => {
                  const nodes = (currentStep.content as any)?.content
                  if (!Array.isArray(nodes) || nodes.length === 0) return null
                  const ytUrls = extractYouTubeUrls(currentStep.content)
                  return (
                    <div className={cn(
                      'rounded-2xl border p-6 mb-6 transition-all',
                      isCurrentDone ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'
                    )}>
                      <RichTextEditor key={currentStep.id} content={currentStep.content} readOnly />
                      {ytUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ytUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                              Watch on YouTube
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                    disabled={currentStepIdx === 0}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {!isCurrentDone && (
                      <Button variant="outline" size="sm" onClick={markCompleteOnly} loading={marking}>
                        <Check className="w-3.5 h-3.5" /> Mark done
                      </Button>
                    )}

                    {currentStepIdx < steps.length - 1 ? (
                      <Button size="sm" onClick={markAndNext} loading={marking}>
                        Next <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      /* Last step */
                      allDone ? (
                        <Button size="sm" variant="success" onClick={() => setShowQuiz(true)}>
                          <Sparkles className="w-3.5 h-3.5" /> Knowledge Check
                        </Button>
                      ) : (
                        <Button size="sm" onClick={markAndNext} loading={marking}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Finish &amp; Quiz
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400 text-sm">No steps in this topic.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Topic Quiz Modal ── */}
      {showQuiz && (
        <TopicQuizModal
          topicId={topicId}
          topicTitle={topicTitle}
          userId={userId}
          subjectId={subjectId}
          nextTopicHref={nextTopicHref}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </>
  )
}
