'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  HelpCircle, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  Sparkles, Loader2, RefreshCw, BookOpen, Zap,
} from 'lucide-react'

interface Question {
  question_text: string
  explanation: string
  correct_index: number
  options: string[]
}

interface AiQuiz {
  generated_at: string
  passing_score: number
  questions: Question[]
}

interface Topic {
  id: string
  title: string
  ai_quiz: AiQuiz | null
}

interface Subject {
  id: string
  title: string
  topics: Topic[]
}

interface Props {
  subjects: Subject[]
}

export default function QuizBankClient({ subjects: initial }: Props) {
  const supabase = createClient()

  // Local copy of subjects so we can update quiz data after generation
  const [subjects, setSubjects] = useState<Subject[]>(initial)
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(
    () => new Set(initial.length > 0 ? [initial[0].id] : [])
  )
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [generating, setGenerating] = useState<string | null>(null) // topicId being generated
  const [genError, setGenError] = useState<string>('')

  const totalTopics = subjects.reduce((n, s) => n + s.topics.length, 0)
  const generatedCount = subjects.reduce(
    (n, s) => n + s.topics.filter(t => t.ai_quiz?.questions?.length).length, 0
  )
  const allTopics = subjects.flatMap(s => s.topics)
  const missingTopics = allTopics.filter(t => !t.ai_quiz?.questions?.length)

  function toggleSubject(id: string) {
    setOpenSubjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function updateTopicQuiz(topicId: string, quiz: AiQuiz) {
    setSubjects(prev => prev.map(s => ({
      ...s,
      topics: s.topics.map(t => t.id === topicId ? { ...t, ai_quiz: quiz } : t),
    })))
    setSelectedTopic(prev => prev?.id === topicId ? { ...prev, ai_quiz: quiz } : prev)
  }

  async function generate(topicId: string, force = false) {
    setGenerating(topicId)
    setGenError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setGenError('Not authenticated'); return }

      const res = await fetch('/api/admin/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topicId, force }),
      })
      const data = await res.json()
      if (!res.ok || !data.quiz) {
        setGenError(data.error ?? 'Generation failed')
        return
      }
      updateTopicQuiz(topicId, data.quiz)
    } catch (e: any) {
      setGenError(e?.message ?? 'Unknown error')
    } finally {
      setGenerating(null)
    }
  }

  async function generateAllMissing() {
    for (const topic of missingTopics) {
      await generate(topic.id, false)
    }
  }

  async function regenerateAll() {
    for (const topic of allTopics) {
      await generate(topic.id, true)
    }
  }

  return (
    <div className="flex h-full">

      {/* ── Left panel: topic list ───────────────────────────────────────────── */}
      <div className="w-80 shrink-0 border-r border-slate-100 bg-slate-50/50 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-base font-bold text-slate-900">Quiz Bank</h1>
            <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
              {generatedCount} / {totalTopics}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Pre-generate quiz questions for each topic so users never wait.
          </p>

          <div className="mt-3 flex gap-2">
            {missingTopics.length > 0 && (
              <button
                onClick={generateAllMissing}
                disabled={generating !== null}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                title="Generate questions for topics that don't have any yet"
              >
                {generating && missingTopics.some(t => t.id === generating) ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Generate Missing ({missingTopics.length})</>
                )}
              </button>
            )}
            {totalTopics > 0 && (
              <button
                onClick={regenerateAll}
                disabled={generating !== null}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-60"
                title="Regenerate fresh questions for every topic (replaces existing)"
              >
                {generating && allTopics.some(t => t.id === generating) && missingTopics.every(t => t.id !== generating) ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating…</>
                ) : (
                  <><RefreshCw className="w-3.5 h-3.5" /> Regenerate All</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Subject accordion */}
        <div className="flex-1 overflow-y-auto py-2">
          {subjects.map(subject => {
            const isOpen = openSubjects.has(subject.id)
            const subjectGenerated = subject.topics.filter(t => t.ai_quiz?.questions?.length).length
            return (
              <div key={subject.id}>
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-100 transition-colors group"
                >
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  }
                  <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{subject.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {subjectGenerated}/{subject.topics.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-1">
                    {subject.topics.length === 0 ? (
                      <p className="px-10 py-2 text-xs text-slate-400 italic">No topics</p>
                    ) : (
                      subject.topics.map(topic => {
                        const hasQuiz = (topic.ai_quiz?.questions?.length ?? 0) > 0
                        const isSelected = selectedTopic?.id === topic.id
                        const isGen = generating === topic.id
                        return (
                          <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic)}
                            className={cn(
                              'w-full flex items-center gap-2.5 pl-10 pr-3 py-2.5 text-left transition-colors',
                              isSelected
                                ? 'bg-violet-50 border-r-2 border-violet-600'
                                : 'hover:bg-slate-100'
                            )}
                          >
                            {isGen ? (
                              <Loader2 className="w-3 h-3 text-violet-500 animate-spin shrink-0" />
                            ) : hasQuiz ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
                            )}
                            <span className={cn(
                              'flex-1 text-xs truncate',
                              isSelected ? 'font-semibold text-violet-900' : 'text-slate-600'
                            )}>
                              {topic.title}
                            </span>
                            {hasQuiz && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {topic.ai_quiz!.questions.length}q
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {subjects.length === 0 && (
            <div className="flex flex-col items-center py-16 px-4 text-center">
              <HelpCircle className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No subjects found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: question preview ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!selectedTopic ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <HelpCircle className="w-7 h-7 text-violet-300" />
            </div>
            <p className="text-slate-600 font-semibold">Select a topic</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">
              Choose a topic on the left to preview or generate its quiz questions.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-8 py-8">

            {/* Topic header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">
                  {subjects.find(s => s.topics.some(t => t.id === selectedTopic.id))?.title}
                </p>
                <h2 className="text-xl font-bold text-slate-900">{selectedTopic.title}</h2>
                {selectedTopic.ai_quiz && (
                  <p className="text-xs text-slate-400 mt-1">
                    Generated {new Date(selectedTopic.ai_quiz.generated_at).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })} · Passing score: {selectedTopic.ai_quiz.passing_score}%
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {selectedTopic.ai_quiz?.questions?.length ? (
                  <button
                    onClick={() => generate(selectedTopic.id, true)}
                    disabled={generating === selectedTopic.id}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {generating === selectedTopic.id
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating…</>
                      : <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
                    }
                  </button>
                ) : (
                  <button
                    onClick={() => generate(selectedTopic.id, false)}
                    disabled={generating === selectedTopic.id}
                    className="flex items-center gap-1.5 px-4 h-8 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {generating === selectedTopic.id
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Generate Questions</>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {genError && generating === null && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{genError}</p>
              </div>
            )}

            {/* Generating spinner */}
            {generating === selectedTopic.id && (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-8 flex flex-col items-center text-center">
                <Sparkles className="w-8 h-8 text-violet-400 animate-pulse mb-3" />
                <p className="text-sm font-semibold text-violet-700">Generating questions with AI…</p>
                <p className="text-xs text-violet-500 mt-1">Reading topic content and crafting 5 questions</p>
              </div>
            )}

            {/* No quiz yet */}
            {!selectedTopic.ai_quiz?.questions?.length && generating !== selectedTopic.id && (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center">
                <HelpCircle className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-500 font-semibold">No questions yet</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">
                  Click "Generate Questions" to use AI to create 5 multiple-choice questions from this topic's content.
                </p>
              </div>
            )}

            {/* Questions list */}
            {selectedTopic.ai_quiz?.questions?.length && generating !== selectedTopic.id && (
              <div className="space-y-4">
                {selectedTopic.ai_quiz.questions.map((q, qi) => (
                  <div key={qi} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {qi + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{q.question_text}</p>
                      </div>
                    </div>
                    <div className="px-5 py-3 space-y-2">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm',
                            oi === q.correct_index
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                              : 'text-slate-500'
                          )}
                        >
                          <span className={cn(
                            'w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0',
                            oi === q.correct_index
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-200 text-slate-400'
                          )}>
                            {oi === q.correct_index
                              ? <CheckCircle2 className="w-3 h-3" />
                              : String.fromCharCode(65 + oi)
                            }
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-4">
                      <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                        <span className="font-semibold text-amber-700">Explanation: </span>
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  )
}
