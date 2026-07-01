import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { resend, FROM } from '@/lib/resend'
import { nudgeEmail } from '@/lib/emails'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

function adminClient() {
  return createSupabaseClient(SB_URL, SVC, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function verifyAdmin(token: string): Promise<string | null> {
  const r1 = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  })
  if (!r1.ok) return null
  const user = await r1.json()
  if (!user?.id) return null
  const r2 = await fetch(`${SB_URL}/rest/v1/profiles?select=role,full_name&id=eq.${user.id}&limit=1`, {
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  })
  if (!r2.ok) return null
  const profiles = await r2.json()
  if (profiles?.[0]?.role !== 'admin') return null
  return profiles[0].full_name ?? 'Admin'
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    const senderName = await verifyAdmin(token)
    if (!senderName) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject_id, user_id, due_date } = await req.json()
    if (!subject_id || !user_id) return NextResponse.json({ error: 'subject_id and user_id required' }, { status: 400 })

    const sb = adminClient()

    // Get the current admin user id
    const r = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: ANON, Authorization: `Bearer ${token}` },
    })
    const authUser = await r.json()
    const assigned_by = authUser?.id ?? null

    // Insert or ignore duplicate — nudge always sends the reminder email
    const { data: assignment, error: assignErr } = await sb
      .from('assignments')
      .insert({ subject_id, user_id, assigned_by, due_date: due_date || null })
      .select('id')
      .single()

    if (assignErr) {
      const isDupe = assignErr.message.includes('unique') || assignErr.code === '23505'
      if (!isDupe) {
        return NextResponse.json({ error: assignErr.message }, { status: 400 })
      }
      // Duplicate is fine — still send the reminder email below
    }

    // Fetch trainee email + name, and subject title for the notification email
    if (resend) {
      const [userRes, subjectRes] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/profiles?select=full_name,email&id=eq.${user_id}&limit=1`, {
          headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
        }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/subjects?select=title,emoji&id=eq.${subject_id}&limit=1`, {
          headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
        }).then(r => r.json()),
      ])

      const profile = userRes?.[0]
      const subject = subjectRes?.[0]

      if (profile?.email && subject?.title) {
        const origin = req.headers.get('x-forwarded-host')
          ? `https://${req.headers.get('x-forwarded-host')}`
          : new URL(req.url).origin

        await resend.emails.send({
          from: FROM,
          to: profile.email,
          subject: `New training reminder: ${subject.emoji ?? ''} ${subject.title}`,
          html: nudgeEmail({
            userName: profile.full_name ?? profile.email.split('@')[0],
            subjectEmoji: subject.emoji ?? '📚',
            subjectTitle: subject.title,
            dueDate: due_date,
            appUrl: origin,
            senderName,
          }),
        })
      }
    }

    return NextResponse.json({ ok: true, id: assignment?.id })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
