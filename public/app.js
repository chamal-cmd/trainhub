// ─── State ────────────────────────────────────────────────────────────────────
let ANTHROPIC_KEY = '433fd2b7a74e0c88ba3291abf465d79d';
let ALL_CALLS     = [];    // all loaded calls for current date range
let filtered      = [];
let dateRange     = 'week';
let sortCol       = 'timestamp';
let sortDir       = 'desc';
let activeSents   = new Set();
let selectedId    = null;
let expandedIds   = new Set();
let chSent        = null;
let chOut         = null;

// ─── Timestamp helpers ────────────────────────────────────────────────────────
function rangeTimestamps(range) {
  const now  = Math.floor(Date.now() / 1000);
  const day  = 86400;
  if (range === 'today') return { from: now - day,     to: now };
  if (range === 'week')  return { from: now - 7*day,   to: now };
  if (range === 'month') return { from: now - 30*day,  to: now };
  return { from: now - 7*day, to: now };
}

// ─── Load calls from server ───────────────────────────────────────────────────
async function loadCalls(range) {
  const { from, to } = rangeTimestamps(range);
  try {
    const resp = await fetch(`/api/calls?from=${from}&to=${to}`);
    if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
    const json = await resp.json();

    // Show banner if on demo data
    const banner = document.getElementById('api-banner');
    const badge  = document.getElementById('source-badge');
    if (json.source === 'aircall') {
      badge.textContent  = 'Live · Aircall';
      badge.className    = 'text-xs font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md';
      banner.classList.add('hidden');
    } else {
      badge.textContent  = 'Demo data';
      badge.className    = 'text-xs font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md';
      if (json.reason) {
        document.getElementById('api-banner-text').textContent =
          `Aircall not connected — showing demo data. Reason: ${json.reason}. ` +
          `To connect, open server.js and set AIRCALL_API_ID + AIRCALL_API_TOKEN, then restart.`;
        banner.classList.remove('hidden');
      }
    }

    return (json.calls || []).map(c => ({
      ...c,
      timestamp: new Date(c.timestamp),
    }));

  } catch (err) {
    console.error('Failed to load calls:', err);
    document.getElementById('source-badge').textContent = 'Offline';
    document.getElementById('api-banner-text').textContent =
      `Could not reach the server: ${err.message}. Make sure server.js is running (node server.js).`;
    document.getElementById('api-banner').classList.remove('hidden');
    return [];
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('inp-key').value = ANTHROPIC_KEY;
  await doRefresh();
});

// ─── Date range ───────────────────────────────────────────────────────────────
function setRange(r) {
  dateRange = r;
  ['today','week','month'].forEach(x => {
    const b = document.getElementById('dr-'+x);
    b.className = x === r
      ? 'dr-btn px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm text-slate-700 transition-all'
      : 'dr-btn px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 transition-all';
  });
  doRefresh();
}

