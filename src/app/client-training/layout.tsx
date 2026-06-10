export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'

export default async function ClientTrainingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'User', userRole = 'Bookkeeper', completionRate = 0

  if (user) {
    try {
      const [profileRes, assignRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('assignments').select('subjects(topics(steps(id)))').eq('user_id', user.id),
        supabase.from('step_progress').select('step_id').eq('user_id', user.id),
      ])
      userName    = profileRes.data?.full_name ?? 'User'
      userRole    = profileRes.data?.role === 'admin' ? 'Administrator' : 'Bookkeeper'
      const allIds: string[] = (assignRes.data ?? []).flatMap((a: any) =>
        (a.subjects as any)?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
      )
      const done = new Set(progressRes.data?.map((p: any) => p.step_id) ?? [])
      completionRate = allIds.length > 0 ? Math.round((allIds.filter(id => done.has(id)).length / allIds.length) * 100) : 0
    } catch { /* fail silently */ }
  }

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>
      {children}
    </UserClientWrapper>
  )
}
