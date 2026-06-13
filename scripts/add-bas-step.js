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
    title:       'BAS Review Assistant',
    order_index: 50,
    content: doc(
      h2('What It Is'),
      para('The BAS Review Assistant is a specialised AI-powered Australian tax accountant built to conduct thorough, ATO-compliant Business Activity Statement reviews for GP Bookkeeper clients. It cross-references three documents simultaneously and works through every transaction line by line before lodgement.'),
      h2('What to Upload'),
      bullet([
        [bold('BAS / Activity Statement '), { type: 'text', text: '— for the relevant quarter' }],
        [bold('Account transaction report '), { type: 'text', text: '— for the same period' }],
        [bold('Bank statements '), { type: 'text', text: '— for the same period' }],
      ]),
      note('These are the only three documents accepted. The assistant will not work with unrelated files.'),
      h2('What It Does Automatically'),
      bullet([
        'Reviews all three documents simultaneously — BAS, account transactions, and bank statements',
        'Scans every bank statement transaction line by line and verifies it is coded to the correct expense account in line with ATO regulations',
        [bold('Identifies miscoded transactions'), { type: 'text', text: ' — e.g. GST-free items coded as GST-inclusive, private expenses incorrectly claimed, capital items coded as operating expenses' }],
        'Flags discrepancies between what is reported on the BAS and what appears in the transaction records',
        [bold('Checks GST classifications'), { type: 'text', text: ' — taxable supplies, GST-free, input-taxed, and out of scope' }],
        'Validates that ITC (Input Tax Credits) claims are legitimate and supported by transaction evidence',
        'Reviews PAYG Withholding figures against the activity statement where applicable',
        'References the ATO BAS guidelines at ato.gov.au when a ruling or clarification is needed',
        'Provides a clear summary of findings — errors, risks, and recommended corrections before lodgement',
      ]),
      h2('Common Issues It Catches'),
      bullet([
        'GST-free medical income incorrectly reported as taxable supplies',
        'Private or personal expenses claimed as business ITCs',
        'Capital purchases (equipment, fit-out) coded as operating expenses',
        'Transactions missing from the BAS that appear in bank statements',
        'Duplicate transactions or double-coded items',
        'PAYG Withholding figures that do not reconcile with payroll records',
      ]),
      h2('What It Will Not Do'),
      bullet([
        'Make assumptions without document evidence — everything is evidence-based',
        'Approve or lodge a BAS directly',
        'Override ATO regulations regardless of how transactions are presented',
      ]),
      h2('ATO Reference'),
      para('When a ruling or clarification is required, the assistant references the official ATO BAS guidelines. Staff do not need to look these up manually.'),
      note('Always complete the BAS Review before lodgement. This assistant is the last line of defence against costly ATO compliance errors for our clients.'),
    ),
  });

  const row = Array.isArray(result) ? result[0] : result;
  if (row?.id) console.log('✓ BAS Review Assistant step created:', row.id);
  else console.error('Failed:', JSON.stringify(result).slice(0, 300));
}

main().catch(console.error);