async function doRefresh() {
  // Spin icon
  const icon = document.getElementById('ri');
  icon.style.transition = 'transform .55s ease';
  icon.style.transform  = 'rotate(360deg)';
  setTimeout(() => { icon.style.transition=''; icon.style.transform=''; }, 600);

  // Show loading
  document.getElementById('loading-overlay').classList.remove('hidden');
  document.getElementById('main-content').classList.add('hidden');

  ALL_CALLS = await loadCalls(dateRange);

  // Rebuild agent dropdown
  const agSel = document.getElementById('f-agent');
  const prev  = agSel.value;
  agSel.innerHTML = '<option value="">All Agents</option>';
  [...new Set(ALL_CALLS.map(c => c.agent))].sort().forEach(a => {
    const o = document.createElement('option');
    o.value = a; o.textContent = a;
    agSel.appendChild(o);
  });
  agSel.value = prev;

  document.getElementById('loading-overlay').classList.add('hidden');
  document.getElementById('main-content').classList.remove('hidden');

  applyFilters();
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function toggleSent(s) {
  const btn = document.getElementById('sb-'+s);
  if (activeSents.has(s)) {
    activeSents.delete(s);
    btn.style.outline = '';
  } else {
    activeSents.add(s);
    btn.style.outline = '2px solid currentColor';
    btn.style.outlineOffset = '1px';
  }
  applyFilters();
}

function clearFilters() {
  document.getElementById('f-search').value  = '';
  document.getElementById('f-agent').value   = '';
  document.getElementById('f-outcome').value = '';
  activeSents.clear();
  ['positive','neutral','negative'].forEach(s => {
    document.getElementById('sb-'+s).style.outline = '';
  });
  applyFilters();
}

function applyFilters() {
  const q  = document.getElementById('f-search').value.trim().toLowerCase();
  const ag = document.getElementById('f-agent').value;
  const oc = document.getElementById('f-outcome').value;

  filtered = ALL_CALLS.filter(c => {
    if (ag && c.agent !== ag) return false;
    if (oc && c.call_outcome !== oc) return false;
    if (activeSents.size && !activeSents.has(c.sentiment)) return false;
    if (q) {
      const hay = [c.phone, c.agent, ...(c.key_topics||[]), ...(c.tags||[])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (sortCol === 'timestamp')          { av = av instanceof Date ? av.getTime() : new Date(av).getTime(); bv = bv instanceof Date ? bv.getTime() : new Date(bv).getTime(); }
    if (sortCol === 'follow_up_required') { av = av?1:0; bv = bv?1:0; }
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir==='asc'?-1:1;
    if (av > bv) return sortDir==='asc'?1:-1;
    return 0;
  });

  renderKPIs();
  renderCharts();
  renderTable();
}

// ─── Sort ─────────────────────────────────────────────────────────────────────
function sortBy(col) {
  sortDir = sortCol===col ? (sortDir==='asc'?'desc':'asc') : (col==='timestamp'?'desc':'asc');
  sortCol = col;
  document.querySelectorAll('[id^="si-"]').forEach(el => { el.textContent='↕'; el.className='text-slate-300'; });
  const el = document.getElementById('si-'+col);
  if (el) { el.textContent=sortDir==='asc'?'↑':'↓'; el.className='text-indigo-500'; }
  applyFilters();
}

// ─── Count-up ─────────────────────────────────────────────────────────────────
function countUp(el, target, suffix='', dur=600) {
  const t0 = performance.now();
  (function frame(now) {
    const p = Math.min((now-t0)/dur, 1);
    const e = 1-Math.pow(1-p,3);
    el.textContent = Math.round(target*e) + suffix;
    if (p<1) requestAnimationFrame(frame);
  })(t0);
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
function renderKPIs() {
  const n   = filtered.length;
  const avg = n ? Math.round(filtered.reduce((s,c)=>s+c.duration,0)/n) : 0;
  const pos = filtered.filter(c=>c.sentiment==='positive').length;
  const fu  = filtered.filter(c=>c.follow_up_required).length;

  countUp(document.getElementById('kpi-total'), n);
  countUp(document.getElementById('kpi-pos'),   n ? Math.round(pos/n*100) : 0, '%');
  countUp(document.getElementById('kpi-fu'),    fu);

  const mm=Math.floor(avg/60), ss=String(avg%60).padStart(2,'0');
  document.getElementById('kpi-dur').textContent = `${mm}:${ss}`;
  document.getElementById('kpi-total-sub').textContent =
    `${filtered.filter(c=>c.direction==='inbound').length} in · ${filtered.filter(c=>c.direction==='outbound').length} out`;
  document.getElementById('kpi-pos-sub').textContent  = `${pos} of ${n} calls`;
  document.getElementById('kpi-fu-sub').textContent   =
    `${filtered.filter(c=>c.call_outcome==='unresolved').length} unresolved`;
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function renderCharts() {
  const sc = {
    positive: filtered.filter(c=>c.sentiment==='positive').length,
    neutral:  filtered.filter(c=>c.sentiment==='neutral').length,
    negative: filtered.filter(c=>c.sentiment==='negative').length,
  };
  if (chSent) chSent.destroy();
  chSent = new Chart(document.getElementById('ch-sent').getContext('2d'), {
    type:'doughnut',
    data:{ labels:['Positive','Neutral','Negative'],
      datasets:[{data:[sc.positive,sc.neutral,sc.negative], backgroundColor:['#10b981','#94a3b8','#ef4444'], borderWidth:0, hoverOffset:4}]},
    options:{ cutout:'72%', plugins:{ legend:{display:false},
      tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.raw}`}}},
      animation:{duration:700,easing:'easeOutQuart'}}
  });
  document.getElementById('sent-legend').innerHTML =
    [['Positive','#10b981',sc.positive],['Neutral','#94a3b8',sc.neutral],['Negative','#ef4444',sc.negative]]
    .map(([l,c,n])=>`<div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${c}"></div><span class="text-sm text-slate-600 flex-1">${l}</span><span class="text-sm font-bold text-slate-800">${n}</span></div>`).join('');

  const ok=['resolved','unresolved','follow-up-required','sale-made'];
  const ol=['Resolved','Unresolved','Follow-up','Sale Made'];
  if (chOut) chOut.destroy();
  chOut = new Chart(document.getElementById('ch-out').getContext('2d'), {
    type:'bar',
    data:{ labels:ol, datasets:[{data:ok.map(k=>filtered.filter(c=>c.call_outcome===k).length),
      backgroundColor:['#10b981','#ef4444','#f59e0b','#6366f1'], borderRadius:6, borderSkipped:false}]},
    options:{ plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw} calls`}}},
      scales:{ x:{grid:{display:false},ticks:{font:{size:11},color:'#94a3b8'}},
               y:{beginAtZero:true,ticks:{stepSize:1,font:{size:11},color:'#94a3b8',precision:0},grid:{color:'#f1f5f9'}}},
      animation:{duration:700}}
  });
}

// ─── Table helpers ────────────────────────────────────────────────────────────
const fmt = {
  time: ts => {
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) + ', ' + d.toLocaleDateString([],{month:'short',day:'numeric'});
  },
  dur: s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,
};

function bSent(s) {
  const m={positive:'bg-emerald-50 text-emerald-700',neutral:'bg-slate-100 text-slate-600',negative:'bg-red-50 text-red-600'};
  const i={positive:'↑',neutral:'—',negative:'↓'};
  const label = s||'neutral';
  return `<span class="tag ${m[label]||m.neutral}">${i[label]||'—'} ${label[0].toUpperCase()+label.slice(1)}</span>`;
}
function bOut(o) {
  const m={resolved:'bg-emerald-50 text-emerald-700',unresolved:'bg-red-50 text-red-600','follow-up-required':'bg-amber-50 text-amber-700','sale-made':'bg-indigo-50 text-indigo-700'};
  const l={resolved:'Resolved',unresolved:'Unresolved','follow-up-required':'Follow-up','sale-made':'Sale Made'};
  return `<span class="tag ${m[o]||'bg-slate-100 text-slate-600'}">${l[o]||o}</span>`;
}
function bDir(d) {
  return d==='inbound'
    ? `<span class="flex items-center gap-1 text-xs text-slate-600"><svg class="w-3 h-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>Inbound</span>`
    : `<span class="flex items-center gap-1 text-xs text-slate-600"><svg class="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>Outbound</span>`;
}

// ─── Table render ─────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('tbl-empty');
  if (!filtered.length) { tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = filtered.map(c => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${selectedId===c.id?'row-sel':''}"
        onclick="rowClick(event,'${c.id}')">
      <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">${fmt.time(c.timestamp)}</td>
      <td class="px-4 py-3"><div class="font-medium text-slate-800 text-sm">${c.agent}</div><div class="text-xs text-slate-400">${c.phone}</div></td>
      <td class="px-4 py-3">${bDir(c.direction)}</td>
      <td class="px-4 py-3 text-sm text-slate-700 font-mono">${fmt.dur(c.duration)}</td>
      <td class="px-4 py-3">${bSent(c.sentiment)}</td>
      <td class="px-4 py-3">${bOut(c.call_outcome)}</td>
      <td class="px-4 py-3">${c.follow_up_required?'<span class="tag bg-amber-50 text-amber-600">Yes</span>':'<span class="text-slate-300 text-xs">—</span>'}</td>
      <td class="px-4 py-3">
        <button class="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                onclick="toggleExpand(event,'${c.id}')" title="Expand">
          <svg id="ei-${c.id}" class="w-4 h-4 transition-transform ${expandedIds.has(c.id)?'rotate-180':''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </td>
    </tr>
    ${expandedIds.has(c.id)?`
    <tr class="bg-slate-50 border-b border-slate-100">
      <td colspan="8" class="px-6 py-4">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Key Topics</p>
            <div class="flex flex-wrap gap-1.5">${(c.key_topics||[]).length?c.key_topics.map(t=>`<span class="tag bg-sky-50 text-sky-700">${t}</span>`).join(''):'<span class="text-xs text-slate-400">None recorded yet — re-analyze with Claude</span>'}</div>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Action Items</p>
            ${(c.action_items||[]).length
              ?`<ul class="space-y-1">${c.action_items.map(a=>`<li class="text-xs text-slate-600 flex gap-1.5"><span class="text-indigo-400">•</span>${a}</li>`).join('')}</ul>`
              :'<p class="text-xs text-slate-400">None yet — re-analyze with Claude</p>'}
          </div>
        </div>
      </td>
    </tr>`:''}
  `).join('');
}

function toggleExpand(e,id) {
  e.stopPropagation();
  expandedIds.has(id)?expandedIds.delete(id):expandedIds.add(id);
  renderTable();
}

function rowClick(e,id) {
  if (e.target.closest('button')) return;
  selectedId = id;
  const call = ALL_CALLS.find(c=>c.id===id);
  openPanel(call);
  renderTable();
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function openPanel(c) {
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('hidden');
  panel.classList.add('panel-enter');

  const pct    = Math.round((c.sentiment_score||0.5)*100);
  const barCls = (c.sentiment_score||0.5)>.6?'bg-emerald-500':(c.sentiment_score||0.5)>.4?'bg-slate-400':'bg-red-500';
  const numCls = (c.sentiment_score||0.5)>.6?'text-emerald-400':(c.sentiment_score||0.5)>.4?'text-slate-400':'text-red-400';

  document.getElementById('detail-inner').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <p class="text-sm font-semibold text-white">Call Detail</p>
      <button onclick="closePanel()" class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="bg-slate-800 rounded-xl p-4 mb-4">
      <div class="flex items-start justify-between mb-3">
        <div>
          <p class="text-white font-semibold">${c.agent}</p>
          <p class="text-slate-400 text-sm">${c.phone}</p>
          ${c.contact_name?`<p class="text-slate-500 text-xs mt-0.5">Contact: ${c.contact_name}</p>`:''}
        </div>
        <div class="text-right">
          <p class="text-slate-300 text-xs">${fmt.time(c.timestamp)}</p>
          <p class="text-slate-400 text-xs mt-0.5">${fmt.dur(c.duration)} · ${c.direction}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">${bSent(c.sentiment)}${bOut(c.call_outcome)}${c.follow_up_required?'<span class="tag bg-amber-500/20 text-amber-400">Follow-up needed</span>':''}</div>
    </div>

    <div class="mb-4">
      <div class="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>Sentiment score</span><span class="${numCls} font-semibold">${pct}%</span>
      </div>
      <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full ${barCls} transition-all duration-700" style="width:${pct}%"></div>
      </div>
    </div>

    ${(c.tags||[]).length?`<div class="mb-4">
      <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Tags</p>
      <div class="flex flex-wrap gap-1.5">${c.tags.map(t=>`<span class="tag bg-slate-700 text-slate-300">${t}</span>`).join('')}</div>
    </div>`:''}

    <div class="mb-4">
      <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Summary</p>
      <div class="bg-slate-800 rounded-xl p-3">
        <p class="text-sm text-slate-300 leading-relaxed">${c.summary||'No summary — click Re-analyze below.'}</p>
      </div>
    </div>

    ${(c.key_topics||[]).length?`<div class="mb-4">
      <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Key Topics</p>
      <div class="flex flex-wrap gap-1.5">${c.key_topics.map(t=>`<span class="tag bg-indigo-500/20 text-indigo-300">${t}</span>`).join('')}</div>
    </div>`:''}

    ${(c.action_items||[]).length?`<div class="mb-5">
      <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Action Items</p>
      <ul class="space-y-2">${c.action_items.map(a=>`<li class="flex items-start gap-2 text-sm text-slate-300"><span class="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>${a}</li>`).join('')}</ul>
    </div>`:''}

    <div class="mt-auto pt-2">
      <button id="reanalyze-btn" onclick="reanalyze('${c.id}')"
        class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.4 3.4 0 01-4.8 0l-.347-.347z"/></svg>
        Re-analyze with Claude
      </button>
      <div id="claude-box" class="hidden mt-3">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <p class="text-xs font-medium text-indigo-400">Claude's Analysis</p>
        </div>
        <div id="claude-text" class="bg-slate-800 rounded-xl p-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[2rem]"></div>
      </div>
    </div>
  `;
}

function closePanel() {
  document.getElementById('detail-panel').classList.add('hidden');
  selectedId = null;
  renderTable();
}

// ─── Claude streaming re-analysis ─────────────────────────────────────────────
async function reanalyze(id) {
  const c = ALL_CALLS.find(x=>x.id===id);
  if (!c) return;

  if (!ANTHROPIC_KEY.trim()) {
    alert('Enter your Anthropic API key in Settings (⚙).');
    openSettings(); return;
  }

  const btn    = document.getElementById('reanalyze-btn');
  const box    = document.getElementById('claude-box');
  const textEl = document.getElementById('claude-text');

  btn.disabled  = true;
  btn.innerHTML = `<svg class="w-4 h-4 spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Analyzing…`;
  box.classList.remove('hidden');
  textEl.textContent = '';
  textEl.classList.add('cursor-blink');

  const prompt = `You are a customer-service QA analyst reviewing a call record.

Produce exactly three labeled sections:

**Summary** — 2-3 sentences on what happened in the call.
**Sentiment** — State positive / neutral / negative with a one-line justification. Note if the current label (${c.sentiment}, ${Math.round((c.sentiment_score||0.5)*100)}%) should change.
**Recommended Actions** — 1-2 concrete, agent-specific follow-up steps.

Call data:
- Agent: ${c.agent}
- Direction: ${c.direction}
- Duration: ${fmt.dur(c.duration)}
- Outcome: ${c.call_outcome}
- Tags: ${(c.tags||[]).join(', ')||'none'}
- Current topics: ${(c.key_topics||[]).join(', ')||'none recorded'}
- Existing notes/actions: ${(c.action_items||[]).join('; ')||'none'}
- Current summary: ${c.summary}

Keep total response under 300 words.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        stream: true,
        messages: [{ role:'user', content:prompt }]
      })
    });

    if (!resp.ok) { const e=await resp.text(); throw new Error(`${resp.status}: ${e}`); }

    textEl.classList.remove('cursor-blink');
    const reader = resp.body.getReader();
    const dec    = new TextDecoder();
    let buf      = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value,{stream:true});
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw==='[DONE]') break;
        try {
          const p = JSON.parse(raw);
          if (p.type==='content_block_delta' && p.delta?.type==='text_delta') {
            textEl.textContent += p.delta.text;
            document.getElementById('detail-panel').scrollTop = 9999;
          }
        } catch {}
      }
    }
  } catch (err) {
    textEl.classList.remove('cursor-blink');
    textEl.textContent = `⚠ ${err.message}`;
    textEl.style.color = '#fca5a5';
  } finally {
    btn.disabled  = false;
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Re-analyze with Claude`;
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function openSettings() {
  document.getElementById('inp-key').value = ANTHROPIC_KEY;
  document.getElementById('settings-modal').classList.remove('hidden');
}
function closeSettings() { document.getElementById('settings-modal').classList.add('hidden'); }
function saveSettings() {
  ANTHROPIC_KEY = document.getElementById('inp-key').value.trim();
  const btn = document.getElementById('save-btn');
  btn.textContent='Saved!';
  btn.classList.replace('bg-indigo-600','bg-emerald-600');
  btn.classList.replace('hover:bg-indigo-700','hover:bg-emerald-700');
  setTimeout(()=>{ btn.textContent='Save'; btn.classList.replace('bg-emerald-600','bg-indigo-600'); btn.classList.replace('hover:bg-emerald-700','hover:bg-indigo-700'); closeSettings(); },1000);
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function doExport() {
  const hdr = ['ID','Timestamp','Agent','Phone','Direction','Duration_sec','Sentiment','Sentiment_Score','Outcome','Follow_up','Tags','Key_Topics','Action_Items'];
  const rows = filtered.map(c => [
    c.id, (c.timestamp instanceof Date?c.timestamp:new Date(c.timestamp)).toISOString(),
    `"${c.agent}"`, c.phone, c.direction, c.duration,
    c.sentiment, c.sentiment_score||0.5, c.call_outcome,
    c.follow_up_required?'Yes':'No',
    `"${(c.tags||[]).join('; ')}"`,
    `"${(c.key_topics||[]).join('; ')}"`,
    `"${(c.action_items||[]).join('; ')}"`
  ]);
  const csv  = [hdr,...rows].map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`call-report-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
