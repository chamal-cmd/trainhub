// Edge runtime: supports streaming + no 10s Lambda timeout on Netlify
export const runtime = 'edge'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const BASE_PROMPT = `You are a helpful, friendly AI assistant built into TrainHub — a training platform for a bookkeeping team at a company called GP (General Practice). Your role is to help team members quickly find information, understand their training materials, and get answers about their responsibilities and company policies.

Key facts about this platform:
- It is used by ~30 bookkeepers across 3 pods: MAS Legato (led by Ridmal), Jemajo (led by Mahesh), and Philippines (led by Jobelle)
- Training modules cover topics like Xero, Dext, Fathom, payroll, reconciliation, client onboarding, and other bookkeeping workflows
- Users can track their completion progress and are assigned modules by their administrator
- Software tools used include: Xero, Dext Prepare, Fathom, Asana, Slack, Microsoft 365, Hiver, Hubdoc, Google Workspace, QuickBooks

When answering any question, follow these steps in order:
1. **Read the knowledge base documents first** — before forming any answer, scan every document in the Company Knowledge Base section below for relevant information
2. **Base your answer on those documents** — if the documents contain relevant content, quote or summarise directly from them and cite the document name (e.g. "According to [Document Name]...")
3. **Only go beyond the documents** if the question is not covered at all — in that case, use your general knowledge and note that the answer is not in the uploaded documents
4. If a question is about policies, procedures, or workflows and the documents don't cover it, tell the user which document would be the right place to look, or suggest they ask their team lead or administrator

General guidelines:
- Be concise and direct — one to three short paragraphs at most
- Use a warm, professional tone — you're a knowledgeable colleague, not a formal helpdesk
- Never fabricate policies or procedures — only state what is in the documents or is general knowledge`

const MAX_FILE_CHARS = 8_000
const MAX_HISTORY_MESSAGES = 10
const MAX_KB_FILES = 4 // max files to include even if many match

// Score a KB file against the user's query using word overlap
function scoreFile(query: string, name: string, content: string): number {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2) // ignore short stop words

  const haystack = (name + ' ' + content).toLowerCase()
  return words.reduce((score, word) => {
    // name matches count more than body matches
    if (name.toLowerCase().includes(word)) return score + 3
    if (haystack.includes(word)) return score + 1
    return score
  }, 0)
}

function selectRelevantFiles(
  files: { name: string; content: string }[],
  query: string,
): { name: string; content: string }[] {
  const scored = files
    .map(f => ({ f, score: scoreFile(query, f.name, f.content) }))
    .sort((a, b) => b.score - a.score)

  // Always include files that scored > 0; fall back to top MAX_KB_FILES if nothing matched
  const matched = scored.filter(x => x.score > 0).slice(0, MAX_KB_FILES)
  return (matched.length > 0 ? matched : scored.slice(0, MAX_KB_FILES)).map(x => x.f)
}

export async function POST(req: NextRequest) {
  const { messages, userContext } = await req.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI assistant is not configured. Please add ANTHROPIC_API_KEY to your environment.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Fetch knowledge base files
  let knowledgeSection = ''
  try {
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: kbFiles, error } = await admin
      .from('knowledge_files')
      .select('name, content')
      .order('created_at', { ascending: true })

    if (error) console.error('Knowledge base fetch error:', error.message)

    if (kbFiles?.length) {
      // Extract the latest user query for word matching
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? ''
      const relevant = selectRelevantFiles(kbFiles, lastUserMsg)

      console.log(`KB: ${kbFiles.length} total files, ${relevant.length} matched for query: "${lastUserMsg.slice(0, 60)}"`)

      knowledgeSection = '\n\n---\n## Company Knowledge Base\nThe following documents are relevant to this question. Use them to answer accurately:\n\n'
      for (const f of relevant) {
        const content = f.content.length > MAX_FILE_CHARS
          ? f.content.slice(0, MAX_FILE_CHARS) + '\n[...truncated]'
          : f.content
        knowledgeSection += `### ${f.name}\n${content}\n\n`
      }
      knowledgeSection += '---'
    }
  } catch (e: any) {
    console.error('Knowledge base error:', e.message)
  }

  const client = new Anthropic()

  // Build final system prompt (single string — most compatible with edge runtime)
  const fullSystem = BASE_PROMPT
    + (knowledgeSection || '')
    + (userContext ? `\n\nContext about the current user: ${userContext}` : '')

  // Trim history to last N messages to avoid unbounded token growth
  const trimmedMessages = messages.slice(-MAX_HISTORY_MESSAGES)

  const stream = await client.messages.stream({
    model: 'claude-3-5-haiku-20241022',  // confirmed valid model — fast + cheap
    max_tokens: 1024,
    system: fullSystem,
    messages: trimmedMessages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
