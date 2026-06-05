import Link from 'next/link'
import { BookOpen, Users, ClipboardCheck, Award, ArrowUpRight, Activity } from 'lucide-react'

const stats = [
  { label: 'Training Modules', value: 8,  icon: BookOpen,      light: 'bg-violet-50 text-violet-700',  href: '/preview/admin/subjects', change: 'View library' },
  { label: 'Active Users',     value: 30, icon: Users,          light: 'bg-violet-50 text-violet-600',  href: '#',                        change: 'Manage team' },
  { label: 'Assignments',      value: 54, icon: ClipboardCheck, light: 'bg-sky-50 text-sky-600',        href: '#',                        change: 'View all' },
  { label: 'Quizzes Passed',   value: 47, icon: Award,          light: 'bg-emerald-50 text-emerald-600',href: '#',                        change: 'See reports' },
]

const recentModules = [
  { id: '1', emoji: '🔧', title: 'Machine Safety & Operations', color: '#4F46E5', date: '2 days ago' },
  { id: '2', emoji: '📋', title: 'HR Onboarding Essentials',   color: '#059669', date: '5 days ago' },
  { id: '3', emoji: '🎯', title: 'Quality Control Standards',  color: '#DB2777', date: '1 week ago' },
  { id: '4', emoji: '🚀', title: 'Leadership Fundamentals',    color: '#D97706', date: '2 weeks ago' },
  { id: '5', emoji: '💡', title: 'Workplace Compliance 2024',  color: '#7C3AED', date: '3 weeks ago' },
]

const recentAttempts = [
  { id: '1', name: 'Chamal Abeytunga',     quiz: 'Safety Quiz',        score: 92, passed: true  },
  { id: '2', name: 'Tharushi Atukorala',   quiz: 'HR Onboarding Quiz', score: 68, passed: false },
  { id: '3', name: 'Kalani Fernando',      quiz: 'Quality Standards',  score: 85, passed: true  },
  { id: '4', name: 'Catherine Rose Alforque', quiz: 'Compliance Quiz', score: 95, passed: true  },
  { id: '5', name: 'Abdullah Fazeel',      quiz: 'Safety Quiz',        score: 72, passed: true  },
  { id: '6', name: 'Tania Weerasinghe',    quiz: 'HR Onboarding Quiz', score: 55, passed: false },
]

export default function PreviewAdminDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-[220px] min-h-screen bg-[#1E1B4B] flex flex-col shrink-0 select-none">
        <div className="px-5 h-16 flex items-center border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">TrainHub</p>
              <p className="text-violet-500 text-[10px] mt-0.5 leading-none">Admin Portal</p>
            </div>
          </div>
        </div>
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-violet-500/60 uppercase tracking-widest">Menu</p>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {[
            { label: 'Dashboard',        href: '/preview/admin',    active: true },
            { label: 'Training Library', href: '/preview/admin/subjects', active: false },
            { label: 'Users',            href: '#', active: false },
            { label: 'Assignments',      href: '#', active: false },
            { label: 'Reports',          href: '#', active: false },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${item.active ? 'bg-violet-700 text-white shadow-md shadow-indigo-900/50' : 'text-violet-300/80 hover:bg-white/[0.07] hover:text-white'}`}>
              <span className="flex-1 tracking-tight">{item.label}</span>
              {item.active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg bg-white/[0.04]">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">R</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Ridmal Perera</p>
              <p className="text-[10px] text-violet-400/60 truncate">MAS Legato · Pod Leader</p>
            </div>
          </div>
          <Link href="/login" className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-violet-400/70 hover:bg-white/[0.07] hover:text-white transition-all">
            ← Back to Login
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Good morning, Ridmal 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">Here's what's happening with your training platform.</p>
          </div>
          <Link href="/preview/admin/subjects/new">
            <button className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-violet-300">
              + New Module
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <Link key={s.label} href={s.href}>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all group cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${s.light} flex items-center justify-center`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition-colors" />
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-xs text-violet-600 mt-2 font-medium">{s.change} →</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Two column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent Modules */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <h2 className="font-semibold text-slate-800 text-sm">Recent Modules</h2>
              </div>
              <Link href="/preview/admin/subjects" className="text-xs text-violet-700 hover:text-violet-800 font-medium flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {recentModules.map((s, i) => (
              <Link key={s.id} href="/preview/admin/subjects">
                <div className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group ${i < recentModules.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: s.color + '18', border: `1px solid ${s.color}30` }}>
                    {s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors truncate">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.date}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                </div>
              </Link>
            ))}
          </div>

          {/* Quiz Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-slate-800 text-sm">Quiz Activity</h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {recentAttempts.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {a.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.quiz}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {a.passed ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
