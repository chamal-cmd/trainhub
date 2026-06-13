// One-off import: GP Bookkeeper Training.xlsx client sheets -> client_tasks/client_subtasks
// Usage: node scripts/client-import.js
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ'
const BASE = 'https://yqefhohpfdcfripuswpw.supabase.co/rest/v1'
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function post(path, body) {
  const r = await fetch(`${BASE}/${path}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`POST ${path} -> ${r.status}: ${await r.text()}`)
  return r.json()
}
async function get(path) {
  const r = await fetch(`${BASE}/${path}`, { headers: HEADERS })
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`)
  return r.json()
}

const loom = (id) => `https://www.loom.com/share/${id}`

// ── Import data per client ──────────────────────────────────────────────────
// groups: [groupTitle, [subtaskTitle, videoUrl|null][]][]

const IMPORTS = [
  {
    clientName: 'GP Bookkeeper',
    clientId: 'b826e7d7-0c71-44ae-a5de-148e0e92b4a2',
    groups: [
      ['Weekly Tasks', [
        ['GP Book Dashboard (Every Monday)', loom('0818754989e84607873442171882c86b')],
      ]],
    ],
  },
  {
    clientName: 'Scale My Clinic',
    clientId: '1e5f85c6-fb0d-4ef0-bee7-29c30e522ed0',
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', loom('9ddf19ef7e5e47878672da32254784de')],
        ['Bills (as needed)', loom('9ddf19ef7e5e47878672da32254784de')],
        ['Sales Invoices (as needed)', loom('9ddf19ef7e5e47878672da32254784de')],
      ]],
      ['Weekly Tasks', [
        ['SMC File (every Wednesday)', loom('ec8ef531057645d2a32efca3324edf9c')],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', 'https://drive.google.com/file/d/148F042t1_99KBA6Yz8a4Vl39yUqtmk30/view'],
        ['Profit First (Wednesday)', null],
        ['Creditors Pay (same with PF)', null],
      ]],
      ['Month-End Tasks', [
        ['Amortization/Prepayments', loom('cdb5a49bf5d64d6da5913d864faffbdc')],
        ['Revenue Analysis', loom('2a0ef859d9104832a766c804632efc2b')],
        ['Cost Analysis', loom('2826449d36414cfe9244f816149dc909')],
        ['SMC BS Recon', null],
        ['SMC Fathom Reporting', null],
        ['GP Hero Invoice', loom('08e3de11bbbe4a23a8d3ab92f637c71c')],
        ['GP Book Invoice', loom('c445b73a38064512ba8f4bb3f8f0fd78')],
        ["Ryan's Wages Invoice", loom('4f8f841f61754d72b5ca1ef4a1bb15c0')],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Processing', 'https://drive.google.com/drive/folders/14TbLBqZ48sfgkZt7rqo3ZQeM4vEz-vvW'],
      ]],
      ['Ad Hoc Tasks', [
        ['How to do a refund in Stripe', loom('f750fbbe7510465fb63e9a346787d378')],
        ['Direct Debit Set up', loom('eaa18f7310714efdbbe523d58190adc8')],
        ['How to create payment in Stripe', loom('2571aacc97c34d8489b65bf51dc90202')],
      ]],
    ],
  },
  {
    clientName: 'Family Medical Practice',
    clientId: 'd3f0338a-1baa-43a2-b3e1-8eca8fd23ccd',
    accessTools: ['Xero - Riverstone', 'HubDoc', 'KPEyes', 'Best Practice', 'Tanda'],
    groups: [
      ['Daily Tasks', [
        ['HubDoc', loom('08b2b7c4302249a3882fc58deed3f2a0')],
        ['Bank Recon', 'https://drive.google.com/open?id=117_dX2BLQtIziYQq49fRHDfPFwGLTKyP'],
      ]],
      ['Weekly Tasks', [
        ['Creditors Payment (Thu)', loom('fa18a24e1f26414ea768eb8818ea46eb')],
        ['Request for GP Reports (Tue)', loom('02171bac7b2c43ee8a5c152ad6c2af40')],
        ["Doctor's Pay Calculation (Wed)", 'https://drive.google.com/open?id=1xwCPs2VvRf5S4XvB_kMrouzLX6UTOzC_'],
        ["Doctor's Pay Calculation Billing (Tue)", 'https://drive.google.com/open?id=1s_aJrCN2hknLC9ZV9CvKLHxhGJySj42I'],
        ['Clinic Income (Tue)', null],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll (Thu)', 'https://drive.google.com/open?id=1xpvScLqUrGCAtDshIauYDdBFV_F8_lF2'],
      ]],
      ['Monthly Tasks', [
        ['Superannuation', loom('8b71df651d4e4a3aa2452bed9d49720c')],
        ['Monthly P&L Report', loom('4840725d610e414aa55ee9e11b53e294')],
        ['Wages Breakdown per Department', 'https://drive.google.com/open?id=1v6UBr4FlDvcIHUuTgz_mG9HG7ScxdQI9'],
        ['Dr Sharon and Dr Michelle Patient Fee Reconciliation', null],
      ]],
      ['Quarterly / Yearly Tasks', [
        ['Registrars Bonus (Quarterly, 24th)', null],
        ['Payroll Tax (Yearly)', null],
        ['STP YE Reconciliation and Finalisation (Yearly)', null],
        ['Check junior anniversaries to update in Payroll (Yearly)', null],
      ]],
      ['Misc', [
        ['Email Handling', null],
      ]],
    ],
  },
  {
    clientName: 'Kim Ching',
    clientId: '407fbacd-3b51-4feb-9be1-162128410778',
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', loom('1ec6a2b8411c4e63adeb3d3ac725193f')],
        ['Bills (as needed)', loom('67c912bdb5f7475f9e34c0c81ea2f711')],
        ['Dext', loom('c85fb4342f9c4ac696e7648000b1fe2e')],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', loom('4a6e75de505f45cbae95e64a1574283c')],
        ['Request for GP Reports', loom('0127fbaa6b384526a1cb9d7dc6ba7413')],
        ["Doctor's Pay Calculation", loom('a5fc7da5a20a4eb382b4c3016375919c')],
        ["Doctor's Pay Calculation Billing", loom('c18020f850594d6082d22115a5c787d6')],
        ["Sending of Doctor's Statements", loom('7e72aa7ea6664e27808c3dc3d5578ac3')],
        ['Clinic Income', loom('59f5ac0d31af43209508d779ac4f0916')],
      ]],
      ['Monthly Tasks', [
        ['Superannuation Payment', loom('6ca35472145f462eba95fb1c94500792')],
        ["Processing of Kim's Payroll", null],
        ['Fathom Reporting', loom('f5886bc1df4b46d5a7b6c5ab7279e987')],
      ]],
      ['Month-End Tasks', [
        ['P&L Analysis', loom('2b0ad9bb29134f16989f2a65fced25f5')],
      ]],
      ['Ad Hoc Tasks', [
        ['Checking of Salary Rates', null],
        ['Checking of Leave Loading & Annual Leave', null],
        ["Processing Creditor's Pay", loom('f0be9a5abe1c494c9552cc89cbfbb31a')],
      ]],
    ],
  },
  {
    clientName: 'GDMC',
    clientId: null, // created below
    groups: [
      ['Onboarding', [
        ['Onboarding — Ryan', loom('1e63847178b1443a88c336fd9c841720')],
        ['Onboarding — Melody', loom('56965b3852954e649704a22204f53b16')],
      ]],
      ['Recurring Tasks (Mon / Wed / Thu)', [
        ['Bank Recon', loom('ee1f897ab586461f8c808a6f34d5c3bf')],
        ['Bills / Invoice Processing / Petty Cash Recon', loom('1e81723481524bf38c5e908cb384c037')],
      ]],
      ['Weekly Tasks', [
        ['Updating Weekly Dashboard (Every Monday)', loom('717a19557f1849de98a4fb27ea7d7c86')],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', loom('885785f2d82e4c8e9fcea4d2377b421f')],
        ['GP Payments', loom('b6361d222f874ad79c25ada68e01322d')],
        ['Creditors Pay', loom('1e81723481524bf38c5e908cb384c037')],
        ['Profit First Calculation', loom('ada57636921749ad80ed1347e65f5243')],
        ['BP Report — Generate', 'https://drive.google.com/drive/folders/1uNLAtwitEWZiLDaucxv0bqp3ATPJMOIV'],
      ]],
      ['Monthly / Month-End Tasks', [
        ['Amortization/Prepayments', loom('308167be7557463d81d9c32c07dd9019')],
        ['P&L Analysis', loom('2c8a3396559d489ba8b933f8416f0287')],
        ['Petty Cash Replenishment Process', loom('e6bebac67aef4f05912b5a866ea13dbd')],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Batch Payrun', loom('7469314317f4494491c393bac86c76ad')],
      ]],
    ],
  },
]

