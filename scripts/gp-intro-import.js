/**
 * TrainHub — Introduction to GP Bookkeeper Module
 * Creates a comprehensive sequential KB subject with rich TipTap content.
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

// ── TipTap helpers ────────────────────────────────────────────────────────────

const h2    = text => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
const para  = text => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const bold  = text => ({ type: 'text', marks: [{ type: 'bold' }], text });
const note  = text => ({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
const bullet = items => ({
  type: 'bulletList',
  content: items.map(item => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: Array.isArray(item) ? item : [{ type: 'text', text: item }] }],
  })),
});
const doc = (...nodes) => ({ type: 'doc', content: nodes, attachments: [] });

// ── Module data ───────────────────────────────────────────────────────────────

const SUBJECT = {
  title:       'Introduction to GP Bookkeeper',
  emoji:       '🏢',
  cover_color: '#6366f1',
  description: 'Everything you need to know about GP Bookkeeper — who we are, how we work, our team, tools, and expectations.',

  topics: [
    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 1: Welcome
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Welcome to GP Bookkeeper',
      steps: [
        {
          title: 'Who We Are',
          content: doc(
            h2('Australia\'s First Bookkeeping Service for General Practice'),
            para('GP Bookkeeper Pty Ltd is a specialist bookkeeping firm focused exclusively on general practice medical clinics across Australia. We do not service dental, allied health, or general businesses — our niche is GP medical practices only.'),
            bullet([
              'We provide professional bookkeeping to complement medical accounting services',
              'We are a fully paperless company — all processes run through digital systems and automations',
              'Our goal is to give every client financial clarity, financial control, and a bankable profit',
              'We have been continuously growing since 2022',
            ]),
            note('If you\'re ever unsure about a decision, always reach out to your pod leader rather than guessing. Getting it right matters more than getting it fast.'),
          ),
        },
        {
          title: 'Our Company Family',
          content: doc(
            h2('Scale My Clinic & Our Sister Companies'),
            para('GP Bookkeeper sits within a family of businesses all focused on the general practice sector. Understanding this structure helps you understand the bigger picture.'),
            h2('Scale My Clinic (Parent Company)'),
            para('A business coaching organisation working with 120–130 medical clinic owners across Australia. All other businesses sit beneath it.'),
            h2('Our Sister Companies'),
            bullet([
              'GP Hero — Provides offshore reception staff for medical practices (based in the Philippines)',
              'GP Bookkeeper — That\'s us! Bookkeeping services for general practice only',
              'Clinic Academy — A subscription-based online nursing training program',
            ]),
            note('You may cross-reference with Scale My Clinic and GP Hero teams from time to time. It\'s one connected ecosystem.'),
          ),
        },
        {
          title: 'Our Vision, Framework & Values',
          content: doc(
            h2('The GP Bookkeeper Framework'),
            para('Everything we do is built around three outcomes for our clients:'),
            bullet([
              'Financial Clarity — Reliable reporting and digital dashboards so clients always know where they stand',
              'Financial Control — Systems, automations, and benchmarking to manage cash and costs proactively',
              'Bankable Profit — The end result: a thriving, well-managed medical practice',
            ]),
            h2('How We Deliver This'),
            bullet([
              'Fix the foundation layers — chart of accounts, bank feeds, payroll setup done correctly from day one',
              'Simplified and timely financial reporting every month',
              'Systems and automations to reduce manual work for both us and the client',
              'Benchmarking against industry standards (Touchstone)',
              'Profit First cash management guidance',
            ]),
            h2('Our Thematic Goal — The Century'),
            para('Our current 12-month goal is called "The Century" — achieving 100 active client plans. Everyone\'s work contributes to this target.'),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 2: Leadership & Structure
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Leadership & Reporting Structure',
      steps: [
        {
          title: 'Directors & General Manager',
          content: doc(
            h2('Leadership Team'),
            bullet([
              [bold('Directors: '), { type: 'text', text: 'Todd Cameron and Sachin Patel' }],
              [bold('General Manager: '), { type: 'text', text: 'Ryan Sela' }],
            ]),
            h2('How the Hierarchy Works'),
            para('Directors → General Manager (Ryan) → Pod Leaders → Team Members'),
            bullet([
              'The Directors set the strategic direction of GP Bookkeeper',
              'Ryan (GM) manages day-to-day operations and supports all pods',
              'Pod Leaders manage their team\'s workflow, quality, and client relationships',
              'Team members report directly to their Pod Leader',
            ]),
            note('If you have questions your Pod Leader can\'t answer, escalate to Ryan. Never guess or make assumptions on important matters.'),
          ),
        },
        {
          title: 'Our Three Pods',
          content: doc(
            h2('How We\'re Organised'),
            para('GP Bookkeeper operates in three pods — two based in Sri Lanka and one in the Philippines. Each pod has a dedicated Pod Leader who is your primary point of contact for day-to-day work.'),
            h2('Sri Lanka — MAS Legato Pod'),
            para('Pod Leader: Ridmal Perera'),
            bullet(['Chamal Abeytunga', 'Abdullah Fazeel', 'Thamuditha Dodanwatte', 'Fazeen Fawmy', 'Nidusha Sekar', 'Odara Kalansooriya', 'Ammar Tharick', 'Ranindu Jayathilake']),
            h2('Sri Lanka — Jemajo Pod'),
            para('Pod Leader: Mahesh Kumara'),
            bullet(['Tharushi Atukorala', 'Tania Weerasinghe', 'Kalani Fernando', 'Megha Fernando', 'Anupama Amarasekara']),
            h2('Philippines Pod'),
            para('Pod Leader: Jobelle Abano'),
            bullet(['Luisa', 'Catherine Rose Alforque', 'Eleazar Llorin', 'John Nestor', 'Melody Aquino']),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 3: Services & Client Roadmap
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Our Services & Client Roadmap',
      steps: [
        {
          title: 'What We Do for Clients',
          content: doc(
            h2('Our Core Service: Monthly Bookkeeping'),
            para('Every client engagement includes a structured set of monthly deliverables. These are non-negotiable and must be completed accurately and on time every month.'),
            h2('Monthly Inclusions'),
            bullet([
              'Chart of accounts management',
              'Bank reconciliations',
              'Accounts payable and receivable',
              'Payroll setup and processing (Tanda/Deputy + Employment Hero)',
              'Processing GP payments',
              'Management reports — Profit & Loss and Balance Sheet',
              'Bank account structure management',
            ]),
            h2('Awards We Manage'),
            bullet([
              'Nurses award — Nurses Award (specific award name)',
              'Admin staff — Health Professionals and Support Services Award',
              'These awards update every 1st of July each year',
              'Doctors are not under an award',
            ]),
            note('Always check for the latest award rates before processing payroll. Award rates change on 1 July each year.'),
          ),
        },
        {
          title: 'The Client Roadmap (Q1–Q4)',
          content: doc(
            h2('How We Structure Our Client Engagement'),
            para('Every new client goes through a structured quarterly roadmap. This ensures we build a strong foundation before moving to more advanced services.'),
            h2('Q1 — Foundation'),
            bullet([
              'Onboarding: access setup, chart of accounts, bank feeds',
              'Basic bookkeeping: reconciliations, payroll, GP payments',
              'Streamlining the workflow for timely completion',
            ]),
            h2('Q2 — Reporting'),
            bullet([
              'Monthly P&L and Balance Sheet delivered reliably',
              'Benchmarking against Touchstone industry standards',
              'Financial dashboards set up and live',
            ]),
            h2('Q3 — Procurement'),
            bullet([
              'Cost-saving review (e.g. electricity, insurance, subscriptions)',
              'We have achieved savings of $3,000+ per year for clients through this process',
            ]),
            h2('Q4 — Profit First'),
            bullet([
              'Cash management guidance using Profit First methodology',
              'Optimising bank account structures for cash flow clarity',
            ]),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 4: Tools & Technology
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Tools & Technology Stack',
      steps: [
        {
          title: 'Core Bookkeeping & Finance Tools',
          content: doc(
            h2('Accounting & Document Management'),
            bullet([
              'Xero — Primary accounting software for all clients',
              'Dext (formerly Receipt Bank) — Document capture, supplier rules, and publishing to Xero',
              'Fathom — Reporting and financial dashboards for client management reports',
            ]),
            h2('Phone'),
            bullet([
              'Aircall — Our cloud phone system for client calls and internal calls',
            ]),
            note('You will have dedicated modules on Xero, Dext, Fathom, and Aircall in this Knowledge Base. Complete those after finishing this introduction module.'),
          ),
        },
        {
          title: 'Communication & Collaboration Tools',
          content: doc(
            h2('Email & Client Communication'),
            bullet([
              'Gmail with Hiver — All client email is managed through shared inboxes in Gmail via the Hiver add-on',
              'Hiver allows email assignment, tagging, automations, and internal notes without leaving Gmail',
            ]),
            h2('Internal Communication'),
            bullet([
              'Slack — Primary internal messaging platform for team communication',
              'Zoom — Video meetings and team calls',
              'WhatsApp — Each pod has a WhatsApp group for quick team updates',
              'Loom — Screen recording for training, client walkthroughs, and async updates',
            ]),
            note('If you haven\'t been added to your pod\'s WhatsApp group, let your Pod Leader know immediately.'),
          ),
        },
        {
          title: 'Task Management & Time Tracking',
          content: doc(
            h2('Task & Project Management'),
            bullet([
              'Asana — All client work and internal tasks are managed in Asana',
              'Every client has a dedicated Asana project set up to a specific structure',
              'Your Pod Leader will walk you through your client\'s Asana boards',
            ]),
            h2('Time Tracking'),
            bullet([
              'Hubstaff — Used for time tracking, screenshots, and activity monitoring',
              'You are required to track your time accurately in Hubstaff',
            ]),
            h2('HR & People Tools'),
            bullet([
              'Employment Hero — HR platform for leave requests, contracts, and employee records',
              'Roster Elf — Rostering and scheduling tool',
              'Tanda — Workforce management, timesheets, and payroll integration for clients',
            ]),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 5: Expectations & Culture
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Team Expectations & Culture',
      steps: [
        {
          title: 'What\'s Expected From You',
          content: doc(
            h2('Core Expectations'),
            bullet([
              'Accuracy first — it\'s not about getting tasks done quickly, it\'s about getting them right',
              'If you\'re unsure about a decision, ask your Pod Leader. Never guess on important matters.',
              'Communicate professionally and promptly — with clients, with your team, and with your leaders',
              'Be adaptable — our processes are constantly improving and we expect everyone to grow with them',
              'Be on time — timeliness in reporting and client deliverables is non-negotiable',
            ]),
            h2('Speak Up'),
            para('One of our strongest values is giving everyone a voice. We want to hear from you:'),
            bullet([
              'If you see a better way to do something — say it',
              'If you disagree with an approach — raise it respectfully',
              'If you\'re struggling — let your Pod Leader know early, not late',
              'Every team member\'s ideas are valued, regardless of seniority',
            ]),
            note('Your Pod Leader is here to support you, not just supervise you. Build that relationship early.'),
          ),
        },
        {
          title: 'Leave Entitlements & Work-Life Balance',
          content: doc(
            h2('Your Leave Entitlements'),
            bullet([
              '10 days Annual Leave per year',
              '7 days Sick Leave per year',
              '1 week compulsory shutdown over Christmas (this is in addition to your annual leave)',
              'Australian public holidays are observed',
            ]),
            h2('Applying for Leave'),
            bullet([
              'All leave requests are submitted through Employment Hero',
              'Give as much notice as possible — especially for planned annual leave',
              'Sick leave should be notified to your Pod Leader on the morning of absence',
              'Refer to the Signed Leave Policy document for full details',
            ]),
            h2('Flexibility'),
            para('We believe in a healthy work-life balance. If you\'re finding your workload unmanageable, speak to your Pod Leader. We\'d rather know early so we can help.'),
          ),
        },
        {
          title: 'Team Connection',
          content: doc(
            h2('Staying Connected as a Remote Team'),
            para('Being remote doesn\'t mean being isolated. We\'ve built strong team connection into our culture.'),
            h2('Fun Friday'),
            bullet([
              'We hold Fun Friday every month or every three weeks — a team social session everyone looks forward to',
              'It\'s not just about work. Relationships matter.',
            ]),
            h2('Stay Connected'),
            bullet([
              'Slack — for quick updates and team conversations',
              'WhatsApp group — for your pod (ask your Pod Leader if you haven\'t been added)',
              'Zoom — for team meetings and catch-ups',
            ]),
            note('Connection is a core part of our culture. Show up to team events, engage in Slack, and build relationships with your colleagues across all three pods.'),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 6: Conferences & Events
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'Industry Conferences & Events',
      steps: [
        {
          title: 'Conferences We Attend',
          content: doc(
            h2('GP Bookkeeper\'s Industry Presence'),
            para('Our leaders actively participate in the Australian healthcare and business community through key industry events. This reflects our commitment to staying at the forefront of medical practice management.'),
            h2('Conferences Attended'),
            bullet([
              'PONC (Practice Owners Network Conference)',
              'AAPM (Australian Association of Practice Management)',
              'Xerocon — every 2 years',
              'Digital Health Festival',
              'Scale My Clinic Digital Conference — twice a year',
              'Scale My Clinic Physical Conference — held in October or November each year',
            ]),
            note('These events are where GP Bookkeeper builds relationships with the broader medical practice community. You may hear clients or partners reference these events.'),
          ),
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TOPIC 7: GP Bookkeeper Hub
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: 'GP Bookkeeper Hub — Your Internal Assistant',
      steps: [
        {
          title: 'What is GP Bookkeeper Hub?',
          content: doc(
            h2('Your Internal AI Assistant'),
            para('GP Bookkeeper Hub is the official internal virtual assistant for GP Bookkeeper Pty Ltd. It communicates as if it is the company itself — giving you clear, direct answers in a natural, conversational tone.'),
            h2('What It Can Help With'),
            bullet([
              'Company policies and procedures',
              'Internal processes and guidelines',
              'Service standards and bookkeeping practices for Australian medical practices',
              'Team structure and reporting lines (current as of last update)',
              'Approved company information and publicly available details',
            ]),
            h2('What It Cannot Do'),
            bullet([
              'It will not answer payroll questions — use the "Payroll Assistant" GPT for all payroll queries (wages, STP, super, leave calculations, Fair Work)',
              'It does not store personal employee data or client financial records',
              'It does not retain conversation history between sessions',
              'It cannot access external systems or live databases independently',
            ]),
          ),
        },
        {
          title: 'How to Use the Hub Effectively',
          content: doc(
            h2('Getting the Best Answers'),
            bullet([
              'Ask short, specific questions — the Hub gives concise answers by design',
              'If an answer seems unclear, ask the Hub to explain further',
              'For team structure or reporting line questions, check the date the information was last updated',
              'For anything related to publicly available GP Bookkeeper information, it aligns with gpbookkeeper.com.au',
            ]),
            h2('When to Escalate Instead'),
            bullet([
              'If the Hub says information is not available — go directly to Ryan or your Pod Leader',
              'Never rely on the Hub for payroll-related matters — always use the Payroll Assistant GPT',
              'For urgent or sensitive client issues, always speak to your Pod Leader directly',
            ]),
            h2('Payroll Queries'),
            para('For any payroll question — wages, STP, superannuation, leave calculations, payroll tax, terminations, or Fair Work matters — use the dedicated Payroll Assistant GPT. Do not ask GP Bookkeeper Hub for payroll answers.'),
            note('The Hub is a support tool, not a replacement for your Pod Leader. When in doubt, always talk to a person.'),
          ),
        },
      ],
    },
  ],
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Creating subject: ${SUBJECT.emoji} ${SUBJECT.title}`);

  const subjectRes = await sbPost('subjects', {
    title:       SUBJECT.title,
    emoji:       SUBJECT.emoji,
    cover_color: SUBJECT.cover_color,
    description: SUBJECT.description,
  });
  const subject = Array.isArray(subjectRes) ? subjectRes[0] : subjectRes;
  if (!subject?.id) {
    console.error('Failed to create subject:', JSON.stringify(subjectRes).slice(0, 300));
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
    if (!topicRow?.id) {
      console.error(`Failed to create topic "${topic.title}":`, JSON.stringify(topicRes).slice(0, 200));
      continue;
    }
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
      if (!stepRow?.id) {
        console.error(`  Failed to create step "${step.title}":`, JSON.stringify(stepRes).slice(0, 200));
      } else {
        console.log(`    ✓ Step [${si + 1}]: ${step.title}`);
      }
    }
  }

  console.log('\n\n✅ Introduction to GP Bookkeeper module created!');
  console.log(`   Subject ID: ${subject.id}`);
}

main().catch(console.error);
