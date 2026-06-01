// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getUser, getProfile, getCompletedStepIds, getCompletionRate } from '@/lib/supabase/queries'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'
import { ProfileClient } from '@/components/profile/ProfileClient'

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  // Cached helpers deduplicate DB hits shared with layout/other pages in same request
  const [profile, completedIds, completionRate, assignmentsRes, allProfilesRes, allProgressRes] = await Promise.all([
    getProfile(user.id),
    getCompletedStepIds(user.id),
    getCompletionRate(user.id),
    supabase
      .from('assignments')
      .select('id, subjects(id, title, emoji, cover_color, topics(steps(id)))')
      .eq('user_id', user.id),
    supabase.from('profiles').select('id, full_name'),
    supabase.from('step_progress').select('user_id'),
  ])

  const assignments = assignmentsRes.data  ?? []
  const allProfiles = allProfilesRes.data  ?? []
  const allProgress = allProgressRes.data  ?? []

  // ── Build module list ──────────────────────────────────────────────────────
  const modules = assignments.map((a: any) => {
    const s = a.subjects as any
    const allSteps: string[] = s?.topics?.flatMap((t: any) =>
      t.steps?.map((step: any) => step.id) ?? []
    ) ?? []
    const completed = allSteps.filter(id => completedIds.has(id)).length
    const total     = allSteps.length
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      id: s.id, title: s.title, emoji: s.emoji ?? '📖',
      color: s.cover_color ?? null,
      completed, total, percent,
      readMins: Math.max(2, total * 3),
    }
  })

  // ── Build leaderboard ─────────────────────────────────────────────────────
  const stepsByUser = new Map<string, number>()
  for (const p of allProgress) {
    stepsByUser.set(p.user_id, (stepsByUser.get(p.user_id) ?? 0) + 1)
  }

  const leaderboard = allProfiles
    .map((p: any) => {
      const name = p.full_name ?? 'Unknown'
      return {
        userId:         p.id,
        name,
        initials:       name.split(' ').map((n: string) => n[0] ?? '').join('').toUpperCase().slice(0, 2),
        stepsCompleted: stepsByUser.get(p.id) ?? 0,
        isCurrentUser:  p.id === user.id,
        rank:           0,
      }
    })
    .sort((a: any, b: any) => b.stepsCompleted - a.stepsCompleted)
    .map((e: any, i: number) => ({ ...e, rank: i + 1 }))

  const userName = profile?.full_name ?? 'User'
  const userRole = profile?.role === 'admin' ? 'Administrator' : 'Bookkeeper'

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>
      <ProfileClient modules={modules} leaderboard={leaderboard} />
    </UserClientWrapper>
  )
}
