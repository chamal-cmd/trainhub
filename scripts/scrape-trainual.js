/**
 * Trainual → TrainHub Scraper  v6 — Network Intercept Edition
 * Intercepts actual Trainual API responses during page navigation.
 * node scripts/scrape-trainual.js
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const readline = require('readline');

const SLUG        = '40a899e7-96d4-4180-b8d2-c0ab2cab0fe2';
const BASE        = `https://app.trainual.com/${SLUG}`;
const OUTPUT_JSON = path.join(__dirname, 'trainual-data.json');
const OUTPUT_SQL  = path.join(__dirname, 'trainual-import.sql');

function prompt(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a); }));
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function sqlStr(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function sqlJson(o) {
  if (o == null) return "'{}'::jsonb";
  return "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb";
}

// ── Parse topics/steps out of any Trainual API response ───────────────────────
function parseTopicsFromResponses(responses) {
  const topics = [];

  for (const [url, data] of Object.entries(responses)) {
    // Pattern: curriculum detail with topics array
    const currData = data?.data?.curriculum || data?.data?.subject || data?.data;
    const topicsArr =
      data?.data?.topics ||
      currData?.topics ||
      data?.topics ||
      (Array.isArray(data?.data) ? data.data : null);

    if (topicsArr && Array.isArray(topicsArr)) {
      for (const t of topicsArr) {
        const topicId   = t.id || t.element_id;
        const topicTitle = t.title || t.name || '';
        const stepsArr  = t.steps || t.step_items || [];
        if (topicTitle) {
          topics.push({
            id: topicId,
            title: topicTitle,
            steps: stepsArr.map((s, si) => ({
              id: s.id || s.element_id,
              title: s.title || s.name || `Step ${si + 1}`,
              html:  s.content_body || s.body || s.content || s.html || '',
              text:  s.text || '',
              order: si,
            })),
          });
        }
      }
    }

    // Pattern: single topic with steps
    const singleTopic = data?.data?.topic;
    if (singleTopic?.id) {
      const existingIdx = topics.findIndex(t => t.id === singleTopic.id);
      const steps = (singleTopic.steps || singleTopic.step_items || []).map((s, si) => ({
        id: s.id || s.element_id,
        title: s.title || s.name || `Step ${si + 1}`,
        html:  s.content_body || s.body || s.content || s.html || '',
        text:  s.text || '',
        order: si,
      }));
      if (existingIdx >= 0) {
        if (steps.length > topics[existingIdx].steps.length) topics[existingIdx].steps = steps;
      } else if (singleTopic.title) {
        topics.push({ id: singleTopic.id, title: singleTopic.title, steps });
      }
    }

    // Pattern: jsonapi format  {data: {type: "Topic", attributes: {...}, relationships: {...}}}
    if (data?.data?.type === 'Topic' || data?.data?.attributes?.title) {
      const attrs = data.data.attributes || {};
      const rel   = data.data.relationships || {};
      // steps might be in included array
      const included = data.included || [];
      const steps = included
        .filter(inc => inc.type === 'Step' || inc.type === 'StepItem')
        .map((s, si) => ({
          id: s.id,
          title: s.attributes?.title || `Step ${si + 1}`,
          html:  s.attributes?.content_body || s.attributes?.body || '',
          text:  s.attributes?.text || '',
          order: si,
        }));
      if (attrs.title) {
        topics.push({ id: data.data.id, title: attrs.title, steps });
      }
    }
  }

  return topics;
}

// ── Parse step content out of a response ─────────────────────────────────────
function parseStepContent(data) {
  const s = data?.data?.step || data?.data?.step_item || data?.data;
  if (!s) return null;
  return {
    id: s.id,
    title: s.title || s.name || '',
    html:  s.content_body || s.body || s.content || s.html || '',
    text:  s.text || '',
  };
}

// ── Get current page content via DOM ─────────────────────────────────────────
async function getPageContent(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')?.innerText?.trim() || '';
    const body = document.querySelector(
      '.tiptap, .ProseMirror, [class*="step-content"], [class*="StepContent"], [class*="content-body"], article, [class*="editor"], [class*="Editor"]'
    );
    return {
      title: h1,
      html:  body?.innerHTML || '',
      text:  body?.innerText?.trim() || '',
    };
  });
}

// ── Fetch via in-browser fetch (uses auth cookies) ────────────────────────────
async function apiFetch(page, url) {
  return page.evaluate(async (u) => {
    try {
      const res = await fetch(u, {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!res.ok) return { _error: res.status };
      return await res.json();
    } catch (e) { return { _error: e.message }; }
  }, url);
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Trainual → TrainHub  v6 (Network Intercept) ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── Use existing Chrome Profile 1 session (already logged into Trainual) ────
  const CHROME_PROFILE_SRC = path.join(
    process.env.LOCALAPPDATA || 'C:\\Users\\ChamalAb\\AppData\\Local',
    'Google', 'Chrome', 'User Data', 'Profile 1'
  );
  const CHROME_PROFILE_TMP = path.join(require('os').tmpdir(), 'trainual-chrome-profile');

  // Kill any Chrome processes that might lock the profile
  try { require('child_process').execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' }); } catch {}
  await sleep(1500);

  // Copy profile to temp to avoid lock issues
  console.log('📋 Copying Chrome profile...');
  if (fs.existsSync(CHROME_PROFILE_TMP)) {
    fs.rmSync(CHROME_PROFILE_TMP, { recursive: true, force: true });
  }
  fs.mkdirSync(CHROME_PROFILE_TMP, { recursive: true });
  require('child_process').execSync(
    `xcopy /E /I /Q /H "${CHROME_PROFILE_SRC}" "${CHROME_PROFILE_TMP}"`,
    { stdio: 'ignore' }
  );
  console.log('✅ Profile copied.\n');

  // Launch with persistent context using the copied profile
  const ctx  = await chromium.launchPersistentContext(CHROME_PROFILE_TMP, {
    headless: false,
    slowMo: 20,
    channel: 'chrome',   // use real Chrome so session cookies work
    args: ['--no-first-run', '--no-default-browser-check'],
  }).catch(async () => {
    // Fallback: launch fresh browser and ask for manual login
    console.log('⚠️  Could not use Chrome profile — launching fresh browser.');
    const b = await chromium.launch({ headless: false, slowMo: 20 });
    return b.newContext();
  });

  const page = ctx.pages?.()[0] || await ctx.newPage();

  // ── Global response capture ─────────────────────────────────────────────────
  const globalCapture = {};
  page.on('response', async (resp) => {
    const u = resp.url();
    if (!u.includes('/ajax/') && !u.includes('/api/')) return;
    if (u.includes('px.ads') || u.includes('analytics') || u.includes('datadog')) return;
    try {
      const json = await resp.json();
      globalCapture[u] = json;
    } catch {}
  });

  // ── Navigate to Trainual (should already be logged in) ──────────────────────
  console.log('🔗 Opening Trainual...');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await sleep(4000);

  if (page.url().includes('sign_in') || page.url().includes('login')) {
    console.log('⚠️  Session expired. Please log in manually in the browser window.');
    await prompt('▶  Press ENTER once on the dashboard: ');
  }
  console.log(`✅ Session active → ${page.url()}\n`);
  await sleep(2000);

  // ── Step 1: Get subjects list ───────────────────────────────────────────────
  console.log('📚 Fetching subjects...');
  const allSubjects = [];
  for (let pg = 1; pg <= 10; pg++) {
    const data = await apiFetch(page,
      `${BASE}/ajax/interactive_dashboard/user_curriculums?page=${pg}&per_page=50&filter_kind=all&sort_col=default_sorting&view_kind=all_content`
    );
    const items = data?.data?.user_curriculums || [];
    if (items.length === 0) break;
    allSubjects.push(...items);
    console.log(`   Page ${pg}: ${items.length} subjects`);
    if (items.length < 50) break;
  }
  // Also grab completed
  const comp = await apiFetch(page,
    `${BASE}/ajax/interactive_dashboard/user_curriculums?page=1&per_page=50&filter_kind=completed&view_kind=all_content`
  );
  (comp?.data?.user_curriculums || []).forEach(c => {
    if (!allSubjects.find(x => x.id === c.id)) allSubjects.push(c);
  });
  console.log(`   Total: ${allSubjects.length} subjects\n`);

  // ── Step 2: Go to dashboard and click through each subject ────────────────────
  console.log('🏠 Loading dashboard...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await sleep(3000);

  const fullData = [];

  for (let i = 0; i < allSubjects.length; i++) {
    const subj = allSubjects[i];
    console.log(`\n📖 [${i+1}/${allSubjects.length}] "${subj.title}" (id:${subj.id})`);

    // Per-subject response capture
    const subjResponses = {};
    const handler = async (resp) => {
      const u = resp.url();
      if (!u.includes('/ajax/') && !u.includes('/api/')) return;
      if (u.includes('px.ads') || u.includes('analytics') || u.includes('datadog') || u.includes('hightouch')) return;
      try {
        const json = await resp.json();
        if (json && !json._error) subjResponses[u] = json;
      } catch {}
    };
    page.on('response', handler);

    // Go back to dashboard then CLICK the subject link — real React navigation, no 404
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(2000);

    // Find and click the subject link by its ID in the href
    const subjectLink = page.locator(`a[href*="/subjects/${subj.id}"]`).first();
    const found = await subjectLink.count();
    if (found > 0) {
      console.log(`   → Clicking subject card...`);
      await subjectLink.click();
    } else {
      // Fallback: try finding by title text
      const byTitle = page.locator(`text="${subj.title}"`).first();
      const foundByTitle = await byTitle.count();
      if (foundByTitle > 0) {
        console.log(`   → Clicking by title...`);
        await byTitle.click();
      } else {
        console.log(`   ⚠️ Could not find subject link on dashboard, skipping`);
        page.off('response', handler);
        fullData.push({ id: subj.id, elementId: subj.element_id, title: subj.title, emoji: subj.emoji || '📚', topics: [] });
        continue;
      }
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await sleep(3000);

    page.off('response', handler);

    page.off('response', handler);

    // ── Collect all topic links visible on the subject page ─────────────────
    const topicLinks = await page.evaluate(() => {
      const seen = new Set();
      const result = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if ((href.includes('/topics/') || href.includes('/steps/')) && !seen.has(href)) {
          seen.add(href);
          result.push({ href, label: a.innerText?.trim() || '' });
        }
      });
      return result;
    });
    console.log(`   Found ${topicLinks.length} topic/step links on subject page`);

    const topicsWithContent = [];

    for (const tLink of topicLinks) {
      const topicUrl = tLink.href.startsWith('http')
        ? tLink.href
        : `https://app.trainual.com${tLink.href}`;

      console.log(`\n   📂 Clicking topic: ${tLink.label || tLink.href}`);

      // Click the topic link (already on subject page — React navigation)
      const topicAnchor = page.locator(`a[href="${tLink.href}"]`).first();
      const exists = await topicAnchor.count();
      if (exists > 0) {
        await topicAnchor.click();
      } else {
        await page.goto(topicUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      }
      await page.waitForLoadState('networkidle').catch(() => {});
      await sleep(2000);

      // ── Grab all step links inside this topic ────────────────────────────
      const stepLinks = await page.evaluate(() => {
        const seen = new Set();
        const result = [];
        document.querySelectorAll('a[href*="/steps/"]').forEach(a => {
          const href = a.getAttribute('href') || '';
          if (!seen.has(href)) {
            seen.add(href);
            result.push({ href, label: a.innerText?.trim() || '' });
          }
        });
        return result;
      });
      console.log(`      Found ${stepLinks.length} steps`);

      const topicTitle = await page.evaluate(() =>
        document.querySelector('h1, h2, [class*="topic-title"], [class*="TopicTitle"]')?.innerText?.trim() || ''
      );

      const steps = [];

      if (stepLinks.length === 0) {
        // No separate step links — capture the content right here on this page
        const content = await getPageContent(page);
        if (content.text.length > 20) {
          console.log(`      📄 (inline content) "${content.title}" — ${content.text.substring(0, 60).replace(/\n/g,' ')}...`);
          steps.push({ title: content.title || tLink.label, html: content.html, text: content.text, order: 0 });
        }
      } else {
        // Click into each step
        for (let si = 0; si < stepLinks.length; si++) {
          const sLink = stepLinks[si];
          const stepUrl = sLink.href.startsWith('http')
            ? sLink.href
            : `https://app.trainual.com${sLink.href}`;

          const stepAnchor = page.locator(`a[href="${sLink.href}"]`).first();
          const stepExists = await stepAnchor.count();
          if (stepExists > 0) {
            await stepAnchor.click();
          } else {
            await page.goto(stepUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
          }
          await page.waitForLoadState('networkidle').catch(() => {});
          await sleep(1500);

          const content = await getPageContent(page);
          const stepTitle = content.title || sLink.label || `Step ${si + 1}`;
          console.log(`      📄 "${stepTitle}" — ${content.text.substring(0, 60).replace(/\n/g,' ')}...`);
          steps.push({ title: stepTitle, html: content.html, text: content.text, order: si });

          // Go back to topic page for the next step (if there are more)
          if (si < stepLinks.length - 1) {
            await page.goBack().catch(() => {});
            await sleep(1000);
          }
        }
      }

      topicsWithContent.push({
        title: topicTitle || tLink.label || `Topic ${topicsWithContent.length + 1}`,
        steps,
      });

      // Go back to subject page for the next topic
      await page.goBack().catch(async () => {
        // If back fails, re-navigate to the subject
        const subjectLink = page.locator(`a[href*="/subjects/${subj.id}"]`).first();
        if (await subjectLink.count() > 0) await subjectLink.click();
        else await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
      });
      await sleep(1500);
    }

    if (topicLinks.length === 0) {
      // Subject page itself might have inline content (no separate topics)
      const inline = await getPageContent(page);
      if (inline.text.length > 20) {
        topicsWithContent.push({
          title: 'Content',
          steps: [{ title: inline.title || subj.title, html: inline.html, text: inline.text, order: 0 }]
        });
      } else {
        console.log(`   ⚠️  No topic links or inline content found on this subject.`);
      }
    }

    fullData.push({
      id:        subj.id,
      elementId: subj.element_id,
      title:     subj.title,
      emoji:     subj.emoji || '📚',
      topics:    topicsWithContent,
    });

    // Save progress after each subject
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(fullData, null, 2));
  }

  // ── Step 3: Summary ─────────────────────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════');
  console.log('📊 RESULTS:');
  const totalTopics = fullData.reduce((s, sub) => s + sub.topics.length, 0);
  const totalSteps  = fullData.reduce((s, sub) => s + sub.topics.reduce((ss, t) => ss + t.steps.length, 0), 0);
  console.log(`   Subjects : ${fullData.length}`);
  console.log(`   Topics   : ${totalTopics}`);
  console.log(`   Steps    : ${totalSteps}`);
  console.log('════════════════════════════════════════\n');

  fullData.forEach(sub => {
    console.log(`\n  📖 ${sub.title}`);
    sub.topics.forEach(t => {
      console.log(`     📂 ${t.title} (${t.steps.length} steps)`);
      t.steps.forEach(s => console.log(`        📄 ${s.title} (${(s.text||'').length} chars)`));
    });
  });

  // ── Step 4: Generate SQL ─────────────────────────────────────────────────────
  if (totalTopics > 0 || totalSteps > 0) {
    const lines = [
      '-- Trainual → TrainHub Import',
      `-- Generated: ${new Date().toISOString()}`,
      '',
      'DO $$ DECLARE admin_id UUID; BEGIN',
      "  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;",
      '',
    ];

    for (const sub of fullData) {
      const sid = uuid();
      lines.push(`  -- Subject: ${sub.title}`);
      lines.push(`  INSERT INTO subjects (id,title,emoji,created_by) VALUES ('${sid}',${sqlStr(sub.title)},${sqlStr(sub.emoji)},admin_id) ON CONFLICT (id) DO NOTHING;`);
      sub.topics.forEach((t, ti) => {
        const tid = uuid();
        lines.push(`  INSERT INTO topics (id,subject_id,title,order_index) VALUES ('${tid}','${sid}',${sqlStr(t.title)},${ti}) ON CONFLICT (id) DO NOTHING;`);
        t.steps.forEach((s, si) => {
          const stid = uuid();
          lines.push(`  INSERT INTO steps (id,topic_id,title,content,order_index) VALUES ('${stid}','${tid}',${sqlStr(s.title)},${sqlJson({html:s.html,text:s.text})},${si}) ON CONFLICT (id) DO NOTHING;`);
        });
      });
      lines.push('');
    }

    lines.push('END $$;');
    fs.writeFileSync(OUTPUT_SQL, lines.join('\n'));
    console.log(`\n💾 SQL  → ${OUTPUT_SQL}`);
  } else {
    console.log('\n⚠️  No topics/steps found — SQL not generated.');
    console.log('   Check the terminal output above for which API URLs were captured,');
    console.log('   then share that info so we can target the right endpoints.\n');
  }

  console.log(`💾 JSON → ${OUTPUT_JSON}`);
  console.log('\n✅ Done!');
  await prompt('▶  Press ENTER to close browser: ');
  await browser.close();
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
