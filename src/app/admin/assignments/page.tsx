'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile, Subject } from '@/lib/types'
import { getInitials, formatDate } from '@/lib/utils'
import { Plus, Bell, Trash2, Users, ChevronDown, Check, CalendarDays } from 'lucide-react'

export default function NudgePage() {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<any[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [subjects, setSubjects] = useState<Pick<Subject, 'id' | 'title' | 'emoji' | 'cover_color'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selSubjects, setSelSubjects] = useState<string[]>([])
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [selUser, setSelUser] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setSubjectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadAll() {
    const [{ data: a }, { data: u }, { data: s }] = await Promise.all([
      supabase.from('assignments').select(`
        id, due_date, created_at,
        profiles!assignments_user_id_fkey(id, full_name, email),
        subjects(id, title, emoji, cover_color)
      `).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').neq('role', 'admin').order('full_name'),
      supabase.from('subjects').select('id, title, emoji, cover_color').order('order_index', { ascending: true }),
    ])
    setAssignments(a ?? [])
    setUsers(u ?? [])
    setSubjects(s ?? [])
    setLoading(false)
  }

  function toggleSubject(id: string) {
    setSelSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelSubjects(prev => prev.length === subjects.length ? [] : subjects.map(s => s.id))
  }

  const subjectLabel = selSubjects.length === 0
    ? 'Select modules...'
    : selSubjects.length === subjects.length
      ? 'All modules'
      : `${selSubjects.length} module${selSubjects.length > 1 ? 's' : ''} selected`

  async function callNudge(subject_id: string, user_id: string, token: string) {
    return fetch('/api/admin/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ subject_id, user_id, due_date: dueDate || null }),
    })
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selSubjects.length || !selUser) return
    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''

    await Promise.allSettled(selSubjects.map(sid => callNudge(sid, selUser, token)))

    await loadAll()
    setShowModal(false)
    setSelSubjects([])
    setSelUser('')
    setDueDate('')
    setSaving(false)
  }

  async function handleAssignAll(e: React.MouseEvent) {
    e.preventDefault()
    if (!selSubjects.length) return
    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''

    const pairs: Array<[string, string]> = []
    for (const sid of selSubjects) {
      for (const u of users) pairs.push([sid, u.id])
    }

    await Promise.allSettled(pairs.map(([sid, uid]) => callNudge(sid, uid, token)))

    await loadAll()
    setShowModal(false)
    setSelSubjects([])
    setSelUser('')
    setDueDate('')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this nudge record?')) return
    await supabase.from('assignments').delete().eq('id', id)
    setAssignments(assignments.filter(a => a.id !== id))
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Send Reminders</h1>
          <p className="text-slate-500 text-sm mt-1">Nudge team members to complete their training modules</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Send Reminder
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
        </div>
      ) : assignments.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Module</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Sent</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Due Date</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={a.id} className={i !== assignments.length - 1 ? 'border-b border-slate-100' : ''}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">{getInitials(a.profiles?.full_name ?? '')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400">{a.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{a.subjects?.emoji}</span>
                      <span className="text-sm text-slate-700">{a.subjects?.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-400">{formatDate(a.created_at)}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {a.due_date
                      ? <Badge variant="warning">{formatDate(a.due_date)}</Badge>
                      : <span className="text-xs text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No reminders sent yet</h3>
          <p className="text-slate-400 text-sm mb-5">Nudge a team member to complete their training.</p>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Send Reminder</Button>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={open => { setShowModal(open); if (!open) { setSelSubjects([]); setSelUser(''); setDueDate(''); setError('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Training Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">

            {/* Multi-select modules */}
            <div className="space-y-1.5">
              <Label>Training Module(s)</Label>
              <div className="relative" ref={dropRef}>
                <button
                  type="button"
                  onClick={() => setSubjectOpen(v => !v)}
                  className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                >
                  <span className={selSubjects.length === 0 ? 'text-slate-400' : 'text-slate-800'}>
                    {subjectLabel}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {subjectOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    <label className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selSubjects.length === subjects.length ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                        {selSubjects.length === subjects.length && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">All modules</span>
                      <input type="checkbox" className="sr-only" checked={selSubjects.length === subjects.length} onChange={toggleAll} />
                    </label>
                    {subjects.map(s => (
                      <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selSubjects.includes(s.id) ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                          {selSubjects.includes(s.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-700">{s.emoji} {s.title}</span>
                        <input type="checkbox" className="sr-only" checked={selSubjects.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Remind Who</Label>
              <Select value={selUser} onValueChange={setSelUser}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} — {u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Due Date (optional)</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent cursor-pointer"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter className="gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="button" variant="secondary" loading={saving} onClick={handleAssignAll} disabled={!selSubjects.length}>
                <Users className="w-4 h-4" /> Remind All Users
              </Button>
              <Button type="submit" loading={saving} disabled={!selSubjects.length || !selUser}>
                <Bell className="w-4 h-4" /> Send Reminder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
