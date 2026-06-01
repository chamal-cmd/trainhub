'use client'

import { useState } from 'react'
import { UserNarrowSidebar } from './UserNarrowSidebar'
import { UserTopBar } from './UserTopBar'

interface UserClientWrapperProps {
  children: React.ReactNode
  userName: string
  userRole: string
  completionRate: number
}

export function UserClientWrapper({
  children,
  userName,
  userRole,
  completionRate,
}: UserClientWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {sidebarOpen && <UserNarrowSidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        <UserTopBar
          userName={userName}
          userRole={userRole}
          completionRate={completionRate}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
        />
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
