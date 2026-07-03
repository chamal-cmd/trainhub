import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM } from '@/lib/resend'
import { reminderEmail } from '@/lib/emails'

async function sbFetch(url: string, svc: string) {
  const key = svc.trim()
  const r = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function POST(req: NextRequest) {
  // Read env vars at request time (not module load time) so Cloudflare secrets are available
  const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const SECRET = process.env.CRON_SECRET ?? ''

  const incoming = req.headers.get('x-cron-secret')
  if (!SECRET || incoming !== SECRET.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!resend) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })
  }

  if (!SVC) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin

  const sb = (path: string) => sbFetch(`${SB_URL}/rest/v1/${path}`, SVC)

  try {
    // 1. All assignments
    const assignments: { user_id: string; subject_id: string }[] =
      await sb('assignments?select=user_id,subject_id')
    if (!assignments.length) return NextResponse.json({ ok: true, sent: 0 })

    const subjectIds = [...new Set(assignments.map(a => a.subject_id))]
    const userIds    = [...new Set(assignments.map(a => a.user_id))]

    // 2. Profiles, subjects, topics, steps
    const [profiles, subjects, topics]: any[] = await Promise.all([
      sb(`profiles?select=id,email,full_name&id=in.(${userIds.join(',')})`),
      sb(`subjects?select=id,title,emoji&id=in.(${subjectIds.join(',')})`),
      sb(`topics?select=id,subject_id&subject_id=in.(${subjectIds.join(',')})`),
    ])

    const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
    const subjectMap = Object.fromEntries(subjects.map((s: any) => [s.id, s]))
    const topicToSubject: Record<string, string> = {}
    for (const t of topics) topicToSubject[t.id] = t.subject_id

    const topicIds = topics.map((t: any) => t.id)
    if (!topicIds.length) return NextResponse.json({ ok: true, sent: 0 })

    const steps: any[] = await sb(`steps?select=id,topic_id&topic_id=in.(${topicIds.join(',')})`)

    // subjectId -> Set<stepId>
    const subjectStepIds: Record<string, Set<string>> = {}
    for (const s of steps) {
      const sid = topicToSubject[s.topic_id]
      if (!subjectStepIds[sid]) subjectStepIds[sid] = new Set()
      subjectStepIds[sid].add(s.id)
    }

    // Only filter by user_id — step filtering happens in JS to avoid URL length limits
    const progress: any[] = await sb(`step_progress?select=user_id,step_id&user_id=in.(${userIds.join(',')})`)

    const completedByUser: Record<string, Set<string>> = {}
    for (const p of progress) {
      if (!completedByUser[p.user_id]) completedByUser[p.user_id] = new Set()
      completedByUser[p.user_id].add(p.step_id)
    }

    // Build per-user in-progress module list
    const byUser = new Map<string, { email: string; fullName: string; modules: any[] }>()
    for (const a of assignments) {
      const total = subjectStepIds[a.subject_id]?.size ?? 0
      if (!total) continue
      const done = [...(subjectStepIds[a.subject_id] ?? [])].filter(id => completedByUser[a.user_id]?.has(id)).length
      if (done === 0 || done >= total) continue

      if (!byUser.has(a.user_id)) {
        const p = profileMap[a.user_id]
        if (!p?.email) continue
        byUser.set(a.user_id, { email: p.email, fullName: p.full_name, modules: [] })
      }
      const sub = subjectMap[a.subject_id]
      byUser.get(a.user_id)!.modules.push({
        emoji:     sub?.emoji ?? '📚',
        title:     sub?.title ?? 'Training Module',
        completed: done,
        total,
      })
    }

    if (!byUser.size) {
      return NextResponse.json({ ok: true, sent: 0, message: 'No in-progress assignments' })
    }

    let sent = 0
    const errors: string[] = []
    for (const [, user] of byUser) {
      try {
        await resend!.emails.send({
          from:    FROM,
          to:      user.email,
          subject: `You have ${user.modules.length} training module${user.modules.length > 1 ? 's' : ''} to finish 📚`,
          html:    reminderEmail({ userName: user.fullName || user.email.split('@')[0], modules: user.modules, appUrl: origin }),
        })
        sent++
      } catch (e: any) {
        errors.push(`${user.email}: ${e?.message ?? String(e)}`)
      }
    }

    return NextResponse.json({ ok: true, sent, errors: errors.length ? errors : undefined })

  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
