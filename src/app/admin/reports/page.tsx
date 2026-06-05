// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getInitials, formatDate } from '@/lib/utils'
import { BarChart3, TrendingUp, Award, Users } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'user')
    .order('full_name')

  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      user_id, subject_id,
      subjects(id, title, emoji,
        topics(steps(id))
      )
    `)

  const { data: stepProgress } = await supabase
    .from('step_progress')
    .select('user_id, step_id')

  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('user_id, quiz_id, score, passed, completed_at')

  // Build per-user stats
  const userStats = (users ?? []).map(user => {
    const userAssignments = (assignments ?? []).filter(a => a.user_id === user.id)
    const userStepIds = (stepProgress ?? []).filter(p => p.user_id === user.id).map(p => p.step_id)
    const userAttempts = (quizAttempts ?? []).filter(a => a.user_id === user.id)
    const passedQuizzes = userAttempts.filter(a => a.passed).length

    const moduleProgress = userAssignments.map(a => {
      const allSteps: string[] = (a.subjects as any)?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
      const completed = allSteps.filter(sid => userStepIds.includes(sid)).length
      return {
        title: (a.subjects as any)?.title ?? '',
        emoji: (a.subjects as any)?.emoji ?? '📚',
        total: allSteps.length,
        completed,
        percent: allSteps.length > 0 ? Math.round((completed / allSteps.length) * 100) : 0,
      }
    })

    const totalSteps = moduleProgress.reduce((s, m) => s + m.total, 0)
    const completedSteps = moduleProgress.reduce((s, m) => s + m.completed, 0)
    const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    return { ...user, moduleProgress, totalSteps, completedSteps, overallPercent, passedQuizzes, totalAssigned: userAssignments.length }
  })

  const totalAssignments = (assignments ?? []).length
  const avgProgress = userStats.length > 0 ? Math.round(userStats.reduce((s, u) => s + u.overallPercent, 0) / userStats.length) : 0
  const totalPassed = (quizAttempts ?? []).filter(a => a.passed).length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Track team training progress</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Assignments', value: totalAssignments, icon: BarChart3, color: 'text-violet-700 bg-violet-50' },
          { label: 'Avg. Completion', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Quizzes Passed', value: totalPassed, icon: Award, color: 'text-amber-600 bg-amber-50' },
          { label: 'Active Learners', value: userStats.filter(u => u.completedSteps > 0).length, icon: Users, color: 'text-sky-600 bg-sky-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-user progress */}
      <div className="space-y-4">
        {userStats.map(user => (
          <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-slate-900 text-sm">{user.full_name}</p>
                  <div className="flex items-center gap-2">
                    {user.passedQuizzes > 0 && (
                      <Badge variant="success">🏆 {user.passedQuizzes} quiz{user.passedQuizzes > 1 ? 'zes' : ''} passed</Badge>
                    )}
                    <span className="text-xs text-slate-500">{user.overallPercent}% complete</span>
                  </div>
                </div>
                <Progress value={user.overallPercent} className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  {user.moduleProgress.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs">{m.emoji}</span>
                      <span className="text-xs text-slate-600">{m.title}</span>
                      <span className={`text-xs font-medium ml-1 ${m.percent === 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {m.completed}/{m.total}
                      </span>
                    </div>
                  ))}
                  {user.totalAssigned === 0 && (
                    <span className="text-xs text-slate-400">No training assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
