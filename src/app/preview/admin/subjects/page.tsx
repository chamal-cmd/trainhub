import Link from 'next/link'
import { BookOpen, Plus, FileText, HelpCircle, ArrowRight } from 'lucide-react'

const subjects = [
  { id: '1', emoji: '🔧', title: 'Machine Safety & Operations',  description: 'Essential safety protocols for all factory floor staff.',    color: '#4F46E5', topics: 5, steps: 18, quiz: true  },
  { id: '2', emoji: '📋', title: 'HR Onboarding Essentials',     description: 'Everything new employees need to know on day one.',          color: '#059669', topics: 4, steps: 12, quiz: true  },
  { id: '3', emoji: '🎯', title: 'Quality Control Standards',    description: 'MAS Holdings quality frameworks and inspection processes.',   color: '#DB2777', topics: 6, steps: 22, quiz: true  },
  { id: '4', emoji: '🚀', title: 'Leadership Fundamentals',      description: 'Building effective team leadership at every level.',          color: '#D97706', topics: 3, steps: 9,  quiz: true  },
  { id: '5', emoji: '💡', title: 'Workplace Compliance 2024',    description: 'Legal compliance requirements and company policy updates.',   color: '#7C3AED', topics: 4, steps: 14, quiz: true  },
  { id: '6', emoji: '📊', title: 'Production Planning Basics',   description: 'Introduction to production scheduling and planning tools.',  color: '#0284C7', topics: 3, steps: 10, quiz: false },
  { id: '7', emoji: '🌟', title: 'Customer Service Excellence',  description: 'Delivering outstanding service to internal and external customers.',color: '#9333EA', topics: 4, steps: 13, quiz: true  },
  { id: '8', emoji: '🔍', title: 'Fabric Inspection Techniques', description: 'Advanced fabric analysis and defect identification methods.', color: '#0891B2', topics: 5, steps: 16, quiz: false },
]

export default function PreviewSubjectsPage() {
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
            { label: 'Dashboard',        href: '/preview/admin',          active: false },
            { label: 'Training Library', href: '/preview/admin/subjects', active: true  },
            { label: 'Users',            href: '#', active: false },
            { label: 'Assignments',      href: '#', active: false },
            { label: 'Reports',          href: '#', active: false },
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
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">R</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Ridmal Perera</p>
              <p className="text-[10px] text-violet-400/60 truncate">MAS Legato · Pod Leader</p>
            </div>
          </div>
          <Link href="/preview/admin" className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-violet-400/70 hover:bg-white/[0.07] hover:text-white transition-all">
            ← Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Training Library</h1>
            <p className="text-slate-400 text-sm mt-0.5">{subjects.length} modules in your library</p>
          </div>
          <Link href="/preview/admin/subjects/new">
            <button className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> New Module
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subject, i) => (
            <Link key={subject.id} href="/preview/admin">
              <div className="bg-white rounded-2xl border border-slate-100 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="h-1 w-full" style={{ backgroundColor: subject.color }} />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: subject.color + '1A', boxShadow: `0 0 0 1px ${subject.color}20` }}>
                      {subject.emoji}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug line-clamp-1">{subject.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{subject.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <BookOpen className="w-3 h-3" /> {subject.topics} topics
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <FileText className="w-3 h-3" /> {subject.steps} steps
                    </div>
                    {subject.quiz && (
                      <div className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 rounded-lg px-2.5 py-1.5">
                        <HelpCircle className="w-3 h-3" /> Quiz
                      </div>
                    )}
                    <div className="ml-auto">
                      <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-violet-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          <Link href="/preview/admin/subjects/new">
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center py-12 px-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-slate-400 group-hover:text-violet-700 transition-colors">New Module</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
