/**
 * TrainHub SOP Import — v2
 * Converts knowledge base files into SOPs via Claude AI, inserts as steps.
 * Throttled to respect Claude Haiku rate limits (5 req/min, 4k tokens/min).
 */

const https = require('https');

const SB_BASE   = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';
const ANT_KEY   = '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';
const DELAY_MS  = 15000; // 15s between Claude calls — stays under 5 req/min

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function apiGet(host, path, headers = {}) {
  return new Promise((res, rej) => {
    const r = https.request({ hostname: host, path, method: 'GET', headers: { Accept: 'application/json', ...headers } },
      re => { let d = ''; re.on('data', c => d += c); re.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } }); });
    r.on('error', rej); r.end();
  });
}

function apiPost(host, path, body, headers = {}) {
  return new Promise((res, rej) => {
    const json = JSON.stringify(body);
    const r = https.request({ hostname: host, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json), ...headers } },
      re => { let d = ''; re.on('data', c => d += c); re.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } }); });
    r.on('error', rej); r.write(json); r.end();
  });
}

const sbGet  = path => apiGet(SB_BASE, '/rest/v1/' + path, { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY });
const sbPost = (path, body) => apiPost(SB_BASE, '/rest/v1/' + path, body, { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Prefer: 'return=representation' });
const sleep  = ms => new Promise(r => setTimeout(r, ms));

// ── Claude conversion ─────────────────────────────────────────────────────────

async function toSOP(content, fileName) {
  // Truncate long transcripts — focus on the core procedure
  const raw = content.length > 5000 ? content.slice(0, 5000) + '\n[truncated]' : content;

  const prompt = `Convert the following training content into a professional SOP for GP Bookkeeper, an Australian bookkeeping firm.

Return ONLY a raw JSON object (NO markdown, NO code fences, NO explanation). Format:
{"title":"Step title (5-8 words)","content":{"type":"doc","content":[...tiptap nodes...]}}

TipTap node shapes:
- Heading H2: {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"..."}]}
- Paragraph:  {"type":"paragraph","content":[{"type":"text","text":"..."}]}
- Bullet list: {"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}]}
- Tip/note:   {"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}

Rules:
- Strip all timestamps (0:01, 0:12 etc) and verbal filler (um, uh, like)
- Keep only actionable steps and key points
- Use plain Australian English
- Max 6 bullet points per list
- Keep response under 800 tokens total

File: ${fileName}
Content:
${raw}`;

  let attempt = 0;
  while (attempt < 3) {
    attempt++;
    const resp = await apiPost('api.anthropic.com', '/v1/messages',
      { model: 'claude-haiku-4-5', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] },
      { 'x-api-key': ANT_KEY, 'anthropic-version': '2023-06-01' });

    if (resp.error?.type === 'rate_limit_error') {
      console.log(`  Rate limited — waiting 30s (attempt ${attempt}/3)...`);
      await sleep(30000);
      continue;
    }

    const text = resp.content?.[0]?.text ?? '';
    // Strip markdown code fences if Claude added them anyway
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.title && parsed.content) return parsed;
      console.error(`  Bad shape: ${JSON.stringify(parsed).slice(0, 100)}`);
      return null;
    } catch (e) {
      console.error(`  JSON parse error: ${e.message} — raw: ${cleaned.slice(0, 120)}`);
      return null;
    }
  }
  return null;
}

// ── File → Topic mapping (FULL UUIDs) ────────────────────────────────────────

