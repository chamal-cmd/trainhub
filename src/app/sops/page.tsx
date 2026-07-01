export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import GeneralSopsClient from '@/app/admin/general-sops/GeneralSopsClient'

export default async function SopsPage() {
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('title', 'General SOPs')
    .single()

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center">
        <FileText className="w-12 h-12 text-slate-200 mb-4" />
        <p className="text-slate-500 font-semibold">No SOPs available yet</p>
      </div>
    )
  }

  const { data: topics } = await supabase
    .from('topics')
    .select('id, title, order_index, steps(id, title, order_index, content)')
    .eq('subject_id', subject.id)
    .order('order_index')

  const sortedTopics = (topics ?? []).map(t => ({
    ...t,
    steps: (t.steps as any[]).sort((a, b) => a.order_index - b.order_index),
  }))

  return <GeneralSopsClient topics={sortedTopics} />
}
