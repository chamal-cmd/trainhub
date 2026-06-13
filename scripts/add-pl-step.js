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

async function main() {
  const result = await sbPost('steps', {
    topic_id:    '4a1c2f93-4626-4f88-9912-82cbe1006830',
    title:       'P&L Analysis Assistant',
    order_index: 30,
    content: doc(
      h2('What It Is'),
      para('The P&L Analysis Assistant is a dual-perspective AI built for GP Bookkeeper\'s finance work. It analyses every figure from two angles simultaneously — as a financial analyst (trends, ratios, performance) and as a financial controller (accuracy, anomalies, compliance, risk).'),
      h2('What It Does Automatically'),
      bullet([
        'Compares P&L statements month-by-month across every line item',
        'Identifies all variances, anomalies, and unusual movements',
        [bold('Variances above 20%'), { type: 'text', text: ' — detailed rationale and commentary in bullet points' }],
        [bold('Variances below 20%'), { type: 'text', text: ' — single-sentence notification only, no lengthy commentary' }],
        'Drills into account transactions to find the root cause of each variance',
        'Breaks down findings vendor-wise and by date for full transparency',
        'Flags anomalies that may indicate errors, miscodings, or unusual business activity',
      ]),
      h2('How Results Are Presented'),
      bullet([
        'Clean P&L comparison table — variance amounts, percentages, status, and commentary column',
        'Commentary pulled directly from account transactions — specific, not generic',
        'Vendor-wise and date-level detail for all significant movements',
        'Interactive dashboard with a clean, client-ready UI',
      ]),
      h2('What to Upload'),
      bullet([
        'Monthly P&L statements for the periods being compared',
        'Account transactions for the relevant periods',
        [bold('Important: '), { type: 'text', text: 'The assistant rejects any file that does not relate to profit and loss. No exceptions.' }],
      ]),
      h2('What It Prioritises'),
      bullet([
        'Accuracy of variance calculations above all else',
        'Clear, specific commentary backed by transaction evidence',
        'Client-ready presentation at all times',
        'Both analytical and control perspectives on every finding',
      ]),
      note('Use this project at month-end when preparing client financial reviews. Upload both the P&L export and the account transactions from Xero for the most detailed, transaction-backed analysis.'),
    ),
  });

  const row = Array.isArray(result) ? result[0] : result;
  if (row?.id) {
    console.log('✓ P&L Analysis step created:', row.id);
  } else {
    console.error('Failed:', JSON.stringify(result).slice(0, 300));
  }
}

main().catch(console.error);
