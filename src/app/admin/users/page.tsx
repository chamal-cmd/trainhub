'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import type { Profile } from '@/lib/types'
import { getInitials, formatDate } from '@/lib/utils'
import { Plus, Search, Users, Mail, Shield, User, Clock, X, Loader2 } from 'lucide-react'

type PendingInvite = { id: string; email: string; full_name: string; role: 'user'|'admin'; invited_at: string }

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState<{email: string; role: 'user'|'admin'} | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => { loadUsers(); loadPending() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
  }

  async function loadPending() {
    const auth = await getAuthHeader()
    const res = await fetch('/api/admin/revoke-invite', { headers: auth })
    if (res.ok) {
      const json = await res.json()
      setPendingInvites(json.pending ?? [])
    }
  }

  async function revokeInvite(invite: PendingInvite) {
    if (!confirm(`Revoke invite for ${invite.email}? They won't be able to use the invite link.`)) return
    setRevoking(invite.id)
    const auth = await getAuthHeader()
    const res = await fetch('/api/admin/revoke-invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ userId: invite.id }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error); setRevoking(null); return }
    setPendingInvites(prev => prev.filter(p => p.id !== invite.id))
    setRevoking(null)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')

    // Capture values before clearing
    const sentTo   = inviteEmail
    const sentRole = inviteRole
    const sentName = inviteName

    // ── Show success instantly (optimistic UI) ──
    setShowInvite(false)
    setInviteEmail('')
    setInviteName('')
    setInviteSuccess({ email: sentTo, role: sentRole })

    // ── Send invite in background — doesn't block the UI ──
    getAuthHeader().then(auth => fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ email: sentTo, fullName: sentName, role: sentRole, sendInvite: true }),
    })).then(async res => {
      const json = await res.json()
      if (!res.ok) {
        // Rollback: reopen modal with error
        setInviteSuccess(null)
        setInviteEmail(sentTo)
        setInviteName(sentName)
        setInviteRole(sentRole)
        setInviteError(json.error ?? 'Failed to invite user')
        setShowInvite(true)
      } else {
        // Refresh lists quietly in background
        Promise.all([loadUsers(), loadPending()]).catch(() => {})
      }
    }).catch(() => {
      // Network error — rollback
      setInviteSuccess(null)
      setInviteEmail(sentTo)
      setInviteName(sentName)
      setInviteRole(sentRole)
      setInviteError('Network error — please try again.')
      setShowInvite(true)
    })
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const admins = filtered.filter(u => u.role === 'admin')
  const regularUsers = filtered.filter(u => u.role === 'user')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{users.filter(u => u.role === 'user').length} users · {users.filter(u => u.role === 'admin').length} admins</p>
        </div>
        <Button onClick={() => { setShowInvite(true); setInviteRole('user'); setInviteError('') }}>
          <Mail className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Pending Invites ── */}
          {pendingInvites.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-600">Pending Invites ({pendingInvites.length})</span>
              </h2>
              <div className="space-y-2">
                {pendingInvites.map(invite => (
                  <div key={invite.id} className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                      {invite.full_name?.split(' ').map((n:string) => n[0]).join('').toUpperCase().slice(0,2) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{invite.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{invite.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      invite.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-violet-100 text-violet-800'
                    }`}>
                      {invite.role === 'admin' ? '🛡️ Admin' : '👤 Member'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      Awaiting
                    </span>
                    <button
                      onClick={() => revokeInvite(invite)}
                      disabled={revoking === invite.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 shrink-0"
                      title="Revoke invite"
                    >
                      {revoking === invite.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <X className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {admins.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Administrators ({admins.length})
              </h2>
              <UserList users={admins} />
            </div>
          )}
          {regularUsers.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Team Members ({regularUsers.length})
              </h2>
              <UserList users={regularUsers} />
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No users found.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Invite Success Modal ── */}
      {inviteSuccess && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setInviteSuccess(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
              {/* Animated checkmark */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                inviteSuccess.role === 'admin' ? 'bg-purple-100' : 'bg-emerald-100'
              }`}>
                <Mail className={`w-7 h-7 ${inviteSuccess.role === 'admin' ? 'text-purple-600' : 'text-emerald-600'}`} />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">Invitation Sent! 🎉</h2>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                An invite email has been sent to{' '}
                <strong className="text-slate-700">{inviteSuccess.email}</strong>
                {' '}as a{' '}
                <span className={`font-semibold ${inviteSuccess.role === 'admin' ? 'text-purple-700' : 'text-violet-800'}`}>
                  {inviteSuccess.role === 'admin' ? '🛡️ Admin' : '👤 Team Member'}
                </span>.
              </p>

              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5 text-left">
                <p className="text-xs text-slate-500 mb-1 font-medium">What happens next:</p>
                <ol className="text-xs text-slate-600 space-y-1">
                  <li>1. They receive an email with a secure link</li>
                  <li>2. They click it → set their password</li>
                  <li>3. They're in as {inviteSuccess.role === 'admin' ? 'Admin' : 'Team Member'} ✅</li>
                </ol>
              </div>

              <button
                onClick={() => setInviteSuccess(null)}
                className={`w-full h-10 rounded-xl text-white text-sm font-semibold transition-colors ${
                  inviteSuccess.role === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-violet-700 hover:bg-violet-800'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* Invite User Dialog */}
      <Dialog open={showInvite} onOpenChange={v => { setShowInvite(v); setInviteError('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">

            {/* Invite type — prominent two-option picker */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInviteRole('user')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  inviteRole === 'user'
                    ? 'border-violet-600 bg-violet-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-2xl mb-1.5">👤</div>
                <p className={`text-sm font-bold ${inviteRole === 'user' ? 'text-violet-800' : 'text-slate-800'}`}>
                  Team Member
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Access to training modules</p>
              </button>
              <button
                type="button"
                onClick={() => setInviteRole('admin')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  inviteRole === 'admin'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-2xl mb-1.5">🛡️</div>
                <p className={`text-sm font-bold ${inviteRole === 'admin' ? 'text-purple-700' : 'text-slate-800'}`}>
                  Admin
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Full access + manage users</p>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Jane Smith" value={inviteName} onChange={e => setInviteName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" placeholder="jane@gpbookkeeper.com.au" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
              📧 An invite email will be sent — they set their own password when they join.
            </p>

            {inviteError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button
                type="submit"
                loading={inviting}
                className={inviteRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Send {inviteRole === 'admin' ? 'Admin' : 'Team Member'} Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserList({ users }: { users: Profile[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {users.map((user, i) => (
        <div key={user.id} className={`flex items-center gap-4 px-5 py-4 ${i !== users.length - 1 ? 'border-b border-slate-100' : ''}`}>
          <Avatar>
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> {user.email}
            </p>
          </div>
          {user.department && <span className="text-xs text-slate-400">{user.department}</span>}
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
            {user.role === 'admin' ? '🛡️ Admin' : 'User'}
          </Badge>
          <span className="text-xs text-slate-400 hidden sm:block">{formatDate(user.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
