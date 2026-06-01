/**
 * Call Reports — Node.js Proxy Server
 *
 * Serves the dashboard HTML and proxies Aircall API requests
 * to avoid CORS issues when calling from the browser.
 *
 * HOW TO SET YOUR AIRCALL CREDENTIALS:
 *   1. Log in to Aircall → Integrations → API Keys
 *   2. Copy your API ID and API Token
 *   3. Paste them into the two lines below
 *   4. Restart the server:  node server.js
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

// ─── Aircall credentials ──────────────────────────────────────────────────────
const AIRCALL_API_ID    = '0b1e382d5ecd73922d462540fc816c23';
const AIRCALL_API_TOKEN = '7f242544b64ffa2c74f24fadd5a3a0c4';
const AIRCALL_AUTH      = Buffer
  .from(`${AIRCALL_API_ID}:${AIRCALL_API_TOKEN}`)
  .toString('base64');

const PORT = 4001;

// ─── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
};

// ─── Mock fallback data (used if Aircall auth fails) ─────────────────────────
const MOCK = [
  { id:'m01', agent:'Sarah Chen',    phone:'+1 (555) 234-5678', direction:'inbound',  duration:342, timestamp: ago(0,9,15),  status:'done', tags:['billing','account-upgrade'],    sentiment:'positive', sentiment_score:0.84, call_outcome:'resolved',           follow_up_required:false, key_topics:['Payment plan setup','Account upgrade','Service satisfaction'], action_items:['Send payment confirmation email','Schedule 30-day check-in'],      summary:'Customer called to set up a payment plan and upgrade their account. High satisfaction reported.' },
  { id:'m02', agent:'Marcus Rivera', phone:'+44 20 7946 0958',  direction:'outbound', duration:187, timestamp: ago(0,10,42), status:'done', tags:['renewal','churn-risk'],          sentiment:'neutral',  sentiment_score:0.52, call_outcome:'follow-up-required', follow_up_required:true,  key_topics:['Contract renewal','Pricing concerns','Competitor comparison'],  action_items:['Send revised pricing proposal','Schedule follow-up call'],        summary:'Renewal call with churn-risk account. Pricing concerns raised. Proposal to follow.' },
  { id:'m03', agent:'Priya Patel',   phone:'+1 (555) 891-2345', direction:'inbound',  duration:523, timestamp: ago(0,11,5),  status:'done', tags:['technical','escalation'],        sentiment:'negative', sentiment_score:0.18, call_outcome:'unresolved',          follow_up_required:true,  key_topics:['API failure','Data sync issues','SLA breach'],                 action_items:['Escalate to Tier 2','Send incident report','Offer service credit'], summary:'Critical API integration failure causing 6-hour data sync outage. Escalated — unresolved.' },
  { id:'m04', agent:'Sarah Chen',    phone:'+61 2 9374 4000',   direction:'outbound', duration:678, timestamp: ago(0,14,30), status:'done', tags:['demo','new-prospect'],            sentiment:'positive', sentiment_score:0.93, call_outcome:'sale-made',           follow_up_required:false, key_topics:['Product demo','Enterprise features','Pricing'],               action_items:['Send contract for e-signature','Schedule onboarding'],            summary:'Successful enterprise demo closed on 12-month Enterprise plan.' },
  { id:'m05', agent:"James O'Brien", phone:'+1 (555) 456-7890', direction:'inbound',  duration:145, timestamp: ago(1,8,20),  status:'done', tags:['billing','refund'],              sentiment:'negative', sentiment_score:0.20, call_outcome:'resolved',            follow_up_required:false, key_topics:['Double charge','Refund request'],                              action_items:['Process refund within 3-5 business days'],                       summary:'Double charge resolved — refund initiated.' },
  { id:'m06', agent:'Marcus Rivera', phone:'+1 (555) 321-9876', direction:'inbound',  duration:289, timestamp: ago(1,13,15), status:'done', tags:['onboarding','new-customer'],      sentiment:'positive', sentiment_score:0.88, call_outcome:'resolved',            follow_up_required:false, key_topics:['Initial setup','Team invitations','Integration walkthrough'],   action_items:['Share onboarding documentation link'],                           summary:'New customer onboarding completed. All setup steps done.' },
  { id:'m07', agent:'Priya Patel',   phone:'+49 30 12345678',   direction:'outbound', duration:412, timestamp: ago(2,10,0),  status:'done', tags:['upsell','analytics'],             sentiment:'neutral',  sentiment_score:0.63, call_outcome:'follow-up-required', follow_up_required:true,  key_topics:['Analytics add-on','ROI discussion','Budget approval'],          action_items:['Send ROI case study','Follow up after June 3rd'],                summary:'Upsell call for analytics package. Budget approval pending — follow up June 3.' },
  { id:'m08', agent:"James O'Brien", phone:'+1 (555) 654-3210', direction:'inbound',  duration:198, timestamp: ago(2,15,45), status:'done', tags:['technical','password-reset'],     sentiment:'neutral',  sentiment_score:0.56, call_outcome:'resolved',            follow_up_required:false, key_topics:['Password reset','MFA setup'],                                  action_items:[],                                                                summary:'Password reset and MFA setup completed in under 4 minutes.' },
  { id:'m09', agent:'Yuki Tanaka',   phone:'+81 3 1234 5678',   direction:'inbound',  duration:356, timestamp: ago(3,9,10),  status:'done', tags:['renewal','negotiation'],          sentiment:'positive', sentiment_score:0.78, call_outcome:'sale-made',           follow_up_required:false, key_topics:['Annual renewal','Multi-year discount','Additional seats'],      action_items:['Send 2-year contract with 15% discount'],                        summary:'Annual renewal turned into 2-year commitment. 15% discount + 5 additional seats.' },
  { id:'m10', agent:'Sarah Chen',    phone:'+1 (555) 789-0123', direction:'outbound', duration:91,  timestamp: ago(3,11,30), status:'done', tags:['check-in','nps'],                 sentiment:'positive', sentiment_score:0.80, call_outcome:'resolved',            follow_up_required:false, key_topics:['NPS follow-up','Feature satisfaction'],                        action_items:['Add to Q3 beta testing group'],                                  summary:'NPS follow-up. Customer scored 9/10 — excited about Q3 roadmap.' },
  { id:'m11', agent:'Marcus Rivera', phone:'+33 1 23 45 67 89', direction:'inbound',  duration:467, timestamp: ago(5,14,20), status:'done', tags:['complaint','escalation'],         sentiment:'negative', sentiment_score:0.13, call_outcome:'follow-up-required', follow_up_required:true,  key_topics:['Missing feature','Cancellation threat','Custom reporting'],    action_items:['Escalate to product team','Offer 2-month extension','PM call'],  summary:'Cancellation threat over missing reporting feature. De-escalated with 2-month extension.' },
  { id:'m12', agent:'Yuki Tanaka',   phone:'+1 (555) 147-2589', direction:'inbound',  duration:234, timestamp: ago(6,10,55), status:'done', tags:['billing','invoice'],              sentiment:'neutral',  sentiment_score:0.59, call_outcome:'resolved',            follow_up_required:false, key_topics:['Invoice clarification','Overage charges','Plan optimization'], action_items:['Send detailed usage report'],                                    summary:'Overage charge explained. Customer considering plan upgrade.' },
];

function ago(days, h, m) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─── Aircall HTTP helper ───────────────────────────────────────────────────────
function aircallGet(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.aircall.io',
      port: 443,
      path: apiPath,
      method: 'GET',
      rejectUnauthorized: false,  // needed for corporate SSL proxies (Zscaler etc.)
      headers: {
        'Authorization': `Basic ${AIRCALL_AUTH}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Map a raw Aircall call object to our dashboard schema ────────────────────
function mapCall(c) {
  return {
    id:                 String(c.id),
    agent:              c.user?.name  || c.missed_call_reason || 'Unknown Agent',
    phone:              c.raw_digits  || c.contact?.phone_numbers?.[0]?.value || 'Unknown',
    direction:          c.direction   || 'inbound',
    duration:           c.duration    || 0,
    timestamp:          new Date((c.started_at || 0) * 1000).toISOString(),
    status:             c.status      || 'done',
    tags:               (c.tags       || []).map(t => (typeof t === 'string' ? t : t.name)).filter(Boolean),
    sentiment:          'neutral',
    sentiment_score:    0.5,
    call_outcome:       c.status === 'missed' ? 'unresolved' : 'resolved',
    key_topics:         [],
    action_items:       (c.comments   || []).map(cm => cm.content).filter(Boolean),
    follow_up_required: c.status === 'missed',
    summary:            c.recording
      ? 'Recording available. Click "Re-analyze with Claude" for an AI summary.'
      : (c.comments?.length
        ? c.comments.map(cm => cm.content).join(' ')
        : 'No notes recorded. Click "Re-analyze with Claude" to generate an AI summary.'),
    contact_name:       c.contact?.name || null,
    recording:          c.recording || null,
  };
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /api/calls ──────────────────────────────────────────────────────────
  if (url.pathname === '/api/calls' && req.method === 'GET') {
    const from = url.searchParams.get('from') || String(Math.floor(Date.now() / 1000) - 7 * 86400);
    const to   = url.searchParams.get('to')   || String(Math.floor(Date.now() / 1000));

    if (!AIRCALL_API_ID.trim()) {
      // No API ID configured — return mock data immediately
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ source: 'mock', reason: 'AIRCALL_API_ID not set in server.js', calls: MOCK }));
      return;
    }

    try {
      console.log(`→ Fetching Aircall calls from=${from} to=${to}`);
      const result = await aircallGet(`/v1/calls?from=${from}&to=${to}&per_page=50&order=desc`);
      console.log(`← Aircall status: ${result.status}`);

      if (result.status === 200 && Array.isArray(result.data?.calls)) {
        const calls = result.data.calls.map(mapCall);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ source: 'aircall', calls, meta: result.data.meta }));
      } else {
        const reason = JSON.stringify(result.data);
        console.warn('Aircall error:', result.status, reason);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ source: 'mock', reason: `Aircall ${result.status}: ${reason}`, calls: MOCK }));
      }
    } catch (err) {
      console.error('Aircall fetch error:', err.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ source: 'mock', reason: err.message, calls: MOCK }));
    }
    return;
  }

  // ── Static file serving ─────────────────────────────────────────────────────
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, 'public', filePath.replace(/\.\./g, '')); // basic path traversal guard

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   Call Reports Server                     ║');
  console.log(`║   http://localhost:${PORT}/                   ║`);
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Aircall API ID    : ${AIRCALL_API_ID || '(not set — demo mode)'.padEnd(20)}║`);
  console.log(`║   Aircall Token     : ${AIRCALL_API_TOKEN.slice(0, 8)}…${''.padEnd(12)}║`);
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
});
