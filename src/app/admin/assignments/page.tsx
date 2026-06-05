'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile, Subject, Assignment } from '@/lib/types'
import { getInitials, formatDate } from '@/lib/utils'
import { Plus, ClipboardList, Trash2, Users, BookOpen } from 'lucide-react'

export default function AssignmentsPage() {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<any[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [subjects, setSubjects] = useState<Pick<Subject, 'id' | 'title' | 'emoji' | 'cover_color'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selSubject, setSelSubject] = useState('')
  const [selUser, setSelUser] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: a }, { data: u }, { data: s }] = await Promise.all([
      supabase.from('assignments').select(`
        id, due_date, created_at,
        profiles!assignments_user_id_fkey(id, full_name, email),
        subjects(id, title, emoji, cover_color)
      `).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'user').order('full_name'),
      supabase.from('subjects').select('id, title, emoji, cover_color').order('title'),
    ])
    setAssignments(a ?? [])
    setUsers(u ?? [])
    setSubjects(s ?? [])
    setLoading(false)
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selSubject || !selUser) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { error: dbErr } = await supabase.from('assignments').insert({
      subject_id: selSubject,
      user_id: selUser,
      assigned_by: user?.id,
      due_date: dueDate || null,
    })

    if (dbErr) {
      setError(dbErr.message.includes('unique') ? 'This module is already assigned to this user.' : dbErr.message)
      setSaving(false)
      return
    }

    await loadAll()
    setShowModal(false)
    setSelSubject('')
    setSelUser('')
    setDueDate('')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this assignment?')) return
    await supabase.from('assignments').delete().eq('id', id)
    setAssignments(assignments.filter(a => a.id !== id))
  }

  // Assign to ALL users
  async function handleAssignAll(e: React.FormEvent) {
    e.preventDefault()
    if (!selSubject) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const inserts = users.map(u => ({
      subject_id: selSubject,
      user_id: u.id,
      assigned_by: user?.id,
      due_date: dueDate || null,
    }))

    const { error: dbErr } = await supabase.from('assignments').upsert(inserts, { onConflict: 'subject_id,user_id' })
    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    await loadAll()
    setShowModal(false)
    setSelSubject('')
    setSelUser('')
    setDueDate('')
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 text-sm mt-1">Assign training modules to your team</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Assign Training
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
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Assigned</th>
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
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No assignments yet</h3>
          <p className="text-slate-400 text-sm mb-5">Start assigning training modules to your team.</p>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Assign Training</Button>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Training Module</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Training Module</Label>
              <Select value={selSubject} onValueChange={setSelSubject}>
                <SelectTrigger><SelectValue placeholder="Select module..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.emoji} {s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign To</Label>
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
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter className="gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="button" variant="secondary" loading={saving} onClick={handleAssignAll as any} disabled={!selSubject}>
                <Users className="w-4 h-4" /> Assign to All Users
              </Button>
              <Button type="submit" loading={saving} disabled={!selSubject || !selUser}>
                <BookOpen className="w-4 h-4" /> Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
