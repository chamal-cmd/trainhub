'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw, Home, HelpCircle } from 'lucide-react'

type PageParams = { params: Promise<{ quizId: string }> }

type AnswerState = 'unanswered' | 'correct' | 'incorrect'

export default function QuizPage({ params }: PageParams) {
  const { quizId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subjectId, setSubjectId] = useState('')

  useEffect(() => { loadQuiz() }, [quizId])

  async function loadQuiz() {
    const { data } = await supabase
      .from('quizzes')
      .select(`
        id, title, passing_score, subject_id,
        quiz_questions(id, question_text, question_type, order_index, explanation,
          quiz_options(id, option_text, is_correct)
        )
      `)
      .eq('id', quizId)
      .single()

    if (data) {
      setQuiz(data)
      setSubjectId(data.subject_id)
      const sorted = (data.quiz_questions ?? [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({ ...q, options: q.quiz_options ?? [] }))
      setQuestions(sorted)
    }
    setLoading(false)
  }

  function handleSelect(optionId: string) {
    if (answerState !== 'unanswered') return
    setSelectedOption(optionId)
  }

  function handleConfirm() {
    if (!selectedOption || answerState !== 'unanswered') return
    const question = questions[currentIdx]
    const option = question.options.find((o: any) => o.id === selectedOption)
    const correct = option?.is_correct ?? false
    setAnswerState(correct ? 'correct' : 'incorrect')
    setAnswers({ ...answers, [question.id]: selectedOption })
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setSelectedOption(null)
      setAnswerState('unanswered')
    } else {
      finishQuiz()
    }
  }

  async function finishQuiz() {
    setSubmitting(true)

    // Calculate score
    let correct = 0
    for (const q of questions) {
      const selectedId = answers[q.id]
      const selectedOpt = q.options.find((o: any) => o.id === selectedId)
      if (selectedOpt?.is_correct) correct++
    }

    const pct = Math.round((correct / questions.length) * 100)
    const didPass = pct >= quiz.passing_score

    setScore(pct)
    setPassed(didPass)
    setFinished(true)

    // Save attempt
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .insert({ user_id: user.id, quiz_id: quizId, score: pct, passed: didPass })
        .select('id')
        .single()

      if (attempt) {
        for (const q of questions) {
          const selectedId = answers[q.id]
          if (selectedId) {
            await supabase.from('quiz_attempt_answers').insert({
              attempt_id: attempt.id,
              question_id: q.id,
              selected_option_id: selectedId,
            })
          }
        }
      }
    }

    setSubmitting(false)
  }

  function retake() {
    setCurrentIdx(0)
    setSelectedOption(null)
    setAnswerState('unanswered')
    setAnswers({})
    setFinished(false)
    setScore(0)
    setPassed(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!quiz || questions.length === 0) return (
    <div className="flex items-center justify-center h-screen text-slate-500">Quiz not found or has no questions.</div>
  )

  // Results screen
  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className={cn(
            'rounded-2xl border-2 p-8 text-center',
            passed ? 'bg-white border-emerald-300' : 'bg-white border-red-200'
          )}>
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4',
              passed ? 'bg-emerald-50' : 'bg-red-50'
            )}>
              {passed ? '🏆' : '😔'}
            </div>
            <h1 className={cn('text-2xl font-bold mb-1', passed ? 'text-emerald-700' : 'text-red-700')}>
              {passed ? 'Congratulations!' : 'Not quite there'}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {passed ? 'You passed the quiz!' : `You need ${quiz.passing_score}% to pass. Keep studying and try again!`}
            </p>

            <div className="flex items-center justify-center gap-8 mb-6 py-4 bg-slate-50 rounded-xl">
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: passed ? '#059669' : '#DC2626' }}>{score}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Your Score</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-400">{quiz.passing_score}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Passing Score</p>
              </div>
            </div>

            {/* Question review */}
            <div className="space-y-2 mb-6 text-left">
              {questions.map((q, i) => {
                const selectedId = answers[q.id]
                const selectedOpt = q.options.find((o: any) => o.id === selectedId)
                const correct = selectedOpt?.is_correct
                return (
                  <div key={q.id} className={cn('flex items-start gap-2 p-2.5 rounded-lg text-sm', correct ? 'bg-emerald-50' : 'bg-red-50')}>
                    {correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-xs">{q.question_text}</p>
                      {!correct && q.explanation && (
                        <p className="text-xs text-slate-500 mt-0.5">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={retake}>
                <RotateCcw className="w-4 h-4" /> Retake
              </Button>
              <Button className="flex-1" onClick={() => router.push(`/training/${subjectId}`)}>
                <Home className="w-4 h-4" /> Back to Module
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentIdx]
  const progressPct = Math.round(((currentIdx) / questions.length) * 100)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-700 text-sm">{quiz.title}</span>
          </div>
          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
            {currentIdx + 1} / {questions.length}
          </span>
        </div>

        <Progress value={progressPct} className="mb-6" />

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">
            Question {currentIdx + 1}
          </p>
          <h2 className="text-lg font-bold text-slate-900 mb-6">{question.question_text}</h2>

          <div className="space-y-2.5">
            {question.options.map((option: any) => {
              const isSelected = selectedOption === option.id
              const isCorrect = option.is_correct
              const revealed = answerState !== 'unanswered'

              let style = 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
              if (isSelected && !revealed) style = 'border-indigo-500 bg-indigo-50'
              if (revealed && isCorrect) style = 'border-emerald-400 bg-emerald-50 cursor-default'
              if (revealed && isSelected && !isCorrect) style = 'border-red-400 bg-red-50 cursor-default'
              if (revealed && !isSelected && !isCorrect) style = 'border-slate-100 bg-slate-50 opacity-60 cursor-default'

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  disabled={revealed}
                  className={cn('w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all', style)}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    isSelected && !revealed ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300',
                    revealed && isCorrect ? 'border-emerald-500 bg-emerald-500' : '',
                    revealed && isSelected && !isCorrect ? 'border-red-500 bg-red-500' : '',
                  )}>
                    {((isSelected && !revealed) || (revealed && isCorrect) || (revealed && isSelected && !isCorrect)) && (
                      revealed
                        ? isCorrect ? <CheckCircle2 className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />
                        : <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={cn('text-sm font-medium', revealed && isCorrect ? 'text-emerald-800' : revealed && isSelected ? 'text-red-800' : 'text-slate-700')}>
                    {option.option_text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {answerState !== 'unanswered' && question.explanation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">Explanation</p>
              <p className="text-xs text-blue-600">{question.explanation}</p>
            </div>
          )}

          <div className="flex justify-end mt-6 gap-2">
            {answerState === 'unanswered' ? (
              <Button onClick={handleConfirm} disabled={!selectedOption}>
                Confirm Answer
              </Button>
            ) : (
              <Button onClick={handleNext} loading={submitting}>
                {currentIdx < questions.length - 1 ? <>Next Question <ArrowRight className="w-4 h-4" /></> : 'See Results'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
