'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, ArrowLeft, ArrowRight, Check, BookOpen, Menu, X, FileText, Video, File, Download } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type PageParams = { params: Promise<{ subjectId: string; topicId: string }> }

// ── Converts any shareable video URL into its embeddable iframe src ───────────
function resolveEmbedUrl(url: string): string | null {
  try {
    // YouTube: watch?v=ID  or  youtu.be/ID
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url).searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    // Vimeo — handles both public (vimeo.com/ID) and private (vimeo.com/ID/HASH)
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

    // Loom
    if (url.includes('loom.com/share/')) {
      const id = url.split('loom.com/share/')[1]?.split('?')[0]
      return id ? `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true` : null
    }

    // Google Drive: /file/d/FILE_ID/view  →  /file/d/FILE_ID/preview
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
  const router = useRouter()
  const supabase = createClient()

  const [steps, setSteps] = useState<any[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [topicTitle, setTopicTitle] = useState('')
  const [subjectTitle, setSubjectTitle] = useState('')
  const [subjectEmoji, setSubjectEmoji] = useState('📚')
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => { loadData() }, [topicId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: topic } = await supabase
      .from('topics')
      .select(`title, subjects(title, emoji), steps(id, title, content, order_index)`)
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

    const { data: progress } = await supabase
      .from('step_progress').select('step_id').eq('user_id', user.id)
    setCompletedIds(new Set(progress?.map(p => p.step_id) ?? []))
    setLoading(false)
  }

  async function markComplete() {
    const step = steps[currentStepIdx]
    if (!step || completedIds.has(step.id)) return
    setMarking(true)
    await supabase.from('step_progress').upsert({ user_id: userId, step_id: step.id })
    setCompletedIds(new Set([...completedIds, step.id]))
    setMarking(false)
  }

  async function markAndNext() {
    await markComplete()
    if (currentStepIdx < steps.length - 1) setCurrentStepIdx(currentStepIdx + 1)
  }

  const currentStep = steps[currentStepIdx]
  const isCurrentDone = currentStep ? completedIds.has(currentStep.id) : false
  const completedCount = steps.filter(s => completedIds.has(s.id)).length
  const percent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0
  const allDone = steps.length > 0 && completedCount === steps.length

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full" />
        <p className="text-slate-400 text-sm">Loading content…</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* ── Step sidebar ── */}
      <div className={cn(
        'flex flex-col border-r border-slate-100 bg-slate-50 shrink-0 transition-all duration-300 overflow-hidden',
        sidebarOpen ? 'w-64' : 'w-0'
      )}>
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-slate-100 shrink-0">
          <Link href={`/training/${subjectId}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 mb-3 transition-colors group">
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
            const done = completedIds.has(step.id)
            const active = i === currentStepIdx
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIdx(i)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 text-left transition-all group border-r-2',
                  active
                    ? 'bg-indigo-50 border-indigo-500'
                    : 'border-transparent hover:bg-white hover:border-slate-200'
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                    active ? 'border-indigo-500' : 'border-slate-300 group-hover:border-slate-400'
                  )} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs leading-snug font-medium truncate',
                    active ? 'text-indigo-700' : done ? 'text-slate-400' : 'text-slate-600'
                  )}>
                    {step.title}
                  </p>
                </div>
              </button>
            )
          })}
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
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
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

              {/* Attachments first: Videos, PDFs, Files */}
              {(() => {
                const atts: any[] = (currentStep.content as any)?.attachments ?? []
                if (atts.length === 0) return null
                return (
                  <div className="mb-6 space-y-3">
                    {atts.map((att: any, idx: number) => {
                      const isVideo = att.type === 'video_url'
                      const isPdf = att.type === 'pdf'
                      const embedUrl = isVideo ? resolveEmbedUrl(att.url) : null
                      const isEmbeddable = embedUrl !== null
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
                                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
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
                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
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

              {/* Text content below attachments */}
              {currentStep.content && Object.keys(currentStep.content).length > 0 && (
                (() => {
                  // Only render text block if there's actual paragraph content
                  const paragraphs = (currentStep.content as any)?.content ?? []
                  const hasText = paragraphs.some((node: any) =>
                    node?.content?.some((c: any) => c?.text?.trim())
                  )
                  if (!hasText) return null
                  return (
                    <div className={cn(
                      'rounded-2xl border p-6 mb-6 transition-all',
                      isCurrentDone ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'
                    )}>
                      <RichTextEditor content={currentStep.content} readOnly />
                    </div>
                  )
                })()
              )}

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
                    <Button variant="outline" size="sm" onClick={markComplete} loading={marking}>
                      <Check className="w-3.5 h-3.5" /> Mark done
                    </Button>
                  )}
                  {currentStepIdx < steps.length - 1 ? (
                    <Button size="sm" onClick={markAndNext} loading={marking}>
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Link href={`/training/${subjectId}`}>
                      <Button size="sm" variant={allDone ? 'success' : 'default'}>
                        {allDone ? <><CheckCircle2 className="w-3.5 h-3.5" /> Finish</> : 'Back to Module'}
                      </Button>
                    </Link>
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
  )
}
