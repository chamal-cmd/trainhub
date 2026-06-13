/**
 * Sets order_index on all subjects to define the recommended learning sequence.
 * Run AFTER applying supabase/migrations/20260613_subjects_order_index.sql
 */

const https = require('https');

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ';

function sbPatch(id, body) {
  return new Promise((res, rej) => {
    const json = JSON.stringify(body);
    const r = https.request({
      hostname: SB_BASE,
      path: `/rest/v1/subjects?id=eq.${id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json),
        apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Prefer: 'return=minimal',
      },
    }, re => { let d = ''; re.on('data', c => d += c); re.on('end', () => res(d)); });
    r.on('error', rej); r.write(json); r.end();
  });
}

// ─── Recommended learning sequence ────────────────────────────────────────────
// Format: [order, id, title]
const SEQUENCE = [
  // ── Phase 1: Orientation ──────────────────────────────────────────────────
  [10,  'ba8101f9-b92e-49cf-b5dd-2a2fb38b58c4', '🏢 Introduction to GP Bookkeeper'],
  [20,  '86bd9a89-3e47-4755-bf4b-40038f3d343e', '💬 Soft Skills & Client Communication'],
  [30,  '9e33d6e1-d519-4e5f-b2f7-89d9e3608ad4', '🎉 Employee Onboarding'],

  // ── Phase 2: Daily Tools (used from day 1) ────────────────────────────────
  [40,  '69044e82-40e1-4499-a1b3-da41a9d5ac3c', '📧 Hiver'],
  [50,  '2e860f15-835d-4ebf-9d0d-b4568cf47f32', '📋 Asana'],
  [60,  '66cd3386-6c18-4d3d-aa5c-9e12d6b29926', '⏱️ Hubstaff'],
  [70,  'bbaaf0d0-8b59-445e-a15f-e1f2d0cf2ca0', '📞 Aircall'],

  // ── Phase 3: Client Work ──────────────────────────────────────────────────
  [80,  '29d61641-c677-4907-b6af-b73136f500cd', '🤝 Client Onboarding'],
  [90,  '2b68eafa-1b4f-44a7-a1fd-e1928f75b250', '📋 How to Structure Your New Client\'s Asana Board'],
  [100, 'd7b4b9f0-d370-43f0-8d10-1f0a9be378c7', '📲 Client Meeting Structure'],
  [110, '83a89a09-659b-4f67-8da4-87523ab86287', '📩 Email Templates'],
  [120, 'd28951c7-fcb6-44ac-8f68-0de14edfb97c', '📧 Hiver Email Templates'],

  // ── Phase 4: Core Bookkeeping Software ───────────────────────────────────
  [130, '26e0f5ed-1c87-400e-9c65-751b81b8736e', '📊 Xero Foundations'],
  [140, '7dce95e9-35ad-4b6b-87ad-929d6824b562', '⚙️ Dext Account Setup'],
  [150, 'dfbc593d-6e49-498f-a11c-30f5ef197b0c', '🧾 Dext Prepare'],
  [160, '14bf914f-c586-458e-b402-6750a2f3f598', '🧾 Dext'],
  [170, 'c2e34162-b637-4822-805c-4bd1270c7f4a', '📊 Reconciliations'],
  [180, '7ce60c53-1406-4ccf-9b32-3c98935ce56d', '🧾 GST and BAS'],

  // ── Phase 5: Payroll & HR ─────────────────────────────────────────────────
  [190, 'dcff0af4-3314-4e2f-b136-8730fe1c4391', '💰 Payroll'],
  [200, 'e205c1db-9323-4864-8e5f-15e53f50d2b6', '💼 Payroll and Single Touch Payroll'],
  [210, '16168803-f146-4402-84fe-045da22e3c6f', '📅 Tanda'],
  [220, 'a8c50330-5f3e-40d6-85ce-4f0b86fdcb30', '📝 Applying Leave'],
  [230, '05be8130-835d-486f-a4ff-fc903f6147d2', '🌴 Leave Policy'],

  // ── Phase 6: Advanced & Reporting ─────────────────────────────────────────
  [240, '18c272cc-14b3-4f4b-b207-1e3607727e26', '📊 Fathom Reporting'],
  [250, 'cd9e0908-f382-481c-85e8-16a4693551f2', '📊 Xero'],

  // ── Phase 7: AI Tools ─────────────────────────────────────────────────────
  [260, 'a0a91300-da5b-4cd0-8208-ad93e31da450', '🤖 Introduction to Claude & AI Tools'],

  // ── Phase 8: Tips & Reference ─────────────────────────────────────────────
  [270, '36f8c959-99fe-45fc-b798-fa7deadcf076', '⚡ Quick Tips - Trick Bytes'],
  [280, 'a1755980-5c48-450f-9a71-72caebb5e038', '📚 M3 Health'],
  [290, 'f38e30ce-360e-4275-899e-90568fa0d194', '🎥 Team Training'],

  // ── Legacy / Archive ──────────────────────────────────────────────────────
  [900, '3b6593be-764e-4cb7-8748-b54d460791bf', '🚀 GP Bookkeeper Onboarding (legacy)'],
  [910, '74d2b838-dd60-4685-b28a-d53570291d70', '?? Tanda (old)'],
  [920, '9be96ada-51ed-4ac2-b5d4-eab997cfd3a3', '⚡ Quick Tips Video Series (legacy)'],
];

async function main() {
  console.log('Setting subject order_index values...\n');
  for (const [order, id, label] of SEQUENCE) {
    await sbPatch(id, { order_index: order });
    console.log(`  [${String(order).padStart(3)}] ${label}`);
  }
  console.log('\n✅ Done!');
}

main().catch(console.error);
