'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User, Bell, Shield, Settings2, Camera,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  ChevronRight, Mail, Lock, Globe, Sun, Moon, Laptop,
} from 'lucide-react'

interface Props {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  initialTab?: Tab
}

type Tab   = 'profile' | 'notifications' | 'security' | 'account'
type Theme = 'light' | 'dark'

// ── All IANA timezones grouped by region ────────────────────────────────────
const TIMEZONES: { group: string; zones: { value: string; label: string }[] }[] = [
  { group: 'Africa', zones: [
    { value: 'Africa/Abidjan',       label: 'Abidjan (UTC+0)' },
    { value: 'Africa/Accra',         label: 'Accra (UTC+0)' },
    { value: 'Africa/Addis_Ababa',   label: 'Addis Ababa (UTC+3)' },
    { value: 'Africa/Algiers',       label: 'Algiers (UTC+1)' },
    { value: 'Africa/Cairo',         label: 'Cairo (UTC+2)' },
    { value: 'Africa/Casablanca',    label: 'Casablanca (UTC+1)' },
    { value: 'Africa/Johannesburg',  label: 'Johannesburg (UTC+2)' },
    { value: 'Africa/Lagos',         label: 'Lagos (UTC+1)' },
    { value: 'Africa/Nairobi',       label: 'Nairobi (UTC+3)' },
    { value: 'Africa/Tunis',         label: 'Tunis (UTC+1)' },
  ]},
  { group: 'Americas', zones: [
    { value: 'America/Anchorage',    label: 'Anchorage (UTC−9)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC−3)' },
    { value: 'America/Bogota',       label: 'Bogota (UTC−5)' },
    { value: 'America/Caracas',      label: 'Caracas (UTC−4)' },
    { value: 'America/Chicago',      label: 'Chicago (UTC−6/−5)' },
    { value: 'America/Denver',       label: 'Denver (UTC−7/−6)' },
    { value: 'America/Halifax',      label: 'Halifax (UTC−4/−3)' },
    { value: 'America/Lima',         label: 'Lima (UTC−5)' },
    { value: 'America/Los_Angeles',  label: 'Los Angeles (UTC−8/−7)' },
    { value: 'America/Mexico_City',  label: 'Mexico City (UTC−6/−5)' },
    { value: 'America/New_York',     label: 'New York (UTC−5/−4)' },
    { value: 'America/Phoenix',      label: 'Phoenix (UTC−7)' },
    { value: 'America/Santiago',     label: 'Santiago (UTC−4/−3)' },
    { value: 'America/Sao_Paulo',    label: 'São Paulo (UTC−3)' },
    { value: 'America/St_Johns',     label: 'St. John\'s (UTC−3:30)' },
    { value: 'America/Toronto',      label: 'Toronto (UTC−5/−4)' },
    { value: 'America/Vancouver',    label: 'Vancouver (UTC−8/−7)' },
  ]},
  { group: 'Asia', zones: [
    { value: 'Asia/Almaty',          label: 'Almaty (UTC+6)' },
    { value: 'Asia/Baghdad',         label: 'Baghdad (UTC+3)' },
    { value: 'Asia/Bangkok',         label: 'Bangkok (UTC+7)' },
    { value: 'Asia/Colombo',         label: 'Colombo (UTC+5:30)' },
    { value: 'Asia/Dhaka',           label: 'Dhaka (UTC+6)' },
    { value: 'Asia/Dubai',           label: 'Dubai (UTC+4)' },
    { value: 'Asia/Hong_Kong',       label: 'Hong Kong (UTC+8)' },
    { value: 'Asia/Jakarta',         label: 'Jakarta (UTC+7)' },
    { value: 'Asia/Karachi',         label: 'Karachi (UTC+5)' },
    { value: 'Asia/Kathmandu',       label: 'Kathmandu (UTC+5:45)' },
    { value: 'Asia/Kolkata',         label: 'Kolkata (UTC+5:30)' },
    { value: 'Asia/Kuala_Lumpur',    label: 'Kuala Lumpur (UTC+8)' },
    { value: 'Asia/Kuwait',          label: 'Kuwait (UTC+3)' },
    { value: 'Asia/Manila',          label: 'Manila (UTC+8)' },
    { value: 'Asia/Muscat',          label: 'Muscat (UTC+4)' },
    { value: 'Asia/Riyadh',          label: 'Riyadh (UTC+3)' },
    { value: 'Asia/Seoul',           label: 'Seoul (UTC+9)' },
    { value: 'Asia/Shanghai',        label: 'Shanghai (UTC+8)' },
    { value: 'Asia/Singapore',       label: 'Singapore (UTC+8)' },
    { value: 'Asia/Taipei',          label: 'Taipei (UTC+8)' },
    { value: 'Asia/Tehran',          label: 'Tehran (UTC+3:30)' },
    { value: 'Asia/Tokyo',           label: 'Tokyo (UTC+9)' },
    { value: 'Asia/Yekaterinburg',   label: 'Yekaterinburg (UTC+5)' },
  ]},
  { group: 'Atlantic', zones: [
    { value: 'Atlantic/Azores',      label: 'Azores (UTC−1)' },
    { value: 'Atlantic/Cape_Verde',  label: 'Cape Verde (UTC−1)' },
    { value: 'Atlantic/Reykjavik',   label: 'Reykjavik (UTC+0)' },
  ]},
  { group: 'Australia', zones: [
    { value: 'Australia/Adelaide',   label: 'Adelaide (UTC+9:30)' },
    { value: 'Australia/Brisbane',   label: 'Brisbane (UTC+10)' },
    { value: 'Australia/Darwin',     label: 'Darwin (UTC+9:30)' },
    { value: 'Australia/Hobart',     label: 'Hobart (UTC+10/+11)' },
    { value: 'Australia/Melbourne',  label: 'Melbourne (UTC+10/+11)' },
    { value: 'Australia/Perth',      label: 'Perth (UTC+8)' },
    { value: 'Australia/Sydney',     label: 'Sydney (UTC+10/+11)' },
  ]},
  { group: 'Europe', zones: [
    { value: 'Europe/Amsterdam',     label: 'Amsterdam (UTC+1/+2)' },
    { value: 'Europe/Athens',        label: 'Athens (UTC+2/+3)' },
    { value: 'Europe/Belgrade',      label: 'Belgrade (UTC+1/+2)' },
    { value: 'Europe/Berlin',        label: 'Berlin (UTC+1/+2)' },
    { value: 'Europe/Brussels',      label: 'Brussels (UTC+1/+2)' },
    { value: 'Europe/Bucharest',     label: 'Bucharest (UTC+2/+3)' },
    { value: 'Europe/Budapest',      label: 'Budapest (UTC+1/+2)' },
    { value: 'Europe/Copenhagen',    label: 'Copenhagen (UTC+1/+2)' },
    { value: 'Europe/Dublin',        label: 'Dublin (UTC+0/+1)' },
    { value: 'Europe/Helsinki',      label: 'Helsinki (UTC+2/+3)' },
    { value: 'Europe/Istanbul',      label: 'Istanbul (UTC+3)' },
    { value: 'Europe/Kiev',          label: 'Kyiv (UTC+2/+3)' },
    { value: 'Europe/Lisbon',        label: 'Lisbon (UTC+0/+1)' },
    { value: 'Europe/London',        label: 'London (UTC+0/+1)' },
    { value: 'Europe/Madrid',        label: 'Madrid (UTC+1/+2)' },
    { value: 'Europe/Moscow',        label: 'Moscow (UTC+3)' },
    { value: 'Europe/Oslo',          label: 'Oslo (UTC+1/+2)' },
    { value: 'Europe/Paris',         label: 'Paris (UTC+1/+2)' },
    { value: 'Europe/Prague',        label: 'Prague (UTC+1/+2)' },
    { value: 'Europe/Rome',          label: 'Rome (UTC+1/+2)' },
    { value: 'Europe/Stockholm',     label: 'Stockholm (UTC+1/+2)' },
    { value: 'Europe/Vienna',        label: 'Vienna (UTC+1/+2)' },
    { value: 'Europe/Warsaw',        label: 'Warsaw (UTC+1/+2)' },
    { value: 'Europe/Zurich',        label: 'Zurich (UTC+1/+2)' },
  ]},
  { group: 'Pacific', zones: [
    { value: 'Pacific/Auckland',     label: 'Auckland (UTC+12/+13)' },
    { value: 'Pacific/Fiji',         label: 'Fiji (UTC+12)' },
    { value: 'Pacific/Guam',         label: 'Guam (UTC+10)' },
    { value: 'Pacific/Honolulu',     label: 'Honolulu (UTC−10)' },
    { value: 'Pacific/Midway',       label: 'Midway (UTC−11)' },
    { value: 'Pacific/Tongatapu',    label: 'Tongatapu (UTC+13)' },
  ]},
  { group: 'UTC', zones: [
    { value: 'UTC',                  label: 'UTC (UTC+0)' },
  ]},
]

