export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FileText, FolderOpen } from 'lucide-react'
import GeneralSopsClient from './GeneralSopsClient'

export default async function GeneralSopsPage() {
  const supabase = await createClient()

  // Find the General SOPs subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, title')
    .eq('title', 'General SOPs')
    .single()

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center">
        <FileText className="w-12 h-12 text-slate-200 mb-4" />
        <p className="text-slate-500 font-semibold">No General SOPs found</p>
        <p className="text-slate-400 text-sm mt-1">
          Run <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">node scripts/upload-general-sops.mjs</code> to upload SOPs.
        </p>
      </div>
    )
  }

  // Load all topics + steps for this subject
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
