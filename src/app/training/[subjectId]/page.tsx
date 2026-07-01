// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'
import {
  ArrowLeft, CheckCircle2, ChevronRight,
  Clock, Lock, Sparkles, BookOpen, Play,
  HelpCircle, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PageParams = { params: Promise<{ subjectId: string }> }

export default async function TrainingSubjectPage({ params }: PageParams) {
  const { subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, subjectRes, stepProgressRes] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
    supabase
      .from('subjects')
      .select(`id, title, description, emoji, cover_color,
        topics(id, title, order_index, ai_quiz, steps(id, title, order_index)),
        quizzes(id, title, passing_score)`)
      .eq('id', subjectId)
      .single(),
    supabase.from('step_progress').select('step_id').eq('user_id', user.id),
  ])

  let quizAttemptsRes: { data: any[] | null } = { data: [] }
  let topicQuizRes: { data: any[] | null } = { data: [] }
  try { quizAttemptsRes = await supabase.from('quiz_attempts').select('quiz_id, passed, score').eq('user_id', user.id) } catch {}
  try { topicQuizRes = await supabase.from('topic_quiz_completions').select('topic_id, passed').eq('user_id', user.id) } catch {}

  const profile = profileRes.data
  const subject = subjectRes.data
  const isAdmin = profile?.role === 'admin'

  if (!subject) notFound()

  const completedIds       = new Set(stepProgressRes.data?.map(p => p.step_id) ?? [])
  const passedQuizIds      = new Set(quizAttemptsRes.data?.filter(a => a.passed).map(a => a.quiz_id) ?? [])
  const passedTopicQuizIds = new Set(topicQuizRes.data?.filter(r => r.passed).map(r => r.topic_id) ?? [])

  const topics = (subject.topics ?? [])
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((t: any) => ({ ...t, steps: (t.steps ?? []).sort((a: any, b: any) => a.order_index - b.order_index) }))

  const allStepIds     = topics.flatMap((t: any) => t.steps.map((s: any) => s.id))
  const completedCount = allStepIds.filter(id => completedIds.has(id)).length
  const totalCount     = allStepIds.length
  const percent        = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const readMins       = Math.max(2, topics.reduce((acc: number, t: any) => acc + Math.max(2, t.steps.length * 3), 0))
  const quiz           = (subject.quizzes as any[])?.[0]
  const quizPassed     = quiz ? passedQuizIds.has(quiz.id) : false
  const color          = subject.cover_color || '#7C3AED'

  const completionRate = percent

  const userName = profile?.full_name ?? 'User'
  const userRole = profile?.role === 'admin' ? 'Administrator' : 'Bookkeeper'

  function topicHasQuiz(t: any): boolean {
    return (t.ai_quiz?.questions?.length ?? 0) > 0
  }

  function topicStatus(t: any): 'completed' | 'quiz_pending' | 'in_progress' | 'not_started' | 'empty' {
    const total = t.steps.length
    const done  = t.steps.filter((s: any) => completedIds.has(s.id)).length
    if (total === 0)   return 'empty'
    if (done === 0)    return 'not_started'
    if (done < total)  return 'in_progress'
    // Only quiz_pending if a quiz actually exists and hasn't been passed
    if (topicHasQuiz(t) && !passedTopicQuizIds.has(t.id)) return 'quiz_pending'
    return 'completed'
  }

  function isTopicLocked(index: number): boolean {
    if (isAdmin || index === 0) return false
    const prev = topics[index - 1]
    if (prev.steps.length === 0) return false
    // If previous topic has a quiz, require passing it
    if (topicHasQuiz(prev)) return !passedTopicQuizIds.has(prev.id)
    // No quiz — just require all steps to be complete
    return !prev.steps.every((s: any) => completedIds.has(s.id))
  }

  function topicLockReason(index: number): string {
    if (index === 0) return ''
    const prev = topics[index - 1]
    const prevStepsDone = prev.steps.length > 0 && prev.steps.every((s: any) => completedIds.has(s.id))
    if (!prevStepsDone) return `Complete "${prev.title}" first`
    if (topicHasQuiz(prev)) return `Pass the quiz in "${prev.title}" to unlock`
    return `Complete "${prev.title}" first`
  }

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>

      {/* ── Sub-header ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="flex items-center gap-3 px-6 h-12">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-slate-200">/</span>
          <span className="text-sm font-semibold text-slate-700 truncate">{subject.title}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
            </div>
            <span className="text-xs font-bold" style={{ color }}>{percent}%</span>
          </div>
          <span className="text-slate-200 hidden sm:block">|</span>
          <span className="items-center gap-1 text-xs text-slate-400 hidden sm:flex shrink-0">
            <Clock className="w-3.5 h-3.5" />{readMins} min
          </span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Module hero */}
        <div
          className="rounded-2xl p-6 mb-8 flex items-center gap-5"
          style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)`, border: `1px solid ${color}25` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-sm"
            style={{ background: `${color}22` }}
          >
            {subject.emoji || '📚'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{subject.title}</h1>
            {subject.description && (
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">{subject.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-xs text-slate-500">{topics.length} topics</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">{totalCount} steps</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">{readMins} min read</span>
              {percent === 100 && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Topic list */}
        {topics.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400">No topics yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic: any, ti: number) => {
              const locked  = isTopicLocked(ti)
              const status  = topicStatus(topic)
              const firstStep = topic.steps[0]
              const href = firstStep
                ? `/training/${subject.id}/${topic.id}?step=${firstStep.id}`
                : `/training/${subject.id}/${topic.id}`

              const row = (
                <div className={cn(
                  'group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200',
                  locked
                    ? 'bg-slate-50/50 border-slate-100 opacity-50 cursor-not-allowed'
                    : status === 'completed'
                    ? 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-200 hover:shadow-sm cursor-pointer'
                    : status === 'quiz_pending'
                    ? 'bg-amber-50/40 border-amber-100 hover:border-amber-200 hover:shadow-sm cursor-pointer'
                    : status === 'in_progress'
                    ? 'bg-violet-50/40 border-violet-100 hover:border-violet-200 hover:shadow-sm cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-violet-200 hover:shadow-sm cursor-pointer'
                )}>

                  {/* Number/status indicator */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                    locked         ? 'bg-slate-100'
                    : status === 'completed'   ? 'bg-emerald-500'
                    : status === 'quiz_pending'? 'bg-amber-100'
                    : status === 'in_progress' ? 'bg-violet-100'
                    : 'bg-slate-100 group-hover:bg-violet-100'
                  )}>
                    {locked
                      ? <Lock className="w-3.5 h-3.5 text-slate-400" />
                      : status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : status === 'quiz_pending'
                      ? <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      : <span className={cn(
                          status === 'in_progress' ? 'text-violet-600' : 'text-slate-500 group-hover:text-violet-600'
                        )}>{ti + 1}</span>
                    }
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-semibold text-sm leading-snug',
                      locked          ? 'text-slate-400'
                      : status === 'completed' ? 'text-slate-600'
                      : 'text-slate-800 group-hover:text-violet-900'
                    )}>
                      {topic.title}
                    </p>
                    {locked ? (
                      <p className="text-xs text-slate-400 mt-0.5">{topicLockReason(ti)}</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {topic.steps.length} step{topic.steps.length !== 1 ? 's' : ''}
                        {status === 'in_progress' && (
                          <> · {topic.steps.filter((s: any) => completedIds.has(s.id)).length}/{topic.steps.length} done</>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Right badge + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'completed' && (
                      <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-lg px-2.5 py-1">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                    {status === 'quiz_pending' && (
                      <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 rounded-lg px-2.5 py-1">
                        <Sparkles className="w-3 h-3" /> Take quiz
                      </span>
                    )}
                    {status === 'in_progress' && (
                      <span className="hidden sm:inline text-[11px] font-bold text-violet-700 bg-violet-100 rounded-lg px-2.5 py-1">
                        In progress
                      </span>
                    )}
                    {status === 'not_started' && !locked && (
                      <Play className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-400 transition-colors" />
                    )}
                    {!locked && (
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                    )}
                  </div>
                </div>
              )

              return locked
                ? <div key={topic.id}>{row}</div>
                : <Link key={topic.id} href={href}>{row}</Link>
            })}
          </div>
        )}

        {/* Module-level quiz */}
        {quiz && (
          <div className={cn(
            'mt-8 rounded-2xl border-2 p-5',
            quizPassed ? 'border-emerald-200 bg-emerald-50' : 'border-violet-100 bg-violet-50'
          )}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  quizPassed ? 'bg-emerald-100' : 'bg-violet-100'
                )}>
                  {quizPassed ? <Trophy className="w-5 h-5 text-emerald-600" /> : <HelpCircle className="w-5 h-5 text-violet-600" />}
                </div>
                <div>
                  <p className={cn('font-bold text-sm', quizPassed ? 'text-emerald-800' : 'text-violet-800')}>{quiz.title}</p>
                  <p className={cn('text-xs mt-0.5', quizPassed ? 'text-emerald-600' : 'text-violet-500')}>
                    {quizPassed ? 'Module quiz passed — well done!' : `Pass mark: ${quiz.passing_score}%`}
                  </p>
                </div>
              </div>
              <Link href={`/quiz/${quiz.id}`}>
                <button className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105',
                  quizPassed
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-violet-700 text-white hover:bg-violet-800'
                )}>
                  {quizPassed ? 'Retake' : 'Take quiz'}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </UserClientWrapper>
  )
}
