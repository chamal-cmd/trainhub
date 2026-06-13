// One-off import: GP Bookkeeper Training.xlsx — remaining client sheets
// Usage: node scripts/client-import-v2.js
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

const IMPORTS = [
  {
    clientName: 'Au Family Trust',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', null],
        ['Dext/Bills', null],
      ]],
      ['Weekly Tasks', [
        ['Clinic Tracker', null],
      ]],
      ['Fortnightly Tasks', [
        ['Processing Creditor\'s Pay', loom('08f1c24353de4b1b8a9440033b91d9a7')],
        ['Podiatry', null],
        ['Physio Peak', null],
        ['Payroll', null],
        ['Doctor\'s Pay Calculation', null],
        ['Dr Faris Reconciliation', null],
      ]],
      ['Monthly Tasks', [
        ['Pathology', null],
        ['GP Reg Top Up Calculation', null],
        ['P&L Analysis', null],
        ['Service Fee Income', null],
        ['GP Reg Income and Dr Vincent Income', null],
        ['Fathom/Management Reports', null],
        ['Manual Leave Monitoring', null],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation', null],
      ]],
    ],
  },
  {
    clientName: 'Our Group',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', loom('cc3ffd8a63fa4db4be1a1aeb3d92e937')],
        ['Bills', loom('97e8673e95ae41d8b49b480825e2bbbf')],
        ['Dext', loom('e94969cfba674e8abe15be21690c8b38')],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll-The Barracks', null],
        ['Payroll-Creek Street', null],
        ['Payroll-AFP', null],
        ['Payroll-Logan', null],
        ['Payroll-Spring Hill', loom('dd4be31eddde4029864207aef157db54')],
        ['Request Doctor\'s Hours', loom('2d441aa43962465eb9c8c901aa5bb82a')],
        ['Generate GP Reports-Barracks', loom('2142391c7a7e45619622917da6b42063')],
        ['Generate GP Reports-Creek', loom('3dad6d946f9d42059cfb109e8359e8ba')],
        ['Generate GP Reports-AFP', loom('70a55532116043e28210b95f9bf2a39c')],
        ['Generate GP Reports-Spring Hill', loom('4f5071a4155249fb9c04a46eed015f32')],
        ['Generate GP Reports-Logan', loom('69591aa63b754a8b8497969cf5b047e9')],
        ['Doctor\'s Pay Calc-Barracks', loom('6f3c0a7d481241d889b7b4c2ffa730a3')],
        ['Doctor\'s Pay Calc-Creek', loom('24457d051aad4591a22f3c08a0ba125a')],
        ['Doctor\'s Pay Calc-Logan', loom('1b40d2d3eff64053820fa7718e724cce')],
        ['Doctor\'s Pay Calc-AFP', loom('8703ad19835e486ea6feb4331ac6f2c4')],
        ['Doctor\'s Pay Calc-Spring Hill', loom('a3747c3e3ebe46b4a245e07fcddcb7b7')],
        ['Doctor\'s Pay Calc Billing-Barracks', loom('0f5232ef5a9b47299fecae0deb7b3e7b')],
        ['Doctor\'s Pay Calc Billing-Creek', loom('779abd7fcbe14b1cb58bba71952ca9c8')],
        ['Doctor\'s Pay Calc Billing-AFP', loom('53680a85d45a43c7b63e622e6a121f86')],
        ['Doctor\'s Pay Calc Billing-Spring Hill', loom('5f63e5f935174586af0166361e0c8e53')],
        ['Sending Doctor\'s Statements-Spring Hill', loom('3538f5570a47443abbf51f6b734feaff')],
        ['Sending Doctor\'s Statements-All Others', loom('ff00910cfc6d4f6db2c6a943c06fecb5')],
        ['Clinic Income', loom('14808f53748f4eb09cf714d187cef5a3')],
        ['Processing Creditor\'s Pay', loom('27282c498e6242c7baa78b1890d3615f')],
        ['Cash & Cheque Template-Spring Hill', loom('adacb94e8607495e817c78675edca482')],
        ['Daily Takings Calc-AFP', loom('c2e38c846d9643ce8654c6b005465a40')],
        ['Request Men\'s Clinic Reports', loom('cd491877c27745a9b4f083721487ad70')],
        ['Men\'s Clinic Calc for Dr Ali', loom('f8948734f8b7443994efc3c04ac1a6c5')],
      ]],
      ['Ad Hoc Tasks', [
        ['Setting-up of GP', loom('50b6ad15a7d54736b66ba78b5166b00a')],
        ['PIPs Calculation-Spring Hill', loom('1d3b8e7e9ca84ee39697c9f720e66849')],
      ]],
    ],
  },
  {
    clientName: 'TVM',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', loom('c43354800ded499c84fd3364555927aa')],
        ['Uncoded Bank Transactions', loom('a600fa50f3284049af737f42aa7d16a3')],
        ['Dext/Bills', loom('4ffe95f9cda547a9ba486ce976d5745f')],
        ['Email Management', null],
      ]],
      ['Weekly Tasks', [
        ['Clinic Dashboard Update', loom('5b7369938cf542ccaf57c9f16974f2c2')],
      ]],
      ['Fortnightly Tasks', [
        ['Staff Pay', loom('7c6d0b4d331543b5a7a51c7a38786e9f')],
        ['Sending ABA Staff Pay to Julian', loom('16cb2536710d47da82bab21fae67692f')],
        ['RCTI for GPs with No BOQ Account', loom('01fefe388f5e46f4b03288ec850a2ac1')],
        ['GP Reg Pay Calculation', loom('75e90a7aa2344b919a71909ec0b32699')],
        ['Processing Creditor\'s Pay', loom('4ffe95f9cda547a9ba486ce976d5745f')],
        ['Batch Payment for Creditors', loom('b2f8f7faa0db4b9db0304f9641f21c38')],
        ['Dr Sathya AHO Billings', loom('65c87e96e6b8421fbd1692ee0bc611e4')],
      ]],
      ['Monthly/Month-End Tasks', [
        ['P&L Analysis', null],
        ['Fathom Report', loom('b062842823e64406b7c86ce22a355c07')],
      ]],
      ['Quarterly Tasks', [
        ['Exceed Ultrasound Invoice', loom('044d73c98e654aca8e3d4b03b5765cb2')],
        ['Superannuation Payment', null],
      ]],
      ['Ad Hoc Tasks', [
        ['GP Reg Pay Calc-Final Pay', loom('8cf812f224ed4b65923949a92896dcde')],
        ['TVM Bank Contact History Changes', loom('00e3f66cf70f48cdaead7b0122d93c4b')],
      ]],
    ],
  },
  {
    clientName: 'Karmveer',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', null],
        ['Bills Process-Dext', null],
        ['Outlook: Remittance Advice', null],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', null],
        ['GP Payments Process', null],
      ]],
      ['Monthly Tasks', [
        ['Labor Hire', null],
        ['Superannuation Processing', null],
        ['Billable Back to Towradgi', null],
      ]],
    ],
  },
  {
    clientName: 'KSP Medical - Tyabb',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', null],
        ['Bills Process-Dext', null],
      ]],
      ['Weekly Tasks', [
        ['Financial Dashboard/Clinic Tracker', null],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', null],
        ['Staff Cost Analysis', null],
        ['GP Payments Process', null],
        ['GP Invoices Sending', null],
        ['Creditors Pay', null],
        ['Profit First', null],
        ['Invoice: Stephanie/4Cyte/Lachlan', null],
        ['Invoice: Leanne', null],
      ]],
      ['Month-End Tasks', [
        ['Amortization/Prepayments', null],
        ['P&L Analysis', null],
        ['Service Fee Journaling', null],
        ['Clinic Income-Month End', null],
      ]],
      ['Monthly Tasks', [
        ['Benchmarking', null],
        ['Superannuation Processing', null],
      ]],
      ['Quarterly Tasks', [
        ['Quarterly BAS Report Sending to Doctors', null],
      ]],
      ['Ad Hoc Tasks', [
        ['Adding New Employee in Tanda and Xero', null],
      ]],
    ],
  },
  {
    clientName: 'KSP Your Doctor',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', null],
        ['Bills Process-Dext', null],
      ]],
      ['Weekly Tasks', [
        ['Financial Dashboard/Clinic Tracker', null],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', null],
        ['Staff Cost Analysis', null],
        ['GP Payments Process', null],
        ['GP Invoices Sending', null],
        ['Creditors Pay', null],
        ['Profit First', null],
      ]],
      ['Month-End Tasks', [
        ['Amortization/Prepayments', null],
        ['P&L Analysis', null],
        ['Service Fee Journaling', null],
      ]],
      ['Monthly Tasks', [
        ['Benchmarking', null],
        ['Per Doctor Dashboard-Dr Helena', null],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Processing', null],
      ]],
      ['Ad Hoc Tasks', [
        ['Adding New Employee in Tanda and Xero', null],
      ]],
    ],
  },
  {
    clientName: 'Rural Medical Clinic',
    clientId: null,
    groups: [
      ['Daily/Regular Tasks', [
        ['Bank Recon', null],
        ['Bills Processing', null],
      ]],
      ['Weekly Tasks', [
        ['Updating Weekly Dashboard', loom('940dabe274d44349bb5e62a870b88f6b')],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', null],
        ['GP Payments', null],
        ['Creditors Pay', loom('23168b2248084c0e9a12cbe357208942')],
        ['Profit First Calculation', loom('a6973de4b0f248d9846dcfcf5840d590')],
        ['GP Payments Reconciliation', null],
        ['SP Report-Generate', loom('635f4001054b41248b8370d832aaa95b')],
        ['BP Report-Generate', loom('c9176650427f4e96af708c4cdc7e2186')],
      ]],
      ['Month-End Tasks', [
        ['Amortization/Prepayments', loom('3dda837465a8496698ee2d027715b82d')],
        ['P&L Analysis', loom('d238c9396e534ea5b8a8988eed44c905')],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Batch Payrun', null],
        ['GP Synergy', 'https://drive.google.com/file/d/1NLpg5a5QvVrfSvoHSJ1g_Zbkeq7qlBF_/view?usp=share_link'],
      ]],
    ],
  },
  {
    clientName: 'KFMP',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', loom('c350e8b13d4446c18c22d45b0575538f')],
        ['Bank Recon-Tyro & Stripe', loom('8236650db52643f49ba036582ba5ab6e')],
        ['Bank Recon-Stripe', loom('09815bd96f4845e1b05c2f7e162cff00')],
        ['KFMP Bank Recs (workcover & TMF)', loom('4120bd326e104d43b2a0d7fce997de69')],
        ['Dext/Bills', loom('79682c86141944e2bfd16e849d89034b')],
      ]],
      ['Weekly Tasks', [
        ['Processing Creditor\'s Pay', loom('cffa51c186d64d1690c4dea0a86676bf')],
      ]],
      ['Fortnightly Tasks', [
        ['KFMP Staff Pay', loom('1e9d30864c254c91977ea6fcb164e137')],
        ['Generate GP Reports and Checking Balances', loom('68bc24136f7146e0a66473dce24ba7ac')],
        ['Doctor\'s Pay Calculation', null],
        ['GP Reg Pay Calc-Creek Street', null],
        ['Clinic Income', null],
      ]],
      ['Monthly Tasks', [
        ['Superannuation Payment', loom('0853c69a006c43da88fca50df24dfc4c')],
        ['P&L Analysis', null],
      ]],
      ['Ad Hoc Tasks', [
        ['Setting-up of GP', null],
        ['Tyro Settlement Crossing Other Dates', loom('341051abd12d4ae0b9c38dd0af50b17d')],
        ['Tyro Settlement with Minimal Differences', loom('47eb868e33804797902d58f6f020c237')],
        ['KFMP-Put Back Deleted SP Transaction', loom('57410071d4234355a3671f118e689ff4')],
        ['Paid Family and Domestic Violence Leave', loom('c3b9b48489284aa19ad0b9a28c79ee28')],
      ]],
    ],
  },
  {
    clientName: 'Karis Medical',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Overall Overview-Fathom', 'https://fathom.video/calls/140707559?tab=summary'],
        ['Bank Recon', loom('b08aac5592e843e4944fe7d43317b7d1')],
        ['DEXT Clearing-Sales', loom('c281487478a84fc5ba031beaff499e9e')],
        ['DEXT Clearing-Cost', loom('49e1b1974d024c0880166390e21f7fb9')],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', loom('0da21f848cf14847b2b91a40941c249f')],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Batch Payrun', null],
      ]],
    ],
  },
  {
    clientName: 'GHFP & Nurture',
    clientId: null,
    groups: [
      ['Daily/Regular Tasks (MWF)', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
      ]],
      ['Weekly Tasks', [
        ['Creditors Pay (Batch)-Every Thursday', null],
        ['Staff Costs Analysis', null],
        ['Financial Dashboard Updating', null],
      ]],
      ['Fortnightly Tasks', [
        ['Bulk Transfers Fortnightly', null],
        ['Service Fee Recording-Fortnightly', null],
        ['Fortnightly Journal Recording-GP Reg/Practice/Clinic Income', null],
      ]],
      ['Monthly Tasks', [
        ['Wages Payable Recon', null],
        ['Admin and Nursing Wages Recording & Transfer', null],
        ['Management Fee Recording & Transfer', null],
        ['Benchmark Updating', null],
        ['Payroll Tax Processing', loom('7514372ea16f4c6380a0c1a47674695d')],
        ['Monthly Performance Report-Fathom', null],
      ]],
      ['Month-End Tasks', [
        ['Amortization/Prepayments', null],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Processing', null],
      ]],
      ['Onboarding', [
        ['Onboarding (Xero File Review)', null],
      ]],
    ],
  },
  {
    clientName: 'Top Health',
    clientId: null,
    groups: [
      ['Underwood', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Reg Top-up', null],
        ['GP Payment', null],
        ['Sublease Invoicing', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
      ['Beenleigh', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Payment', null],
        ['Sublease Invoicing', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
      ['Birkdale', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Payment', null],
        ['Sublease Invoicing', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
      ['Cannon Hill', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Reg Top-up', null],
        ['GP Payment', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
      ['Capalaba', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Reg Top-up', null],
        ['GP Payment', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
      ['Greenslopes', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Payment', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
      ['West End/Montague Market', [
        ['Bank Recon', null],
        ['Bills Processing-Dext', null],
        ['Creditors Pay (Batch)', null],
        ['Staff Pay', null],
        ['GP Payment', null],
        ['Intercompany Charges', null],
        ['Superannuation Processing', null],
      ]],
    ],
  },
  {
    clientName: 'Ocean Grove Medical',
    clientId: null,
    groups: [
      ['Daily/Regular Tasks', [
        ['Bank Recs', null],
      ]],
      ['Weekly Tasks', [
        ['Financial Dashboard Updating', null],
        ['Staffing Cost Analysis Updating', null],
      ]],
      ['Fortnightly Tasks', [
        ['Judo Loan Manual Import of Bank Statements and Recon', null],
        ['Creditors Processing and Batch Payment', null],
        ['Fortnightly GP Reg Recon & Allocation', null],
        ['Staff and GP Reg Payroll inc Overage', loom('5dca420b9eae4337ae19064bb52e53c6')],
        ['Partners and Contractors Pay-GP Pay', loom('de0dea2432044d04987d0b0a2924ec2a')],
        ['Send out Contractors and Partners Billings Copy and Service Fee Invoices', null],
        ['Clinic/Vaccine Income Updating', null],
        ['Small Partners\' Distribution-GAS', null],
        ['Profit First Updating', null],
      ]],
      ['Monthly Tasks', [
        ['Send out Partner\'s Management Fee Fix 20K plus GST', null],
        ['Partners\' Mgt Flat Rate Payment-20K plus GST', null],
        ['Directors\' Distribution of Profit 9K each-GAS', null],
        ['Benchmark Report Updating', null],
        ['Fathom Report (Monthly Performance Report)', null],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation Processing', null],
        ['Send Doctors Quarterly GST Report-Grove', loom('a2abbc43e88a4661809b841ee7ba5529')],
      ]],
    ],
  },
  {
    clientName: 'Niroga',
    clientId: null,
    groups: [
      ['Daily/Regular Tasks', [
        ['Bank Recon', null],
        ['Bills Processing', null],
      ]],
      ['Weekly Tasks', [
        ['Clinic Tracker', null],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll and GP Top Up', null],
        ['Creditors Batch Pay', null],
        ['Costs Analysis & Cashflow Report', null],
        ['Dr Catherine White GP Pay', null],
        ['Debtors Update', loom('c4fc7cf0b9f44117a61c5987fd27f926')],
        ['Fortnight Payroll Breakdown', null],
      ]],
      ['Monthly Tasks', [
        ['GP Payments Process', null],
        ['Sending of Doctor\'s Statements', null],
        ['Service Fee Recon', null],
        ['Locum GP Pay', null],
        ['Sessional Room Rentals', null],
        ['BP Related Receipts Check', null],
        ['Wage Payable Account (Recon)', null],
        ['Western Pathology Invoice', null],
        ['Fathom Report', null],
      ]],
      ['Month-End Tasks', [
        ['Amortization/Prepayments', null],
        ['P&L Analysis', null],
      ]],
      ['Quarterly Tasks', [
        ['Superannuation', null],
      ]],
      ['Ad Hoc Tasks', [
        ['Clinic Income', null],
      ]],
    ],
  },
  {
    clientName: 'Kath T',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recs', null],
        ['Daily Cash Rec.', null],
        ['Tyro Settlement', null],
        ['Uncoded Bank Transactions', null],
        ['Dext Clearing', null],
      ]],
      ['Weekly Tasks', [
        ['Weekly Uncoded Bank Items to Lesley', null],
        ['Bank Rec-Healthy Connection for All', null],
        ['GP Payment-Processing/AutoMed Rec', loom('4e07412ab5c049058ec4482acd02c834')],
        ['GP Payment-Invoice for Individual Doc.', null],
        ['GP Pay-Payment', null],
        ['Clinic Tracker and Additional Dashboards', loom('58ba068d61a0490eb04ea86b581c1ce8')],
      ]],
      ['Fortnightly Tasks', [
        ['Staff Payroll', null],
        ['Staff Payroll Payment', null],
        ['Sending Payslips', null],
        ['Payroll Filing-PAYG/GST', null],
      ]],
      ['Monthly Tasks', [
        ['Superannuation', null],
        ['Super Process', null],
        ['Monthly IAS', null],
      ]],
      ['Quarterly Tasks', [
        ['Check Invoice "Agatha"', null],
      ]],
      ['Ad Hoc Tasks', [
        ['Creditor\'s Pay', null],
        ['Creditor\'s Pay-Payment', null],
        ['Pathology', null],
        ['Month End', null],
        ['Check & Clear C&K Xero File', null],
      ]],
    ],
  },
  {
    clientName: 'Mokare',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recs', null],
      ]],
      ['Weekly Tasks', [
        ['Creditor\'s Pay-Payment', null],
        ['Clinic Tracker and Additional Dashboards', null],
      ]],
      ['Fortnightly Tasks', [
        ['Staff Payroll', null],
        ['Staff Payroll Payment', null],
        ['Sending Payslips', null],
        ['Superannuation-Fortnightly', null],
      ]],
      ['Monthly Tasks', [
        ['Request Staff Incentive Notice', null],
        ['Monthly IAS/Quarterly BAS', null],
        ['Bills Processing', loom('5dd7d5f930c344309ef9461abd2c7f91')],
      ]],
      ['Month-End Tasks', [
        ['Month End-ON CALL Payments Journal', loom('3b03ac32135049a8ba64fd515ccffb78')],
        ['Month End-Service Fee', null],
        ['Month End-MYOB Bank Recon', null],
      ]],
      ['Ad Hoc Tasks', [
        ['The Surgery-GP Receipts Recon', loom('0c754974200e45aeaeb632ce5a94cce1')],
        ['The Surgery-Practice Nurse Hours Calc Quarterly', loom('86edc526145e4876ab846b75c681c72a')],
        ['GP Pay-Payment', null],
        ['The Surgery-GP Reg Commission', null],
      ]],
    ],
  },
  {
    clientName: 'Matt C. - Superclinic',
    clientId: null,
    groups: [
      ['Weekly Tasks', [
        ['Dr Matt Cardone-GP Reconciliation', loom('4fc02aca6951462a91872b72efa4ba07')],
        ['Miriam Korman-Allied Health Reconciliation', loom('8e416465aa5b46849fa6220042364135')],
        ['Dr Shaymal Sharma-GP Reconciliation', loom('4fc02aca6951462a91872b72efa4ba07')],
        ['Dr Jessica Hughes-GP Reconciliation', loom('4fc02aca6951462a91872b72efa4ba07')],
        ['Dr Brent Williams-GP Reconciliation', loom('4fc02aca6951462a91872b72efa4ba07')],
        ['Dr Grant Rogers-GP Reconciliation', loom('a33c5357e7934421aa54de17925aeee1')],
        ['Service Fee Invoice Processing', loom('4f6114a12b8243db92b0be3a28195873')],
        ['Request Bank Statements', loom('a0dcffebf04343a999e96d87bff3eba3')],
        ['Comparison of BP vs Automed vs Doctor\'s Calculation', loom('bd0e2eade939440fa023b9b0c2e88ad5')],
        ['Send Queries to Debbie and Louis', loom('7453031deccd478daf1f558fe0b0c2cb')],
      ]],
    ],
  },
  {
    clientName: 'Emma',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Reconciliation', loom('96a7e422d1e04e46b76252a89174795c')],
        ['Dext Clearing', loom('fd4c355afb534152a44d6d130ccf695e')],
      ]],
      ['Fortnightly Tasks', [
        ['GP Payment Calculation & Payment', loom('32ceb705f2834ddbb90d1147e60d90ee')],
        ['Allied Health Processing & Payment', loom('6d245af3cbb140e5a8850ecd7ca99422')],
        ['SP Reconciliation', loom('32ceb705f2834ddbb90d1147e60d90ee')],
        ['Creditor\'s Pay', loom('16753b5d83184c5fac362788cbcec1ba')],
        ['GP Reg Calculation and Processing', loom('86c6a5d6b2654b1b89879f5641648cc7')],
        ['Admin & Nurses Pay Processing', loom('86c6a5d6b2654b1b89879f5641648cc7')],
      ]],
      ['Monthly Tasks', [
        ['Month End', loom('89ce4a3599744860b809f96c18b9feaf')],
        ['Monthly Super Processing', loom('0a659ae6a1fb4172aac5bd751dc880a9')],
        ['Monthly IAS Processing', loom('acf683936d984f9e8efbc0cd1c7ccb72')],
        ['Monthly Payroll Tax Lodgement', loom('7481017fba994e67b50face603bf958d')],
        ['Monthly Pathology Invoices', loom('b9fcaf10fe154e09aee5a2f0b4d35549')],
        ['Monthly Room Rental Invoices', loom('9e0dadf493594a91834e7e734a38cd92')],
        ['Month End Distribution', loom('4e7bc18fcb25419cbdd146f6c89c6d33')],
        ['Cashflow Statement', loom('4e7bc18fcb25419cbdd146f6c89c6d33')],
      ]],
      ['Quarterly Tasks', [
        ['Quarterly BAS Lodgement', loom('6b1446e04e6648c7a19d919f065a3b21')],
        ['Quarterly MDHS Invoice', loom('7f665b1718494867941dec949f958105')],
      ]],
    ],
  },
  {
    clientName: 'MC Ferny Hills',
    clientId: null,
    groups: [
      ['Pay Runs', [
        ['Reports-Linda and Christian', null],
        ['Staff Pay', null],
        ['GP Reg', null],
        ['Doctors as Employees', null],
        ['Doctors as Contractors', null],
        ['Sending Statements', null],
        ['GP Reg Minimum Pay', null],
        ['Quick Consult-Doctors Pay', null],
      ]],
      ['Creditors Pay', [
        ['Bank Reconciliation', null],
        ['Dext Clearing', null],
        ['Creditor Pay Process', null],
        ['AMEX CC', null],
        ['Accrual of PIP and WIPP', loom('91b6143074324b5c9c26fe3cf3a19a8a')],
        ['Echo and Holter & Clinic Income', loom('b15c6c285429402fa15739fed8335c4a')],
        ['Tyro Fee-Posting from Portal', loom('f0e80ad7dbee4da6afcc7caed10914ab')],
        ['Weekly Billing Revenue-Manual Journal', loom('c19fab1e186f4d2c9e8fbb9d2928e727')],
      ]],
      ['Month End', [
        ['Prepayment', null],
        ['Cash Flow', 'https://docs.google.com/spreadsheets/d/15GBiP6KxmD_LVNrBNdsFqX1FSE32WZZ9/edit?usp=drive_link&ouid=105339080753575656121&rtpof=true&sd=true'],
      ]],
    ],
  },
  {
    clientName: 'MC Engadine',
    clientId: null,
    groups: [
      ['Pay Runs', [
        ['Staff Payroll', null],
        ['GP Payments', null],
        ['Sending GP Statements', null],
        ['Dr Jonathan Barrel\'s GP Statement', null],
        ['Dr Jason\'s Report-Quarterly', null],
      ]],
      ['Creditors Pay', [
        ['Bank Reconciliation', null],
        ['Dext Clearing', null],
        ['Creditor Pay Process', null],
        ['AMEX CC', null],
      ]],
      ['Month End', [
        ['Request Reports from Julie', null],
        ['Clinic Income', loom('36703025d6634e88804e52a1e46c5b7a')],
        ['Tyro Fee-Posting from Portal', loom('f0e80ad7dbee4da6afcc7caed10914ab')],
        ['Accrual of PIP and WIPP', loom('91b6143074324b5c9c26fe3cf3a19a8a')],
      ]],
    ],
  },
  {
    clientName: 'MC Monavale',
    clientId: null,
    groups: [
      ['Pay Runs', [
        ['Email Communication of Katarina', null],
        ['GP Payments Reports Download', null],
        ['Staff Payroll', null],
        ['GP Payments', null],
        ['Dr Rowena\'s Sheet', null],
        ['Sending GP Statements', null],
      ]],
      ['Creditors Pay', [
        ['Bank Reconciliation', null],
        ['Dext Clearing', null],
        ['Creditor Pay Process', null],
        ['AMEX CC', null],
      ]],
      ['Month End', [
        ['Clinic Income', null],
        ['Tyro Fee-Posting from Portal', loom('f0e80ad7dbee4da6afcc7caed10914ab')],
        ['Accrual of PIP and WIPP', loom('91b6143074324b5c9c26fe3cf3a19a8a')],
        ['Monthly IAS', loom('c5db6536a6f9444db0955e173bcedd10')],
      ]],
    ],
  },
  {
    clientName: 'Plantagenet Medical',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Reconciliation', loom('993526fc70ab4201b06104f743f87784')],
        ['Workcover Checking', null],
        ['Email Management', null],
      ]],
      ['Regular Tasks (MWF)', [
        ['Bills Processing', null],
      ]],
      ['Fortnightly Tasks', [
        ['Creditors Pay', null],
        ['Payroll', null],
        ['GP Registrar Calculation', null],
      ]],
      ['Monthly Tasks (1st and 16th)', [
        ['GP Pays Processing', null],
        ['Service Fee Invoices', null],
        ['Practice Income Recording', null],
      ]],
    ],
  },
  {
    clientName: 'Vasuki',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Reconciliation', loom('4eb6db99af344996a202c44c917f120c')],
        ['Dext Clearing', loom('8a0c9c0549d341bb936eb46de0b100a7')],
      ]],
      ['Fortnightly Tasks', [
        ['GP Payment Process', loom('e0213a2193c34e70ab8431da9c03f9f6')],
        ['Payroll Process', loom('4f710ccc79de40ef847496235200ee1f')],
      ]],
      ['Monthly Tasks', [
        ['Superannuation Process', loom('7240cf4fef664fa39cf3ab39fc5f642e')],
        ['Month End Process', loom('c57993797be1490c91bc1adaff6fc10b')],
      ]],
    ],
  },
  {
    clientName: 'Dubbo',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Reconciliation', loom('0c04960c3456418c9f5bb82780ac0839')],
        ['Dext Clearing', loom('297225b40d3b46e096f03fd10852547b')],
      ]],
      ['Weekly Tasks', [
        ['Clinic Tracker', loom('18475cc8b8eb4aad9873d4f42c0a19f9')],
      ]],
      ['Fortnightly Tasks', [
        ['Creditor Pay', loom('c915d589484247b1b6276267bc37674b')],
        ['GP Payment', loom('daac89722bb54332915c808c2642b299')],
        ['GP Regs Payment', loom('92d4dfa59c4d4fccb47f8af907a25f16')],
        ['Staff Payroll', loom('22b995fc8ab44aaca89e631130d4ea43')],
        ['Superannuation Processing', loom('b1b8eadebb1d4a458db31a4ef882eb13')],
      ]],
      ['Monthly Tasks', [
        ['Benchmarking', loom('586d686b146e4b9fb78eda594b19e271')],
        ['Monthly IAS Processing', loom('87e54b8d5c584f03804cdf387df58674')],
      ]],
      ['Quarterly Tasks', [
        ['Quarterly BAS Lodgement', loom('a63461e747114569b9aa8c4fec5585bb')],
      ]],
    ],
  },
  {
    clientName: 'PSD',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Reconciliation', loom('3d6a9d0e5ffb403994bbfe4e199c5da2')],
        ['Dext Clearing', loom('6075375d197d4288af25c0cc45d20161')],
      ]],
      ['Weekly Tasks', [
        ['Creditor Pay', loom('1b7fd2a94853461ab836d31f7d5ef6c4')],
        ['Clinic Tracker', loom('7be7797d0a464b40bddfd1f0d9da2a1a')],
      ]],
      ['Fortnightly Tasks', [
        ['GP Payment', loom('c84042d21c9f474cb3368fdc5e364108')],
        ['Staff Payroll', loom('bebd0a8f533544f994a04d7355145225')],
        ['Superannuation Processing', loom('8fae349df40c4e0190f6987c169a809e')],
      ]],
      ['Monthly Tasks', [
        ['Pathology Invoice', loom('feac5b7ce4f14609a0da4c8ad801b424')],
      ]],
      ['Quarterly Tasks', [
        ['Quarterly BAS Lodgement', loom('5f5dec80a484496a83853fc887be0eec')],
        ['Quarterly Summary for GPs', loom('a0aea0ff69f1455aa88f4d861e629230')],
      ]],
    ],
  },
  {
    clientName: 'Rye',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', null],
        ['Bills Process-Dext', null],
      ]],
      ['Weekly Tasks', [
        ['Financial Dashboard/Clinic Tracker', null],
        ['Pay.com Reconciliation', null],
        ['Weekly Deposit Report', null],
      ]],
      ['Fortnightly Tasks', [
        ['Payroll', null],
        ['GP Payments Process', null],
        ['GP Invoices Sending', null],
        ['Creditors Pay', null],
      ]],
      ['Monthly Tasks', [
        ['Benchmarking', null],
        ['Superannuation Processing', null],
        ['Per Doctor Dashboard', null],
        ['Take Up Income Pragya and Rahul Journal', null],
      ]],
    ],
  },
  {
    clientName: 'Michael Clements',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Reconciliation', null],
        ['Email Management', null],
        ['Hubdoc Clearing / Bills Processing', null],
      ]],
      ['Fortnightly Tasks', [
        ['Staff Payroll-Checking timesheets in EH', null],
        ['Staff Payroll-Pay run finalisation', null],
        ['Staff Payroll-Sending payslips', null],
        ['Staff Payroll-STP filing', null],
        ['GP Payments-Worksheet preparation', null],
        ['GP Payments-Xero purchase orders and bills', null],
        ['GP Payments-Batch payments', null],
        ['GP Payments-Sending RCTIs', null],
      ]],
      ['Quarterly Tasks', [
        ['Processing Superannuation', null],
      ]],
      ['Ad Hoc Tasks', [
        ['Cubiko Calculate Project', null],
        ['PEM Accounts Checklist', null],
      ]],
    ],
  },
  {
    clientName: 'Everyday Medical',
    clientId: null,
    groups: [
      ['Introduction', [
        ['Introduction', null],
      ]],
      ['Bank Reconciliation', [
        ['Introduction to Bank Accounts', null],
        ['Bank Reconciliation', null],
      ]],
      ['Payroll', [
        ['Everyday Medical Payroll', null],
        ['How to upload payment', null],
        ['Send Payslips', null],
        ['Superannuation', null],
        ['STP Filing', null],
      ]],
      ['GP Payments', [
        ['Download DR Reports', null],
        ['Worksheet Preparation', null],
        ['Bills Creation', null],
        ['Payment Arrangement', null],
        ['Send Invoices & Remittance Advices', null],
      ]],
      ['Month End', [
        ['Clear Bank Reconciliation', null],
        ['Check Reconciliation Reports', null],
        ['P&L Review', null],
        ['BL Review', null],
      ]],
      ['Monthly Reports', [
        ['Everyday Medical Budget', null],
        ['Cashflow Forecast', null],
        ['Fathom Report', null],
      ]],
      ['BAS/IAS', [
        ['BAS-Share Activity Statement with Accountant', null],
        ['IAS-Share Payroll Reports with Accountant', null],
      ]],
    ],
  },
  {
    clientName: 'Clinic Academy',
    clientId: null,
    groups: [
      ['Daily Tasks', [
        ['Bank Recon', null],
        ['Bills Processing', null],
        ['Invoice Processing', null],
      ]],
    ],
  },
]

async function run() {
  for (const imp of IMPORTS) {
    let clientId = imp.clientId

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
  }
  console.log('\nAll imports complete.')
}

run().catch((e) => { console.error(e); process.exit(1) })
