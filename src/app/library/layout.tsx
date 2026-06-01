export const dynamic = 'force-dynamic'

import { getUser, getProfile, getCompletionRate } from '@/lib/supabase/queries'
import { UserClientWrapper } from '@/components/shared/UserClientWrapper'

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  let userName = 'User', userRole = 'Bookkeeper', completionRate = 0

  if (user) {
    // Both cached — if dashboard or another layout already called these,
    // React deduplicates and returns the same promise result
    const [profile, rate] = await Promise.all([
      getProfile(user.id),
      getCompletionRate(user.id),
    ])
    userName       = profile?.full_name ?? 'User'
    userRole       = profile?.role === 'admin' ? 'Administrator' : 'Bookkeeper'
    completionRate = rate
  }

  return (
    <UserClientWrapper userName={userName} userRole={userRole} completionRate={completionRate}>
      {children}
    </UserClientWrapper>
  )
}
