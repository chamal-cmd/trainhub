'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, ArrowRight } from 'lucide-react'

interface Nudge {
  id: string
  subjects: { id: string; title: string; emoji: string; cover_color: string }
}

export function NudgeTodoSection({ initialNudges }: { initialNudges: Nudge[] }) {
  const supabase = createClient()
  const [nudges, setNudges] = useState(initialNudges)
  const [ticking, setTicking] = useState<Set<string>>(new Set())

  async function markDone(id: string) {
    setTicking(prev => new Set([...prev, id]))
    await supabase
      .from('assignments')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id)
    // Brief delay so the checkmark shows before item vanishes
    setTimeout(() => setNudges(prev => prev.filter(n => n.id !== id)), 400)
  }

  async function clearAll() {
    const ids = nudges.map(n => n.id)
    setTicking(new Set(ids))
    await supabase
      .from('assignments')
      .update({ completed_at: new Date().toISOString() })
      .in('id', ids)
    setTimeout(() => setNudges([]), 400)
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-3.5 h-3.5 text-violet-500" />
        <h2 className="text-sm font-bold text-slate-700">To-do</h2>
        {nudges.length > 0 && (
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {nudges.length}
          </span>
        )}
        {nudges.length > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {nudges.length === 0 ? (
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3.5">
          <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">No pending reminders — you're all caught up!</p>
        </div>
      ) : (
      <div className="space-y-2">
        {nudges.map(n => {
          const done = ticking.has(n.id)
          return (
            <div
              key={n.id}
              className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3.5 group transition-all duration-200 ${
                done ? 'opacity-50 border-slate-100' : 'border-slate-200 hover:border-violet-200'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => markDone(n.id)}
                disabled={done}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  done
                    ? 'bg-violet-600 border-violet-600'
                    : 'border-slate-300 hover:border-violet-500'
                }`}
              >
                {done && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Module link */}
              <Link href={`/training/${n.subjects.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                  style={{ background: `${n.subjects.cover_color || '#7C3AED'}20` }}
                >
                  {n.subjects.emoji || '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {n.subjects.title}
                  </p>
                  <p className="text-xs text-violet-500 mt-0.5">Tap to start training</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors shrink-0" />
              </Link>
            </div>
          )
        })}
      </div>
      )}
    </section>
  )
}
