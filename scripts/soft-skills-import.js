/**
 * TrainHub — Soft Skills & Client Communication Module
 */

const https = require('https');

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';

function sbPost(path, body) {
  return new Promise((res, rej) => {
    const json = JSON.stringify(body);
    const r = https.request({
      hostname: SB_BASE, path: '/rest/v1/' + path, method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json),
        apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Prefer: 'return=representation',
      },
    }, re => { let d = ''; re.on('data', c => d += c); re.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } }); });
    r.on('error', rej); r.write(json); r.end();
  });
}

const h2     = t => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: t }] });
const para   = t => ({ type: 'paragraph', content: [{ type: 'text', text: t }] });
const bold   = t => ({ type: 'text', marks: [{ type: 'bold' }], text: t });
const note   = t => ({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }] });
const bullet = items => ({
  type: 'bulletList',
  content: items.map(item => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: Array.isArray(item) ? item : [{ type: 'text', text: item }] }],
  })),
});
const video  = (url, name) => ({ type: 'video_url', url, name });
const doc    = (nodes, attachments = []) => ({ type: 'doc', content: nodes, attachments });

// ── Module ────────────────────────────────────────────────────────────────────

const SUBJECT = {
  title:       'Soft Skills & Client Communication',
  emoji:       '💬',
  cover_color: '#0ea5e9',
  description: 'Essential soft skills for bookkeepers and how to communicate professionally with clients via Zoom and email.',

  topics: [

    // ── TOPIC 1: Soft Skills ─────────────────────────────────────────────────
    {
      title: 'Soft Skills for Bookkeepers',
      steps: [
        {
          title: 'Core Soft Skills to Develop',
          content: doc([
            h2('Why Soft Skills Matter in Bookkeeping'),
            para('Technical accuracy gets the work done — soft skills keep the client. At GP Bookkeeper, how you communicate, manage your time, and handle pressure is just as important as your Xero skills.'),
            h2('The Key Skills to Build'),
            bullet([
              [bold('Communication'), { type: 'text', text: ' — Explain financial information clearly to non-finance clients. Keep it simple, avoid jargon.' }],
              [bold('Attention to detail'), { type: 'text', text: ' — One wrong figure can cascade. Develop the habit of checking your own work before it leaves your hands.' }],
              [bold('Time management'), { type: 'text', text: ' — Deadlines are non-negotiable in bookkeeping. Prioritise daily, communicate early if something will be late.' }],
              [bold('Problem solving'), { type: 'text', text: ' — When something doesn\'t reconcile, stay methodical. Work through the problem — don\'t panic, don\'t guess.' }],
              [bold('Emotional intelligence'), { type: 'text', text: ' — Clients can be stressed about money. Stay calm, empathetic, and professional even when conversations get difficult.' }],
              [bold('Adaptability'), { type: 'text', text: ' — Software, processes, and regulations change. Be the person who embraces change rather than resists it.' }],
            ]),
            note('The bookkeepers who grow fastest at GP Bookkeeper are not always the most technical — they\'re the ones clients trust and enjoy working with.'),
          ]),
        },
        {
          title: 'Top 5 Soft Skills for Accountants',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=pQpUiVtjzSY', 'Top 5 Soft Skills for Accountants')]),
        },
        {
          title: 'Why Accountants Need Soft Skills',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=rJxWNWK7rG0', 'Why Accountants Need Soft Skills')]),
        },
        {
          title: 'Communication & Leadership in Accounting',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=iCiwRzZVl8g', 'Communication and Leadership in Accounting')]),
        },
      ],
    },

    // ── TOPIC 2: Zoom ────────────────────────────────────────────────────────
    {
      title: 'Client Communication via Zoom',
      steps: [
        {
          title: 'Zoom Best Practices at GP Bookkeeper',
          content: doc([
            h2('Before the Call'),
            bullet([
              'Test your audio and video at least 5 minutes before the call starts',
              'Use a clean, professional background — virtual backgrounds are fine if your environment is noisy or messy',
              'Have the relevant documents (P&L, BAS, reconciliation) open and ready to share before the client joins',
              'Send a meeting agenda to the client the day before so they know what to expect',
            ]),
            h2('During the Call'),
            bullet([
              'Turn your camera on — clients build trust through face-to-face interaction',
              'Mute yourself when not speaking, especially if you\'re in a shared space',
              'Speak clearly and slowly — financial information can be overwhelming for clients',
              'Summarise key points as you go: "So what this means for you is..."',
              'If you don\'t know the answer to something, say so honestly and commit to a follow-up time',
            ]),
            h2('After the Call'),
            bullet([
              'Send a follow-up email within 24 hours summarising what was discussed and any action items',
              'Document any decisions or changes agreed on the call in Asana immediately',
            ]),
            note('Clients judge professionalism in the first 60 seconds of a Zoom call. Your setup, punctuality, and preparation say a lot before you even speak.'),
          ]),
        },
        {
          title: 'Mastering Zoom Meeting Etiquette Professionally',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=-N28N8ZN5Vw', 'Mastering Zoom Meeting Etiquette Professionally')]),
        },
        {
          title: '10 Rules Every Pro Follows on Video Calls',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=JpP5grJSFWQ', '10 Rules Every Pro Follows on Video Calls')]),
        },
        {
          title: '5 Tips for Hosting a Great Zoom Meeting',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=brLKt1KKrKU', '5 Tips for Hosting a Great Zoom Meeting')]),
        },
      ],
    },

    // ── TOPIC 3: Email ───────────────────────────────────────────────────────
    {
      title: 'Client Communication via Email',
      steps: [
        {
          title: 'Email Standards at GP Bookkeeper',
          content: doc([
            h2('The GP Bookkeeper Email Standard'),
            bullet([
              [bold('Reply within 24 hours '), { type: 'text', text: '— even if just to acknowledge receipt and give an ETA for a full response' }],
              [bold('Clear subject lines '), { type: 'text', text: '— include the client name and topic: "ABC Clinic — March BAS Update"' }],
              [bold('One purpose per email '), { type: 'text', text: '— don\'t bundle three different topics into one email. Clients miss things.' }],
              [bold('Finish with a clear next step '), { type: 'text', text: '— every email should end with what happens next and who does it' }],
              [bold('Professional tone always '), { type: 'text', text: '— warm but not casual. We are their trusted financial partner, not a friend texting.' }],
            ]),
            h2('Structure of a Good Client Email'),
            bullet([
              'Opening — acknowledge context or refer to previous interaction',
              'Body — state the purpose clearly in 2–3 short paragraphs maximum',
              'Action required — be explicit: "Could you please send us the missing bank statement by Friday?"',
              'Closing — professional sign-off with your name, role, and contact details',
            ]),
            h2('Things to Avoid'),
            bullet([
              'Never send financial data in the body of an email — attach it as a PDF or share via secure link',
              'Avoid vague language: "as soon as possible" → give a specific date instead',
              'Don\'t use accounting jargon without explaining it — not every client knows what "ITC" means',
              'Never write an email when you are frustrated — draft it, wait 10 minutes, then review before sending',
            ]),
            note('When in doubt, use the Claude — GP Bookkeeper Hub project to draft a first version. Edit it, then send.'),
          ]),
        },
        {
          title: 'Time-Saving Email Tips for Accounting Firms',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=5nyKb9SBm7Q', 'Time-Saving Email Tips for Accounting Firms')]),
        },
        {
          title: 'Professional Email Dos and Don\'ts',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=3fTTu5uyeYU', 'Professional Email Dos and Don\'ts')]),
        },
        {
          title: '6 Email Etiquette Rules for Business',
          content: doc([
            para('Watch the video below to learn this skill.'),
          ], [video('https://www.youtube.com/watch?v=NBuw9YNP_6A', '6 Email Etiquette Rules for Business')]),
        },
      ],
    },
  ],
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Creating: ${SUBJECT.emoji} ${SUBJECT.title}`);

  const subjectRes = await sbPost('subjects', {
    title: SUBJECT.title, emoji: SUBJECT.emoji,
    cover_color: SUBJECT.cover_color, description: SUBJECT.description,
  });
  const subject = Array.isArray(subjectRes) ? subjectRes[0] : subjectRes;
  if (!subject?.id) { console.error('Failed subject:', JSON.stringify(subjectRes).slice(0,200)); return; }
  console.log(`✓ Subject: ${subject.id}`);

  for (let ti = 0; ti < SUBJECT.topics.length; ti++) {
    const topic = SUBJECT.topics[ti];
    const topicRes = await sbPost('topics', {
      subject_id: subject.id, title: topic.title, order_index: (ti + 1) * 10,
    });
    const topicRow = Array.isArray(topicRes) ? topicRes[0] : topicRes;
    if (!topicRow?.id) { console.error(`Failed topic: ${topic.title}`); continue; }
    console.log(`\n  ✓ Topic [${ti + 1}]: ${topic.title}`);

    for (let si = 0; si < topic.steps.length; si++) {
      const step = topic.steps[si];
      const stepRes = await sbPost('steps', {
        topic_id: topicRow.id, title: step.title,
        order_index: (si + 1) * 10, content: step.content,
      });
      const stepRow = Array.isArray(stepRes) ? stepRes[0] : stepRes;
      if (stepRow?.id) console.log(`    ✓ Step [${si + 1}]: ${step.title}`);
      else console.error(`    Failed step: ${step.title} — ${JSON.stringify(stepRes).slice(0,150)}`);
    }
  }
  console.log('\n✅ Done!');
}

main().catch(console.error);
