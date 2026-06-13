/**
 * TrainHub — Introduction to Claude & Claude Projects Module
 */

const https = require('https');

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';

function sbPost(path, body) {
  return new Promise((res, rej) => {
    const json = JSON.stringify(body);
    const r = https.request({
      hostname: SB_BASE,
      path: '/rest/v1/' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Prefer: 'return=representation',
      },
    }, re => {
      let d = '';
      re.on('data', c => d += c);
      re.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } });
    });
    r.on('error', rej);
    r.write(json);
    r.end();
  });
}

const h2     = text => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
const h3     = text => ({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] });
const para   = text => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const bold   = text => ({ type: 'text', marks: [{ type: 'bold' }], text });
const note   = text => ({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
const bullet = items => ({
  type: 'bulletList',
  content: items.map(item => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: Array.isArray(item) ? item : [{ type: 'text', text: item }] }],
  })),
});
const doc = (...nodes) => ({ type: 'doc', content: nodes, attachments: [] });

const SUBJECT = {
  title:       'Introduction to Claude & AI Tools',
  emoji:       '🤖',
  cover_color: '#7c3aed',
  description: 'How to use Claude AI effectively at GP Bookkeeper — from everyday prompting to our custom Claude Projects.',

  topics: [
    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 1: What is Claude
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'What is Claude?',
      steps: [
        {
          title: 'Claude — GP Bookkeeper\'s AI Assistant',
          content: doc(
            h2('What is Claude?'),
            para('Claude is an AI assistant made by Anthropic. At GP Bookkeeper, we use Claude to save time, improve quality, and get answers faster. Think of it as a highly capable colleague available 24/7 — one who can write, research, summarise, and reason through problems with you.'),
            h2('What Claude is Great At'),
            bullet([
              'Drafting and improving emails — first draft in seconds, you refine it',
              'Summarising long documents, transcripts, or meeting notes',
              'Answering questions about accounting concepts, Australian tax rules, medical billing',
              'Writing SOPs, checklists, and templates from scratch',
              'Explaining complex topics in plain English',
              'Reviewing your work and suggesting improvements',
              'Brainstorming ideas and solving problems step by step',
            ]),
            h2('What Claude is NOT'),
            bullet([
              'It is not connected to the internet by default — it cannot look up live data unless given a tool',
              'It is not always 100% correct — always review important outputs, especially numbers',
              'It is not a replacement for your judgement — use it as a thinking partner, not an authority',
            ]),
            note('Always review Claude\'s output before sending to a client or making a financial decision. AI can make mistakes — your review is the safety net.'),
          ),
        },
        {
          title: 'How to Access Claude',
          content: doc(
            h2('Accessing Claude'),
            bullet([
              'Go to claude.ai and sign in with your work account',
              'Use the main chat interface for one-off questions and tasks',
              'Use Claude Projects (covered in the next topic) for ongoing, context-rich work',
            ]),
            h2('Claude Plans'),
            bullet([
              'Free plan — limited messages per day, access to Claude 3 Haiku',
              'Pro plan — higher usage limits, access to Claude 3.5 Sonnet and Opus (the most capable models)',
              'GP Bookkeeper staff use the Pro plan — ask Ryan if you need access set up',
            ]),
            h2('Choosing the Right Model'),
            bullet([
              'Claude Sonnet — Best balance of speed and capability. Use this for most tasks.',
              'Claude Opus — Most powerful, best for complex reasoning. Use for detailed analysis.',
              'Claude Haiku — Fastest, lightest. Good for quick simple tasks.',
            ]),
            note('When in doubt, use Claude Sonnet. It handles 95% of daily tasks extremely well.'),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 2: Prompting Well
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'How to Get Great Results from Claude',
      steps: [
        {
          title: 'The Art of a Good Prompt',
          content: doc(
            h2('Why Prompting Matters'),
            para('The quality of Claude\'s answer depends almost entirely on the quality of your question. A vague prompt gets a vague answer. A specific, well-structured prompt gets a result you can actually use.'),
            h2('The Simple Formula'),
            bullet([
              [bold('Context: '), { type: 'text', text: 'Who are you? What\'s the situation? (e.g. "I\'m a bookkeeper at an Australian medical practice")' }],
              [bold('Task: '), { type: 'text', text: 'What do you need? Be specific. (e.g. "Write an email to a client explaining why their BAS is delayed")' }],
              [bold('Format: '), { type: 'text', text: 'How should it be structured? (e.g. "Keep it under 150 words, professional but friendly")' }],
              [bold('Constraints: '), { type: 'text', text: 'What to avoid? (e.g. "Don\'t mention the software error that caused it")' }],
            ]),
            h2('Example — Weak vs Strong Prompt'),
            h3('Weak:'),
            para('"Write an email about the BAS"'),
            h3('Strong:'),
            para('"I\'m a bookkeeper at GP Bookkeeper, an Australian medical practice bookkeeping firm. Write a professional email to our client Dr. Smith explaining that their Q1 BAS will be submitted 3 days late due to missing bank statements we\'re still waiting on. Keep it under 120 words, apologetic but confident, and end with a clear next step."'),
            note('The more context you give, the more useful the output. It takes 30 extra seconds to write a better prompt — and saves 10 minutes of editing.'),
          ),
        },
        {
          title: 'Practical Prompts for Bookkeepers',
          content: doc(
            h2('Ready-to-Use Prompt Templates'),
            h3('Drafting a client email:'),
            para('"I\'m a bookkeeper at an Australian medical practice firm. Draft a [type] email to [client/situation]. Tone: professional and friendly. Length: under [X] words."'),
            h3('Explaining something to a client:'),
            para('"Explain [accounting concept] to a non-accountant medical practice owner in simple terms. Use an analogy if helpful. Keep it under 3 paragraphs."'),
            h3('Summarising a document:'),
            para('"Summarise the key points from this [document/transcript] in bullet points. Focus on action items and decisions made."'),
            h3('Reviewing your work:'),
            para('"Review this email/SOP/report I wrote. Point out anything unclear, unprofessional, or missing. Suggest specific improvements."'),
            h3('Learning a concept:'),
            para('"Explain how [Xero feature / Medicare billing / payroll award] works in Australia. I\'m a bookkeeper who already understands the basics."'),
            h2('Tips'),
            bullet([
              'If the first answer isn\'t right, don\'t start over — just say "Make it shorter" or "More formal" or "Add a section on X"',
              'You can paste in a document, email, or transcript and ask Claude to work with it',
              'Use "Think step by step" for complex problems — it forces Claude to slow down and reason carefully',
            ]),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 3: Claude Projects
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Claude Projects — What They Are',
      steps: [
        {
          title: 'What is a Claude Project?',
          content: doc(
            h2('Projects vs Regular Chat'),
            para('A regular Claude chat starts fresh every time — Claude remembers nothing from your last conversation. A Claude Project is different: it gives Claude persistent context that applies to every conversation inside that project.'),
            h2('What Makes Projects Powerful'),
            bullet([
              [bold('System Instructions: '), { type: 'text', text: 'You write a set of rules and context that Claude always follows inside this project' }],
              [bold('Knowledge Base: '), { type: 'text', text: 'You upload documents, files, and reference material Claude can draw from in every chat' }],
              [bold('Persistent Memory: '), { type: 'text', text: 'Claude remembers the conversation history within the project (unlike regular chats which reset)' }],
              [bold('Customised Persona: '), { type: 'text', text: 'You can make Claude behave as a specific assistant (e.g. "You are GP Bookkeeper\'s internal assistant")' }],
            ]),
            h2('The Result'),
            para('Instead of re-explaining your context every time, Claude already knows who you are, what company you work for, what rules apply, and what documents are relevant — every single conversation.'),
            note('Projects are like giving Claude a permanent briefing file. Once set up correctly, you just ask your question and get a contextually accurate answer immediately.'),
          ),
        },
        {
          title: 'Setting Up a Claude Project',
          content: doc(
            h2('How to Create a Project'),
            bullet([
              'Go to claude.ai and click "Projects" in the left sidebar',
              'Click "New Project"',
              'Give it a clear name (e.g. "GP Bookkeeper Hub", "Payroll Assistant")',
              'Add your Project Instructions (the system prompt — explained below)',
              'Upload any knowledge files you want Claude to reference',
              'Start chatting — every conversation in this project uses your instructions and files',
            ]),
            h2('Writing Good Project Instructions'),
            para('Project Instructions are the most important part. They tell Claude:'),
            bullet([
              'Who it is (e.g. "You are an internal assistant for GP Bookkeeper Pty Ltd")',
              'What it knows (company, team, policies, processes)',
              'How to behave (tone, format, what to avoid)',
              'What to do when it doesn\'t know something (escalate to Ryan/Pod Leader)',
              'Any hard rules (e.g. "Never answer payroll questions — direct to Payroll Assistant")',
            ]),
            h2('Uploading Knowledge Files'),
            bullet([
              'Upload PDFs, Word docs, text files, spreadsheets',
              'Claude will reference these when answering questions',
              'Keep files updated — outdated information in the knowledge base leads to outdated answers',
              'Ideal file types: policy documents, SOPs, process guides, team lists, templates',
            ]),
            note('The better your instructions and knowledge files, the more accurate and useful the project becomes. Take time to set it up properly.'),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 4: GP Bookkeeper's Claude Projects
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Our Claude Projects at GP Bookkeeper',
      steps: [
        {
          title: 'GP Bookkeeper Hub',
          content: doc(
            h2('GP Bookkeeper Hub — Internal Company Assistant'),
            para('This is our primary Claude Project. It acts as the official internal virtual assistant for GP Bookkeeper — as if you\'re chatting with the company itself.'),
            h2('What It Knows'),
            bullet([
              'All company policies and procedures',
              'Team structure — all three pods, pod leaders, and team members',
              'Internal processes and service standards',
              'Bookkeeping practices for Australian medical practices',
              'Publicly available company information from gpbookkeeper.com.au',
            ]),
            h2('How to Use It'),
            bullet([
              'Ask it any internal process question: "How do I apply for leave?"',
              'Ask about team structure: "Who is in Ridmal\'s pod?"',
              'Ask about company policy: "What is our email standard for client communication?"',
              'Ask about bookkeeping practices: "How does Medicare billing work?"',
            ]),
            h2('Important Rules'),
            bullet([
              'Do NOT ask it payroll questions — use the Payroll Assistant GPT instead',
              'If it says information is not available, go to Ryan or your Pod Leader',
              'It does not store your personal data or conversation history between sessions',
            ]),
            note('Treat GP Bookkeeper Hub as your first stop for any internal question. It saves you from interrupting your Pod Leader for routine queries.'),
          ),
        },
        {
          title: 'Payroll Assistant',
          content: doc(
            h2('Payroll Assistant GPT'),
            para('A dedicated AI assistant specifically built for payroll questions. Because payroll in Australia involves complex legislation (Fair Work Act, STP, superannuation, awards), a specialist assistant is used rather than the general Hub.'),
            h2('Use This For'),
            bullet([
              'Wages and pay rate questions',
              'Single Touch Payroll (STP) processing queries',
              'Superannuation calculations and compliance',
              'Leave calculations (annual leave, sick leave, long service leave)',
              'Payroll tax questions',
              'Termination pay and entitlements',
              'Fair Work Act questions',
              'Award interpretation (Nurses Award, Health Professionals Award)',
            ]),
            h2('How to Access'),
            para('Ask Ryan or your Pod Leader for the link to the Payroll Assistant GPT if you haven\'t been given access yet.'),
            note('When in doubt about whether something is a "payroll question" — if it involves money paid to an employee in any form, use the Payroll Assistant.'),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 5: Best Practices & Tips
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Best Practices & Daily AI Habits',
      steps: [
        {
          title: 'Using AI Safely at Work',
          content: doc(
            h2('The Golden Rules of AI at GP Bookkeeper'),
            bullet([
              [bold('Always review before sending: '), { type: 'text', text: 'Never send a client email or report written by AI without reading and editing it first' }],
              [bold('No client data in regular chat: '), { type: 'text', text: 'Don\'t paste client financial data, client names, or sensitive records into regular Claude chat. Use approved internal projects only.' }],
              [bold('Verify numbers: '), { type: 'text', text: 'Claude can make mathematical errors. Always verify any figures it produces independently.' }],
              [bold('Use it as a first draft tool: '), { type: 'text', text: 'AI is fastest when used to generate a starting point that you then refine — not a final product.' }],
              [bold('Credit your judgement: '), { type: 'text', text: 'If Claude suggests something that doesn\'t feel right, trust your instincts and your training.' }],
            ]),
            h2('Privacy'),
            bullet([
              'Anthropic (Claude\'s maker) does not use your conversations to train their models if you have a Pro account with privacy settings enabled',
              'Still avoid pasting full client names, TFNs, bank account numbers, or financial records into any AI tool',
              'When unsure if something is sensitive — don\'t paste it',
            ]),
          ),
        },
        {
          title: 'Quick Wins — Claude for Daily Bookkeeping Work',
          content: doc(
            h2('Time-Saving Uses You Can Start Today'),
            h3('Email Drafting'),
            bullet([
              'Paste a client\'s message and ask Claude to draft a professional reply',
              'Ask it to make your draft "shorter", "more formal", or "clearer"',
              'Use it to write difficult emails — chasing overdue documents, explaining an error, delivering bad news professionally',
            ]),
            h3('Document Summarisation'),
            bullet([
              'Paste a long transcript or meeting notes and ask for bullet-point key actions',
              'Upload a policy document and ask "What does this say about [topic]?"',
              'Ask it to extract all action items from a meeting recording transcript',
            ]),
            h3('Learning on the Job'),
            bullet([
              'Ask "How does [Xero feature] work?" for quick answers',
              'Ask "What is the current superannuation rate in Australia?"',
              'Ask "Explain the difference between cash and accrual accounting in simple terms"',
            ]),
            h3('Formatting & Quality'),
            bullet([
              'Paste your work and ask "Is this clear and professional?"',
              'Ask it to format a messy list into a clean table',
              'Ask it to rewrite something in plain English for a client who isn\'t finance-savvy',
            ]),
            note('Start with one task you do every day and try doing it with Claude first. Most people save 20-30 minutes a day once they build the habit.'),
          ),
        },
      ],
    },
  ],
};

async function main() {
  console.log(`Creating: ${SUBJECT.emoji} ${SUBJECT.title}`);

  const subjectRes = await sbPost('subjects', {
    title:       SUBJECT.title,
    emoji:       SUBJECT.emoji,
    cover_color: SUBJECT.cover_color,
    description: SUBJECT.description,
  });
  const subject = Array.isArray(subjectRes) ? subjectRes[0] : subjectRes;
  if (!subject?.id) {
    console.error('Failed:', JSON.stringify(subjectRes).slice(0, 300));
    return;
  }
  console.log(`✓ Subject: ${subject.id}`);

  for (let ti = 0; ti < SUBJECT.topics.length; ti++) {
    const topic = SUBJECT.topics[ti];
    const topicRes = await sbPost('topics', {
      subject_id:  subject.id,
      title:       topic.title,
      order_index: (ti + 1) * 10,
    });
    const topicRow = Array.isArray(topicRes) ? topicRes[0] : topicRes;
    if (!topicRow?.id) { console.error(`Failed topic: ${topic.title}`); continue; }
    console.log(`\n  ✓ Topic [${ti + 1}]: ${topic.title}`);

    for (let si = 0; si < topic.steps.length; si++) {
      const step = topic.steps[si];
      const stepRes = await sbPost('steps', {
        topic_id:    topicRow.id,
        title:       step.title,
        order_index: (si + 1) * 10,
        content:     step.content,
      });
      const stepRow = Array.isArray(stepRes) ? stepRes[0] : stepRes;
      if (stepRow?.id) console.log(`    ✓ Step [${si + 1}]: ${step.title}`);
      else console.error(`    Failed step: ${step.title} — ${JSON.stringify(stepRes).slice(0,150)}`);
    }
  }
  console.log('\n✅ Done!');
}

main().catch(console.error);
