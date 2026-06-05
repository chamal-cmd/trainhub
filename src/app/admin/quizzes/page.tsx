// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, HelpCircle, BookOpen, CheckCircle2, ChevronRight, ArrowRight, ClipboardList } from 'lucide-react'

export default async function QuizzesPage() {
  const supabase = await createClient()

  // Fetch all subjects — with their quiz (if any) and question count
  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id, title, emoji, cover_color,
      quizzes(id, title, passing_score,
        quiz_questions(id)
      )
    `)
    .order('created_at', { ascending: false })

  // Fetch recent quiz attempts for activity
  const { data: recentAttempts } = await supabase
    .from('quiz_attempts')
    .select('id, score, passed, completed_at, profiles(full_name), quizzes(title)')
    .order('completed_at', { ascending: false })
    .limit(10)

  const withQuiz    = (subjects ?? []).filter((s: any) => s.quizzes?.length > 0)
  const withoutQuiz = (subjects ?? []).filter((s: any) => !s.quizzes?.length)

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Quizzes</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Build and manage quizzes for your training modules. Each module can have one quiz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: quiz list ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Modules WITH a quiz */}
          {withQuiz.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active Quizzes ({withQuiz.length})</p>
              <div className="space-y-2">
                {withQuiz.map((subject: any) => {
                  const quiz      = subject.quizzes[0]
                  const qCount    = quiz.quiz_questions?.length ?? 0
                  return (
                    <Link key={subject.id} href={`/admin/subjects/${subject.id}/quiz`}>
                      <div className="bg-white border border-slate-100 hover:border-violet-300 hover:shadow-sm rounded-2xl p-4 flex items-center gap-4 group transition-all">
                        {/* Subject icon */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: subject.cover_color + '20' }}
                        >
                          {subject.emoji}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-800 transition-colors truncate">
                            {quiz.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 truncate">{subject.title}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-400">{qCount} question{qCount !== 1 ? 's' : ''}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-400">Pass: {quiz.passing_score}%</span>
                          </div>
                        </div>

                        {/* Badge + arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Live
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Modules WITHOUT a quiz — create prompt */}
          {withoutQuiz.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                No Quiz Yet ({withoutQuiz.length})
              </p>
              <div className="space-y-2">
                {withoutQuiz.map((subject: any) => (
                  <Link key={subject.id} href={`/admin/subjects/${subject.id}/quiz`}>
                    <div className="bg-white border border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 rounded-2xl p-4 flex items-center gap-4 group transition-all">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 opacity-60"
                        style={{ backgroundColor: subject.cover_color + '20' }}
                      >
                        {subject.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-500 group-hover:text-violet-800 transition-colors truncate">
                          {subject.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">No quiz created yet</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 group-hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        <Plus className="w-3 h-3" /> Create Quiz
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {(subjects ?? []).length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <HelpCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No training modules yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-5">Create a module first, then add a quiz to it.</p>
              <Link href="/admin/subjects/new"
                className="inline-flex items-center gap-2 bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-800 transition-colors">
                <Plus className="w-4 h-4" /> Create Module
              </Link>
            </div>
          )}
        </div>

        {/* ── Right: activity feed + how-to ── */}
        <div className="space-y-4">

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <p className="text-2xl font-bold text-violet-700">{withQuiz.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Quizzes live</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{recentAttempts?.length ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">Recent attempts</p>
            </div>
          </div>

          {/* Recent attempts */}
          {recentAttempts && recentAttempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Recent Attempts</span>
                </div>
                <Link href="/admin/reports" className="text-xs text-violet-700 font-semibold hover:underline">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {recentAttempts.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {a.score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{(a.profiles as any)?.full_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{(a.quizzes as any)?.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {a.passed ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How quiz builder works */}
          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
            <p className="text-xs font-bold text-violet-800 mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> How it works
            </p>
            <ul className="space-y-2 text-xs text-violet-800/80">
              <li className="flex gap-2"><span className="font-bold shrink-0">1.</span> Click any module above to open its quiz builder</li>
              <li className="flex gap-2"><span className="font-bold shrink-0">2.</span> Add multiple choice or true/false questions</li>
              <li className="flex gap-2"><span className="font-bold shrink-0">3.</span> Set a passing score (default 70%)</li>
              <li className="flex gap-2"><span className="font-bold shrink-0">4.</span> Add an explanation for each answer</li>
              <li className="flex gap-2"><span className="font-bold shrink-0">5.</span> Save — team members can take it immediately</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
