// ─────────────────────────────────────────────────────────────────────────────
// TrainHub AI Engine — rule-based assistant powered by live Supabase data
// No external API key required.
// ─────────────────────────────────────────────────────────────────────────────

export interface AiContext {
  userName: string
  userRole: string
  completionRate: number
  modules: {
    id: string
    title: string
    emoji: string
    percent: number
    total: number
    completed: number
    readMins: number
  }[]
  tools: {
    name: string
    emoji: string
    category: string
    description: string | null
    website_url: string | null
  }[]
}

// ── Keyword helper ─────────────────────────────────────────────────────────────

function has(q: string, ...words: string[]) {
  return words.some(w => q.includes(w))
}

// ── Response generators ────────────────────────────────────────────────────────

function progressResponse(ctx: AiContext): string {
  const done    = ctx.modules.filter(m => m.percent === 100)
  const inProg  = ctx.modules.filter(m => m.percent > 0 && m.percent < 100)
  const notYet  = ctx.modules.filter(m => m.percent === 0)

  if (ctx.modules.length === 0) {
    return `Hi ${ctx.userName}! You don't have any modules assigned yet. Your administrator will assign training to you soon.`
  }

  let msg = `Your overall training completion is **${ctx.completionRate}%**.\n\n`

  if (done.length > 0) {
    msg += `✅ **Completed (${done.length}):** ${done.map(m => m.title).join(', ')}\n\n`
  }
  if (inProg.length > 0) {
    msg += `🔄 **In progress (${inProg.length}):**\n${inProg.map(m => `• ${m.title} — ${m.percent}%`).join('\n')}\n\n`
  }
  if (notYet.length > 0) {
    msg += `📋 **Not started (${notYet.length}):** ${notYet.map(m => m.title).join(', ')}`
  }

  return msg.trim()
}

function toolsResponse(ctx: AiContext, q: string): string {
  if (ctx.tools.length === 0) {
    return 'No tools have been added to your account yet. Ask your administrator to add them.'
  }

  // Check if asking about a specific tool
  const specificTool = ctx.tools.find(t => q.includes(t.name.toLowerCase()))
  if (specificTool) {
    return `**${specificTool.emoji} ${specificTool.name}** (${specificTool.category})\n\n${specificTool.description ?? 'No description available.'}\n\n${specificTool.website_url ? `🔗 ${specificTool.website_url}` : ''}`
  }

  // Group by category
  const byCategory = new Map<string, typeof ctx.tools>()
  for (const t of ctx.tools) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, [])
    byCategory.get(t.category)!.push(t)
  }

  let msg = `Your team uses **${ctx.tools.length} tools** across ${byCategory.size} categories:\n\n`
  for (const [cat, tools] of byCategory) {
    msg += `**${cat}:** ${tools.map(t => `${t.emoji} ${t.name}`).join(', ')}\n`
  }
  msg += `\nAsk me about any specific tool for more details.`
  return msg.trim()
}

function modulesResponse(ctx: AiContext): string {
  if (ctx.modules.length === 0) {
    return "You don't have any training modules assigned yet. Check back soon or speak to your administrator."
  }

  const total = ctx.modules.reduce((s, m) => s + m.total, 0)
  const done  = ctx.modules.reduce((s, m) => s + m.completed, 0)

  let msg = `You have **${ctx.modules.length} modules** assigned with **${total} steps** total (${done} completed).\n\n`
  msg += ctx.modules
    .map(m => {
      const bar = m.percent === 100 ? '✅' : m.percent > 0 ? '🔄' : '⬜'
      return `${bar} **${m.title}** — ${m.percent}% (${m.readMins} min)`
    })
    .join('\n')

  return msg.trim()
}

function responsibilitiesResponse(ctx: AiContext): string {
  const inProg = ctx.modules.filter(m => m.percent > 0 && m.percent < 100)
  const notYet = ctx.modules.filter(m => m.percent === 0)

  let msg = `As a **${ctx.userRole}** at GP, your main responsibility is to complete your assigned training and apply those skills to your bookkeeping work.\n\n`

  if (inProg.length > 0) {
    msg += `**Your current priority** is to finish modules in progress:\n`
    msg += inProg.map(m => `• ${m.title} (${m.percent}% done)`).join('\n')
    msg += '\n\n'
  }

  if (notYet.length > 0) {
    msg += `**Upcoming training:**\n`
    msg += notYet.map(m => `• ${m.title}`).join('\n')
    msg += '\n\n'
  }

  msg += `Your team also uses tools like ${ctx.tools.slice(0, 3).map(t => t.name).join(', ')} — check the Software & Tools page for the full list.`
  return msg.trim()
}

