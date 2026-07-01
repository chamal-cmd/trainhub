'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, BookOpen, TrendingUp, Wrench, Settings, Building2, FileText, GraduationCap, LogOut, CheckSquare } from 'lucide-react'

const mainItems = [
  { href: '/dashboard',       icon: LayoutDashboard, label: 'Home',            exact: true  },
  { href: '/library',         icon: BookOpen,         label: 'Library',         exact: false },
  { href: '/client-training', icon: Building2,        label: 'Client Training', exact: false },
  { href: '/sops',            icon: FileText,         label: 'General SOPs',    exact: false },
]

const toolItems = [
  { href: '/tools',    icon: Wrench,     label: 'Tools',       exact: false },
  { href: '/profile',  icon: TrendingUp, label: 'My Progress', exact: false },
  { href: '/settings', icon: Settings,   label: 'Settings',    exact: false },
]

interface Props {
  userName?: string
}

export function UserNarrowSidebar({ userName }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [todoCount, setTodoCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('assignments')
        .select('id')
        .eq('user_id', user.id)
      const pending = (data ?? []).length
      setTodoCount(pending)
    }
    load()
  }, [pathname]) // reload count when navigating (e.g. after user marks done on /todo page)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function NavLink({ href, icon: Icon, label, exact, badge }: {
    href: string; icon: any; label: string; exact?: boolean; badge?: number
  }) {
    const active = isActive(href, exact)
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          active
            ? 'bg-violet-700 text-white shadow-md shadow-violet-900/50'
            : 'text-violet-300/80 hover:bg-white/[0.07] hover:text-white'
        )}
      >
        <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', active ? 'text-white' : 'text-violet-400/70')} />
        <span className="flex-1 tracking-tight">{label}</span>
        {badge != null && badge > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {active && badge == null && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
      </Link>
    )
  }

  return (
    <aside className="w-[200px] min-h-screen bg-[#1E1B4B] flex flex-col shrink-0 select-none">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-md">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">TrainHub</p>
            <p className="text-violet-500 text-[10px] mt-0.5 leading-none">Learner Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-4 space-y-5 overflow-y-auto">

        {/* Main */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">Main</p>
          <div className="space-y-0.5">
            {mainItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        </div>

        {/* To-do */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">To-do</p>
          <div className="space-y-0.5">
            <NavLink href="/todo" icon={CheckSquare} label="My Tasks" badge={todoCount} />
          </div>
        </div>

        {/* Tools */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">Tools</p>
          <div className="space-y-0.5">
            {toolItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        </div>

      </nav>

      {/* Bottom sign out */}
      <div className="p-3 border-t border-white/[0.07]">
        {userName && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg bg-white/[0.04]">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-semibold text-white truncate flex-1">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-violet-400/70 hover:bg-white/[0.07] hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
