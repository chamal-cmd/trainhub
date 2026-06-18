'use client'

import { UserSidebar } from './UserSidebar'
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
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <UserSidebar userName={userName} />

      <div className="flex-1 flex flex-col min-w-0">
        <UserTopBar
          userName={userName}
          userRole={userRole}
          completionRate={completionRate}
        />
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
