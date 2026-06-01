'use client'

import { Sparkles } from 'lucide-react'

const PROMPTS = [
  'Show my training progress',
  'What tools does our team use?',
  'What are my responsibilities?',
]

function openAiPanel(query?: string) {
  if (query) {
    // For prompt chips: fire the custom event only.
    // UserTopBar's 'ai-panel-query' listener sets aiOpen=true.
    // Do NOT also fire the keyboard toggle — it would immediately close the panel again.
    window.dispatchEvent(new CustomEvent('ai-panel-query', { detail: { query } }))
  } else {
    // "Open AI Chat" button — toggle via Ctrl+K (panel is closed, so this opens it)
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
    )
  }
}

export function AiLaunchCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-300" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">AI Assistant</p>
            <p className="text-[11px] text-slate-400">Powered by your data</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Ask about your progress, modules, tools, or responsibilities.
        </p>

        {/* Suggested prompts */}
        <div className="space-y-1.5 mb-3">
          {PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => openAiPanel(q)}
              className="w-full text-left px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-xs text-slate-600 font-medium transition-all truncate"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>

        {/* Open button */}
        <button
          onClick={() => openAiPanel()}
          className="w-full h-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Open AI Chat
        </button>

        <p className="text-center text-[10px] text-slate-300 mt-2">
          Press <kbd className="font-mono bg-slate-100 text-slate-400 rounded px-1">Ctrl+K</kbd> from anywhere
        </p>
      </div>
    </div>
  )
}
