'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import React from 'react'
import {
  LayoutDashboard, BookOpen, Users, ClipboardList,
  BarChart3, LogOut, GraduationCap, HelpCircle, Eye, Brain, Building2,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/subjects',       label: 'Training Library', icon: BookOpen },
      { href: '/admin/knowledge-base', label: 'Knowledge Base',   icon: Brain },
      { href: '/admin/quizzes',        label: 'Quizzes',          icon: HelpCircle },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/users',       label: 'Users',           icon: Users },
      { href: '/admin/assignments', label: 'Assignments',     icon: ClipboardList },
      { href: '/admin/clients',     label: 'Client Training', icon: Building2 },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Switch View',
    items: [
      { href: '/dashboard', label: 'User View', icon: Eye },
    ],
  },
]

interface AdminSidebarProps {
  userName?: string
  userEmail?: string
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
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
    <>
    <aside className="w-[220px] h-full bg-[#1E1B4B] flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-md">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">TrainHub</p>
            <p className="text-violet-500 text-[10px] mt-0.5 leading-none">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 px-2 pt-4 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-violet-500/50 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
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
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="p-3 border-t border-white/[0.07]">
        {userName && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg bg-white/[0.04]">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              {userEmail && <p className="text-[10px] text-violet-400/60 truncate">{userEmail}</p>}
            </div>
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

  </>
  )
}
