'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brain, Upload, Trash2, FileText, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

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

const ACCEPTED = '.txt,.md,.csv,.json,.pdf,.docx'

export default function KnowledgeBasePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

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

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return
    setUploading(true)
    setUploadStatus(null)

    const results: string[] = []
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData })
        const json = await res.json()

        if (res.ok) results.push(file.name)
        else errors.push(`${file.name}: ${json.error}`)
      } catch {
        errors.push(`${file.name}: upload failed`)
      }
    }

    if (errors.length) {
      setUploadStatus({ type: 'error', message: errors.join(' · ') })
    } else {
      setUploadStatus({ type: 'success', message: `${results.length} file${results.length !== 1 ? 's' : ''} added to knowledge base` })
    }

    await load()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setTimeout(() => setUploadStatus(null), 5000)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('knowledge_files').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.id !== id))
    setDeleting(null)
  }

  const totalChars = files.reduce((s, f) => s + f.char_count, 0)
  const totalFiles = files.length

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-indigo-500" />
            Knowledge Base
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Files uploaded here are given to the AI Assistant as context — reducing API costs and keeping answers accurate.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-bold text-slate-900">{totalFiles}</p>
          <p className="text-sm text-slate-400 mt-0.5">Files in knowledge base</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-bold text-slate-900">{totalChars.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-0.5">Characters of context</p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`mb-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
        } p-8 flex flex-col items-center justify-center gap-3`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Processing files…</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Drop files here or click to upload</p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, TXT, MD, CSV, DOCX, JSON</p>
            </div>
          </>
        )}
      </div>

      {/* Status */}
      {uploadStatus && (
        <div className={`mb-4 flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border ${
          uploadStatus.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {uploadStatus.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center gap-3">
          <Brain className="w-10 h-10 text-slate-200" />
          <p className="text-slate-400 text-sm font-medium">No files yet</p>
          <p className="text-slate-300 text-xs text-center max-w-xs">
            Upload your SOPs, process guides, and training scripts so the AI can answer questions accurately.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Uploaded Files</p>
          </div>
          <div className="divide-y divide-slate-50">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.char_count.toLocaleString()} chars · {fileSize(f.size_bytes)} · {timeAgo(f.created_at)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  f.file_type === 'pdf' ? 'bg-red-100 text-red-700' :
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

      {/* Info box */}
      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-indigo-900 mb-1.5">How it works</h3>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Every time a team member asks the AI a question, the content of these files is automatically included as context.
          The AI reads your SOPs, process guides, and policies to give accurate, company-specific answers — no hallucinations.
          <br /><br />
          <strong>Best files to upload:</strong> Standard Operating Procedures, onboarding guides, tool guides (Xero, Dext, Fathom),
          client processes, team responsibilities, and any policies your team refers to regularly.
        </p>
      </div>
    </div>
  )
}
