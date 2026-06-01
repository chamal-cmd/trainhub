'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, SquarePen, Clock, Send, Sparkles, RotateCcw, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { processQuery, type AiContext } from '@/lib/ai-engine'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  userName: string
  completionRate: number
}

const SUGGESTED = [
  'Show my training progress',
  'What tools does our team use?',
  'What are my responsibilities?',
]

// ── Typing simulation ─────────────────────────────────────────────────────────
// Streams text word-by-word so it feels like a live response

function streamText(
  text: string,
  onChunk: (partial: string) => void,
  onDone: () => void,
) {
  const words  = text.split(' ')
  let   cursor = 0
  const delay  = Math.max(18, Math.min(40, 1800 / words.length)) // adapt speed to length

  function tick() {
    cursor++
    onChunk(words.slice(0, cursor).join(' '))
    if (cursor < words.length) {
      setTimeout(tick, delay)
    } else {
      onDone()
    }
  }
  setTimeout(tick, 120) // brief initial pause
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiAssistantPanel({ open, onClose, userName, completionRate }: Props) {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [history,      setHistory]      = useState<Message[][]>([])
  const [showHistory,  setShowHistory]  = useState(false)
  const [aiCtx,        setAiCtx]        = useState<AiContext | null>(null)
  const [ctxLoading,   setCtxLoading]   = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // ── Fetch context from Supabase when panel first opens ─────────────────────

  useEffect(() => {
    if (!open || aiCtx || ctxLoading) return
    setCtxLoading(true)

    async function loadContext() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCtxLoading(false); return }

      const [profileRes, assignmentsRes, stepProgressRes, toolsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('assignments').select('subjects(id, title, emoji, cover_color, topics(steps(id)))').eq('user_id', user.id),
        supabase.from('step_progress').select('step_id').eq('user_id', user.id),
        supabase.from('tools').select('name, emoji, category, description, website_url').order('name'),
      ])

      const completedIds = new Set((stepProgressRes.data ?? []).map((p: any) => p.step_id))

      const modules = (assignmentsRes.data ?? []).map((a: any) => {
        const s         = a.subjects as any
        const allSteps: string[] = s?.topics?.flatMap((t: any) => t.steps?.map((st: any) => st.id) ?? []) ?? []
        const completed = allSteps.filter(id => completedIds.has(id)).length
        const total     = allSteps.length
        const percent   = total > 0 ? Math.round((completed / total) * 100) : 0
        return {
          id: s.id, title: s.title, emoji: s.emoji ?? '📖',
          percent, total, completed, readMins: Math.max(2, total * 3),
        }
      })

      const totalSteps     = modules.reduce((s: number, m: any) => s + m.total, 0)
      const completedSteps = modules.reduce((s: number, m: any) => s + m.completed, 0)
      const rate           = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : completionRate

      setAiCtx({
        userName:       profileRes.data?.full_name ?? userName,
        userRole:       profileRes.data?.role === 'admin' ? 'Administrator' : 'Bookkeeper',
        completionRate: rate,
        modules,
        tools: toolsRes.data ?? [],
      })
      setCtxLoading(false)
    }

    loadContext()
  }, [open, aiCtx, ctxLoading, userName, completionRate])

  // ── Auto-scroll + focus ────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }])

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const ctx = aiCtx ?? { userName, completionRate, userRole: 'Bookkeeper', modules: [], tools: [] }
      const userContext = `Name: ${ctx.userName}, Role: ${ctx.userRole}, Overall completion: ${ctx.completionRate}%, Modules: ${ctx.modules.map(m => `${m.title} (${m.percent}%)`).join(', ') || 'none'}`

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userContext,
        }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) throw new Error('AI request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        ))
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[AI Panel] fetch error:', err)
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: 'Sorry, I had trouble connecting. Please try again.' } : m
        ))
      }
    } finally {
      abortRef.current = null
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, streaming: false } : m
      ))
      setLoading(false)
    }
  }, [loading, messages, aiCtx, userName, completionRate])

  // Listen for query from the AI launch card on the dashboard
  // (must be placed AFTER sendMessage is defined to avoid TDZ error)
  useEffect(() => {
    function onQuery(e: Event) {
      const query = (e as CustomEvent<{ query: string }>).detail?.query
      if (query) sendMessage(query)
    }
    window.addEventListener('ai-panel-query', onQuery)
    return () => window.removeEventListener('ai-panel-query', onQuery)
  }, [sendMessage])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function startNewChat() {
    if (messages.length > 0) setHistory(h => [[...messages], ...h])
    setMessages([])
    setInput('')
    setShowHistory(false)
  }

  // ── Render markdown-like bold (**text**) ───────────────────────────────────

  function renderContent(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  if (!open) return null

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] z-50 flex flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right-2 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">AI Assistant</span>
            {ctxLoading && (
              <span className="text-[11px] text-slate-400 animate-pulse">loading your data…</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={startNewChat} title="New chat"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <SquarePen className="w-4 h-4" />
            </button>
            <button onClick={() => setShowHistory(v => !v)} title="Chat history"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showHistory ? 'bg-indigo-50 text-indigo-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
              <Clock className="w-4 h-4" />
            </button>
            <button onClick={onClose} title="Close"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── History panel ── */}
        {showHistory && (
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent chats</p>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">No previous chats yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((chat, i) => {
                  const first = chat.find(m => m.role === 'user')?.content ?? 'Chat'
                  return (
                    <button key={i}
                      onClick={() => { setMessages(chat); setShowHistory(false) }}
                      className="w-full text-left px-3 py-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors text-sm text-slate-700 truncate">
                      {first}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Chat area ── */}
        {!showHistory && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5">

              {/* Welcome state */}
              {!hasMessages && (
                <div className="flex flex-col h-full">
                  <div className="h-28 rounded-2xl mb-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mb-1">Hey there! 👋</p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    I&apos;m your friendly AI teammate, powered by your actual TrainHub data.
                    Ask me about your progress, tools, training modules, or responsibilities.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED.map(q => (
                      <button key={q} onClick={() => sendMessage(q)}
                        className="w-full text-left px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-sm text-slate-700 font-medium transition-all shadow-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {hasMessages && (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.content === '' && msg.streaming ? (
                          <span className="flex gap-1 items-center py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                          </span>
                        ) : (
                          <span className="whitespace-pre-wrap">{renderContent(msg.content)}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {!loading && messages.length > 1 && (
                    <div className="flex justify-center pt-2">
                      <button onClick={startNewChat}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        <RotateCcw className="w-3 h-3" /> Start new chat
                      </button>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* ── Input ── */}
            <div className="px-4 pb-4 pt-2 shrink-0 border-t border-slate-100">
              <div className="relative bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-300 transition-all">
                <textarea
                  ref={inputRef}
                  rows={3}
                  placeholder="Ask anything"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none disabled:opacity-50"
                />
                {loading ? (
                  <button
                    onClick={() => abortRef.current?.abort()}
                    title="Cancel"
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 shadow-sm transition-all"
                  >
                    <Square className="w-3 h-3 text-white fill-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:bg-indigo-600 enabled:hover:bg-indigo-700 enabled:shadow-sm bg-slate-300"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Press{' '}
                <kbd className="font-mono bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[10px]">Ctrl</kbd>
                {' '}+{' '}
                <kbd className="font-mono bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[10px]">K</kbd>
                {' '}to open from anywhere
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
