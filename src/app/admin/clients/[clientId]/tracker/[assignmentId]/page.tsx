'use client'

// Admin view of a specific trainee's client training tracker (read-only)
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Params = { params: Promise<{ clientId: string; assignmentId: string }> }

export default function AdminTrackerView({ params }: Params) {
  const { clientId, assignmentId } = use(params)
  // Reuse the same tracker component — just redirect to it
  // The tracker page handles both admin and trainee views
  if (typeof window !== 'undefined') {
    window.location.replace(`/client-training/${assignmentId}?admin=1&back=/admin/clients/${clientId}`)
  }
  return (
    <div className="flex items-center justify-center min-h-full py-24 text-slate-400 text-sm">
      Redirecting to tracker…
    </div>
  )
}
