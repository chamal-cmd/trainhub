/**
 * add-google-slack-modules.js
 * Creates new Google Workspace and Slack modules with official training resources.
 */

const https = require('https');

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';
const ADMIN   = 'ba75f37f-e8ce-4c70-b9b6-8e2c09c4c81f';

function req(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : undefined;
    const options = {
      hostname: SB_BASE,
      path: '/rest/v1/' + path,
      method,
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Accept: 'application/json' },
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Prefer'] = 'return=representation';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const r = https.request(options, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

const get  = path => req('GET', path);
const post = (path, data) => req('POST', path, data);

const text = (t, marks = []) => ({ type: 'text', text: t, ...(marks.length ? { marks } : {}) });
const bold = t => text(t, [{ type: 'bold' }]);
const link = (t, href) => text(t, [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }]);
const p    = (...content) => ({ type: 'paragraph', content });
const h2   = t => ({ type: 'heading', attrs: { level: 2 }, content: [text(t)] });
const h3   = t => ({ type: 'heading', attrs: { level: 3 }, content: [text(t)] });
const bq   = t => ({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: t }] }] });
const li   = (...content) => ({ type: 'listItem', content: [{ type: 'paragraph', content }] });
const ul   = items => ({ type: 'bulletList', content: items });
const doc  = (...nodes) => ({ type: 'doc', content: nodes });

const MODULES = [
  {
    title: 'Google Workspace',
    emoji: '🔵',
    cover_color: '#1a73e8',
    description: 'Gmail, Drive, Docs, Sheets, Meet and the full Google productivity suite used by the GP Bookkeeper team.',
    topics: [
      {
        title: 'Overview',
        steps: [
          {
            title: 'What is Google Workspace?',
            content: doc(
              h2('Google Workspace at GP Bookkeeper'),
              p(text('Google Workspace is our cloud productivity platform — covering Gmail, Google Drive, Docs, Sheets, Slides, and Google Meet.')),
              h3('Core Tools We Use'),
              ul([
                li(bold('Gmail'), text(' — all email communication with clients and the team')),
                li(bold('Google Drive'), text(' — shared file storage and document collaboration')),
                li(bold('Google Docs'), text(' — proposals, reports, internal documentation')),
                li(bold('Google Sheets'), text(' — data tracking, checklists, reporting')),
                li(bold('Google Meet'), text(' — client video calls and team meetings')),
              ]),
              bq('All team files live in shared Google Drive folders — never save work locally only.'),
            ),
          },
        ],
      },
      {
        title: 'Official Training & Certification',
        steps: [
          {
            title: 'Google Workspace — Training & Certification',
            content: doc(
              h2('Official Google Workspace Training'),
              p(text('Google provides free learning resources for all Workspace apps through their training hub and Learning Centre.')),
              h3('Training Portals'),
              ul([
                li(link('Google Workspace Training Hub', 'https://workspace.google.com/training/')),
                li(link('Google Workspace Learning Centre (end-user guides)', 'https://support.google.com/a/users')),
              ]),
              h3('Certification'),
              ul([
                li(bold('Associate Google Workspace Administrator'), text(' — covers admin console, security, domains, and user management')),
                li(link('Certification path at skills.google', 'https://www.skills.google/paths/24')),
              ]),
              h3('Recommended Starting Points'),
              ul([
                li(text('Gmail basics and keyboard shortcuts')),
                li(text('Google Drive file organisation and sharing')),
                li(text('Google Sheets for client reporting')),
                li(text('Google Meet for video calls')),
              ]),
              bq('The Learning Centre is searchable by app — bookmark it as your go-to reference.'),
            ),
          },
        ],
      },
    ],
  },
  {
    title: 'Slack',
    emoji: '💬',
    cover_color: '#4A154B',
    description: 'Team messaging platform used for day-to-day communication, client updates, and quick collaboration across pods.',
    topics: [
      {
        title: 'Overview',
        steps: [
          {
            title: 'How We Use Slack',
            content: doc(
              h2('Slack at GP Bookkeeper'),
              p(text('Slack is our primary internal communication tool. We use it for team messages, pod-specific channels, and quick questions that do not need an email.')),
              h3('Key Channels'),
              ul([
                li(bold('#general'), text(' — company-wide announcements')),
                li(bold('#team'), text(' — day-to-day team chat')),
                li(bold('Pod channels'), text(' — Legato, Jemajo, Philippines pod discussions')),
              ]),
              h3('Best Practices'),
              ul([
                li(text('Use threads to keep conversations tidy')),
                li(text('Set your status when in a client call or unavailable')),
                li(text('Use @mentions for anything time-sensitive')),
                li(text('Keep client-sensitive information off public channels')),
              ]),
              bq('Email is for clients. Slack is for the team.'),
            ),
          },
        ],
      },
      {
        title: 'Official Training & Certification',
        steps: [
          {
            title: 'Slack — Training & Certification',
            content: doc(
              h2('Official Slack Training'),
              p(text('Slack offers a free introductory workshop and a paid admin certification for power users.')),
              h3('Free — Slack 101 Workshop'),
              ul([
                li(link('Slack Workshop 101 (60 minutes, on-demand)', 'https://slack.com/events/workshop-101')),
                li(text('Covers: channels, messages, notifications, apps, and daily use')),
                li(text('Ideal for all new team members')),
              ]),
              h3('Paid — Slack Certified Administrator'),
              ul([
                li(text('Cost: $300 USD (includes prep course + 2 exam attempts)')),
                li(link('Become a Slack Certified Administrator', 'https://slack.com/resources/slack-for-admins/become-a-slack-certified-administrator')),
                li(text('Covers: workspace setup, permissions, security, integrations')),
              ]),
              h3('All Certifications'),
              p(link('slack.com/slack-certified', 'https://slack.com/slack-certified')),
              bq('Start with the free Workshop 101 — it covers everything needed for daily use.'),
            ),
          },
        ],
      },
    ],
  },
];

