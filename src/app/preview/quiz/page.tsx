'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const questions = [
  {
    id: 'q1', text: 'What should you do FIRST when discovering a fire on the factory floor?',
    options: [
      { id: 'a', text: 'Try to extinguish it yourself',              correct: false },
      { id: 'b', text: 'Sound the alarm and alert others',           correct: true  },
      { id: 'c', text: 'Call your supervisor and wait for guidance', correct: false },
      { id: 'd', text: 'Run to the nearest exit immediately',        correct: false },
    ],
    explanation: 'The first priority is always to sound the alarm so everyone in the building can evacuate safely.'
  },
  {
    id: 'q2', text: 'Which colour identifies a fire extinguisher safe for use on electrical equipment?',
    options: [
      { id: 'a', text: 'Red (water)',   correct: false },
      { id: 'b', text: 'Black (CO₂)',   correct: true  },
      { id: 'c', text: 'Cream (foam)',  correct: false },
      { id: 'd', text: 'Blue (powder)', correct: false },
    ],
    explanation: 'CO₂ (black) extinguishers are non-conductive and safe for electrical fires. Never use water on live electrical equipment.'
  },
  {
    id: 'q3', text: 'Lockout/Tagout (LOTO) procedures are required when:',
    options: [
      { id: 'a', text: 'Performing routine production tasks', correct: false },
      { id: 'b', text: 'Servicing or maintaining machinery',  correct: true  },
      { id: 'c', text: 'Operating a machine at low speed',    correct: false },
      { id: 'd', text: 'Starting a new production run',       correct: false },
    ],
    explanation: 'LOTO is required whenever performing servicing or maintenance work to protect workers from unexpected machine start-up.'
  },
]

type Phase = 'quiz' | 'results'

export default function PreviewQuiz() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>('quiz')

  const q = questions[idx]
  const progress = Math.round((idx / questions.length) * 100)

  function confirm() {
    if (!selected) return
    setRevealed(true)
    setAnswers({ ...answers, [q.id]: selected })
  }

  function next() {
    if (idx < questions.length - 1) {
      setIdx(idx + 1); setSelected(null); setRevealed(false)
    } else {
      setPhase('results')
    }
  }

  function retake() {
    setIdx(0); setSelected(null); setRevealed(false); setAnswers({}); setPhase('quiz')
  }

  if (phase === 'results') {
    const correct = questions.filter(q => {
      const sel = q.options.find(o => o.id === answers[q.id])
      return sel?.correct
    }).length
    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= 70
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className={`rounded-2xl border-2 p-8 text-center bg-white ${passed ? 'border-emerald-300' : 'border-red-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ${passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {passed ? '🏆' : '😔'}
            </div>
            <h1 className={`text-2xl font-bold mb-1 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>{passed ? 'Congratulations!' : 'Not quite there'}</h1>
            <p className="text-slate-500 text-sm mb-6">{passed ? 'You passed the quiz!' : 'You need 70% to pass. Keep studying and try again!'}</p>
            <div className="flex items-center justify-center gap-8 mb-6 py-4 bg-slate-50 rounded-xl">
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: passed ? '#059669' : '#DC2626' }}>{score}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Your Score</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-400">70%</p>
                <p className="text-xs text-slate-500 mt-0.5">Passing Score</p>
              </div>
            </div>
            <div className="space-y-2 mb-6 text-left">
              {questions.map(q => {
                const sel = q.options.find(o => o.id === answers[q.id])
                const ok = sel?.correct
                return (
                  <div key={q.id} className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-medium text-slate-700 text-xs">{q.text}</p>
                      {!ok && <p className="text-xs text-slate-500 mt-0.5">{q.explanation}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={retake} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <Link href="/preview/dashboard" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all">
                  <Home className="w-4 h-4" /> Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-700 text-sm">Machine Safety Quiz</span>
          </div>
          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">{idx + 1} / {questions.length}</span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">Question {idx + 1}</p>
          <h2 className="text-lg font-bold text-slate-900 mb-6">{q.text}</h2>

          <div className="space-y-2.5">
            {q.options.map(opt => {
              const isSel = selected === opt.id
              let cls = 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
              if (isSel && !revealed)            cls = 'border-indigo-500 bg-indigo-50'
              if (revealed && opt.correct)        cls = 'border-emerald-400 bg-emerald-50 cursor-default'
              if (revealed && isSel && !opt.correct) cls = 'border-red-400 bg-red-50 cursor-default'
              if (revealed && !isSel && !opt.correct) cls = 'border-slate-100 bg-slate-50 opacity-60 cursor-default'

              return (
                <button key={opt.id} onClick={() => !revealed && setSelected(opt.id)} disabled={revealed}
                  className={cn('w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all', cls)}>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    isSel && !revealed ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300',
                    revealed && opt.correct ? 'border-emerald-500 bg-emerald-500' : '',
                    revealed && isSel && !opt.correct ? 'border-red-500 bg-red-500' : '')}>
                    {isSel && !revealed && <div className="w-2 h-2 rounded-full bg-white" />}
                    {revealed && opt.correct && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {revealed && isSel && !opt.correct && <XCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn('text-sm font-medium', revealed && opt.correct ? 'text-emerald-800' : revealed && isSel ? 'text-red-800' : 'text-slate-700')}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>

          {revealed && q.explanation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">Explanation</p>
              <p className="text-xs text-blue-600">{q.explanation}</p>
            </div>
          )}

          <div className="flex justify-end mt-6 gap-2">
            {!revealed ? (
              <button onClick={confirm} disabled={!selected}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm">
                Confirm Answer
              </button>
            ) : (
              <button onClick={next}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm">
                {idx < questions.length - 1 ? <>Next Question <ArrowRight className="w-4 h-4" /></> : 'See Results'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
