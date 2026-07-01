'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { Plus, Building2, ChevronRight, Users, BookOpen, Loader2, Trash2, EyeOff } from 'lucide-react'

interface ClientRow {
  id: string
  name: string
  xero_file: string | null
  description: string | null
  is_active: boolean
  task_count: number
  assignment_count: number
}

export default function AdminClientsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients]   = useState<ClientRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newXero, setNewXero]   = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState('')

  useEffect(() => { load() }, [])

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? All tasks and assignments will be permanently removed.`)) return
    setDeletingId(id)
    await supabase.from('clients').delete().eq('id', id)
    setClients(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select(`id, name, xero_file, description, is_active,
               client_tasks(id),
               client_training_assignments(id)`)
      .order('name')
    if (error) {
      // Table doesn't exist yet — migration not run
      setNeedsMigration(true)
      setLoading(false)
      return
    }
    setClients((data ?? []).map((c: any) => ({
      id:               c.id,
      name:             c.name,
      xero_file:        c.xero_file,
      description:      c.description,
      is_active:        c.is_active,
      task_count:       (c.client_tasks ?? []).length,
      assignment_count: (c.client_training_assignments ?? []).length,
    })))
    setLoading(false)
  }

  async function handleCreate() {
    if (!newName.trim()) { setError('Client name is required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('clients').insert({
      name:        newName.trim(),
      xero_file:   newXero.trim() || null,
      description: newDesc.trim() || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    setNewName(''); setNewXero(''); setNewDesc('')
    setShowNew(false); setSaving(false)
    await load()
  }

  const emptyCount = clients.filter(c => c.task_count === 0 && c.assignment_count === 0).length
  const visibleClients = showEmpty ? clients : clients.filter(c => c.task_count > 0 || c.assignment_count > 0)

  return (
    <div className="px-8 py-7 min-h-full bg-[#f8f8f8]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Training</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage client-specific training trackers and team assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && emptyCount > 0 && (
            <button
              onClick={() => setShowEmpty(v => !v)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              {showEmpty ? 'Hide empty' : `Show empty (${emptyCount})`}
            </button>
          )}
          <Button onClick={() => { setShowNew(true); setError('') }}>
            <Plus className="w-4 h-4" /> New Client
          </Button>
        </div>
      </div>

      {/* Migration banner */}
      {needsMigration && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <p className="text-sm font-bold text-amber-900 mb-1">⚠️ Database setup required</p>
          <p className="text-xs text-amber-800 mb-3">
            The Client Training tables don&apos;t exist yet. Run the migration SQL in Supabase to enable this feature.
          </p>
          <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
            <li>Go to <strong>Supabase → SQL Editor</strong></li>
            <li>Open file <code className="bg-amber-100 px-1 rounded">supabase/migrations/20260610_client_training.sql</code></li>
            <li>Copy the entire contents and paste into the SQL Editor</li>
            <li>Click <strong>Run</strong></li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {/* Empty */}
      {!loading && !needsMigration && visibleClients.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-24">
          <Building2 className="w-9 h-9 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No clients yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first client to start adding tasks and assignments.</p>
          <Button className="mt-5" size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3.5 h-3.5" /> New Client
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && !needsMigration && visibleClients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Tasks</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Trainees</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleClients.map(c => (
                <tr
                  key={c.id}
                  className="group hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/clients/${c.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        {c.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{c.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">
                      <BookOpen className="w-3 h-3" /> {c.task_count}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 rounded-lg px-2.5 py-1">
                      <Users className="w-3 h-3" /> {c.assignment_count}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleDelete(e, c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete client"
                      >
                        {deletingId === c.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                      <Link href={`/admin/clients/${c.id}`}>
                        <button className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Client Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Client Name *</Label>
              <Input placeholder="e.g. MC Monavale" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Xero File Name</Label>
              <Input placeholder="e.g. MC Monavale" value={newXero}
                onChange={e => setNewXero(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description <span className="text-slate-400">(optional)</span></Label>
              <Input placeholder="Short description" value={newDesc}
                onChange={e => setNewDesc(e.target.value)} className="mt-1" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