async function main() {
  const existing = await get('subjects?select=title');
  const existingTitles = (Array.isArray(existing) ? existing : []).map(s => s.title.toLowerCase());

  for (const mod of MODULES) {
    if (existingTitles.includes(mod.title.toLowerCase())) {
      console.log(`⚠️  "${mod.title}" already exists — skipping`);
      continue;
    }

    console.log(`\n→ Creating subject "${mod.title}"...`);
    const subResult = await post('subjects', {
      title: mod.title,
      description: mod.description,
      emoji: mod.emoji,
      cover_color: mod.cover_color,
      created_by: ADMIN,
      order_index: 999,
    });

    const sub = Array.isArray(subResult) ? subResult[0] : subResult;
    if (!sub || !sub.id) { console.error('  ✗ Failed:', subResult); continue; }
    console.log(`  ✓ Subject created (${sub.id})`);

    for (let ti = 0; ti < mod.topics.length; ti++) {
      const topic = mod.topics[ti];
      const topicResult = await post('topics', {
        subject_id: sub.id,
        title: topic.title,
        order_index: (ti + 1) * 10,
      });
      const t = Array.isArray(topicResult) ? topicResult[0] : topicResult;
      if (!t || !t.id) { console.error('  ✗ Topic failed:', topicResult); continue; }
      console.log(`  ✓ Topic: "${topic.title}" (${t.id})`);

      for (let si = 0; si < topic.steps.length; si++) {
        const step = topic.steps[si];
        const stepResult = await post('steps', {
          topic_id: t.id,
          title: step.title,
          order_index: (si + 1) * 10,
          content: step.content,
        });
        const s = Array.isArray(stepResult) ? stepResult[0] : stepResult;
        if (!s || !s.id) { console.error('  ✗ Step failed:', stepResult); continue; }
        console.log(`  ✓   Step: "${step.title}" (${s.id})`);
      }
    }
  }

  console.log('\n✅ Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
