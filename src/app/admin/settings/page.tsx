// Admin settings — renders within admin layout (sidebar stays visible)
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { redirect } from 'next/navigation'

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let profile: any = null
  try {
    const res = await supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single()
    profile = res.data
  } catch {}

  const userName  = profile?.full_name ?? ''
  const userEmail = user.email ?? profile?.email ?? ''
  const userRole  = profile?.role === 'admin' ? 'Administrator' : 'Bookkeeper'

  return (
    <div className="h-full">
      <SettingsClient
        userId={user.id}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        initialTab={tab as any}
      />
    </div>
  )
}
