export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getUser, getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { CheckCircle2, Clock, Lock, ChevronRight, Trophy, Sparkles, ShieldCheck, FileText, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function LibraryPage() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  const [subjectsRes, progressRes, quizAttemptsRes, profile] = await Promise.all([
    supabase
      .from('subjects')
      .select('id, title, description, emoji, cover_color, order_index, topics(id, steps(id)), quizzes(id)')
      .order('order_index'),
    supabase.from('step_progress').select('step_id').eq('user_id', user.id),
    supabase.from('quiz_attempts').select('quiz_id').eq('user_id', user.id).eq('passed', true),
    getProfile(user.id),
  ])

  const completedStepIds = new Set((progressRes.data ?? []).map((r: any) => r.step_id))
  const passedQuizIds    = new Set((quizAttemptsRes.data ?? []).map((r: any) => r.quiz_id))
  const isAdmin = profile?.role === 'admin'

  const allModules = (subjectsRes.data ?? []).map((subject: any) => {
    const allSteps: string[] = subject.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
    const completed   = allSteps.filter(id => completedStepIds.has(id)).length
    const total       = allSteps.length
    const percent     = total > 0 ? Math.round((completed / total) * 100) : 0
    const quiz        = (subject.quizzes as any[])?.[0] ?? null
    const quizPassed  = !quiz || passedQuizIds.has(quiz.id)
    const stepsAllDone = total > 0 && completed === total
    const fullyDone   = quiz ? quizPassed : stepsAllDone
    const quizPending = stepsAllDone && !!quiz && !quizPassed
    const readMins    = Math.max(2, total * 3)
    const isSop       = subject.order_index >= 1000
    return { subject, completed, total, percent, quiz, quizPassed, stepsAllDone, fullyDone, quizPending, readMins, locked: false, isSop }
  })

  // Split into training modules and client SOP modules
  const modules    = allModules.filter(m => !m.isSop)
  const sopModules = allModules.filter(m => m.isSop)

  // Sequential lock: only for regular users, only for training modules
  if (!isAdmin) {
    for (let i = 1; i < modules.length; i++) {
      if (!modules[i - 1].fullyDone) {
        modules[i].locked = true
      }
    }
  }

  const doneCount = modules.filter(m => m.fullyDone).length
  const activeIdx = modules.findIndex(m => !m.locked && !m.fullyDone)
  const overallPct = modules.length > 0 ? Math.round((doneCount / modules.length) * 100) : 0

  return (
    <div className="px-6 py-7 min-h-full bg-[#f8f8f8]">
      {/* Admin preview banner */}
      {isAdmin && (
        <div className="flex items-center gap-2.5 bg-violet-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl mb-5">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Admin preview — all modules are accessible. Users see sequential locking.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Learning Path</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {doneCount} of {modules.length} module{modules.length !== 1 ? 's' : ''} completed
          </p>
        </div>
        {modules.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all bg-violet-600" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="text-xs font-bold text-violet-700">{overallPct}%</span>
          </div>
        )}
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No modules yet</p>
          <p className="text-xs text-slate-400 mt-1">Your administrator hasn't created any modules yet.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-2">
          {modules.map((m, i) => {
            const { subject, completed, total, percent, fullyDone, quizPending, locked, readMins } = m
            const isActive = i === activeIdx

            type State = 'done' | 'quiz_pending' | 'active' | 'in_progress' | 'locked' | 'not_started'
            const state: State = locked ? 'locked'
              : fullyDone ? 'done'
              : quizPending ? 'quiz_pending'
              : isActive ? 'active'
              : completed > 0 ? 'in_progress'
              : 'not_started'

            const lockReason = locked
              ? (modules[i - 1]?.quizPending
                  ? `Pass the quiz in "${modules[i - 1].subject.title}" to unlock`
                  : `Complete "${modules[i - 1].subject.title}" to unlock`)
              : ''

            const card = (
              <div className={cn(
                'group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden',
                state === 'locked'       ? 'border-slate-100 opacity-55 cursor-not-allowed'
                : state === 'done'       ? 'border-emerald-100 hover:border-emerald-200 hover:shadow-sm cursor-pointer'
                : state === 'quiz_pending' ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:shadow-md cursor-pointer'
                : state === 'active'     ? 'border-violet-200 bg-violet-50/20 shadow-md hover:shadow-lg cursor-pointer ring-1 ring-violet-200'
                : 'border-slate-200 hover:border-violet-200 hover:shadow-sm cursor-pointer'
              )}>
                <div className="h-1 w-full" style={{ backgroundColor: state === 'locked' ? '#e2e8f0' : (subject.cover_color ?? '#6366f1') }} />

                <div className="flex items-center gap-4 p-4">
                  {/* Step indicator */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    state === 'locked'        ? 'bg-slate-100'
                    : state === 'done'        ? 'bg-emerald-100'
                    : state === 'quiz_pending'? 'bg-amber-100'
                    : state === 'active'      ? 'bg-violet-600'
                    : state === 'in_progress' ? 'bg-violet-100'
                    : 'bg-slate-100 group-hover:bg-violet-100'
                  )}>
                    {state === 'locked'        ? <Lock className="w-4 h-4 text-slate-400" />
                    : state === 'done'         ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : state === 'quiz_pending' ? <Sparkles className="w-5 h-5 text-amber-600" />
                    : state === 'active'       ? <ChevronRight className="w-5 h-5 text-white" />
                    : <span className={cn('text-sm font-bold', state === 'in_progress' ? 'text-violet-600' : 'text-slate-400 group-hover:text-violet-600')}>{i + 1}</span>}
                  </div>

                  {/* Emoji */}
                  <div
                    className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0', state === 'locked' && 'grayscale')}
                    style={{ backgroundColor: (subject.cover_color ?? '#6366f1') + '15' }}
                  >
                    {subject.emoji ?? '📖'}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        'text-sm font-bold leading-snug',
                        state === 'locked'  ? 'text-slate-400'
                        : state === 'done'  ? 'text-slate-600'
                        : state === 'active'? 'text-violet-900'
                        : 'text-slate-800 group-hover:text-violet-900'
                      )}>
                        {subject.title}
                      </p>
                      {state === 'active' && (
                        <span className="text-[10px] font-bold bg-violet-700 text-white rounded-full px-2 py-0.5">UP NEXT</span>
                      )}
                    </div>

                    {state === 'locked' ? (
                      <p className="text-xs text-slate-400 mt-0.5">{lockReason}</p>
                    ) : state === 'quiz_pending' ? (
                      <p className="text-xs text-amber-600 font-medium mt-0.5">All steps done — pass the quiz to complete</p>
                    ) : (
                      <div className="flex items-center gap-3 mt-1">
                        {total > 0 && (
                          <div className="flex items-center gap-1.5 flex-1 max-w-[180px]">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: state === 'done' ? '#10b981' : '#7c3aed' }} />
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0">{completed}/{total}</span>
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                          <Clock className="w-3 h-3" />{readMins}m
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right badge */}
                  <div className="shrink-0">
                    {state === 'done' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-lg px-2.5 py-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                    {state === 'quiz_pending' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 rounded-lg px-2.5 py-1.5">
                        <Trophy className="w-3 h-3" /> Take Quiz
                      </span>
                    )}
                    {(state === 'active' || state === 'in_progress' || state === 'not_started') && (
                      <ChevronRight className={cn('w-4 h-4 transition-colors', state === 'active' ? 'text-violet-600' : 'text-slate-300 group-hover:text-violet-500')} />
                    )}
                  </div>
                </div>
              </div>
            )

            return locked
              ? <div key={subject.id}>{card}</div>
              : <Link key={subject.id} href={`/training/${subject.id}`}>{card}</Link>
          })}
        </div>
      )}

      {/* ── Client SOPs Section ───────────────────────────────────────────── */}
      {sopModules.length > 0 && (
        <div id="sops" className="mt-10 max-w-2xl">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Client SOPs</h2>
              <p className="text-xs text-slate-400">Standard Operating Procedures — download and follow for each client task</p>
            </div>
          </div>

          <div className="space-y-2">
            {sopModules.map((m) => {
              const { subject, total } = m
              const clientName = subject.title.replace(/^SOPs\s*—\s*/, '')
              return (
                <Link key={subject.id} href={`/training/${subject.id}`}>
                  <div className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer">
                    <div className="h-1 w-full" style={{ backgroundColor: subject.cover_color ?? '#334155' }} />
                    <div className="flex items-center gap-4 p-4">
                      {/* Client emoji */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: (subject.cover_color ?? '#334155') + '20' }}
                      >
                        {subject.emoji ?? '🏥'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug">
                          {clientName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-400">{total} SOP document{total !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Right */}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
