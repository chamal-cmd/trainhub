// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, assignmentsRes, stepProgressRes] = await Promise.all([
    supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single(),
    supabase.from('assignments').select('subjects(topics(steps(id)))').eq('user_id', user.id),
    supabase.from('step_progress').select('step_id').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const completedIds = new Set((stepProgressRes.data ?? []).map(p => p.step_id))

  const allIds: string[] = (assignmentsRes.data ?? []).flatMap((a: any) =>
    (a.subjects as any)?.topics?.flatMap((t: any) => t.steps?.map((s: any) => s.id) ?? []) ?? []
  )
  const completionRate = allIds.length > 0
    ? Math.round((allIds.filter(id => completedIds.has(id)).length / allIds.length) * 100)
    : 0

  const userName = profile?.full_name ?? 'User'
  const userRole = profile?.role === 'admin' ? 'Administrator' : 'Bookkeeper'
  const userEmail = user.email ?? profile?.email ?? ''

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>
      <SettingsClient
        userId={user.id}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
      />
    </UserClientWrapper>
  )
}
