'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, BookOpen, TrendingUp, Users, Wrench, Settings, Building2 } from 'lucide-react'

const items = [
  { href: '/dashboard',       icon: LayoutDashboard, label: 'Home',           exact: true,  disabled: false },
  { href: '/library',         icon: BookOpen,         label: 'Library',        exact: false, disabled: false },
  { href: '/client-training', icon: Building2,        label: 'Client Training',exact: false, disabled: false },
  { href: '/tools',           icon: Wrench,           label: 'Tools',          exact: false, disabled: false },
  { href: '/profile',         icon: TrendingUp,       label: 'My Progress',    exact: false, disabled: false },
  { href: '/settings',        icon: Settings,         label: 'Settings',       exact: false, disabled: false },
]

export function UserNarrowSidebar() {
  const pathname = usePathname()

  function isActive(item: typeof items[0]) {
    if (item.disabled) return false
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <aside className="w-14 min-h-screen bg-white border-r border-slate-200 flex flex-col items-center pt-4 pb-3 shrink-0 z-10">
      {items.map((item, i) => {
        const active = isActive(item)

        if (item.disabled) {
          return (
            <div
              key={i}
              title={item.label}
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 cursor-not-allowed opacity-35"
            >
              <item.icon className="w-[18px] h-[18px] text-slate-400" />
            </div>
          )
        }

        return (
          <Link
            key={i}
            href={item.href}
            title={item.label}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all group',
              active
                ? 'bg-violet-700 shadow-sm shadow-violet-200'
                : 'hover:bg-slate-100 cursor-pointer'
            )}
          >
            <item.icon
              className={cn(
                'w-[18px] h-[18px] transition-colors',
                active
                  ? 'text-white'
                  : 'text-slate-500 group-hover:text-slate-700'
              )}
            />
          </Link>
        )
      })}
    </aside>
  )
}