// ── Theme helpers ─────────────────────────────────────────────────────────────
function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem('trainhub-theme', t)
}

// ── Root component ─────────────────────────────────────────────────────────────
export function SettingsClient({ userId, userName, userEmail, userRole, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'profile')

  return (
    <div className="flex h-full bg-[#f8f8f8]">
      {/* ── Left nav ── */}
      <div className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col py-6 px-3">
        <p className="px-3 pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Settings</p>
        <nav className="space-y-0.5">
          <NavItem icon={User}      label="Profile"       tab="profile"       active={activeTab} onClick={() => setActiveTab('profile')} />
          <NavItem icon={Bell}      label="Notifications" tab="notifications" active={activeTab} onClick={() => setActiveTab('notifications')} />
          <NavItem icon={Shield}    label="Security"      tab="security"      active={activeTab} onClick={() => setActiveTab('security')} />
          <NavItem icon={Settings2} label="Account"       tab="account"       active={activeTab} onClick={() => setActiveTab('account')} />
        </nav>
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0">
        {activeTab === 'profile'       && <ProfileSection       userId={userId} userName={userName} userEmail={userEmail} userRole={userRole} />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'security'      && <SecuritySection      userEmail={userEmail} />}
        {activeTab === 'account'       && <AccountSection       userEmail={userEmail} userRole={userRole} />}
      </div>
    </div>
  )
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, tab, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; tab: Tab; active: Tab; onClick: () => void
}) {
  const isActive = active === tab
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
        isActive ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-700' : 'text-slate-400'}`} />
      {label}
      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-500" />}
    </button>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────────────────────
function ProfileSection({ userId, userName, userEmail, userRole }: Props) {
  const [name,      setName]      = useState(userName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = name.split(' ').map((n: string) => n[0] ?? '').join('').toUpperCase().slice(0, 2)

  // Load avatar on mount
  useEffect(() => {
    createClient().from('profiles').select('avatar_url').eq('id', userId).single()
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url) })
  }, [userId])

  async function handleAvatarUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return }
    setUploading(true); setError('')
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadErr) { setError(uploadErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    setAvatarUrl(publicUrl + '?t=' + Date.now())
    setUploading(false)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Full name is required'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', userId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Profile</h1>
      <p className="text-slate-500 text-sm mb-7">Manage how you appear across TrainHub.</p>

      <SectionCard title="Profile photo" description="This will be displayed across the platform.">
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-violet-700 flex items-center justify-center text-white text-2xl font-bold select-none">
                {initials}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-white rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50">
              {uploading
                ? <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-slate-600" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = '' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Profile picture</p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or GIF. Max 2MB.</p>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="mt-2 text-xs font-semibold text-violet-700 hover:text-violet-800 transition-colors disabled:opacity-50">
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal information" description="Update your name and display details.">
        <div className="space-y-4">
          <Field label="Full name" required>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              placeholder="Your full name" />
          </Field>
          <Field label="Email address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={userEmail} disabled
                className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Email is managed by your administrator.</p>
          </Field>
          <Field label="Role">
            <input type="text" value={userRole} disabled
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" />
          </Field>
        </div>

        <Feedback error={error} saved={saved} savedMsg="Profile saved successfully!" />
        <div className="flex justify-end mt-5">
          <SaveButton onClick={handleSave} saving={saving} />
        </div>
      </SectionCard>
    </div>
  )
}

// ── Notifications section ─────────────────────────────────────────────────────
const NOTIF_DEFAULTS = {
  emailAssignments: true,
  emailReminders:   true,
  emailQuizResults: true,
  emailDigest:      false,
  inAppProgress:    true,
  inAppMessages:    true,
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === 'undefined') return NOTIF_DEFAULTS
    try {
      const saved = localStorage.getItem('trainhub-notifs')
      return saved ? { ...NOTIF_DEFAULTS, ...JSON.parse(saved) } : NOTIF_DEFAULTS
    } catch { return NOTIF_DEFAULTS }
  })
  const [saved, setSaved] = useState(false)

  function toggle(key: keyof typeof NOTIF_DEFAULTS) {
    setPrefs((p: typeof NOTIF_DEFAULTS) => ({ ...p, [key]: !p[key] }))
  }

  function handleSave() {
    localStorage.setItem('trainhub-notifs', JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Notifications</h1>
      <p className="text-slate-500 text-sm mb-7">Choose how and when you want to hear from us.</p>

      <SectionCard title="Email notifications" description="Receive email updates about your training activity.">
        <ToggleRow label="New assignments"   description="When new training modules are assigned to you"  checked={prefs.emailAssignments} onChange={() => toggle('emailAssignments')} />
        <ToggleRow label="Due date reminders" description="Reminders before training deadlines"           checked={prefs.emailReminders}   onChange={() => toggle('emailReminders')} />
        <ToggleRow label="Quiz results"       description="When your quiz attempt has been graded"        checked={prefs.emailQuizResults} onChange={() => toggle('emailQuizResults')} />
        <ToggleRow label="Weekly digest"      description="A weekly summary of your overall progress"    checked={prefs.emailDigest}      onChange={() => toggle('emailDigest')} last />
      </SectionCard>

      <SectionCard title="In-app notifications" description="Control what you see inside TrainHub.">
        <ToggleRow label="Progress milestones" description="Celebrate when you complete topics or subjects" checked={prefs.inAppProgress} onChange={() => toggle('inAppProgress')} />
        <ToggleRow label="Team updates"        description="When teammates complete training modules"      checked={prefs.inAppMessages} onChange={() => toggle('inAppMessages')} last />
      </SectionCard>

      <Feedback error="" saved={saved} savedMsg="Notification preferences saved!" />
      <div className="flex justify-end mt-2">
        <SaveButton onClick={handleSave} saving={false} />
      </div>
    </div>
  )
}

