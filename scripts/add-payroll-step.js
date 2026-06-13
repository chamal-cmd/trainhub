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
    title:       'Payroll Review Assistant',
    order_index: 40,
    content: doc(
      h2('What It Is'),
      para('The Payroll Review Assistant is a specialised AI-powered payroll auditor built for GP Bookkeeper Pty Ltd. Upload a payroll activity statement and it immediately gets to work — no prompting needed. It compares the current pay run against the previous one, line by line, and flags everything that matters.'),
      h2('How to Use It'),
      bullet([
        'Simply upload a payroll activity statement — no need to ask a question or give instructions',
        'The assistant automatically compares it against the previous pay run',
        'It identifies every mismatch, variance, and anomaly across all pay items',
        'It flags and investigates any variance above 30% to determine the reason',
        'It references Fair Work Australia (fairwork.gov.au) for award compliance and rate queries',
      ]),
      note('Just upload the file. That\'s it. The assistant does everything automatically from there.'),
      h2('What It Analyses'),
      bullet([
        [bold('Pay items '), { type: 'text', text: '— every line item compared against the previous pay run' }],
        [bold('Pay rates '), { type: 'text', text: '— correctness verified, Fair Work award rates checked where relevant' }],
        [bold('Variances above 30% '), { type: 'text', text: '— investigated with a specific reason provided' }],
        [bold('Variances below 30% '), { type: 'text', text: '— noted in the table only' }],
        [bold('Items as expected '), { type: 'text', text: '— marked with a tick (✓), no clutter' }],
      ]),
      h2('How Results Are Presented'),
      bullet([
        'A clean variance table — every line item, expected vs actual, percentage variance, reason (if >30%)',
        'Tick (✓) for every item that matches — clean and simple',
        'A summary table ready to share with the client',
        [bold('One-sentence client summary '), { type: 'text', text: '— only included if there are issues' }],
        'A draft email with key insights prepared and ready to send — never sent automatically',
      ]),
      h2('What It Prioritises'),
      bullet([
        'Pay item accuracy',
        'Pay rate correctness and Fair Work compliance',
        'Clean, client-ready output every time',
        'Medical industry context — understands GP practice pay items, healthcare awards, and entitlements',
      ]),
      h2('What to Upload'),
      bullet([
        'Current payroll activity statement',
        'Previous pay run for comparison',
      ]),
      h2('Industry Context'),
      para('This assistant is built specifically for the medical industry. It understands the pay items, awards, and entitlements relevant to GPs, nurses, and healthcare practice admin staff — including the Nurses Award and the Health Professionals and Support Services Award.'),
      note('The draft email is prepared automatically but never sent. Always review it before sending to a client.'),
    ),
  });

  const row = Array.isArray(result) ? result[0] : result;
  if (row?.id) console.log('✓ Payroll Review Assistant step created:', row.id);
  else console.error('Failed:', JSON.stringify(result).slice(0, 300));
}

main().catch(console.error);
