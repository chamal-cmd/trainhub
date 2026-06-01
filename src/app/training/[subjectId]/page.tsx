// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'
import {
  ArrowLeft, CheckCircle2, HelpCircle, ChevronRight,
  FileText, Pin, Clock, BookOpen
} from 'lucide-react'

type PageParams = { params: Promise<{ subjectId: string }> }

export default async function TrainingSubjectPage({ params }: PageParams) {
  const { subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    profileRes,
    assignmentRes,
    subjectRes,
    stepProgressRes,
    allAssignmentsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
    supabase.from('assignments').select('id, due_date').eq('subject_id', subjectId).eq('user_id', user.id).single(),
    supabase
      .from('subjects')
      .select('id, title, description, emoji, cover_color, topics(id, title, order_index, steps(id, title, order_index)), quizzes(id, title, passing_score)')
      .eq('id', subjectId)
      .single(),
    supabase.from('step_progress').select('step_id').eq('user_id', user.id),
    supabase.from('assignments').select('subjects(topics(steps(id)))').eq('user_id', user.id),
  ])

  // quiz_attempts fetched separately — table may not exist yet
  const quizAttemptsRes = await supabase.from('quiz_attempts').select('quiz_id, passed, score').eq('user_id', user.id).catch(() => ({ data: [] }))

  const profile    = profileRes.data
  const assignment = assignmentRes.data
  const subject    = subjectRes.data

  // Admins can preview any subject even without an assignment
  const isAdmin = profile?.role === 'admin'
  if (!subject) notFound()
  if (!assignment && !isAdmin) notFound()

  const completedIds  = new Set(stepProgressRes.data?.map(p => p.step_id) ?? [])
  const passedQuizIds = new Set(quizAttemptsRes.data?.filter(a => a.passed).map(a => a.quiz_id) ?? [])

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

  const allIds: string[] = (allAssignmentsRes.data ?? []).flatMap((a: any) =>
    (a.subjects as any)?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
  )
  const completionRate = allIds.length > 0
    ? Math.round((allIds.filter(id => completedIds.has(id)).length / allIds.length) * 100)
    : 0

  const userName = profile?.full_name ?? 'User'
  const userRole = profile?.role === 'admin' ? 'Administrator' : 'Bookkeeper'

  // Per-topic status
  function topicStatus(t: any) {
    const total   = t.steps.length
    const done    = t.steps.filter((s: any) => completedIds.has(s.id)).length
    if (total === 0)        return 'empty'
    if (done === 0)         return 'not_started'
    if (done < total)       return 'in_progress'
    return 'completed'
  }

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>

      {/* ── Trainual-style sub-header ── */}
      <div className="flex items-center gap-3 px-6 h-12 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-10">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 font-medium shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <span className="text-slate-300 shrink-0">|</span>

        <span className="text-sm font-medium text-slate-700 truncate">{subject.title}</span>

        <span className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-full px-2.5 py-0.5 shrink-0">
          Subject
        </span>

        <div className="flex-1" />

        {/* Progress bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">{percent}%</span>
        </div>

        <span className="text-slate-300 shrink-0">|</span>

        <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {readMins} min read
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-8 py-10">

        {/* Subject title block */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{subject.title}</h1>
            {subject.description && (
              <p className="text-slate-500 text-sm mt-1.5">{subject.description}</p>
            )}
            {/* Owned by */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <span className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                Owned by {userName}
              </span>
            </div>
          </div>
        </div>

        {/* ── Topics list ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
          {topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-slate-400 text-sm">No topics yet.</p>
            </div>
          ) : (
            topics.map((topic: any, ti: number) => {
              const status = topicStatus(topic)
              const firstStep = topic.steps[0]
              const href = firstStep
                ? `/training/${subject.id}/${topic.id}?step=${firstStep.id}`
                : `/training/${subject.id}/${topic.id}`

              return (
                <Link key={topic.id} href={href}>
                  <div className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group ${ti < topics.length - 1 ? 'border-b border-slate-100' : ''}`}>

                    {/* Document badge */}
                    <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 shrink-0">
                      Document
                    </span>

                    {/* Title */}
                    <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-slate-900 truncate">
                      {topic.title}
                    </span>

                    {/* Status badge */}
                    {status === 'completed' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {status === 'in_progress' && (
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 shrink-0">
                        In progress
                      </span>
                    )}
                    {(status === 'not_started' || status === 'empty') && (
                      <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1 shrink-0">
                        Not started
                      </span>
                    )}

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* ── Quiz section ── */}
        {quiz && (
          <div className={`rounded-xl border-2 p-5 ${quizPassed ? 'border-emerald-200 bg-emerald-50' : 'border-indigo-100 bg-indigo-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${quizPassed ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                  {quizPassed ? '🏆' : <HelpCircle className="w-5 h-5 text-indigo-600" />}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${quizPassed ? 'text-emerald-800' : 'text-indigo-800'}`}>{quiz.title}</p>
                  <p className={`text-xs ${quizPassed ? 'text-emerald-600' : 'text-indigo-500'}`}>
                    {quizPassed ? 'Quiz completed — well done!' : `Passing score: ${quiz.passing_score}%`}
                  </p>
                </div>
              </div>
              <Link href={`/quiz/${quiz.id}`}>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${quizPassed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {quizPassed ? 'Retake Quiz' : 'Take Quiz'}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </UserClientWrapper>
  )
}
