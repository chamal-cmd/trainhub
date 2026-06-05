'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Users, Check, Loader2, UserCheck, UserX } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

interface Props {
  subjectId: string
  subjectTitle: string
  onClose: () => void
}

export function ManageAccessModal({ subjectId, subjectTitle, onClose }: Props) {
  const supabase = createClient()
  const [profiles, setProfiles]           = useState<Profile[]>([])
  const [assignedIds, setAssignedIds]     = useState<Set<string>>(new Set())
  const [loading, setLoading]             = useState(true)
  const [toggling, setToggling]           = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [subjectId])

  async function load() {
    setLoading(true)
    const [profilesRes, assignmentsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
      supabase.from('assignments').select('user_id').eq('subject_id', subjectId),
    ])
    setProfiles(profilesRes.data ?? [])
    setAssignedIds(new Set((assignmentsRes.data ?? []).map(a => a.user_id)))
    setLoading(false)
  }

  async function toggle(userId: string) {
    setToggling(userId)
    const hasAccess = assignedIds.has(userId)

    if (hasAccess) {
      await supabase
        .from('assignments')
        .delete()
        .eq('user_id', userId)
        .eq('subject_id', subjectId)
      setAssignedIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    } else {
      await supabase
        .from('assignments')
        .insert({ user_id: userId, subject_id: subjectId })
      setAssignedIds(prev => new Set([...prev, userId]))
    }
    setToggling(null)
  }

  async function assignAll() {
    const unassigned = profiles.filter(p => !assignedIds.has(p.id))
    if (!unassigned.length) return
    await supabase.from('assignments').insert(
      unassigned.map(p => ({ user_id: p.id, subject_id: subjectId }))
    )
    setAssignedIds(new Set(profiles.map(p => p.id)))
  }

  async function removeAll() {
    await supabase.from('assignments').delete().eq('subject_id', subjectId)
    setAssignedIds(new Set())
  }

  const admins   = profiles.filter(p => p.role === 'admin')
  const members  = profiles.filter(p => p.role !== 'admin')
  const totalWithAccess = assignedIds.size

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Users className="w-4 h-4 text-violet-600" />
                <h2 className="text-base font-bold text-slate-900">Manage Access</h2>
              </div>
              <p className="text-xs text-slate-400 ml-6">{subjectTitle}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
            <span className="text-xs text-slate-500">
              <span className="font-bold text-slate-800">{totalWithAccess}</span> of {profiles.length} users have access
            </span>
            <div className="flex gap-2">
              <button
                onClick={assignAll}
                className="text-xs font-semibold text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                Assign all
              </button>
              <button
                onClick={removeAll}
                className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                Remove all
              </button>
            </div>
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              </div>
            ) : (
              <>
                {/* Admins */}
                {admins.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 pt-4 pb-2">
                      Admins ({admins.length})
                    </p>
                    {admins.map(p => (
                      <UserRow
                        key={p.id}
                        profile={p}
                        hasAccess={assignedIds.has(p.id)}
                        toggling={toggling === p.id}
                        onToggle={() => toggle(p.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Team members */}
                {members.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 pt-4 pb-2">
                      Team Members ({members.length})
                    </p>
                    {members.map(p => (
                      <UserRow
                        key={p.id}
                        profile={p}
                        hasAccess={assignedIds.has(p.id)}
                        toggling={toggling === p.id}
                        onToggle={() => toggle(p.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 shrink-0">
            <button
              onClick={onClose}
              className="w-full h-9 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function UserRow({ profile, hasAccess, toggling, onToggle }: {
  profile: Profile
  hasAccess: boolean
  toggling: boolean
  onToggle: () => void
}) {
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-violet-700">{initials}</span>
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{profile.full_name}</p>
        <p className="text-xs text-slate-400 truncate">{profile.email}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        disabled={toggling}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
          hasAccess
            ? 'bg-emerald-50 text-emerald-600 hover:bg-red-50 hover:text-red-500'
            : 'bg-slate-100 text-slate-400 hover:bg-violet-50 hover:text-violet-700'
        } disabled:opacity-50`}
      >
        {toggling ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : hasAccess ? (
          <><UserCheck className="w-3 h-3" /> Has access</>
        ) : (
          <><UserX className="w-3 h-3" /> No access</>
        )}
      </button>
    </div>
  )
}
