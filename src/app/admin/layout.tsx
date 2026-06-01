// Auth-gated layout — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/shared/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName  = ''
  let userEmail = ''

  if (user) {
    // Profile fetch is now the only DB call needed — no sequential await
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    userName  = profile?.full_name ?? ''
    userEmail = profile?.email ?? user.email ?? ''
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  )
}
