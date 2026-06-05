'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, Menu, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { id: '1', title: 'Introduction to Machine Safety', done: true  },
  { id: '2', title: 'Personal Protective Equipment (PPE)', done: true  },
  { id: '3', title: 'Hazard Identification', done: true  },
  { id: '4', title: 'Emergency Procedures',  done: false, active: true },
  { id: '5', title: 'Lockout / Tagout (LOTO)', done: false },
  { id: '6', title: 'Incident Reporting',    done: false },
]

const content = `
Emergency procedures are critical protocols that every team member must know to respond quickly and safely during unexpected events on the factory floor.

## Fire Emergency

In case of fire:
1. **Sound the alarm** immediately using the nearest pull station
2. **Call 119** (Sri Lanka Fire & Rescue)
3. **Evacuate** using the nearest marked exit — do not use elevators
4. **Assemble** at the designated muster point (marked on floor maps)
5. **Do not re-enter** the building until the all-clear is given by a supervisor

> Never attempt to fight a large fire. Only use fire extinguishers for small, contained fires when you have a clear escape route.

## Medical Emergency

- Press the **Emergency Call Button** at each workstation
- Do not move an injured person unless they are in immediate danger
- First Aid kits are located at each aisle end and in the breakroom

## Machine Malfunction

If a machine behaves unexpectedly:
- Press the **red E-Stop** button immediately
- Do not attempt to fix the issue yourself
- Tag the machine "OUT OF SERVICE" and notify your line supervisor
`

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}

export default function PreviewTraining() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(3)
  const [completedIds, setCompletedIds] = useState(new Set(['1', '2', '3']))

  const current = steps[currentIdx]
  const isDone = completedIds.has(current.id)
  const completedCount = steps.filter(s => completedIds.has(s.id)).length
  const percent = Math.round((completedCount / steps.length) * 100)

  function markDone() {
    setCompletedIds(new Set([...completedIds, current.id]))
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Step sidebar */}
      <div className={cn('flex flex-col border-r border-slate-100 bg-slate-50 shrink-0 transition-all duration-300 overflow-hidden', sidebarOpen ? 'w-64' : 'w-0')}>
        <div className="px-4 py-4 border-b border-slate-100 shrink-0">
          <Link href="/preview/dashboard" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-700 mb-3 transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to module
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🔧</span>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 truncate">Machine Safety & Operations</p>
              <p className="text-xs font-semibold text-slate-700 truncate">Emergency Procedures</p>
            </div>
          </div>
          <ProgressBar value={percent} />
          <p className="text-[10px] text-slate-400 mt-1.5">{completedCount} of {steps.length} complete · {percent}%</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {steps.map((step, i) => {
            const done = completedIds.has(step.id)
            const active = i === currentIdx
            return (
              <button key={step.id} onClick={() => setCurrentIdx(i)}
                className={cn('flex items-center gap-3 w-full px-4 py-3 text-left transition-all border-r-2', active ? 'bg-violet-50 border-violet-600' : 'border-transparent hover:bg-white hover:border-slate-200')}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <div className={cn('w-4 h-4 rounded-full border-2 shrink-0 transition-colors', active ? 'border-violet-600' : 'border-slate-300')} />}
                <p className={cn('text-xs leading-snug font-medium truncate', active ? 'text-violet-800' : done ? 'text-slate-400' : 'text-slate-600')}>{step.title}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 h-14 border-b border-slate-100 bg-white shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">Machine Safety & Operations · Emergency Procedures</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <BookOpen className="w-3 h-3" />
            {currentIdx + 1} / {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-10">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">Step {currentIdx + 1}</span>
                {isDone && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{current.title}</h1>
            </div>

            <div className={cn('rounded-2xl border p-6 mb-8 transition-all prose-reader', isDone ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white')}>
              <div dangerouslySetInnerHTML={{ __html: content
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^(?!<[h|b|l|p])(.+)$/gm, '<p>$1</p>')
              }} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="flex items-center gap-2">
                {!isDone && (
                  <button onClick={markDone} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                    <Check className="w-3.5 h-3.5" /> Mark done
                  </button>
                )}
                {currentIdx < steps.length - 1 ? (
                  <button onClick={() => { markDone(); setCurrentIdx(currentIdx + 1) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-all shadow-sm">
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link href="/preview/dashboard">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Finish
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
