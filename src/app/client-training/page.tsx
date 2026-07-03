export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Building2, ChevronRight, Clock, FileText, FolderOpen, Video } from 'lucide-react'

export default async function ClientTrainingPage() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, title, description, emoji, cover_color, order_index, topics(id, order_index, steps(id, order_index))')
    .eq('is_client_training', true)
    .order('title')

  const all = allSubjects ?? []

  // SOPs have titles starting with "SOPs"
  const sopSubjects  = all.filter((s: any) => s.title.startsWith('SOPs'))
  const trainSubjects = all.filter((s: any) => !s.title.startsWith('SOPs'))

  const modules = trainSubjects.map((subject: any) => {
    const sortedTopics = [...(subject.topics ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
    const firstTopic   = sortedTopics[0]
    const firstStep    = firstTopic
      ? [...(firstTopic.steps ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)[0]
      : null
    const href = firstTopic && firstStep
      ? `/training/${subject.id}/${firstTopic.id}?step=${firstStep.id}`
      : `/training/${subject.id}`
    const stepCount: number = sortedTopics.flatMap((t: any) => t.steps ?? []).length
    return { subject, stepCount, href }
  })

  const sopModules = sopSubjects.map((subject: any) => {
    const total: number = subject.topics?.flatMap((t: any) => t.steps ?? []).length ?? 0
    const clientName = (subject.title as string).replace(/^SOPs\s*[—–-]\s*/i, '')
    return { subject, total, clientName }
  })

  return (
    <div className="px-6 py-7 min-h-full bg-[#f8f8f8]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Client Training</h1>
        <p className="text-sm text-slate-500 mt-1">
          Training modules and SOPs for each client.
        </p>
      </div>

      {/* ── Training Modules ─────────────────────────────────────────────── */}
      {modules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {modules.map(({ subject, stepCount, href }) => {
            const readMins = Math.max(2, stepCount * 3)
            return (
              <Link key={subject.id} href={href}>
                <div className="group bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer h-full flex flex-col">
                  <div className="h-1.5 w-full" style={{ backgroundColor: subject.cover_color ?? '#6366f1' }} />
                  <div className="p-5 flex flex-col flex-1">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3 shrink-0"
                      style={{ backgroundColor: (subject.cover_color ?? '#6366f1') + '20' }}
                    >
                      {subject.emoji ?? '🏥'}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-violet-900 flex-1">
                      {subject.title}
                    </h3>
                    {subject.description && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {subject.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Video className="w-3 h-3" /> {stepCount} task{stepCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" /> ~{readMins}m
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-500 transition-colors ml-auto" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {modules.length === 0 && sopModules.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <Building2 className="w-9 h-9 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No client modules yet</p>
          <p className="text-xs text-slate-400 mt-1">Your administrator will add client training modules here.</p>
        </div>
      )}

      {/* ── Client SOPs ──────────────────────────────────────────────────── */}
      {sopModules.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Client SOPs</h2>
              <p className="text-xs text-slate-400">Standard Operating Procedures — follow for each client task</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sopModules.map(({ subject, total, clientName }) => (
              <Link key={subject.id} href={`/training/${subject.id}`}>
                <div className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer">
                  <div className="h-1 w-full" style={{ backgroundColor: subject.cover_color ?? '#334155' }} />
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: (subject.cover_color ?? '#334155') + '20' }}
                    >
                      {subject.emoji ?? '🏥'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug truncate">
                        {clientName}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400">{total} SOP{total !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
