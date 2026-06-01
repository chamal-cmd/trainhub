import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE_PROMPT = `You are a helpful, friendly AI assistant built into TrainHub — a training platform for a bookkeeping team at a company called GP (General Practice). Your role is to help team members quickly find information, understand their training materials, and get answers about their responsibilities and company policies.

Key facts about this platform:
- It is used by ~30 bookkeepers across 3 pods: MAS Legato (led by Ridmal), Jemajo (led by Mahesh), and Philippines (led by Jobelle)
- Training modules cover topics like Xero, Dext, Fathom, payroll, reconciliation, client onboarding, and other bookkeeping workflows
- Users can track their completion progress and are assigned modules by their administrator
- Software tools used include: Xero, Dext Prepare, Fathom, Asana, Slack, Microsoft 365, Hiver, Hubdoc, Google Workspace, QuickBooks

When answering:
- Be concise and direct — one to three short paragraphs at most
- If a question is answered by the knowledge base documents below, use that information
- If asked about policies or procedures not in the documents, suggest they check with their team lead or administrator
- Use a warm, professional tone — you're a knowledgeable colleague, not a formal helpdesk`

export async function POST(req: NextRequest) {
  const { messages, userContext } = await req.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI assistant is not configured. Please add ANTHROPIC_API_KEY to your environment.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Fetch knowledge base files to include as context
  let knowledgeSection = ''
  try {
    const supabase = await createClient()
    const { data: kbFiles } = await supabase
      .from('knowledge_files')
      .select('name, content')
      .order('created_at', { ascending: true })

    if (kbFiles?.length) {
      knowledgeSection = '\n\n---\n## Company Knowledge Base\nThe following documents have been uploaded by your administrator. Use them to answer questions accurately:\n\n'
      for (const f of kbFiles) {
        knowledgeSection += `### ${f.name}\n${f.content}\n\n`
      }
      knowledgeSection += '---'
    }
  } catch {
    // Knowledge base fetch failed silently — AI still works without it
  }

  const client = new Anthropic()

  const SYSTEM_PROMPT = BASE_PROMPT + knowledgeSection

  // Append user context to system prompt if provided
  const systemWithContext = userContext
    ? `${SYSTEM_PROMPT}\n\nContext about the current user: ${userContext}`
    : SYSTEM_PROMPT

  const stream = await client.messages.stream({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: systemWithContext,
    messages,
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
