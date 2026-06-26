'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Profile } from '@/lib/types'
import { getInitials, formatDate } from '@/lib/utils'
import {
  Search, Users, Mail, Shield, User, Loader2, Trash2,
  ShieldCheck, ShieldOff, UserPlus, Copy, Check,
} from 'lucide-react'

export default function UsersPage() {
  const supabase = createClient()
  const [users,         setUsers]         = useState<Profile[]>([])
  const [search,        setSearch]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')
  const [removing,      setRemoving]      = useState<string | null>(null)
  const [settingRole,   setSettingRole]   = useState<string | null>(null)

  // Invite modal
  const [showInvite,   setShowInvite]   = useState(false)
  const [inviteEmail,  setInviteEmail]  = useState('')
  const [inviteName,   setInviteName]   = useState('')
  const [inviteRole,   setInviteRole]   = useState<'user' | 'admin'>('user')
  const [inviting,     setInviting]     = useState(false)
  const [inviteError,  setInviteError]  = useState('')
  const [inviteLink,   setInviteLink]   = useState<{ email: string; url: string } | null>(null)
  const [linkCopied,   setLinkCopied]   = useState(false)

  useEffect(() => {
    loadUsers()
    supabase.auth.getUser().then(({ data }) => { if (data.user) setCurrentUserId(data.user.id) })
  }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    const auth = await getAuthHeader()
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ email: inviteEmail, fullName: inviteName, role: inviteRole }),
    })
    const json = await res.json()
    setInviting(false)
    if (!res.ok) { setInviteError(json.error ?? 'Failed to generate invite'); return }
    setShowInvite(false)
    setInviteLink({ email: inviteEmail, url: json.inviteUrl })
    setInviteEmail(''); setInviteName(''); setInviteRole('user')
    loadUsers()
  }

  async function setRole(user: Profile, role: 'admin' | 'user') {
    if (!confirm(`${role === 'admin' ? 'Make Admin' : 'Remove Admin'} for ${user.full_name}?`)) return
    setSettingRole(user.id)
    const auth = await getAuthHeader()
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ userId: user.id, role }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error); setSettingRole(null); return }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role } : u))
    setSettingRole(null)
  }

  async function removeUser(user: Profile) {
    if (!confirm(`Remove ${user.full_name} (${user.email})? This cannot be undone.`)) return
    setRemoving(user.id)
    const auth = await getAuthHeader()
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ userId: user.id }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error); setRemoving(null); return }
    setUsers(prev => prev.filter(u => u.id !== user.id))
    setRemoving(null)
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const filtered     = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const admins       = filtered.filter(u => u.role === 'admin')
  const regularUsers = filtered.filter(u => u.role === 'user')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.filter(u => u.role === 'user').length} members · {users.filter(u => u.role === 'admin').length} admins
          </p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteRole('user'); setInviteError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {admins.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Administrators ({admins.length})
              </h2>
              <UserList users={admins} currentUserId={currentUserId} removing={removing} settingRole={settingRole} onRemove={removeUser} onSetRole={setRole} />
            </div>
          )}
          {regularUsers.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Team Members ({regularUsers.length})
              </h2>
              <UserList users={regularUsers} currentUserId={currentUserId} removing={removing} settingRole={settingRole} onRemove={removeUser} onSetRole={setRole} />
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No users yet. Invite your team to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Invite modal ── */}
      <Dialog open={showInvite} onOpenChange={v => { setShowInvite(v); setInviteError('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 -mt-1 mb-1">
            A link will be generated — only this exact email can use it to sign up.
          </p>

          <form onSubmit={handleInvite} className="space-y-4">
            {/* Role picker */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setInviteRole('user')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${inviteRole === 'user' ? 'border-violet-600 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="text-2xl mb-1.5">👤</div>
                <p className={`text-sm font-bold ${inviteRole === 'user' ? 'text-violet-800' : 'text-slate-800'}`}>Team Member</p>
                <p className="text-xs text-slate-400 mt-0.5">Access to training modules</p>
              </button>
              <button type="button" onClick={() => setInviteRole('admin')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${inviteRole === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="text-2xl mb-1.5">🛡️</div>
                <p className={`text-sm font-bold ${inviteRole === 'admin' ? 'text-purple-700' : 'text-slate-800'}`}>Admin</p>
                <p className="text-xs text-slate-400 mt-0.5">Full access + manage users</p>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <Input placeholder="Jane Smith" value={inviteName} onChange={e => setInviteName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <Input type="email" required placeholder="jane@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>

            {inviteError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{inviteError}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowInvite(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={inviting}
                className={`flex-1 h-10 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${inviteRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-violet-700 hover:bg-violet-800'}`}>
                {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate Invite Link'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Invite link modal ── */}
      {inviteLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-violet-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Invite Link Ready</h2>
              <p className="text-sm text-slate-500 mt-1">
                Share this with <strong className="text-slate-700">{inviteLink.email}</strong> via Slack, WhatsApp, or any channel.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4">
              <span className="shrink-0">🔒</span>
              <span>Only <strong>{inviteLink.email}</strong> can use this link.</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-1.5">
              <p className="flex-1 text-xs text-slate-500 truncate font-mono">{inviteLink.url}</p>
              <button onClick={() => copyLink(inviteLink.url)}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900">
                {linkCopied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-5">Expires in 24 hours</p>

            <button onClick={() => setInviteLink(null)}
              className="w-full h-10 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function UserList({ users, currentUserId, removing, settingRole, onRemove, onSetRole }: {
  users: Profile[]
  currentUserId: string
  removing: string | null
  settingRole: string | null
  onRemove: (user: Profile) => void
  onSetRole: (user: Profile, role: 'admin' | 'user') => void
}) {
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
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
            {user.role === 'admin' ? '🛡️ Admin' : 'Member'}
          </Badge>
          <span className="text-xs text-slate-400 hidden sm:block">{formatDate(user.created_at)}</span>
          {user.id !== currentUserId && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onSetRole(user, user.role === 'admin' ? 'user' : 'admin')}
                disabled={settingRole === user.id}
                title={user.role === 'admin' ? 'Remove admin rights' : 'Grant admin rights'}
                className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${user.role === 'admin' ? 'text-purple-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-purple-600 hover:bg-purple-50'}`}
              >
                {settingRole === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : user.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onRemove(user)}
                disabled={removing === user.id}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                title="Remove user"
              >
                {removing === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
