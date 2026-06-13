/**
 * SOP Import — Retry pass for files that failed JSON parsing.
 * Uses a shorter, stricter prompt to guarantee complete JSON responses.
 */
const https = require('https');

const SB_BASE  = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';
const ANT_KEY  = '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';
const DELAY_MS = 15000;

function apiGet(host, path, hdrs = {}) {
  return new Promise((res, rej) => {
    const r = https.request({ hostname: host, path, method: 'GET', headers: { Accept: 'application/json', ...hdrs } },
      re => { let d = ''; re.on('data', c => d += c); re.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } }); });
    r.on('error', rej); r.end();
  });
}
function apiPost(host, path, body, hdrs = {}) {
  return new Promise((res, rej) => {
    const json = JSON.stringify(body);
    const r = https.request({ hostname: host, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json), ...hdrs } },
      re => { let d = ''; re.on('data', c => d += c); re.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } }); });
    r.on('error', rej); r.write(json); r.end();
  });
}
const sbGet  = p => apiGet(SB_BASE, '/rest/v1/' + p, { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY });
const sbPost = (p, b) => apiPost(SB_BASE, '/rest/v1/' + p, b, { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Prefer: 'return=representation' });
const sleep  = ms => new Promise(r => setTimeout(r, ms));

// Very short prompt — forces Claude to stay under 500 tokens
async function toSOP(content, fileName) {
  const raw = content.slice(0, 3000); // Tighter limit
  for (let attempt = 1; attempt <= 3; attempt++) {
    const resp = await apiPost('api.anthropic.com', '/v1/messages',
      { model: 'claude-haiku-4-5', max_tokens: 700,
        messages: [{ role: 'user', content:
`GP Bookkeeper SOP conversion. Return ONLY valid JSON, no markdown.

{"title":"5-7 word title","content":{"type":"doc","content":[
  {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"HEADING"}]},
  {"type":"paragraph","content":[{"type":"text","text":"BRIEF INTRO (1-2 sentences)"}]},
  {"type":"bulletList","content":[
    {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"KEY POINT 1"}]}]},
    {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"KEY POINT 2"}]}]},
    {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"KEY POINT 3"}]}]},
    {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"KEY POINT 4"}]}]}
  ]}
]}}

Rules: strip timestamps/filler, max 4 bullet points, Australian English, NO extra nodes.
File: ${fileName}
Content (first 3000 chars): ${raw}` }] },
      { 'x-api-key': ANT_KEY, 'anthropic-version': '2023-06-01' });

    if (resp.error?.type === 'rate_limit_error') {
      console.log(`  Rate limit — waiting 30s (attempt ${attempt}/3)`);
      await sleep(30000); continue;
    }
    const text = (resp.content?.[0]?.text ?? '').replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/i,'').trim();
    try {
      const p = JSON.parse(text);
      if (p.title && p.content) return p;
    } catch (e) {
      console.error(`  Parse error attempt ${attempt}: ${e.message}`);
      if (attempt < 3) await sleep(15000);
    }
  }
  return null;
}

