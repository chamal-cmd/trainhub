import { NextRequest, NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Verify JWT token with Supabase ──────────────────────────────────────────
async function verifyUser(token: string): Promise<string | null> {
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${token}` },
  })
  if (!r.ok) return null
  const user = await r.json()
  return user?.id ?? null
}

// ── Extract plain text from TipTap JSONB content ────────────────────────────
function extractText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.text) return node.text as string
  if (Array.isArray(node)) return node.map(extractText).join(' ')
  if (node.content) return extractText(node.content)
  return ''
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    const userId = await verifyUser(token)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { topicId } = await req.json()
    if (!topicId) return NextResponse.json({ error: 'topicId required' }, { status: 400 })

    // Fetch the topic (with existing ai_quiz and steps)
    const topicRes = await fetch(
      `${SB_URL}/rest/v1/topics?id=eq.${topicId}&select=id,title,ai_quiz,steps(id,title,content,order_index)&limit=1`,
      { headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` } }
    )
    const topics = await topicRes.json()
    const topic = Array.isArray(topics) ? topics[0] : null
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    // Return cached quiz if already generated
    if (topic.ai_quiz?.questions?.length > 0) {
      return NextResponse.json({ quiz: topic.ai_quiz })
    }

    // Build training content from steps
    const steps: any[] = (topic.steps ?? []).sort((a: any, b: any) => a.order_index - b.order_index)
    const contentText = steps
      .map((s: any) => {
        const bodyText = extractText(s.content).replace(/\s+/g, ' ').trim()
        return bodyText ? `### ${s.title}\n${bodyText}` : `### ${s.title}`
      })
      .join('\n\n')
      .trim()

    if (!contentText) {
      return NextResponse.json({ error: 'No content to generate quiz from' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI not configured — add ANTHROPIC_API_KEY' }, { status: 503 })

    // ── Call Claude Haiku to generate questions ──────────────────────────────
    const prompt = `You are generating a knowledge-check quiz for a training platform.

Read the training content below and create exactly 5 multiple-choice questions. Return ONLY valid JSON — no markdown fences, no explanation text, nothing else.

Required JSON format:
{
  "questions": [
    {
      "question_text": "Write the question here",
      "explanation": "One or two sentences explaining the correct answer",
      "correct_index": 0,
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}

Requirements:
- Exactly 5 questions
- Exactly 4 options each
- correct_index is 0, 1, 2, or 3
- Questions should test real comprehension, not just surface recall
- Explanations should be helpful and educational
- Keep all text concise and professional

Training content for: "${topic.title}"
---
${contentText.slice(0, 4500)}
---`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      return NextResponse.json({ error: `AI error: ${claudeRes.status} — ${err.slice(0, 200)}` }, { status: 502 })
    }

    const claudeData = await claudeRes.json()
    const responseText = (claudeData.content ?? []).find((b: any) => b.type === 'text')?.text ?? ''

    // Parse JSON — be lenient in case Claude wrapped it in markdown
    let generated: any
    const jsonStr = responseText.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonStr) return NextResponse.json({ error: 'AI returned non-JSON response' }, { status: 500 })
    try { generated = JSON.parse(jsonStr) } catch {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 })
    }

    if (!Array.isArray(generated?.questions) || generated.questions.length === 0) {
      return NextResponse.json({ error: 'AI returned no questions' }, { status: 500 })
    }

    const quiz = {
      generated_at: new Date().toISOString(),
      passing_score: 80,
      questions: generated.questions.slice(0, 5),
    }

    // ── Persist to topics.ai_quiz ────────────────────────────────────────────
    await fetch(`${SB_URL}/rest/v1/topics?id=eq.${topicId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SVC,
        'Authorization': `Bearer ${SVC}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ai_quiz: quiz }),
    })

    return NextResponse.json({ quiz })
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
