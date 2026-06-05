'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, TrendingUp, Award, LogOut, GraduationCap } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'My Training',  icon: LayoutDashboard, exact: true },
  { href: '/profile',   label: 'My Progress',  icon: TrendingUp },
  { href: '/profile',   label: 'Certificates', icon: Award, disabled: false },
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
        {/* Main */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">
            Main
          </p>
          <div className="space-y-0.5">
            {[navItems[0], navItems[1]].map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-violet-700 text-white shadow-md shadow-violet-900/50'
                      : 'text-violet-300/80 hover:bg-white/[0.07] hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      active ? 'text-white' : 'text-violet-400/70'
                    )}
                  />
                  <span className="flex-1 tracking-tight">{item.label}</span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">
            Achievements
          </p>
          <div className="space-y-0.5">
            <Link
              href="/profile"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-300/80 hover:bg-white/[0.07] hover:text-white transition-all"
            >
              <Award className="w-4 h-4 shrink-0 text-violet-400/70 group-hover:scale-110 transition-transform" />
              <span className="flex-1 tracking-tight">Certificates</span>
              <span className="text-[10px] text-violet-600 bg-violet-600/10 px-1.5 py-0.5 rounded-full font-semibold">Soon</span>
            </Link>
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
