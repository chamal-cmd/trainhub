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
import { Plus, Search, Users, Mail, Shield, User } from 'lucide-react'

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
        sendInvite: true, // sends invite email — user sets own password
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setInviteError(json.error ?? 'Failed to invite user')
      setInviting(false)
      return
    }

    await loadUsers()
    setShowInvite(false)
    setInviteEmail('')
    setInviteName('')
    setInviting(false)
    alert(`✅ Invite sent to ${inviteEmail} as ${inviteRole === 'admin' ? 'Admin' : 'Team Member'}. They'll receive an email to set their password.`)
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
          <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
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
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-2xl mb-1.5">👤</div>
                <p className={`text-sm font-bold ${inviteRole === 'user' ? 'text-indigo-700' : 'text-slate-800'}`}>
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
