'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, ChevronRight, Video, Loader2, BookOpen } from 'lucide-react'

interface ClientModule {
  id: string
  title: string
  description: string | null
  emoji: string | null
  cover_color: string | null
  step_count: number
}

export default function AdminClientTrainingPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [modules,  setModules]  = useState<ClientModule[]>([])
  const [loading,  setLoading]  = useState(true)
  const [noColumn, setNoColumn] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('subjects')
      .select('id, title, description, emoji, cover_color, topics(id, steps(id))')
      .eq('is_client_training', true)
      .order('title')

    if (error) {
      // Column doesn't exist yet — migration not run
      setNoColumn(true)
      setLoading(false)
      return
    }

    setModules((data ?? []).map((s: any) => ({
      id:          s.id,
      title:       s.title,
      description: s.description,
      emoji:       s.emoji,
      cover_color: s.cover_color,
      step_count:  (s.topics ?? []).flatMap((t: any) => t.steps ?? []).length,
    })))
    setLoading(false)
  }

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Training</h1>
          <p className="text-sm text-slate-500 mt-1">
            Modules imported from the GP Bookkeeper training sheet. Click any module to edit its steps and videos.
          </p>
        </div>
        <Link href="/admin/subjects">
          <button className="flex items-center gap-2 px-4 h-9 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 transition-colors">
            <BookOpen className="w-4 h-4" /> All Subjects
          </button>
        </Link>
      </div>

      {/* Migration banner */}
      {noColumn && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-amber-900 mb-1">⚠️ Migration required</p>
          <p className="text-xs text-amber-800 mb-3">
            Run this SQL in <strong>Supabase → SQL Editor</strong> first, then run the import script:
          </p>
          <pre className="bg-amber-100 text-amber-900 text-xs rounded-lg p-3 overflow-x-auto mb-3 font-mono">
            {`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_client_training BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_subjects_client_training ON subjects (is_client_training) WHERE is_client_training = TRUE;`}
          </pre>
          <p className="text-xs text-amber-800">
            Then seed modules by running:
          </p>
          <pre className="bg-amber-100 text-amber-900 text-xs rounded-lg p-3 mt-1.5 font-mono">
            {`node scripts/import-client-training.js "C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training (1).xlsx"`}
          </pre>
        </div>
      )}


      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {/* Empty */}
      {!loading && !noColumn && modules.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <Building2 className="w-9 h-9 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No client modules imported yet</p>
          <p className="text-xs text-slate-400 mt-1">Run the import script above to seed modules from the Excel file.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !noColumn && modules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map(m => (
            <div
              key={m.id}
              onClick={() => router.push(`/admin/subjects/${m.id}`)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: m.cover_color ?? '#6366f1' }} />
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: (m.cover_color ?? '#6366f1') + '20' }}
                  >
                    {m.emoji ?? '🏥'}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors mt-1.5" />
                </div>

                <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-violet-900 flex-1">
                  {m.title}
                </h3>
                {m.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                )}

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <Video className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-400">{m.step_count} step{m.step_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
