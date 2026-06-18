'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, Building2, Wrench,
  TrendingUp, Award, LogOut, GraduationCap,
} from 'lucide-react'

const learnItems = [
  { href: '/dashboard',        label: 'My Training',     icon: LayoutDashboard, exact: true },
  { href: '/library',          label: 'Library',         icon: BookOpen },
  { href: '/client-training',  label: 'Client Training', icon: Building2 },
  { href: '/tools',            label: 'Tools',           icon: Wrench },
]

const accountItems = [
  { href: '/profile', label: 'My Progress',  icon: TrendingUp },
  { href: '/profile', label: 'Certificates', icon: Award, soon: true },
]

export function UserSidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  function NavLink({ item }: { item: typeof learnItems[0] & { soon?: boolean } }) {
    const active = isActive(item.href, (item as any).exact)
    return (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          active
            ? 'bg-violet-700 text-white shadow-md shadow-violet-900/50'
            : 'text-violet-300/80 hover:bg-white/[0.07] hover:text-white'
        )}
      >
        <item.icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', active ? 'text-white' : 'text-violet-400/70')} />
        <span className="flex-1 tracking-tight">{item.label}</span>
        {(item as any).soon && !active && (
          <span className="text-[10px] text-violet-500 bg-violet-600/10 px-1.5 py-0.5 rounded-full font-semibold">Soon</span>
        )}
        {active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
      </Link>
    )
  }

  return (
    <aside className="w-[220px] min-h-screen bg-[#1E1B4B] flex flex-col shrink-0 select-none">
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
      <nav className="flex-1 px-2 pt-4 space-y-5">
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">Learn</p>
          <div className="space-y-0.5">
            {learnItems.map(item => <NavLink key={item.label} item={item} />)}
          </div>
        </div>

        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">Account</p>
          <div className="space-y-0.5">
            {accountItems.map(item => <NavLink key={item.label} item={item} />)}
          </div>
        </div>
      </nav>

      {/* Bottom user chip + sign out */}
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
