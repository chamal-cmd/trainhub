'use client'

import Link from 'next/link'
import { BookOpen, CheckCircle2, Clock, ArrowRight, Award, LayoutDashboard, User, LogOut } from 'lucide-react'

const inProgress = [
  { id: '1', emoji: '🔧', title: 'Machine Safety & Operations', color: '#4F46E5', completed: 11, total: 18, percent: 61, due: 'Jun 1' },
  { id: '2', emoji: '📋', title: 'HR Onboarding Essentials',   color: '#059669', completed: 7,  total: 12, percent: 58, due: null    },
]
const notStarted = [
  { id: '3', emoji: '🎯', title: 'Quality Control Standards', color: '#DB2777', completed: 0, total: 22, percent: 0, due: 'Jun 15' },
  { id: '4', emoji: '💡', title: 'Workplace Compliance 2024', color: '#7C3AED', completed: 0, total: 14, percent: 0, due: null     },
]
const completedModules = [
  { id: '5', emoji: '📊', title: 'Production Planning Basics', color: '#0284C7', completed: 10, total: 10, percent: 100, due: null },
]

function ProgressBar({ value, green }: { value: number; green?: boolean }) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${green ? 'bg-emerald-500' : 'bg-violet-600'}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function ModuleCard({ m, done }: { m: any; done?: boolean }) {
  return (
    <Link href="/preview/training">
      <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all group cursor-pointer ${done ? 'border-emerald-100' : 'border-slate-100 hover:border-violet-300'}`}>
        <div className="h-1 w-full" style={{ backgroundColor: m.color }} />
        <div className="p-5">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: m.color + '1A' }}>
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-sm leading-snug truncate transition-colors ${done ? 'text-slate-500' : 'text-slate-900 group-hover:text-violet-700'}`}>{m.title}</h3>
            </div>
            {done
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              : <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-violet-500 transition-all shrink-0 mt-0.5" />}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{m.completed}/{m.total} steps</span>
              <span className={`text-xs font-bold ${done ? 'text-emerald-600' : 'text-slate-600'}`}>{m.percent}%</span>
            </div>
            <ProgressBar value={m.percent} green={done} />
          </div>
          {m.due && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Due {m.due}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function PreviewDashboard() {
  const overall = Math.round(([...inProgress, ...notStarted, ...completedModules].reduce((s, m) => s + m.percent, 0)) / 5)

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
              <p className="text-violet-500 text-[10px] mt-0.5 leading-none">Learner Portal</p>
            </div>
          </div>
        </div>
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-violet-500/60 uppercase tracking-widest">Menu</p>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {[
            { label: 'My Training', href: '/preview/dashboard', active: true  },
            { label: 'My Progress', href: '#',                  active: false },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${item.active ? 'bg-violet-700 text-white shadow-md shadow-violet-900/50' : 'text-violet-300/80 hover:bg-white/[0.07] hover:text-white'}`}>
              <span className="flex-1 tracking-tight">{item.label}</span>
              {item.active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg bg-white/[0.04]">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">T</div>
            <p className="text-xs font-semibold text-white truncate flex-1">Tharushi Atukorala</p>
          </div>
          <Link href="/login" className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-violet-400/70 hover:bg-white/[0.07] hover:text-white transition-all">
            ← Back to Login
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8 max-w-5xl">
        {/* Hero banner */}
        <div className="relative bg-[#1E1B4B] rounded-2xl overflow-hidden mb-8 p-6 md:p-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-60 h-60 bg-violet-700/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-violet-600/15 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-violet-400 text-sm font-medium mb-1">Welcome back 👋</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Tharushi Atukorala</h1>
              <p className="text-violet-300/70 text-sm mt-2">You've completed 1 of 5 modules.</p>
            </div>
            <div className="shrink-0 text-center hidden sm:block">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#6366f1" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - overall / 100)}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{overall}%</span>
                </div>
              </div>
              <p className="text-violet-400 text-xs mt-1">Overall</p>
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-white border-slate-200 text-slate-600"><BookOpen className="w-3.5 h-3.5" /> 5 assigned</div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-amber-50 border-amber-200 text-amber-700"><Clock className="w-3.5 h-3.5" /> 2 in progress</div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-emerald-50 border-emerald-200 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> 1 completed</div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-violet-50 border-violet-200 text-violet-700"><Award className="w-3.5 h-3.5" /> 3 quizzes passed</div>
        </div>

        {/* In Progress */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Continue Learning</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">2</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgress.map(m => <ModuleCard key={m.id} m={m} />)}
          </div>
        </section>

        {/* Up Next */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Up Next</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">2</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notStarted.map(m => <ModuleCard key={m.id} m={m} />)}
          </div>
        </section>

        {/* Completed */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Completed</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">1</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedModules.map(m => <ModuleCard key={m.id} m={m} done />)}
          </div>
        </section>
      </main>
    </div>
  )
}
