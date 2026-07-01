export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/queries'
import { NudgeTodoSection } from '@/components/shared/NudgeTodoSection'
import { CheckSquare } from 'lucide-react'

export default async function TodoPage() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  const { data } = await supabase
    .from('assignments')
    .select('id, created_at, subjects(id, title, emoji, cover_color)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const nudges = ((data ?? []) as any[]).filter(n => n.subjects)

  return (
    <div className="min-h-full bg-[#f8f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-7">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <CheckSquare className="w-6 h-6 text-violet-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
            {nudges.length > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {nudges.length}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            Training modules your admin has asked you to complete.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-8 py-7">
        <NudgeTodoSection initialNudges={nudges} />
      </div>
    </div>
  )
}