const FILE_MAP = [
  // GP Bookkeeper Onboarding — Welcome
  { match: '0001 Hi, so welcome',          topicId: 'ba80c2c2-a978-4053-ba52-2ad5e3d506f3', order: 10 },

  // Client Onboarding — Getting Prepared
  { match: 'how to onboard a new client',  topicId: 'f9270721-b908-4693-a405-2b2b0c74ac2c', order: 10 },
  { match: 'how to onboard a client.txt',  topicId: 'f9270721-b908-4693-a405-2b2b0c74ac2c', order: 11 },
  { match: 'Know Your Client',             topicId: 'f9270721-b908-4693-a405-2b2b0c74ac2c', order: 12 },
  { match: 'Roadmap of a client',          topicId: 'f9270721-b908-4693-a405-2b2b0c74ac2c', order: 13 },

  // Asana board structure
  { match: 'Asana Project Structure',      topicId: 'efd1baf2-57b2-405d-a186-944c2f2ff032', order: 10 },

  // Client Meeting Structure
  { match: 'Structuring Client Meetings',  topicId: 'f2825755-2ba3-43a6-b8b2-6bab592624bf', order: 10 },

  // Dext Prepare — What is Dext?
  { match: 'dEXT 1.txt',                   topicId: '94b30660-1460-4fb5-bfb1-a4ad10f8b5f0', order: 10 },
  { match: 'INTRODUCTION TO DEXT',         topicId: '94b30660-1460-4fb5-bfb1-a4ad10f8b5f0', order: 11 },

  // Dext Prepare — Processing Receipts
  { match: 'how to add cost documents',    topicId: 'f1c23e66-5b04-4ef4-8171-fd753bc5c2c5', order: 10 },
  { match: 'dext clearing sample video 1', topicId: 'f1c23e66-5b04-4ef4-8171-fd753bc5c2c5', order: 11 },
  { match: 'dext clearing sample video 2', topicId: 'f1c23e66-5b04-4ef4-8171-fd753bc5c2c5', order: 12 },

  // Dext Account Setup — Creating client
  { match: 'How to create client account', topicId: 'c221dc07-74d2-4141-a7ca-c0e2a8b9bb2a', order: 10 },

  // Leave
  { match: 'Applying for Leave Process Update.txt', topicId: '425fbd73-a5e0-43e1-8214-d84b7c010395', order: 10 },
  { match: 'Applying Leave in Hubstaff',   topicId: '425fbd73-a5e0-43e1-8214-d84b7c010395', order: 11 },

  // Team Training sessions
  { match: 'surgical partners',            topicId: 'c2d8d734-11d2-4d96-83d6-837c380d5098', order: 10 },
  { match: 'Tanda trainig',               topicId: 'aab1e5ea-8f5e-4a60-af71-0bc0b5c50f1a', order: 10 },
  { match: 'Touchstone benchmarks',        topicId: '67018fe6-92e2-47b3-8f78-e3afe13fffa5', order: 10 },
  { match: 'Profit and Loss Statement in Medical', topicId: 'f80f067c-da2d-44e6-a613-e32632fccb55', order: 10 },

  // Fathom Reporting
  { match: 'fathom 1.txt',                topicId: '3e279b61-1de4-4f39-8edc-46ccf7f42659', order: 10 },
  { match: 'fathom 2.txt',                topicId: '04af040c-994e-4bee-b835-3bd30a4523a5', order: 10 },

  // Email Templates
  { match: 'Email -Normal version',        topicId: 'ba115b1b-411a-4764-99e8-84bc75e1c95f', order: 10 },
  { match: 'Email- Dext',                  topicId: 'ba115b1b-411a-4764-99e8-84bc75e1c95f', order: 11 },
  { match: 'Email- when bookkeeper',       topicId: 'ba115b1b-411a-4764-99e8-84bc75e1c95f', order: 12 },

  // Employee Onboarding — Medical Clients (Client Base section)
  { match: 'What is Medicare',             topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 10 },
  { match: 'how does meducare',            topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 11 },
  { match: 'Tyro',                         topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 12 },
  { match: 'Billings vs Receipts',         topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 13 },
  { match: 'bank reconciliation impact',   topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 14 },
  { match: 'What is Workcover',            topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 15 },
  { match: 'How and Why is Income',        topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 16 },
  { match: 'Key Aspects of Service Fee',   topicId: '53c8bbb4-7d18-4173-8d4e-3ee3b5afb002', order: 17 },

  // Trick Bytes — each goes to its own topic
  { match: 'Trick Byte 01',               topicId: 'ab6e8292-e062-4f05-9333-26f5712e8911', order: 10 },
  { match: 'Trick Byte 02',               topicId: '539faf80-75e0-418f-a78f-db64d728dd17', order: 10 },
  { match: 'Trick Byte 03',               topicId: 'bb560733-f86c-44f8-b829-9778a406baff', order: 10 },
  { match: 'Trick Byte 04',               topicId: '61f1ef13-9f91-48dd-ada3-4794f40a1b83', order: 10 },
  { match: 'Trick Byte 05',               topicId: 'ffa959bb-0439-472a-acc3-ccb7eed1bbaa', order: 10 },
  { match: 'Trick Byte 06',               topicId: '998e7e0f-98e9-42c7-8f53-9516abb38182', order: 10 },
  { match: 'Trick Byte 07',               topicId: '5c997d97-4dc1-4d50-b899-2fc349405382', order: 10 },
  { match: 'Trick Byte 08',               topicId: 'e61430a9-873d-4cd4-829d-7b72552d652f', order: 10 },
  { match: 'Trick Byte 09',               topicId: 'f6636d10-deb4-4988-a149-1f9fc0e0e014', order: 10 },
  { match: 'trick byte 10',               topicId: '58f51be5-c73d-433c-828d-804679c9c0d3', order: 10 },
  { match: 'Trick Byte 10',               topicId: '58f51be5-c73d-433c-828d-804679c9c0d3', order: 10 },
];