// Files that failed + their target topic IDs (full UUIDs)
const RETRY_FILES = [
  { name: 'bank reconciliation impact.txt',                        topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 14 },
  { name: 'dEXT 1.txt',                                            topicId: '94b30660-1460-4fb5-bfb1-a4ad10f8b5f0', order: 10 },
  { name: 'dext clearing sample video 1.txt',                      topicId: 'f1c23e66-5b04-4ef4-8171-fd753bc5c2c5', order: 11 },
  { name: 'fathom 1.txt',                                          topicId: '3e279b61-1de4-4f39-8edc-46ccf7f42659', order: 10 },
  { name: 'fathom 2.txt',                                          topicId: '04af040c-994e-4bee-b835-3bd30a4523a5', order: 10 },
  { name: 'how does meducare work.txt',                            topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 11 },
  { name: 'how to add cost documents to dext.txt',                 topicId: 'f1c23e66-5b04-4ef4-8171-fd753bc5c2c5', order: 10 },
  { name: 'How to create client account in dext.docx',             topicId: 'c221dc07-74d2-4141-a7ca-c0e2a8b9bb2a', order: 10 },
  { name: 'how to onboard a client.txt',                           topicId: 'f9270721-b908-4693-a405-2b2b0c74ac2c', order: 11 },
  { name: 'INTRODUCTION TO DEXT.txt',                              topicId: '94b30660-1460-4fb5-bfb1-a4ad10f8b5f0', order: 11 },
  { name: 'Key Aspects of Service Fee Income i.txt',               topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 17 },
  { name: 'Know Your Client.txt',                                   topicId: 'f9270721-b908-4693-a405-2b2b0c74ac2c', order: 12 },
  { name: 'Profit and Loss Statement in Medical Practice Explained.txt', topicId: 'f80f067c-da2d-44e6-a613-e32632fccb55', order: 10 },
  { name: 'Structuring Client Meetings.txt',                       topicId: 'f2825755-2ba3-43a6-b8b2-6bab592624bf', order: 10 },
  { name: 'Touchstone benchmarks for medical practices- training for the staff Loom - 3 May 2024.txt', topicId: '67018fe6-92e2-47b3-8f78-e3afe13fffa5', order: 10 },
  { name: 'Trick Byte 04 - Create Asana Tasks Directly from Gmail.txt', topicId: '61f1ef13-9f91-48dd-ada3-4794f40a1b83', order: 10 },
  { name: 'Trick Byte 06 - Hiver Email Templates.txt',             topicId: '998e7e0f-98e9-42c7-8f53-9516abb38182', order: 10 },
  { name: 'Trick Byte 09 - Using Asana in Slack.txt',              topicId: 'f6636d10-deb4-4988-a149-1f9fc0e0e014', order: 10 },
  { name: 'Tyro.txt',                                              topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 12 },
  { name: 'What is Medicare.txt',                                  topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 10 },
  { name: 'What is Workcover.txt',                                 topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 15 },
];

async function main() {
  console.log('Fetching knowledge base for retry pass...');
  const allFiles = await sbGet('knowledge_files?select=id,name,content');
  const fileMap  = new Map(allFiles.map(f => [f.name, f]));

  const existingSteps = await sbGet('steps?select=topic_id,title');
  const existingSet   = new Set(existingSteps.map(s => `${s.topic_id}::${s.title.toLowerCase()}`));

  let created = 0, failed = 0;

  for (const target of RETRY_FILES) {
    const file = fileMap.get(target.name);
    if (!file?.content) {
      console.log(`NOT FOUND: ${target.name}`); failed++; continue;
    }

    console.log(`\nRETRY: ${target.name.slice(0, 70)}`);
    const sop = await toSOP(file.content, file.name);
    if (!sop) { console.error('  FAILED after 3 attempts'); failed++; continue; }

    console.log(`  title: "${sop.title}"`);
    const key = `${target.topicId}::${sop.title.toLowerCase()}`;
    if (existingSet.has(key)) { console.log('  SKIP duplicate'); continue; }

    const result = await sbPost('steps', {
      topic_id: target.topicId, title: sop.title,
      content: sop.content, order_index: target.order,
    });
    const row = Array.isArray(result) ? result[0] : result;
    if (row?.id) {
      console.log(`  ✓ CREATED (${row.id.slice(0,8)}...)`);
      existingSet.add(key); created++;
    } else {
      console.error(`  ✗ ${JSON.stringify(result).slice(0,120)}`); failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n${'═'.repeat(40)}`);
  console.log(` Retry pass complete`);
  console.log(`   Created : ${created}`);
  console.log(`   Failed  : ${failed}`);
  console.log('═'.repeat(40));
}

main().catch(console.error);
