'use client'

export const dynamic = 'force-dynamic'

// ── Imports ───────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ExternalLink, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToolRow {
  id: string
  name: string
  description: string | null
  emoji: string
  category: string
  website_url: string | null
  created_at: string
}

interface ToolWithModules extends ToolRow {
  moduleCount: number
}

// ── Category badge colours ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Accounting':         'bg-indigo-50 text-indigo-700',
  'Data Capture':       'bg-teal-50 text-teal-700',
  'Reporting':          'bg-blue-50 text-blue-700',
  'Project Management': 'bg-violet-50 text-violet-700',
  'Communication':      'bg-amber-50 text-amber-700',
  'Productivity':       'bg-emerald-50 text-emerald-700',
  'General':            'bg-slate-100 text-slate-600',
}

// ── Page (default export) ─────────────────────────────────────────────────────

export default function ToolsPage() {
  const [tools, setTools]     = useState<ToolWithModules[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [toolsRes, subjectsRes] = await Promise.all([
        supabase.from('tools').select('*').order('name'),
        supabase.from('subjects').select('id, title'),
      ])

      const rawTools: ToolRow[]   = toolsRes.data  ?? []
      const subjects: any[]       = subjectsRes.data ?? []

      const annotated: ToolWithModules[] = rawTools.map(tool => {
        const keyword     = tool.name.toLowerCase()
        const moduleCount = subjects.filter((s: any) =>
          (s.title as string).toLowerCase().includes(keyword)
        ).length
        return { ...tool, moduleCount }
      })

      setTools(annotated)
      setLoading(false)
    }
    load()
  }, [])

  return <ToolsClient tools={tools} loading={loading} />
}

// ── ToolsClient (search/filter UI) ───────────────────────────────────────────

function ToolsClient({ tools, loading }: { tools: ToolWithModules[]; loading: boolean }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return tools
    const q = query.toLowerCase()
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  }, [tools, query])

  const categories = useMemo(() => {
    const map = new Map<string, ToolWithModules[]>()
    for (const tool of filtered) {
      if (!map.has(tool.category)) map.set(tool.category, [])
      map.get(tool.category)!.push(tool)
    }
    return map
  }, [filtered])

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Software &amp; tools</h1>
        <p className="text-sm text-slate-500 mt-1">
          Get visibility into the software and tools your team relies on.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-7 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-400 transition"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm h-40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state (no results from filter) */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <BookOpen className="w-9 h-9 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            {tools.length === 0 ? 'No tools found in the database.' : 'No tools match your search.'}
          </p>
          {tools.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">Run <code className="bg-slate-100 rounded px-1">scripts/seed-tools.sql</code> to populate the tools table.</p>
          )}
          {tools.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">Try a different search term.</p>
          )}
        </div>
      )}

      {/* Grouped tool tables */}
      {!loading && filtered.length > 0 && Array.from(categories.entries()).map(([category, categoryTools]) => (
        <div key={category} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">{category}</h2>
            <span className="text-xs text-slate-400 font-medium bg-slate-100 rounded-full px-2 py-0.5">
              {categoryTools.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Tool
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">
                    Category
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Modules
                  </th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryTools.map(tool => (
                  <ToolRow key={tool.id} tool={tool} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tool table row ────────────────────────────────────────────────────────────

function ToolRow({ tool }: { tool: ToolWithModules }) {
  const badgeClass = CATEGORY_COLORS[tool.category] ?? CATEGORY_COLORS['General']

  return (
    <tr className="group hover:bg-slate-50 transition-colors">
      {/* Name + description */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shrink-0">
            {tool.emoji}
          </div>
          <div>
            <p className="font-semibold text-slate-800 leading-snug">
              {tool.name}
            </p>
            {tool.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                {tool.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Category badge */}
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
          {tool.category}
        </span>
      </td>

      {/* Related modules */}
      <td className="px-5 py-3.5">
        {tool.moduleCount > 0 ? (
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {tool.moduleCount} module{tool.moduleCount !== 1 ? 's' : ''}
          </Link>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>

      {/* External link */}
      <td className="px-5 py-3.5 text-right">
        {tool.website_url && (
          <a
            href={tool.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
            title={`Open ${tool.name}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </td>
    </tr>
  )
}