function teamResponse(): string {
  return `GP's bookkeeping team is organised into **3 pods**:\n\n` +
    `• **MAS Legato** — led by Ridmal\n` +
    `• **Jemajo** — led by Mahesh\n` +
    `• **Philippines** — led by Jobelle\n\n` +
    `The team has around 30 members in total. Reach out to your pod lead for team-specific questions.`
}

function xeroResponse(): string {
  return `**Xero** is your main cloud-based accounting platform. It's used for:\n\n` +
    `• Client account management & reconciliation\n` +
    `• Payroll processing\n` +
    `• Financial reporting\n` +
    `• Receiving documents published from Dext Prepare\n\n` +
    `Check your Library for Xero training modules, and visit xero.com for official guides.`
}

function dextResponse(): string {
  return `**Dext Prepare** (formerly Receipt Bank) is your data capture tool. It:\n\n` +
    `• Automatically extracts data from receipts, invoices and bank statements\n` +
    `• Publishes documents directly into Xero\n` +
    `• Saves time on manual data entry\n\n` +
    `Your Library may have a Dext training module — check there for step-by-step instructions.`
}

function greetingResponse(ctx: AiContext): string {
  const firstName = ctx.userName.split(' ')[0]
  const inProg = ctx.modules.filter(m => m.percent > 0 && m.percent < 100)

  let msg = `Hi ${firstName}! 👋 Your training is at **${ctx.completionRate}%** overall.`

  if (inProg.length > 0) {
    msg += ` You have ${inProg.length} module${inProg.length > 1 ? 's' : ''} in progress — keep it up!`
  }

  msg += `\n\nHere are some things you can ask me:\n• "What tools do we use?"\n• "Show my training progress"\n• "What modules do I have?"\n• "Tell me about Xero"`
  return msg
}

function fallbackResponse(query: string): string {
  const q = query.trim()
  return `I don't have specific information about "${q}" in your account data.\n\n` +
    `Here's what I **can** help you with:\n` +
    `• Your training progress & completion rate\n` +
    `• Your assigned modules & steps\n` +
    `• Software & tools your team uses\n` +
    `• Your responsibilities as a bookkeeper\n` +
    `• Team pod structure\n\n` +
    `For policy questions like PTO, speak to your team lead or check your company's HR documentation.`
}

// ── Main process function ─────────────────────────────────────────────────────

export function processQuery(query: string, ctx: AiContext): string {
  const q = query.toLowerCase().trim()

  // Greetings
  if (has(q, 'hello', 'hi ', 'hey', 'howdy', 'good morning', 'good afternoon'))
    return greetingResponse(ctx)

  // Progress / completion
  if (has(q, 'completion', 'complete', 'progress', 'percent', '%', 'how far', 'how much', 'done', 'finish', 'my training'))
    return progressResponse(ctx)

  // Specific tools
  if (has(q, 'xero')) return xeroResponse()
  if (has(q, 'dext', 'receipt bank')) return dextResponse()

  // Tools / software general
  if (has(q, 'tool', 'software', 'app', 'platform', 'program', 'system', 'fathom', 'asana', 'slack', 'hubdoc', 'hiver', 'quickbook', 'microsoft', 'google workspace'))
    return toolsResponse(ctx, q)

  // Modules / training
  if (has(q, 'module', 'course', 'subject', 'topic', 'lesson', 'assigned', 'assignment', 'training', 'learn', 'study', 'library'))
    return modulesResponse(ctx)

  // Responsibilities / role
  if (has(q, 'responsib', 'role', 'duty', 'duties', 'job', 'task', 'what should i', 'what do i', 'what am i'))
    return responsibilitiesResponse(ctx)

  // Team
  if (has(q, 'team', 'pod', 'colleague', 'who is', 'who are', 'ridmal', 'mahesh', 'jobelle', 'legato', 'jemajo', 'philippines'))
    return teamResponse()

  // Fallback
  return fallbackResponse(query)
}
