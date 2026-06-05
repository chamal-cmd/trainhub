'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brain, Upload, Trash2, FileText, Loader2, RefreshCw, AlertCircle, CheckCircle2, PenLine, X } from 'lucide-react'

type KnowledgeFile = {
  id: string
  name: string
  file_type: string
  size_bytes: number
  char_count: number
  created_at: string
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function KnowledgeBasePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles]             = useState<KnowledgeFile[]>([])
  const [loading, setLoading]         = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [deleting, setDeleting]       = useState<string | null>(null)
  const [dragging, setDragging]       = useState(false)
  const [status, setStatus]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Paste-text panel
  const [showPaste, setShowPaste]     = useState(false)
  const [pasteName, setPasteName]     = useState('')
  const [pasteText, setPasteText]     = useState('')
  const [savingPaste, setSavingPaste] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('knowledge_files')
      .select('id, name, file_type, size_bytes, char_count, created_at')
      .order('created_at', { ascending: false })
    setFiles((data as KnowledgeFile[]) ?? [])
    setLoading(false)
  }

  function showStatus(type: 'success' | 'error', msg: string) {
    setStatus({ type, msg })
    setTimeout(() => setStatus(null), 5000)
  }

  // ── File upload ──────────────────────────────────────────────────────────────

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return
    setUploading(true)

    const ok: string[] = [], fail: string[] = []

    for (const file of Array.from(fileList)) {
      try {
        const form = new FormData()
        form.append('file', file)
        const res  = await fetch('/api/knowledge/upload', { method: 'POST', body: form })
        const json = await res.json()
        if (res.ok) ok.push(file.name)
        else fail.push(`${file.name}: ${json.error ?? 'failed'}`)
      } catch {
        fail.push(`${file.name}: network error`)
      }
    }

    await load()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (fail.length) showStatus('error', fail.join(' · '))
    else showStatus('success', `${ok.length} file${ok.length !== 1 ? 's' : ''} added`)
  }

  // ── Paste text ───────────────────────────────────────────────────────────────

  async function handleSavePaste() {
    if (!pasteName.trim() || !pasteText.trim()) return
    setSavingPaste(true)

    const supabase = createClient()
    const { error } = await supabase.from('knowledge_files').insert({
      name:       pasteName.trim(),
      content:    pasteText.trim(),
      file_type:  'txt',
      size_bytes: new Blob([pasteText]).size,
      char_count: pasteText.trim().length,
    })

    setSavingPaste(false)
    if (error) {
      showStatus('error', error.message)
    } else {
      setShowPaste(false)
      setPasteName('')
      setPasteText('')
      await load()
      showStatus('success', `"${pasteName.trim()}" added to knowledge base`)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('knowledge_files').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.id !== id))
    setDeleting(null)
  }

  const totalChars = files.reduce((s, f) => s + f.char_count, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-violet-600" />
            Knowledge Base
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Files and text here are automatically given to the AI as context — keeping answers accurate and on-brand.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-bold text-slate-900">{files.length}</p>
          <p className="text-sm text-slate-400 mt-0.5">Documents in knowledge base</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-bold text-slate-900">{totalChars.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-0.5">Characters of AI context</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        {/* Upload file button */}
        <button
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf,.docx,.sql"
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />

        {/* Paste text button */}
        <button
          onClick={() => setShowPaste(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
        >
          <PenLine className="w-4 h-4" />
          Paste Text
        </button>
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }}
        className={`mb-5 rounded-2xl border-2 border-dashed transition-all ${
          dragging ? 'border-violet-500 bg-violet-50' : 'border-slate-100 bg-slate-50/50'
        } py-5 flex items-center justify-center gap-2 text-xs text-slate-400`}
      >
        <Upload className="w-3.5 h-3.5" />
        Drop files here · PDF, TXT, MD, DOCX, CSV, JSON
      </div>

      {/* Paste text panel */}
      {showPaste && (
        <div className="mb-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800">Paste text directly</p>
            <button onClick={() => setShowPaste(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Document name (e.g. Xero Reconciliation SOP)"
            value={pasteName}
            onChange={e => setPasteName(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-violet-500"
          />
          <textarea
            placeholder="Paste your SOP, process guide, or any text the AI should know about…"
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={8}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-violet-500 resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{pasteText.length.toLocaleString()} characters</span>
            <button
              onClick={handleSavePaste}
              disabled={savingPaste || !pasteName.trim() || !pasteText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {savingPaste ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save to Knowledge Base
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className={`mb-4 flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border ${
          status.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {status.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{status.msg}</span>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center gap-3">
          <Brain className="w-10 h-10 text-slate-200" />
          <p className="text-slate-400 text-sm font-medium">No documents yet</p>
          <p className="text-slate-300 text-xs text-center max-w-xs">
            Upload your SOPs, process guides, and training scripts — or paste text directly above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {files.length} document{files.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                  <p className="text-xs text-slate-400">
                    {f.char_count.toLocaleString()} chars · {fileSize(f.size_bytes)} · {timeAgo(f.created_at)}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  f.file_type === 'pdf'  ? 'bg-red-100 text-red-700' :
                  f.file_type === 'docx' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {f.file_type.toUpperCase()}
                </span>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deleting === f.id}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                >
                  {deleting === f.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-violet-900 mb-1.5">How it works</h3>
        <p className="text-xs text-violet-800 leading-relaxed">
          Every AI conversation automatically includes these documents as context. The AI reads your SOPs and guides
          to give accurate, company-specific answers — no hallucinations about your processes.
          <br /><br />
          <strong>Best documents to add:</strong> SOPs, onboarding guides, tool guides (Xero, Dext, Fathom),
          client processes, team responsibilities, and any policies your team refers to regularly.
        </p>
      </div>
    </div>
  )
}
