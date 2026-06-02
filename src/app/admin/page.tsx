// Auth-gated page — must always be dynamic
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, ClipboardCheck, Award, ArrowUpRight, Activity, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Run all independent queries in parallel
  const [
    profileRes,
    { count: subjectsCount },
    { count: usersCount },
    { count: assignmentsCount },
    recentSubjectsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user?.id ?? '').single(),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('assignments').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('id, title, emoji, cover_color, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  // quiz_attempts fetched separately — table may not exist yet
  let passedCount = 0
  let recentAttemptsRes: { data: any[] | null } = { data: [] }
  try {
    const passedRes = await supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('passed', true)
    passedCount = (passedRes as any).count ?? 0
    recentAttemptsRes = await supabase.from('quiz_attempts').select('id, score, passed, completed_at, profiles(full_name), quizzes(title)').order('completed_at', { ascending: false }).limit(8)
  } catch { /* quiz_attempts may not exist */ }

  const profile       = profileRes.data
  const recentSubjects = recentSubjectsRes.data
  const recentAttempts = recentAttemptsRes.data

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const stats = [
    {
      label: 'Modules',
      value: subjectsCount ?? 0,
      icon: BookOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      href: '/admin/subjects',
      action: 'View library',
    },
    {
      label: 'Team Members',
      value: usersCount ?? 0,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      href: '/admin/users',
      action: 'Manage team',
    },
    {
      label: 'Assignments',
      value: assignmentsCount ?? 0,
      icon: ClipboardCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      href: '/admin/assignments',
      action: 'View all',
    },
    {
      label: 'Quizzes Passed',
      value: passedCount ?? 0,
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      href: '/admin/reports',
      action: 'See reports',
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's what's happening with your training platform.
          </p>
        </div>
        <Link href="/admin/subjects/new">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-200 shrink-0">
            <Plus className="w-4 h-4" />
            New Module
          </button>
        </Link>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className={`bg-white rounded-2xl border ${s.border} p-5 hover:shadow-md transition-all group cursor-pointer h-full`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
              <p className={`text-xs mt-2 font-semibold ${s.color}`}>{s.action} →</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Two-column content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Training Library — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Training Library</h2>
            </div>
            <Link
              href="/admin/subjects"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentSubjects && recentSubjects.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentSubjects.map((s: any) => (
                <Link key={s.id} href={`/admin/subjects/${s.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: s.cover_color + '18' }}
                    >
                      {s.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatRelativeDate(s.created_at)}</p>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full shrink-0 opacity-60"
                      style={{ backgroundColor: s.cover_color }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-indigo-300" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">No modules yet</p>
              <Link href="/admin/subjects/new" className="text-xs text-indigo-600 hover:underline">
                Create your first →
              </Link>
            </div>
          )}

          {/* Quick-create footer */}
          <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
            <Link
              href="/admin/subjects/new"
              className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add new training module
            </Link>
          </div>
        </div>

        {/* Activity feed — narrower */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Quiz Activity</h2>
            </div>
            <Link
              href="/admin/reports"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Reports <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentAttempts && recentAttempts.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentAttempts.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {a.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.profiles?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.quizzes?.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {a.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No quiz attempts yet</p>
              <p className="text-xs text-slate-400 mt-1">Results will appear here once team members take quizzes.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Quick links row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {[
          { href: '/admin/users',       label: 'Manage Users',    sub: 'View & edit team',     emoji: '👥' },
          { href: '/admin/assignments',  label: 'Assignments',     sub: 'Assign training',       emoji: '📋' },
          { href: '/admin/reports',      label: 'Reports',         sub: 'Track completion',      emoji: '📊' },
          { href: '/admin/subjects/new', label: 'New Module',      sub: 'Add training content',  emoji: '✨' },
        ].map(q => (
          <Link key={q.href} href={q.href}>
            <div className="bg-white border border-slate-100 hover:border-indigo-200 rounded-xl p-4 hover:shadow-sm transition-all group cursor-pointer">
              <span className="text-xl">{q.emoji}</span>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors mt-2">{q.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{q.sub}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
