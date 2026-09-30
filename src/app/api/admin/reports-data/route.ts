import { NextRequest, NextResponse } from 'next/server'
import { getLearnerReports } from '@/lib/reports'

// Must never be statically cached — this route exists specifically to serve
// data fresher than whatever the Reports page rendered on last load.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifyAdmin(token: string): Promise<boolean> {
  const r1 = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  })
  if (!r1.ok) return false
  const user = await r1.json()
  if (!user?.id) return false

  const r2 = await fetch(`${SB_URL}/rest/v1/profiles?select=role&id=eq.${user.id}&limit=1`, {
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  })
  const profiles = await r2.json()
  return profiles?.[0]?.role === 'admin'
}

// Always-fresh learner data for PDF export — never cache. This exists
// specifically so a "Download PDF" click reflects what's true right now,
// not a snapshot from whenever the Reports page happened to load.
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    if (!(await verifyAdmin(token))) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const learners = await getLearnerReports()
    return NextResponse.json({ learners }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
