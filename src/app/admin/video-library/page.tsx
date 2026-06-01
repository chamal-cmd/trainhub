'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Film, Play, Search, Loader2, ExternalLink, RefreshCw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type VideoStep = {
  id: string
  title: string
  content: any
  updated_at: string
  topics: {
    id: string
    title: string
    subjects: {
      id: string
      title: string
      emoji: string
      cover_color: string
    }
  }
}

type VideoType = 'loom' | 'youtube' | 'scribe' | 'tango' | 'drive' | 'video'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Walk TipTap JSON and return every video node found */
function extractVideoNodes(content: any): { type: VideoType; src: string }[] {
  const results: { type: VideoType; src: string }[] = []
  if (!content) return results

  function walk(node: any) {
    if (!node) return
    if (node.type === 'youtube') {
      results.push({ type: 'youtube', src: node.attrs?.src ?? '' })
    }
    if (node.type === 'iframeEmbed') {
      const src: string = node.attrs?.src ?? ''
      let vtype: VideoType = 'video'
      if (src.includes('loom.com'))          vtype = 'loom'
      else if (src.includes('scribehow'))    vtype = 'scribe'
      else if (src.includes('tango.us'))     vtype = 'tango'
      else if (src.includes('drive.google')) vtype = 'drive'
      results.push({ type: vtype, src })
    }
    if (node.content) node.content.forEach(walk)
  }

  walk(content)
  return results
}

function hasVideoContent(content: any): boolean {
  return extractVideoNodes(content).length > 0
}

const VIDEO_LABELS: Record<VideoType, { label: string; color: string }> = {
  loom:    { label: 'Loom',    color: 'bg-violet-100 text-violet-700' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700' },
  scribe:  { label: 'Scribe',  color: 'bg-orange-100 text-orange-700' },
  tango:   { label: 'Tango',   color: 'bg-emerald-100 text-emerald-700' },
  drive:   { label: 'Drive',   color: 'bg-blue-100 text-blue-700' },
  video:   { label: 'Video',   color: 'bg-slate-100 text-slate-700' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VideoLibraryPage() {
  const [steps,   setSteps]   = useState<VideoStep[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<VideoType | 'all'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('steps')
      .select(`
        id, title, content, updated_at,
        topics(id, title, subjects(id, title, emoji, cover_color))
      `)
      .order('updated_at', { ascending: false })

    const videoSteps = (data ?? []).filter(s => hasVideoContent(s.content))
    setSteps(videoSteps as unknown as VideoStep[])
    setLoading(false)
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = steps.filter(s => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      s.title.toLowerCase().includes(q) ||
      (s.topics as any)?.subjects?.title?.toLowerCase().includes(q) ||
      (s.topics as any)?.title?.toLowerCase().includes(q)

    const matchesFilter = filter === 'all' ||
      extractVideoNodes(s.content).some(v => v.type === filter)

    return matchesSearch && matchesFilter
  })

  // Group by subject
  const grouped = filtered.reduce((acc, step) => {
    const sub = (step.topics as any)?.subjects
    const key = sub?.id ?? 'unknown'
    if (!acc[key]) acc[key] = { subject: sub, steps: [] }
    acc[key].steps.push(step)
    return acc
  }, {} as Record<string, { subject: any; steps: VideoStep[] }>)

  const totalVideos = steps.reduce((acc, s) => acc + extractVideoNodes(s.content).length, 0)

  const filterTabs: { key: VideoType | 'all'; label: string }[] = [
    { key: 'all',     label: `All (${totalVideos})` },
    { key: 'loom',    label: 'Loom' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'tango',   label: 'Tango' },
    { key: 'drive',   label: 'Drive' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Film className="w-6 h-6 text-indigo-500" />
            Video Library
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            All video-embedded steps across your training modules — Loom, YouTube, Tango, Scribe, Google Drive
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search videos or modules…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : steps.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No results for "{search}"</div>
      ) : (
        <div className="space-y-5">
          {Object.values(grouped).map(({ subject, steps: groupSteps }) => (
            <div
              key={subject?.id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              style={{ borderLeftColor: subject?.cover_color, borderLeftWidth: 4 }}
            >
              {/* Module header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="text-lg">{subject?.emoji}</span>
                <Link
                  href={`/admin/subjects/${subject?.id}`}
                  className="font-bold text-slate-800 text-sm hover:text-indigo-600 transition-colors"
                >
                  {subject?.title}
                </Link>
                <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {groupSteps.length} video step{groupSteps.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Steps */}
              <div className="divide-y divide-slate-50">
                {groupSteps.map(step => {
                  const videos = extractVideoNodes(step.content)
                  return (
                    <div key={step.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{step.title}</p>
                        <p className="text-xs text-slate-400 truncate">{(step.topics as any)?.title}</p>
                      </div>

                      {/* Video type badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {videos.map((v, i) => {
                          const meta = VIDEO_LABELS[v.type]
                          return (
                            <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                              {meta.label}
                            </span>
                          )
                        })}
                      </div>

                      {/* Updated */}
                      <span className="text-[11px] text-slate-400 shrink-0 hidden sm:block">
                        {timeAgo(step.updated_at)}
                      </span>

                      {/* Edit link */}
                      <Link
                        href={`/admin/subjects/${subject?.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Edit
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guide callout */}
      {!loading && steps.length > 0 && (
        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-indigo-900 mb-1.5">Adding new videos</h3>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Open any step → click the <strong>🎬 video button</strong> in the toolbar → paste a URL.
            Supports <strong>Loom</strong>, <strong>YouTube</strong>, <strong>Tango</strong> (free), <strong>Scribe</strong>, and <strong>Google Drive</strong> links.
            Videos appear embedded inline so learners never leave the platform.
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <Film className="w-7 h-7 text-indigo-300" />
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1.5">No videos embedded yet</h3>
      <p className="text-slate-400 text-sm text-center max-w-sm leading-relaxed">
        Open any training step, click the <strong>🎬 video button</strong> in the editor toolbar,
        and paste a Loom, YouTube, Tango (free), or Google Drive URL.
      </p>
    </div>
  )
}
