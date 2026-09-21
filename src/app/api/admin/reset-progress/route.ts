import { NextRequest, NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAdminUserId(token: string): Promise<string | null> {
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${token}` },
  })
  if (!r.ok) return null
  const user = await r.json()
  const userId = user?.id
  if (!userId) return null

  const pr = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`, {
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
  })
  const profiles = await pr.json()
  return profiles?.[0]?.role === 'admin' ? userId : null
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    const adminId = await getAdminUserId(token)
    if (!adminId) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const svcHeaders = { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' }

    const [stepRes, quizRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/step_progress?user_id=eq.${userId}`, { method: 'DELETE', headers: svcHeaders }),
      fetch(`${SB_URL}/rest/v1/topic_quiz_completions?user_id=eq.${userId}`, { method: 'DELETE', headers: svcHeaders }),
    ])

    if (!stepRes.ok || !quizRes.ok) {
      return NextResponse.json({ error: 'Failed to reset one or more progress tables' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