async function run() {
  for (const imp of IMPORTS) {
    let clientId = imp.clientId

    // Create the client if it doesn't exist yet (GDMC)
    if (!clientId) {
      const existing = await get(`clients?select=id&name=eq.${encodeURIComponent(imp.clientName)}`)
      if (existing.length > 0) {
        clientId = existing[0].id
        console.log(`${imp.clientName}: client exists (${clientId})`)
      } else {
        const created = await post('clients', { name: imp.clientName, description: 'Imported from GP Bookkeeper Training.xlsx' })
        clientId = created[0].id
        console.log(`${imp.clientName}: client created (${clientId})`)
      }
    }

    // Skip if the client already has tasks (idempotent re-runs)
    const existingTasks = await get(`client_tasks?select=id&client_id=eq.${clientId}&limit=1`)
    if (existingTasks.length > 0) {
      console.log(`${imp.clientName}: already has tasks, skipping`)
      continue
    }

    let taskIdx = 0
    let subTotal = 0
    for (const [groupTitle, subs] of imp.groups) {
      const task = await post('client_tasks', { client_id: clientId, title: groupTitle, order_index: taskIdx++ })
      const taskId = task[0].id
      const rows = subs.map(([title, video_url], i) => ({
        client_task_id: taskId, title, video_url, order_index: i,
      }))
      await post('client_subtasks', rows)
      subTotal += rows.length
    }
    console.log(`${imp.clientName}: ${taskIdx} groups, ${subTotal} subtasks`)

    // Access tools (Riverstone sheet)
    if (imp.accessTools) {
      const existingTools = await get(`client_access_tools?select=id&client_id=eq.${clientId}&limit=1`)
      if (existingTools.length === 0) {
        const toolRows = imp.accessTools.map((tool_name, i) => ({ client_id: clientId, tool_name, order_index: i }))
        await post('client_access_tools', toolRows)
        console.log(`${imp.clientName}: ${toolRows.length} access tools`)
      }
    }
  }
  console.log('\nAll imports complete.')
}

run().catch((e) => { console.error(e); process.exit(1) })
