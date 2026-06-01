'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Quiz, QuizQuestion, QuizOption } from '@/lib/types'
import { Plus, Trash2, ArrowLeft, Save, Check, HelpCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { use as reactUse } from 'react'

type PageParams = { params: Promise<{ id: string }> }

export default function QuizBuilderPage({ params }: PageParams) {
  const { id } = use(params)
  const supabase = createClient()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<(QuizQuestion & { options: QuizOption[] })[]>([])
  const [quizTitle, setQuizTitle] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [subjectTitle, setSubjectTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: subject } = await supabase.from('subjects').select('title').eq('id', id).single()
    if (subject) setSubjectTitle(subject.title)

    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select(`*, quiz_questions(*, quiz_options(*))`)
      .eq('subject_id', id)
      .single()

    if (existingQuiz) {
      setQuiz(existingQuiz)
      setQuizTitle(existingQuiz.title)
      setPassingScore(existingQuiz.passing_score)
      const sorted = (existingQuiz.quiz_questions || [])
        .sort((a: QuizQuestion, b: QuizQuestion) => a.order_index - b.order_index)
        .map((q: any) => ({ ...q, options: q.quiz_options || [] }))
      setQuestions(sorted)
    }
    setLoading(false)
  }

  async function saveQuiz() {
    if (!quizTitle.trim()) return
    setSaving(true)

    let quizId = quiz?.id

    if (!quizId) {
      const { data } = await supabase
        .from('quizzes')
        .insert({ subject_id: id, title: quizTitle, passing_score: passingScore })
        .select('id')
        .single()
      quizId = data?.id
      if (data) setQuiz({ id: data.id, title: quizTitle, passing_score: passingScore, subject_id: id, created_at: new Date().toISOString() })
    } else {
      await supabase.from('quizzes').update({ title: quizTitle, passing_score: passingScore }).eq('id', quizId)
    }

    // Save all questions & options
    for (const [qi, q] of questions.entries()) {
      let qId = q.id

      if (q.id.startsWith('new-')) {
        const { data } = await supabase
          .from('quiz_questions')
          .insert({ quiz_id: quizId, question_text: q.question_text, question_type: q.question_type, order_index: qi, explanation: q.explanation })
          .select('id')
          .single()
        qId = data?.id ?? q.id
      } else {
        await supabase.from('quiz_questions').update({ question_text: q.question_text, question_type: q.question_type, order_index: qi, explanation: q.explanation }).eq('id', qId)
        await supabase.from('quiz_options').delete().eq('question_id', qId)
      }

      for (const opt of q.options) {
        await supabase.from('quiz_options').insert({ question_id: qId, option_text: opt.option_text, is_correct: opt.is_correct })
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    await loadData()
  }

  function addQuestion(type: 'multiple_choice' | 'true_false') {
    const newQ: QuizQuestion & { options: QuizOption[] } = {
      id: `new-${Date.now()}`,
      quiz_id: quiz?.id ?? '',
      question_text: '',
      question_type: type,
      order_index: questions.length,
      explanation: '',
      options: type === 'true_false'
        ? [
            { id: `o-${Date.now()}-1`, question_id: '', option_text: 'True', is_correct: true },
            { id: `o-${Date.now()}-2`, question_id: '', option_text: 'False', is_correct: false },
          ]
        : [
            { id: `o-${Date.now()}-1`, question_id: '', option_text: '', is_correct: true },
            { id: `o-${Date.now()}-2`, question_id: '', option_text: '', is_correct: false },
            { id: `o-${Date.now()}-3`, question_id: '', option_text: '', is_correct: false },
          ],
    }
    setQuestions([...questions, newQ])
  }

  function updateQuestion(idx: number, field: string, value: string) {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  function updateOption(qIdx: number, oIdx: number, field: string, value: string | boolean) {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q
      return {
        ...q,
        options: q.options.map((o, oi) => oi === oIdx ? { ...o, [field]: value } : o)
      }
    }))
  }

  function setCorrectOption(qIdx: number, oIdx: number) {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q
      return { ...q, options: q.options.map((o, oi) => ({ ...o, is_correct: oi === oIdx })) }
    }))
  }

  function addOption(qIdx: number) {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q
      return { ...q, options: [...q.options, { id: `o-${Date.now()}`, question_id: q.id, option_text: '', is_correct: false }] }
    }))
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q
      return { ...q, options: q.options.filter((_, oi) => oi !== oIdx) }
    }))
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href={`/admin/subjects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to {subjectTitle}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quiz Builder</h1>
          <p className="text-slate-500 text-sm mt-0.5">Build a quiz for this training module</p>
        </div>
        <Button onClick={saveQuiz} loading={saving} variant={saved ? 'success' : 'default'}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Quiz</>}
        </Button>
      </div>

      {/* Quiz settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quiz Title</Label>
            <Input placeholder="e.g. Final Assessment" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Passing Score (%)</Label>
            <Input
              type="number" min={1} max={100}
              value={passingScore}
              onChange={e => setPassingScore(parseInt(e.target.value) || 70)}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {qi + 1}
              </div>
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Enter your question..."
                  value={q.question_text}
                  onChange={e => updateQuestion(qi, 'question_text', e.target.value)}
                  className="font-medium"
                />
                <Input
                  placeholder="Explanation (shown after answer) — optional"
                  value={q.explanation || ''}
                  onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                  className="text-sm text-slate-500"
                />
              </div>
              <button onClick={() => removeQuestion(qi)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors mt-0.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2 ml-10">
              <p className="text-xs font-medium text-slate-500 mb-2">
                {q.question_type === 'true_false' ? 'Answer Options' : 'Answer Options (click circle to mark correct)'}
              </p>
              {q.options.map((opt, oi) => (
                <div key={opt.id} className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                  opt.is_correct ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                )}>
                  <button
                    type="button"
                    onClick={() => q.question_type !== 'true_false' && setCorrectOption(qi, oi)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      opt.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400',
                      q.question_type === 'true_false' && 'cursor-default'
                    )}
                  >
                    {opt.is_correct && <Check className="w-3 h-3 text-white" />}
                  </button>
                  {q.question_type === 'true_false' ? (
                    <span className="text-sm font-medium text-slate-700">{opt.option_text}</span>
                  ) : (
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt.option_text}
                      onChange={e => updateOption(qi, oi, 'option_text', e.target.value)}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
                    />
                  )}
                  {q.question_type !== 'true_false' && q.options.length > 2 && (
                    <button onClick={() => removeOption(qi, oi)} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {q.question_type !== 'true_false' && q.options.length < 6 && (
                <button
                  onClick={() => addOption(qi)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 mt-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add question buttons */}
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={() => addQuestion('multiple_choice')}>
          <Plus className="w-4 h-4" />
          Multiple Choice
        </Button>
        <Button variant="outline" onClick={() => addQuestion('true_false')}>
          <Plus className="w-4 h-4" />
          True / False
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 mt-4">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No questions yet</p>
          <p className="text-slate-400 text-sm mt-0.5">Add multiple choice or true/false questions above</p>
        </div>
      )}
    </div>
  )
}
