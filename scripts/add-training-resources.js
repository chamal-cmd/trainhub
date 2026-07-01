/**
 * add-training-resources.js
 * Adds "Official Training & Certification" topic to existing tool modules in TrainHub.
 * Run: node scripts/add-training-resources.js
 */

const https = require('https');

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';

function req(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : undefined;
    const options = {
      hostname: SB_BASE,
      path: '/rest/v1/' + path,
      method,
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Accept: 'application/json',
      },
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

// ── TipTap helpers ─────────────────────────────────────────────────────────────

const text  = (t, marks = []) => ({ type: 'text', text: t, ...(marks.length ? { marks } : {}) });
const bold  = t => text(t, [{ type: 'bold' }]);
const link  = (t, href) => text(t, [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }]);
const p     = (...content) => ({ type: 'paragraph', content });
const h2    = t => ({ type: 'heading', attrs: { level: 2 }, content: [text(t)] });
const h3    = t => ({ type: 'heading', attrs: { level: 3 }, content: [text(t)] });
const bq    = t => ({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: t }] }] });
const li    = (...content) => ({ type: 'listItem', content: [{ type: 'paragraph', content }] });
const ul    = items => ({ type: 'bulletList', content: items });
const doc   = (...nodes) => ({ type: 'doc', content: nodes });

// ── Training resource definitions ──────────────────────────────────────────────

