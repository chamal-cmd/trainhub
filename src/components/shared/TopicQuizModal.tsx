'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2, XCircle, ChevronRight, X, Brain,
  Trophy, RotateCcw, ArrowRight, Loader2, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Question {
  question_text: string
  explanation: string
  correct_index: number
  options: string[]
}

interface QuizData {
  generated_at: string
  passing_score: number
  questions: Question[]
}

interface Props {
  topicId:             string
  topicTitle:          string
  userId:              string
  subjectId:           string
  nextTopicHref?:      string   // href to navigate to after quiz (e.g. next topic)
  onClose:             () => void
}

export default function TopicQuizModal({
  topicId, topicTitle, userId, subjectId, nextTopicHref, onClose,
}: Props) {
  const supabase = createClient()

  // phase: loading → quiz → results
  const [phase,       setPhase]       = useState<'loading' | 'quiz' | 'results'>('loading')
  const [quiz,        setQuiz]        = useState<QuizData | null>(null)
  const [currentQ,    setCurrentQ]    = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [confirmed,   setConfirmed]   = useState(false)
  const [answers,     setAnswers]     = useState<number[]>([])
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => { generateQuiz() }, [])

  async function generateQuiz() {
    setError('')
    setPhase('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setError('Not authenticated'); return }

      const res = await fetch('/api/ai-quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topicId }),
      })
      const data = await res.json()
      if (!res.ok || !data.quiz) { setError(data.error ?? 'Failed to generate quiz'); return }
      setQuiz(data.quiz)
      setPhase('quiz')
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
    }
  }

  function handleSelect(idx: number) {
    if (confirmed) return
    setSelectedIdx(idx)
  }

  function handleConfirm() {
    if (selectedIdx === null) return
    setAnswers(prev => [...prev, selectedIdx])
    setConfirmed(true)
  }

  async function handleNext() {
    if (!quiz) return
    setConfirmed(false)
    setSelectedIdx(null)

    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      // All questions answered — calculate score
      const allAnswers = [...answers]
      const correctCount = allAnswers.filter((a, i) => a === quiz.questions[i].correct_index).length
      const score   = Math.round((correctCount / quiz.questions.length) * 100)
      const passed  = score >= quiz.passing_score

      setSaving(true)
      try {
        await supabase.from('topic_quiz_completions').upsert({
          user_id:  userId,
          topic_id: topicId,
          score,
          passed,
        })
      } catch { /* non-critical — don't block UI */ }
      setSaving(false)
      setPhase('results')
    }
  }

  function handleRetake() {
    setPhase('quiz')
    setCurrentQ(0)
    setSelectedIdx(null)
    setConfirmed(false)
    setAnswers([])
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const q         = quiz?.questions[currentQ]
  const total     = quiz?.questions.length ?? 0
  const isCorrect = confirmed && selectedIdx !== null && q ? selectedIdx === q.correct_index : false
  const isWrong   = confirmed && selectedIdx !== null && q ? selectedIdx !== q.correct_index : false
  const isLast    = currentQ === total - 1

  const correctCount  = answers.filter((a, i) => quiz && a === quiz.questions[i].correct_index).length
  const score         = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const passed        = quiz ? score >= quiz.passing_score : false

  // ── Backdrop ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Knowledge Check</p>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[280px]">{topicTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Loading phase ─────────────────────────────────────────────── */}
        {phase === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
            {error ? (
              <>
                <XCircle className="w-10 h-10 text-red-400" />
                <p className="text-slate-600 text-sm text-center max-w-xs">{error}</p>
                <Button size="sm" variant="outline" onClick={generateQuiz}>Try again</Button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-medium text-sm">Generating your quiz…</p>
                  <p className="text-slate-400 text-xs mt-1">AI is reading the content</p>
                </div>
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </>
            )}
          </div>
        )}

        {/* ── Quiz phase ────────────────────────────────────────────────── */}
        {phase === 'quiz' && q && (
          <div className="flex-1 flex flex-col p-6 gap-5">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQ) / total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {currentQ + 1} / {total}
              </span>
            </div>

            {/* Question */}
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-3">
                Question {currentQ + 1}
              </span>
              <h2 className="text-slate-900 font-semibold text-base leading-snug">
                {q.question_text}
              </h2>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, idx) => {
                const isSelected   = selectedIdx === idx
                const showCorrect  = confirmed && idx === q.correct_index
                const showWrong    = confirmed && isSelected && idx !== q.correct_index
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={confirmed}
                    className={cn(
                      'flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-150',
                      !confirmed && !isSelected && 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700',
                      !confirmed &&  isSelected && 'border-indigo-500 bg-indigo-50 text-indigo-800',
                      showCorrect  && 'border-emerald-400 bg-emerald-50 text-emerald-800',
                      showWrong    && 'border-red-400 bg-red-50 text-red-800',
                      confirmed && !showCorrect && !showWrong && 'border-slate-100 text-slate-400 opacity-60',
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                      !confirmed && !isSelected && 'border-slate-300 text-slate-400',
                      !confirmed &&  isSelected && 'border-indigo-500 text-indigo-600 bg-indigo-100',
                      showCorrect && 'border-emerald-500 bg-emerald-500',
                      showWrong   && 'border-red-500 bg-red-500',
                    )}>
                      {showCorrect
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        : showWrong
                        ? <XCircle className="w-3.5 h-3.5 text-white" />
                        : String.fromCharCode(65 + idx)
                      }
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation (shown after confirming) */}
            {confirmed && (
              <div className={cn(
                'rounded-xl px-4 py-3 text-sm border',
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              )}>
                <p className="font-semibold mb-0.5">{isCorrect ? '✓ Correct!' : '✗ Not quite'}</p>
                <p className="text-xs leading-relaxed opacity-80">{q.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {!confirmed ? (
                <>
                  <span className="text-xs text-slate-400">Select an answer above</span>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={selectedIdx === null}
                  >
                    Confirm
                  </Button>
                </>
              ) : (
                <>
                  <span />
                  <Button size="sm" onClick={handleNext} loading={saving}>
                    {isLast ? 'See results' : 'Next question'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Results phase ─────────────────────────────────────────────── */}
        {phase === 'results' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5 text-center">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl',
              passed ? 'bg-emerald-100' : 'bg-amber-100'
            )}>
              {passed ? <Trophy className="w-8 h-8 text-emerald-600" /> : '📖'}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {passed ? 'Well done!' : 'Keep it up!'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {passed
                  ? `You scored ${score}% — unit quiz passed!`
                  : `You scored ${score}% — review the material and try again.`}
              </p>
            </div>

            {/* Score bar */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Your score</span>
                <span className={cn('font-semibold', passed ? 'text-emerald-600' : 'text-amber-600')}>
                  {score}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', passed ? 'bg-emerald-500' : 'bg-amber-400')}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 text-right">
                {correctCount} / {total} correct · passing: {quiz?.passing_score}%
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-3 mt-2">
              {!passed && (
                <Button variant="outline" size="sm" onClick={handleRetake}>
                  <RotateCcw className="w-3.5 h-3.5" /> Retake quiz
                </Button>
              )}
              {nextTopicHref ? (
                <Link href={nextTopicHref}>
                  <Button size="sm" variant={passed ? 'default' : 'outline'}>
                    Next unit <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/training/${subjectId}`}>
                  <Button size="sm" variant={passed ? 'default' : 'outline'}>
                    Back to module <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
