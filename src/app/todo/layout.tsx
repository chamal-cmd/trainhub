export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'

export default async function TodoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'User', userRole = 'Bookkeeper', completionRate = 0

  if (user) {
    try {
      const profileRes = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      userName = profileRes.data?.full_name ?? 'User'
      userRole = profileRes.data?.role === 'admin' ? 'Administrator' : 'Bookkeeper'
    } catch {}
  }

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>
      {children}
    </UserClientWrapper>
  )
}