const SKIP_PATTERNS = [
  '.json', 'GP Bookkeeper Hub', 'Information about GP Bookkeeper',
  'GP Bookkeeper Hub - 14022026', 'Learning Materials Asana Board',
  'Applying for Leave Process Update 📝',   // duplicate
  'Signed Leave Policy',                     // legal PDF — reference only
  'GP_Bookkeeper_Employee_Policy',           // same
  'Individual_Banking_Model',               // reference PDF
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching knowledge base...');
  const files = await sbGet('knowledge_files?select=id,name,content&order=name');
  console.log(`${files.length} files found\n`);

  const existingSteps = await sbGet('steps?select=topic_id,title');
  const existingSet   = new Set(existingSteps.map(s => `${s.topic_id}::${s.title.toLowerCase()}`));

  let created = 0, skipped = 0, errors = 0, processed = 0;

  for (const file of files) {
    // Skip empty or protected files
    if (!file.content || file.content.length < 80) { skipped++; continue; }
    if (SKIP_PATTERNS.some(p => file.name.includes(p))) {
      console.log(`SKIP  ${file.name.slice(0, 70)}`);
      skipped++; continue;
    }

    // Find the target topic
    const map = FILE_MAP.find(m => file.name.toLowerCase().includes(m.match.toLowerCase()));
    if (!map) {
      console.log(`---- no map: ${file.name.slice(0, 70)}`);
      skipped++; continue;
    }

    console.log(`\n[${++processed}] ${file.name.slice(0, 70)}`);
    console.log(`     → topic ${map.topicId.slice(0, 8)}… order=${map.order}`);

    // Convert to SOP via Claude
    const sop = await toSOP(file.content, file.name);
    if (!sop) { errors++; continue; }

    console.log(`     title: "${sop.title}"`);

    // Skip if a step with this title already exists in this topic
    const key = `${map.topicId}::${sop.title.toLowerCase()}`;
    if (existingSet.has(key)) {
      console.log(`     SKIP (duplicate title)`);
      skipped++; await sleep(DELAY_MS); continue;
    }

    // Insert into Supabase
    const result = await sbPost('steps', {
      topic_id:    map.topicId,
      title:       sop.title,
      content:     sop.content,
      order_index: map.order,
    });
    const row = Array.isArray(result) ? result[0] : result;
    if (row?.id) {
      console.log(`     ✓ CREATED (${row.id.slice(0, 8)}...)`);
      existingSet.add(key);
      created++;
    } else {
      console.error(`     ✗ Insert error: ${JSON.stringify(result).slice(0, 120)}`);
      errors++;
    }

    // Throttle — stay under 5 req/min
    await sleep(DELAY_MS);
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(` SOP Import done`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped}`);
  console.log(`   Errors  : ${errors}`);
  console.log('═'.repeat(50));
}

main().catch(console.error);
