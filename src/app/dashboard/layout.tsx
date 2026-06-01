import { createClient } from '@/lib/supabase/server'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'

// Auth-gated layout — must always be dynamic
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName       = 'User'
  let userRole       = 'Bookkeeper'
  let completionRate = 0

  if (user) {
    try {
      const [profileRes, assignmentsRes, stepProgressRes] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('assignments').select('subjects(topics(steps(id)))').eq('user_id', user.id),
        supabase.from('step_progress').select('step_id').eq('user_id', user.id),
      ])

      userName = profileRes.data?.full_name ?? 'User'
      userRole = profileRes.data?.role === 'admin' ? 'Administrator' : 'Bookkeeper'

      const allStepIds: string[] = (assignmentsRes.data ?? []).flatMap((a: any) =>
        (a.subjects as any)?.topics?.flatMap((t: any) =>
          t.steps?.map((s: any) => s.id) ?? []
        ) ?? []
      )

      const completedIds = new Set(stepProgressRes.data?.map((p: any) => p.step_id) ?? [])
      const completedCount = allStepIds.filter(id => completedIds.has(id)).length

      completionRate = allStepIds.length > 0
        ? Math.round((completedCount / allStepIds.length) * 100)
        : 0
    } catch { /* fail silently — layout renders with defaults */ }
  }

  return (
    <UserClientWrapper
      userName={userName}
      userRole={userRole}
      completionRate={completionRate}
    >
      {children}
    </UserClientWrapper>
  )
}
