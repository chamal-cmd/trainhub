'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, FolderOpen, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  order_index: number
  content: any
}

interface Topic {
  id: string
  title: string
  order_index: number
  steps: Step[]
}

interface Props {
  topics: Topic[]
}

export default function GeneralSopsClient({ topics }: Props) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => {
    const s = new Set<string>()
    if (topics[0]) s.add(topics[0].id)
    return s
  })
  const [selectedStep, setSelectedStep] = useState<Step | null>(() => topics[0]?.steps[0] ?? null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(() => topics[0]?.id ?? null)

  function toggleTopic(id: string) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectStep(step: Step, topicId: string) {
    setSelectedStep(step)
    setSelectedTopicId(topicId)
  }

  const html = selectedStep?.content?.type === 'html' ? selectedStep.content.html : null

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left sidebar: category tree ── */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="text-base font-bold text-slate-800">General SOPs</h1>
          <p className="text-xs text-slate-400 mt-0.5">{topics.reduce((n, t) => n + t.steps.length, 0)} procedures</p>
        </div>

        <nav className="flex-1 py-2">
          {topics.map(topic => {
            const expanded = expandedTopics.has(topic.id)
            return (
              <div key={topic.id}>
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {expanded
                    ? <FolderOpen className="w-4 h-4 text-teal-600 shrink-0" />
                    : <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                  <span className="flex-1 text-left truncate">{topic.title}</span>
                  {expanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  }
                </button>

                {expanded && (
                  <div className="ml-4 border-l border-slate-100 mb-1">
                    {topic.steps.map(step => (
                      <button
                        key={step.id}
                        onClick={() => selectStep(step, topic.id)}
                        className={cn(
                          'w-full flex items-center gap-2 pl-4 pr-3 py-2 text-sm transition-colors text-left',
                          selectedStep?.id === step.id
                            ? 'bg-teal-50 text-teal-800 font-medium border-l-2 border-teal-600 -ml-px'
                            : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{step.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* ── Right: content viewer ── */}
      <div className="flex-1 overflow-y-auto bg-[#f8f8f8]">
        {!selectedStep ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-32">
            <FileText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">Select a procedure from the left</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-7 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-teal-600 font-medium mb-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {topics.find(t => t.steps.some(s => s.id === selectedStep.id))?.title}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedStep.title}</h2>
              </div>

              {/* Content */}
              <div className="px-8 py-7">
                {html ? (
                  <div
                    className="sop-content prose prose-slate max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <p className="text-slate-400 italic text-sm">No content available for this procedure.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .sop-content h1 { font-size: 1.15rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #1e293b; }
        .sop-content h2 { font-size: 1rem; font-weight: 700; margin: 1.1rem 0 0.4rem; color: #1e293b; }
        .sop-content h3 { font-size: 0.9rem; font-weight: 600; margin: 0.9rem 0 0.35rem; color: #334155; }
        .sop-content p  { margin: 0 0 0.6rem; color: #334155; }
        .sop-content ul, .sop-content ol { margin: 0.5rem 0 0.75rem 1.25rem; }
        .sop-content li { margin-bottom: 0.3rem; color: #334155; }
        .sop-content strong { font-weight: 600; color: #1e293b; }
        .sop-content a { color: #0f766e; text-decoration: underline; }
        .sop-content table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.8rem; }
        .sop-content th { background: #f1f5f9; font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; }
        .sop-content td { padding: 0.4rem 0.75rem; border: 1px solid #e2e8f0; }
        .sop-content img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0.75rem 0; display: block; }
      `}</style>
    </div>
  )
}
