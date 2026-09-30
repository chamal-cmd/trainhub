// Shared learner-report computation — used by the admin Reports page (on-screen)
// and the /api/admin/reports-data route (always-fresh data for PDF export).
// Keeping this in one place means the PDF a manager downloads can never show
// different numbers than what the Reports page just displayed.

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface LearnerModuleRow {
  title: string
  emoji: string
  done: number
  total: number
  pct: number
}

export interface LearnerQuizRow {
  title: string
  score: number
  passed: boolean
  date: string
}

export interface LearnerReport {
  id: string
  name: string
  email: string
  pod: string | null
  overallPct: number
  stepsDone: number
  stepsTotal: number
  modulesDone: number
  modulesTotal: number
  quizAverage: number | null
  lastActive: string | null
  pathModules: LearnerModuleRow[]
  clientModules: LearnerModuleRow[]
  quizzes: LearnerQuizRow[]
  moduleEmojis: { emoji: string; title: string; pct: number; done: number }[]
}

async function sb(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
    cache: 'no-store', // never let Next.js's fetch cache serve stale progress data
  })
  return res.json()
}

// PostgREST silently caps unfiltered responses at ~1000 rows. step_progress and
// topic_quiz_completions grow by one row per step/quiz per user and WILL exceed
// that cap as the team trains — paginate with Range headers so nobody's most
// recent completions get silently dropped (this was the actual bug behind
// "my progress shows 100% but admin shows less").
async function sbAll(path: string): Promise<any[]> {
  const pageSize = 1000
  const all: any[] = []
  let start = 0
  for (;;) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SVC,
        Authorization: `Bearer ${SVC}`,
        Range: `${start}-${start + pageSize - 1}`,
      },
      cache: 'no-store',
    })
    const page = await res.json()
    if (!Array.isArray(page) || page.length === 0) break
    all.push(...page)
    if (page.length < pageSize) break
    start += pageSize
  }
  return all
}

// Exported so admin/reports/page.tsx's module/client breakdown sections use
// the same fully-paginated data instead of duplicating (and re-breaking) this.
export async function getAllStepProgress(): Promise<{ user_id: string; step_id: string; completed_at: string }[]> {
  return sbAll('step_progress?select=user_id,step_id,completed_at')
}

export async function getLearnerReports(): Promise<LearnerReport[]> {
  const [users, subjects, stepProgress, quizCompletions] = await Promise.all([
    sb('profiles?role=eq.user&select=id,full_name,email,pod&order=full_name'),
    sb('subjects?select=id,title,emoji,order_index,is_client_training,topics(id,title,steps(id))&order=order_index'),
    sbAll('step_progress?select=user_id,step_id,completed_at'),
    sbAll('topic_quiz_completions?select=user_id,topic_id,score,passed,completed_at'),
  ])

  const stepIdsOf = (s: any): string[] =>
    (s.topics ?? []).flatMap((t: any) => (t.steps ?? []).map((st: any) => st.id))

  const pathModules = (subjects ?? []).filter(
    (s: any) => !s.is_client_training && s.order_index < 1000 && s.title !== 'General SOPs'
  )
  const clientModules = (subjects ?? []).filter((s: any) => s.is_client_training)

  const topicLabel = new Map<string, string>()
  for (const s of subjects ?? []) {
    for (const t of s.topics ?? []) topicLabel.set(t.id, `${s.title} — ${t.title}`)
  }

  const doneByUser = new Map<string, Map<string, string>>()
  for (const p of stepProgress ?? []) {
    if (!doneByUser.has(p.user_id)) doneByUser.set(p.user_id, new Map())
    doneByUser.get(p.user_id)!.set(p.step_id, p.completed_at)
  }

  return (users ?? []).map((user: any) => {
    const done = doneByUser.get(user.id) ?? new Map<string, string>()

    const modRows = (mods: any[]) => mods.map((s: any) => {
      const ids = stepIdsOf(s)
      const d = ids.filter(id => done.has(id)).length
      return {
        title: s.title as string,
        emoji: (s.emoji ?? '📚') as string,
        done: d,
        total: ids.length,
        pct: ids.length > 0 ? Math.round((d / ids.length) * 100) : 0,
      }
    })

    const path   = modRows(pathModules)
    const client = modRows(clientModules)

    const stepsTotal  = path.reduce((s, m) => s + m.total, 0)
    const stepsDone   = path.reduce((s, m) => s + m.done, 0)
    const modulesDone = path.filter(m => m.total > 0 && m.pct === 100).length
    const overallPct  = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0

    const userQuizzes: LearnerQuizRow[] = (quizCompletions ?? [])
      .filter((q: any) => q.user_id === user.id)
      .sort((a: any, b: any) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
      .map((q: any) => ({
        title:  topicLabel.get(q.topic_id) ?? 'Topic quiz',
        score:  q.score ?? 0,
        passed: Boolean(q.passed),
        date:   q.completed_at,
      }))

    const quizAverage = userQuizzes.length > 0
      ? Math.round((userQuizzes.reduce((s, q) => s + q.score, 0) / userQuizzes.length) * 10) / 10
      : null

    const timestamps = [...done.values(), ...userQuizzes.map((q) => q.date)].filter(Boolean).sort()
    const lastActive = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null

    return {
      id: user.id,
      name: user.full_name ?? user.email,
      email: user.email,
      pod: user.pod ?? null,
      overallPct,
      stepsDone,
      stepsTotal,
      modulesDone,
      modulesTotal: path.filter(m => m.total > 0).length,
      quizAverage,
      lastActive,
      pathModules: path.filter(m => m.total > 0),
      clientModules: client.filter(m => m.total > 0),
      quizzes: userQuizzes,
      moduleEmojis: path.filter(m => m.total > 0).map(m => ({ emoji: m.emoji, title: m.title, pct: m.pct, done: m.done })),
    }
  })
}