const TRAINING = [
  {
    // matches subjects whose title contains "Aircall"
    keyword: 'aircall',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Aircall Learn — Training Portal',
    content: doc(
      h2('Official Aircall Training'),
      p(text('Aircall provides a dedicated learning platform at '), link('learn.aircall.com', 'https://learn.aircall.com'), text('.')),
      bq('You need to log in with your Aircall account to access courses.'),
      h3('Learning Paths'),
      ul([
        li(bold('Agent Learning Path'), text(' — covers call handling, the softphone, and daily workflows')),
        li(bold('Admin Learning Path'), text(' — covers number setup, IVR, teams, integrations, and analytics')),
      ]),
      h3('Your Direct Link'),
      p(text('Access your team\'s assigned learning path here: '), link('Open Learning Path →', 'https://learn.aircall.com/app/learning_paths/fd8fcca6-d61e-4e68-9d29-7767284ca729')),
      h3('Certifications'),
      ul([
        li(text('✅ Aircall Agent Certificate')),
        li(text('✅ Aircall Admin Certificate')),
      ]),
    ),
  },
  {
    keyword: 'dext',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Dext U — Certification Programme',
    content: doc(
      h2('Official Dext Training'),
      p(text('Dext offers a structured certification programme called '), bold('Dext U'), text(' — free for partner firms (that\'s us).')),
      h3('Training Portal'),
      p(link('dext.com/en/partner/certification-dext-u', 'https://dext.com/en/partner/certification-dext-u')),
      h3('Three Certification Levels'),
      ul([
        li(bold('Dext Certified'), text(' — core data capture and processing')),
        li(bold('Dext Certified Advanced'), text(' — workflow automation and integrations')),
        li(bold('Dext Certified Expert'), text(' — full platform mastery, partner-level')),
      ]),
      p(text('Each level earns a digital badge. Total time under 3 hours for all three.')),
      h3('Additional Resources'),
      ul([
        li(link('Getting Started with Dext', 'https://dext.com/en/resources/dext-training/getting-started')),
        li(link('Live & On-Demand Training Sessions (weekly)', 'https://help.dext.com/en/articles/416672-live-and-on-demand-training')),
      ]),
      bq('Aim to reach Dext Certified within your first two weeks.'),
    ),
  },
  {
    keyword: 'xero',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Xero Learning Central — Certifications',
    content: doc(
      h2('Official Xero Training'),
      p(text('Xero provides a full learning platform at '), link('learning.central.xero.com', 'https://learning.central.xero.com'), text('.')),
      h3('Certification Tiers'),
      ul([
        li(bold('L1 — Xero Associate'), text(': foundation courses, getting started with Xero')),
        li(bold('L2 — Xero Professional'), text(': reconciliation, reporting, advanced features')),
        li(bold('L3 — Xero Specialist'), text(': full advisory-level certification')),
      ]),
      h3('Specialist Badges'),
      ul([
        li(text('Payroll Specialist')),
        li(text('Migration Specialist')),
        li(text('Tax Specialist')),
        li(text('Inventory Plus Specialist')),
      ]),
      h3('Links'),
      ul([
        li(link('Xero Learning Central (start here)', 'https://learning.central.xero.com')),
        li(link('All Xero Certifications', 'https://www.xero.com/au/certifications/')),
      ]),
      bq('All team members should reach at least Xero Professional (L2).'),
    ),
  },
  {
    keyword: 'asana',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Asana Academy — Free Certifications',
    content: doc(
      h2('Official Asana Training'),
      p(text('Asana Academy at '), link('academy.asana.com', 'https://academy.asana.com'), text(' offers free certifications (normally $299 USD — currently free for a limited time).')),
      h3('Certifications Available'),
      ul([
        li(bold('Workflow Specialist Certificate'), text(' — 8–10 hrs, 60-question exam, 80% pass mark')),
        li(bold('Asana Administrator Certificate'), text(' — admin setup, permissions, templates')),
      ]),
      h3('Skill Badges'),
      ul([
        li(text('Asana Foundations')),
        li(text('AI for Work')),
        li(text('AI Studio Foundations')),
        li(text('Campaign Management')),
        li(text('Resource Management')),
      ]),
      h3('Links'),
      ul([
        li(link('Browse All Courses', 'https://academy.asana.com/page/all-courses')),
        li(link('Workflow Specialist Certificate', 'https://academy.asana.com/path/workflow-specialist-certificate')),
        li(link('Certification Overview', 'https://academy.asana.com/page/asana-certification')),
      ]),
      bq('⚠️ The free offer may end — enrol now to lock in your place. Exam window is 90 days once started.'),
    ),
  },
  {
    keyword: 'hubstaff',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Hubstaff — Getting Started Guides',
    content: doc(
      h2('Official Hubstaff Resources'),
      p(text('Hubstaff does not have a formal academy or certification programme, but provides comprehensive getting-started guides for each role.')),
      h3('Getting Started Guide'),
      ul([
        li(link('Company & Team Setup', 'https://support.hubstaff.com/getting-started/')),
        li(link('Projects & Tasks', 'https://support.hubstaff.com/projects/')),
        li(link('Inviting Team Members & Time Tracking', 'https://support.hubstaff.com/inviting-people/')),
      ]),
      h3('Help Centre'),
      p(link('support.hubstaff.com', 'https://support.hubstaff.com')),
      bq('Focus on the Time Tracking and Timesheets sections — these are most relevant to our day-to-day use.'),
    ),
  },
  {
    keyword: 'tanda',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Tanda — Help & Support Resources',
    content: doc(
      h2('Official Tanda Resources'),
      p(text('Tanda does not offer a formal certification programme. Their primary training materials are in their help centre and support documentation.')),
      h3('Tanda Help Centre'),
      ul([
        li(link('Tanda Help Centre', 'https://www.tanda.co/help')),
        li(link('Getting Started with Tanda', 'https://www.tanda.co/resources')),
      ]),
      h3('Key Topics to Learn'),
      ul([
        li(text('Rostering and shift scheduling')),
        li(text('Timesheets and approvals')),
        li(text('Leave management')),
        li(text('Award interpretation and compliance')),
      ]),
      bq('Contact your Tanda account manager for access to live onboarding sessions.'),
    ),
  },
  {
    keyword: 'google',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Google Workspace — Training & Certification',
    content: doc(
      h2('Official Google Workspace Training'),
      p(text('Google offers free learning resources for Workspace (Gmail, Drive, Docs, Sheets, Meet) through their training hub and Learning Centre.')),
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
        li(text('Google Drive file organisation')),
        li(text('Google Sheets for reporting')),
        li(text('Google Meet for client calls')),
      ]),
    ),
  },
  {
    keyword: 'slack',
    topicTitle: 'Official Training & Certification',
    stepTitle: 'Slack — Training & Certification',
    content: doc(
      h2('Official Slack Training'),
      p(text('Slack offers both a free introductory workshop and a paid admin certification.')),
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
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching existing subjects...\n');
  const subjects = await get('subjects?select=id,title&order=title');

  if (!Array.isArray(subjects)) {
    console.error('Failed to fetch subjects:', subjects);
    process.exit(1);
  }

  console.log(`Found ${subjects.length} subjects:`);
  subjects.forEach(s => console.log(`  • ${s.title} (${s.id})`));
  console.log('');

  for (const resource of TRAINING) {
    const match = subjects.find(s =>
      s.title.toLowerCase().includes(resource.keyword.toLowerCase())
    );

    if (!match) {
      console.log(`⚠️  No subject found for keyword "${resource.keyword}" — skipping`);
      continue;
    }

    console.log(`\n→ Adding topic to "${match.title}"...`);

    // Get current max order_index for this subject's topics
    const existingTopics = await get(
      `topics?subject_id=eq.${match.id}&select=order_index&order=order_index.desc&limit=1`
    );
    const maxOrder = Array.isArray(existingTopics) && existingTopics.length > 0
      ? existingTopics[0].order_index
      : 0;
    const newOrder = maxOrder + 10;

    // Insert the topic
    const topicResult = await post('topics', {
      subject_id: match.id,
      title: resource.topicTitle,
      order_index: newOrder,
    });

    const topic = Array.isArray(topicResult) ? topicResult[0] : topicResult;
    if (!topic || !topic.id) {
      console.error(`  ✗ Failed to create topic:`, topicResult);
      continue;
    }
    console.log(`  ✓ Topic created: "${resource.topicTitle}" (${topic.id})`);

    // Insert the step
    const stepResult = await post('steps', {
      topic_id: topic.id,
      title: resource.stepTitle,
      order_index: 10,
      content: resource.content,
    });

    const step = Array.isArray(stepResult) ? stepResult[0] : stepResult;
    if (!step || !step.id) {
      console.error(`  ✗ Failed to create step:`, stepResult);
      continue;
    }
    console.log(`  ✓ Step created: "${resource.stepTitle}" (${step.id})`);
  }

  console.log('\n✅ Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
