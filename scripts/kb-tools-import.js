/**
 * TrainHub — KB Tools Import
 * Creates 6 KB subjects (Asana, Hiver, Aircall, Hubstaff, Tanda, Dext)
 * with topics and video-embedded steps in Supabase.
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

function makeStepContent(videoUrl, videoTitle) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Watch the video below to learn this skill.' }],
      },
    ],
    attachments: [
      { type: 'video_url', url: videoUrl, name: videoTitle },
    ],
  };
}

// ── Tool data ─────────────────────────────────────────────────────────────────

const TOOLS = [
  // ── ASANA ───────────────────────────────────────────────────────────────────
  {
    subject: 'Asana',
    emoji: '📋',
    cover_color: '#f59e0b',
    topics: [
      {
        title: 'Getting Started with Asana',
        steps: [
          { title: 'Asana Beginner Overview 2024', video_url: 'https://www.youtube.com/watch?v=hcY-2Xux2oI' },
          { title: 'Learn Asana in 18 Minutes', video_url: 'https://www.youtube.com/watch?v=XGp5gmgi-H4' },
          { title: 'Full Beginner Guide 2026', video_url: 'https://www.youtube.com/watch?v=0IqlyoNA39Q' },
        ],
      },
      {
        title: 'Tasks & Projects',
        steps: [
          { title: 'Creating Tasks and Subtasks in Asana', video_url: 'https://www.youtube.com/watch?v=CITRdjvuyLo' },
          { title: 'Subtasks Tips and Tricks', video_url: 'https://www.youtube.com/watch?v=09oTBhBKUPw' },
          { title: 'How to Use Task Dependencies', video_url: 'https://www.youtube.com/watch?v=geZbwBPmBbU' },
          { title: 'Create Task Dependencies on Timeline', video_url: 'https://www.youtube.com/watch?v=bkPdhH2EInQ' },
        ],
      },
      {
        title: 'Project Views (Board, Timeline, List)',
        steps: [
          { title: 'Which Asana View Should You Use', video_url: 'https://www.youtube.com/watch?v=BanrdT_SYaI' },
          { title: 'Asana Timeline Tutorial 2025', video_url: 'https://www.youtube.com/watch?v=v0uIfx3Wgd8' },
          { title: 'Customize Board, List and Calendar Views', video_url: 'https://www.youtube.com/watch?v=M8wYanPi72M' },
          { title: 'Switch from List to Board View', video_url: 'https://www.youtube.com/watch?v=9ns1d9DIDDo' },
        ],
      },
      {
        title: 'Team Collaboration',
        steps: [
          { title: 'Assign Tasks in Asana Team Workflow', video_url: 'https://www.youtube.com/watch?v=df0QtCjMmmo' },
          { title: 'Comments and Mentions for Collaboration', video_url: 'https://www.youtube.com/watch?v=Ju4opPmu3gI' },
          { title: 'Add Collaborators to Tasks Easily', video_url: 'https://www.youtube.com/watch?v=43n2NWbSTF8' },
        ],
      },
      {
        title: 'Automations & Rules',
        steps: [
          { title: 'Asana Rules Automate Tasks and Workflows', video_url: 'https://www.youtube.com/watch?v=UQ225elfb9A' },
          { title: 'Asana Rules Tutorial – Automate Workflows', video_url: 'https://www.youtube.com/watch?v=xr6ihmk8vyc' },
          { title: 'Asana Rule Variables for Workflows', video_url: 'https://www.youtube.com/watch?v=Y60z2eH33LY' },
        ],
      },
      {
        title: 'Reporting & Dashboards',
        steps: [
          { title: 'Asana Reporting Dashboards Full Guide', video_url: 'https://www.youtube.com/watch?v=aQw8chiQz4w' },
          { title: 'Workload and Capacity Planning in Asana', video_url: 'https://www.youtube.com/watch?v=2JoCCnMvfik' },
          { title: 'Asana Reporting and Workload Guide 2026', video_url: 'https://www.youtube.com/watch?v=xSvKF0rjkjQ' },
        ],
      },
    ],
  },

  // ── HIVER ───────────────────────────────────────────────────────────────────
  {
    subject: 'Hiver',
    emoji: '📧',
    cover_color: '#10b981',
    topics: [
      {
        title: 'Getting Started with Hiver',
        steps: [
          { title: 'Set Up Shared Gmail Inbox', video_url: 'https://www.youtube.com/watch?v=znJC-G-kck0' },
          { title: 'Setting Up Hiver (Bee School E01)', video_url: 'https://www.youtube.com/watch?v=LG9V_PmWmds' },
          { title: 'Set Up Collaborative Gmail Inbox (EP-16)', video_url: 'https://www.youtube.com/watch?v=xJCRT4NYQA4' },
          { title: 'Hiver Full Review and Tutorial', video_url: 'https://www.youtube.com/watch?v=Gmg7nYCUB0o' },
        ],
      },
      {
        title: 'Managing Shared Inboxes',
        steps: [
          { title: 'Shared Inboxes Overview (Bee School E03)', video_url: 'https://www.youtube.com/watch?v=161ArrN438s' },
          { title: 'Shared Inbox Management for Teams', video_url: 'https://www.youtube.com/watch?v=LuiEB-tYLhA' },
          { title: 'Manage Shared Inboxes from Gmail', video_url: 'https://www.youtube.com/watch?v=D249qRFqPM4' },
        ],
      },
      {
        title: 'Email Assignment & Tags',
        steps: [
          { title: 'Create Labels in Gmail with Hiver (EP-7)', video_url: 'https://www.youtube.com/watch?v=4OmQYUQ2VEw' },
          { title: 'Email Collaboration in Hiver (Bee School E04)', video_url: 'https://www.youtube.com/watch?v=oe3OaJxbcOs' },
          { title: 'Email Management Features (Bee School E05)', video_url: 'https://www.youtube.com/watch?v=6GJzIYSTXX4' },
        ],
      },
      {
        title: 'Automations & Workflows',
        steps: [
          { title: 'Automations in Hiver Overview', video_url: 'https://www.youtube.com/watch?v=T23iyaFfkDg' },
          { title: 'Streamline Support with Hiver Automations', video_url: 'https://www.youtube.com/watch?v=4qJCOrcxbA0' },
          { title: 'AI Drafts and Rules to Reply Faster', video_url: 'https://www.youtube.com/watch?v=ZLqARdYJgLg' },
        ],
      },
      {
        title: 'Analytics & Reporting',
        steps: [
          { title: 'Custom Reports in Hiver Overview', video_url: 'https://www.youtube.com/watch?v=jDfuKgwDdhY' },
          { title: 'Customer Service Analytics with Hiver', video_url: 'https://www.youtube.com/watch?v=jFSRCjFDCmg' },
        ],
      },
    ],
  },

  // ── AIRCALL ─────────────────────────────────────────────────────────────────
  {
    subject: 'Aircall',
    emoji: '📞',
    cover_color: '#3b82f6',
    topics: [
      {
        title: 'Getting Started with Aircall',
        steps: [
          { title: 'Full Aircall Setup Guide 2026', video_url: 'https://www.youtube.com/watch?v=Z728kH3m_xs' },
          { title: 'Navigate the Aircall Dashboard', video_url: 'https://www.youtube.com/watch?v=d7tw0jcIQms' },
          { title: 'Set Your Agents Up for Success', video_url: 'https://www.youtube.com/watch?v=GS-OFeuxNv4' },
        ],
      },
      {
        title: 'Making & Receiving Calls',
        steps: [
          { title: 'How to Make a Call on Aircall', video_url: 'https://www.youtube.com/watch?v=i4tUaOAew9g' },
          { title: 'Dial a Phone Number in Aircall', video_url: 'https://www.youtube.com/watch?v=1V4uRbLe-js' },
          { title: 'Record, Mute, and Hold a Call', video_url: 'https://www.youtube.com/watch?v=qLQ5WsEkYAo' },
          { title: 'Use Aircall as a Call Center', video_url: 'https://www.youtube.com/watch?v=9tVyjyiypmA' },
        ],
      },
      {
        title: 'Call Routing & IVR',
        steps: [
          { title: 'Build an IVR in Aircall', video_url: 'https://www.youtube.com/watch?v=JYLKUqtMkos' },
          { title: 'Configure an IVR Number (Admin Dashboard)', video_url: 'https://www.youtube.com/watch?v=6--FTVWb8ag' },
          { title: 'Smart Routing for Inbound Calls', video_url: 'https://www.youtube.com/watch?v=1_kI4ZPeTcg' },
        ],
      },
      {
        title: 'Integrations',
        steps: [
          { title: 'Connect All Your Tools with Aircall', video_url: 'https://www.youtube.com/watch?v=aAVS76g-hsQ' },
          { title: 'HubSpot & Aircall Integration Overview', video_url: 'https://www.youtube.com/watch?v=mgGK6QggGcs' },
          { title: 'Aircall and HubSpot: Sync Calls and More', video_url: 'https://www.youtube.com/watch?v=v-647X7z-2k' },
          { title: 'Connect Aircall to Zapier (API Guide)', video_url: 'https://www.youtube.com/watch?v=ejyy3KbrMBc' },
        ],
      },
      {
        title: 'Analytics & Reporting',
        steps: [
          { title: 'Set Up Aircall Dashboard from Scratch', video_url: 'https://www.youtube.com/watch?v=pF2eYUW3KX8' },
          { title: 'Create a Dial Report from Aircall Data', video_url: 'https://www.youtube.com/watch?v=tChwm6IZjIc' },
          { title: 'How to Create an Aircall Dashboard', video_url: 'https://www.youtube.com/watch?v=bhroo-u6xQQ' },
        ],
      },
    ],
  },

  // ── HUBSTAFF ────────────────────────────────────────────────────────────────
  {
    subject: 'Hubstaff',
    emoji: '⏱️',
    cover_color: '#8b5cf6',
    topics: [
      {
        title: 'Getting Started with Hubstaff',
        steps: [
          { title: 'Hubstaff Tutorial for Beginners 2026', video_url: 'https://www.youtube.com/watch?v=GZyYzBvf3i8' },
          { title: 'How to Use Hubstaff as an Employer', video_url: 'https://www.youtube.com/watch?v=PteeP-NB4C4' },
          { title: 'Hubstaff Demo: Software Walkthrough', video_url: 'https://www.youtube.com/watch?v=HuSgY7WB-SA' },
        ],
      },
      {
        title: 'Tracking Time',
        steps: [
          { title: 'How to Use Hubstaff Complete Tutorial 2025', video_url: 'https://www.youtube.com/watch?v=65xMmt6Erj0' },
          { title: 'Hubstaff Time Tracking Step by Step', video_url: 'https://www.youtube.com/watch?v=KjF95fuKBEM' },
          { title: 'How To Use Hubstaff Time Tracking 2026', video_url: 'https://www.youtube.com/watch?v=hO4dszWQe_o' },
        ],
      },
      {
        title: 'Projects & Tasks',
        steps: [
          { title: 'How to Add a Project in Hubstaff', video_url: 'https://www.youtube.com/watch?v=P0zJ4R1teyY' },
          { title: 'How to Add a Task in Hubstaff', video_url: 'https://www.youtube.com/watch?v=LBWMY89-12o' },
          { title: 'Hubstaff Projects GPS and Payroll Tutorial', video_url: 'https://www.youtube.com/watch?v=gPrAko_wQhM' },
        ],
      },
      {
        title: 'Screenshots & Activity Monitoring',
        steps: [
          { title: 'How to Enable Screenshots in Hubstaff', video_url: 'https://www.youtube.com/watch?v=p1r9L1of1h8' },
          { title: 'Setup Screenshots and Timesheets in Hubstaff', video_url: 'https://www.youtube.com/watch?v=Xn9mku9Nk20' },
          { title: 'Activity Tracking with Hubstaff', video_url: 'https://www.youtube.com/watch?v=zDBd2yTpM6w' },
        ],
      },
      {
        title: 'Reports & Payroll',
        steps: [
          { title: 'Hubstaff Tutorial: Employers Payroll and Teams', video_url: 'https://www.youtube.com/watch?v=u1Y9Qmqs1xE' },
          { title: 'Hubstaff Explained: Payroll and Remote Teams', video_url: 'https://www.youtube.com/watch?v=1hAO2qZQjBs' },
        ],
      },
    ],
  },

  // ── TANDA ───────────────────────────────────────────────────────────────────
  {
    subject: 'Tanda',
    emoji: '📅',
    cover_color: '#ec4899',
    topics: [
      {
        title: 'Getting Started with Tanda',
        steps: [
          { title: 'How to Start Using Tanda', video_url: 'https://www.youtube.com/watch?v=up-53QIIBf8' },
          { title: 'Intro to Tanda Workforce Platform', video_url: 'https://www.youtube.com/watch?v=48R2_hlZsKw' },
          { title: 'Workforce Management with Tanda', video_url: 'https://www.youtube.com/watch?v=UNDryYDurZk' },
        ],
      },
      {
        title: 'Rostering & Scheduling',
        steps: [
          { title: 'Tanda Demo: Rostering', video_url: 'https://www.youtube.com/watch?v=ApWf9P_-Na8' },
          { title: 'Tanda Employee Onboarding', video_url: 'https://www.youtube.com/watch?v=-tkZYnpjpYA' },
        ],
      },
      {
        title: 'Timesheets & Attendance',
        steps: [
          { title: 'Tanda Demo: Time & Attendance', video_url: 'https://www.youtube.com/watch?v=pPv6Iv4_9X8' },
          { title: 'Tanda Overview', video_url: 'https://www.youtube.com/watch?v=MPYpJMpRPAo' },
        ],
      },
      {
        title: 'Leave Management',
        steps: [
          { title: 'Tanda Demo: Leave Management', video_url: 'https://www.youtube.com/watch?v=1BKFE4RPsIc' },
          { title: 'Creating a Leave Request in Tanda', video_url: 'https://www.youtube.com/watch?v=MUJsNM8Gb6g' },
          { title: 'Requesting Leave and Unavailability', video_url: 'https://www.youtube.com/watch?v=EIrzx7SbT9I' },
        ],
      },
      {
        title: 'Payroll Integration',
        steps: [
          { title: 'Tanda Workforce x SafetyCulture Integration', video_url: 'https://www.youtube.com/watch?v=JI_a-fMIWkE' },
          { title: 'Pharmacy Rostering with Tanda', video_url: 'https://www.youtube.com/watch?v=Ncf1p3jCCaM' },
        ],
      },
    ],
  },

  // ── DEXT ────────────────────────────────────────────────────────────────────
  {
    subject: 'Dext',
    emoji: '🧾',
    cover_color: '#f97316',
    topics: [
      {
        title: 'Getting Started with Dext',
        steps: [
          { title: 'Full Dext Overview & Demo (2025)', video_url: 'https://www.youtube.com/watch?v=IXiaXOIGra8' },
          { title: 'How To Use Dext – Bookkeeping Tutorial (2025)', video_url: 'https://www.youtube.com/watch?v=iYL5xEeY2gk' },
          { title: 'Dext Accounting Tutorial for Beginners (2025)', video_url: 'https://www.youtube.com/watch?v=AteiYTiCApA' },
          { title: 'Speed Up Your Bookkeeping – Dext Basics Guide', video_url: 'https://www.youtube.com/watch?v=lszA2k9Uru0' },
        ],
      },
      {
        title: 'Uploading Receipts & Invoices',
        steps: [
          { title: 'Uploading Receipts & Invoices (Web Platform)', video_url: 'https://www.youtube.com/watch?v=vCGM-H1JNr8' },
          { title: 'Uploading Receipts & Invoices to Dext Prepare', video_url: 'https://www.youtube.com/watch?v=zNfnYQvlo2g' },
          { title: 'Submit Bills & Receipts via Mobile App', video_url: 'https://www.youtube.com/watch?v=7QHLONzotVM' },
          { title: 'How to Email an Invoice or Receipt into Dext', video_url: 'https://www.youtube.com/watch?v=fsscCWY5-QU' },
        ],
      },
      {
        title: 'Supplier Rules & Auto-Categorisation',
        steps: [
          { title: 'How to Set Up Supplier and Customer Rules', video_url: 'https://www.youtube.com/watch?v=I-iaHUvqLF4' },
          { title: 'Maximising Efficiency: Supplier Rules', video_url: 'https://www.youtube.com/watch?v=ir0OoizwNBA' },
          { title: 'Dext Prepare – Adding a New Supplier', video_url: 'https://www.youtube.com/watch?v=4DOSHs6xOWs' },
        ],
      },
      {
        title: 'Xero Integration',
        steps: [
          { title: 'Connect Dext to Xero – Perfect Data Sync', video_url: 'https://www.youtube.com/watch?v=KQgcuxEfie4' },
          { title: 'Dext Integration With Xero – 2025 Full Guide', video_url: 'https://www.youtube.com/watch?v=tg0iDD9DNG8' },
          { title: 'How to Connect Xero and Dext Integration', video_url: 'https://www.youtube.com/watch?v=9trWevrqKC8' },
          { title: 'Publish Invoices from Dext to Xero', video_url: 'https://www.youtube.com/watch?v=zWSr2baGIJw' },
        ],
      },
      {
        title: 'Review & Approval',
        steps: [
          { title: 'Dext Prepare: Review & Publish (Xero Hero)', video_url: 'https://www.youtube.com/watch?v=cCrQXnVBzDw' },
          { title: 'Xero Training – Review & Publish Bills', video_url: 'https://www.youtube.com/watch?v=n821ymIYDu8' },
          { title: 'Streamline Processes Between Dext and Xero', video_url: 'https://www.youtube.com/watch?v=KPUz2R-7RxY' },
        ],
      },
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function importTool(tool) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(` Importing: ${tool.emoji} ${tool.subject}`);
  console.log('═'.repeat(60));

  // 1. Create subject
  const subjectRes = await sbPost('subjects', {
    title:       tool.subject,
    emoji:       tool.emoji,
    cover_color: tool.cover_color || '#6366f1',
    description: `Official tutorials and guides for ${tool.subject}.`,
  });
  const subject = Array.isArray(subjectRes) ? subjectRes[0] : subjectRes;
  if (!subject?.id) {
    console.error(`  ✗ Failed to create subject: ${JSON.stringify(subjectRes).slice(0, 200)}`);
    return;
  }
  console.log(`  ✓ Subject: ${subject.id}`);

  // 2. Create topics + steps
  for (let ti = 0; ti < tool.topics.length; ti++) {
    const topic = tool.topics[ti];
    const topicRes = await sbPost('topics', {
      subject_id:  subject.id,
      title:       topic.title,
      order_index: (ti + 1) * 10,
    });
    const topicRow = Array.isArray(topicRes) ? topicRes[0] : topicRes;
    if (!topicRow?.id) {
      console.error(`  ✗ Failed to create topic "${topic.title}": ${JSON.stringify(topicRes).slice(0, 200)}`);
      continue;
    }
    console.log(`  ✓ Topic [${ti + 1}]: ${topic.title}`);

    for (let si = 0; si < topic.steps.length; si++) {
      const step = topic.steps[si];
      const stepRes = await sbPost('steps', {
        topic_id:    topicRow.id,
        title:       step.title,
        order_index: (si + 1) * 10,
        content:     makeStepContent(step.video_url, step.title),
      });
      const stepRow = Array.isArray(stepRes) ? stepRes[0] : stepRes;
      if (!stepRow?.id) {
        console.error(`    ✗ Failed to create step "${step.title}": ${JSON.stringify(stepRes).slice(0, 200)}`);
      } else {
        console.log(`    ✓ Step [${si + 1}]: ${step.title}`);
      }
    }
  }
}

async function main() {
  for (const tool of TOOLS) {
    await importTool(tool);
  }
  console.log('\n\n✅ Import complete!');
}

main().catch(console.error);