// ── Security section ──────────────────────────────────────────────────────────
function SecuritySection({ userEmail }: { userEmail: string }) {
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowN]       = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  async function handleChangePassword() {
    setError('')
    if (!newPw)              { setError('Please enter a new password'); return }
    if (newPw.length < 8)    { setError('Password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (err) { setError(err.message); return }
    setNewPw(''); setConfirmPw('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const strength = !newPw ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 4 : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-400'][strength]
  const strengthText  = ['', 'text-red-500', 'text-yellow-500', 'text-blue-500', 'text-emerald-600'][strength]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Security</h1>
      <p className="text-slate-500 text-sm mb-7">Manage your password and account security.</p>

      <SectionCard title="Sign-in information">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{userEmail}</p>
            <p className="text-xs text-slate-400">Signed in with email &amp; password</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Change password" description="Use a strong, unique password for your account.">
        <div className="space-y-4">
          <Field label="New password">
            <PasswordInput value={newPw} onChange={v => { setNewPw(v); setError('') }}
              show={showNew} onToggle={() => setShowN(v => !v)} placeholder="At least 8 characters" />
            {newPw && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthColor}`} style={{ width: `${strength * 25}%` }} />
                </div>
                <span className={`text-[11px] font-semibold ${strengthText}`}>{strengthLabel}</span>
              </div>
            )}
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirmPw} onChange={v => { setConfirmPw(v); setError('') }}
              show={showConf} onToggle={() => setShowConf(v => !v)} placeholder="Re-enter new password" />
            {confirmPw && newPw && confirmPw !== newPw && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
            {confirmPw && newPw && confirmPw === newPw && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Passwords match</p>
            )}
          </Field>
        </div>

        <Feedback error={error} saved={saved} savedMsg="Password updated successfully!" />
        <div className="flex justify-end mt-5">
          <SaveButton onClick={handleChangePassword} saving={saving} label="Update password" />
        </div>
      </SectionCard>

      <SectionCard title="Active sessions">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <Laptop className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Current session</p>
            <p className="text-xs text-slate-400 mt-0.5">You're currently signed in. Use the sign out button from the top menu to log out of all devices.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Account section ───────────────────────────────────────────────────────────
function AccountSection({ userEmail, userRole }: { userEmail: string; userRole: string }) {
  const [timezone, setTimezone] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('trainhub-tz') ?? 'Asia/Colombo') : 'Asia/Colombo'
  )
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('trainhub-theme') as Theme) ?? 'light'
  })
  const [saved, setSaved] = useState(false)

  // Apply theme immediately on toggle click
  function handleThemeChange(t: Theme) {
    setTheme(t)
    applyTheme(t)
  }

  function handleSave() {
    localStorage.setItem('trainhub-tz', timezone)
    localStorage.setItem('trainhub-theme', theme)
    applyTheme(theme)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Account</h1>
      <p className="text-slate-500 text-sm mb-7">Manage your account preferences and settings.</p>

      <SectionCard title="Account overview">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm font-semibold text-slate-700 truncate">{userEmail}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Role</p>
            <p className="text-sm font-semibold text-slate-700">{userRole}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferences" description="Customize your TrainHub experience.">
        <Field label="Timezone">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition appearance-none cursor-pointer">
              {TIMEZONES.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.zones.map(z => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="Appearance" description="Switch between light and dark mode. Changes apply immediately.">
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          {([
            ['light', Sun,  'Light', 'Clean white interface'],
            ['dark',  Moon, 'Dark',  'Easy on the eyes'],
          ] as [Theme, React.ComponentType<{className?:string}>, string, string][]).map(([val, Icon, lbl, desc]) => (
            <button key={val} onClick={() => handleThemeChange(val)}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                theme === val
                  ? 'border-violet-600 bg-violet-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}>
              {theme === val && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                theme === val ? 'bg-violet-100' : 'bg-slate-100'
              }`}>
                <Icon className={`w-5 h-5 ${theme === val ? 'text-violet-700' : 'text-slate-500'}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${theme === val ? 'text-violet-800' : 'text-slate-700'}`}>{lbl}</p>
                <p className={`text-xs mt-0.5 ${theme === val ? 'text-violet-600' : 'text-slate-400'}`}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <Feedback error="" saved={saved} savedMsg="Preferences saved!" />
      <div className="flex justify-end mt-2">
        <SaveButton onClick={handleSave} saving={false} />
      </div>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-10 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition" />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange, last }: {
  label: string; description: string; checked: boolean; onChange: () => void; last?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-slate-50' : ''}`}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button onClick={onChange}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 ${checked ? 'bg-violet-700' : 'bg-slate-200'}`}
        role="switch" aria-checked={checked}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function Feedback({ error, saved, savedMsg }: { error: string; saved: boolean; savedMsg: string }) {
  if (!error && !saved) return null
  return (
    <div className={`flex items-center gap-2 mt-4 p-3 rounded-xl text-sm border ${
      error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
    }`}>
      {error
        ? <><AlertCircle className="w-4 h-4 shrink-0" /> {error}</>
        : <><CheckCircle2 className="w-4 h-4 shrink-0" /> {savedMsg}</>
      }
    </div>
  )
}

function SaveButton({ onClick, saving, label = 'Save changes' }: {
  onClick: () => void; saving: boolean; label?: string
}) {
  return (
    <button onClick={onClick} disabled={saving}
      className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 active:bg-violet-900 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
      {saving ? 'Saving…' : label}
    </button>
  )
}
