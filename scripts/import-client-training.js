/**
 * import-client-training.js
 * Reads GP Bookkeeper Training Excel and seeds client training modules into TrainHub.
 * Each sheet → one subject (is_client_training=true) with one topic and steps per task row.
 * Video URLs embedded as TipTap paragraphs so the training player renders them as embeds.
 *
 * Run:
 *   node scripts/import-client-training.js "C:\Users\ChamalAb\Downloads\GP Bookkeeper Training (1).xlsx"
 *
 * Idempotent — skips sheets already imported. Safe to run multiple times.
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')
const XLSX  = require('xlsx')

// ── Load .env.local without requiring dotenv ──────────────────────────────────
const envFile = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const SB_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
const SVC     = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SB_BASE || !SVC) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ── Supabase REST via Node https ──────────────────────────────────────────────

function sbReq(method, urlPath, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : undefined
    const opts = {
      hostname: SB_BASE,
      path: '/rest/v1/' + urlPath,
      method,
      headers: {
        apikey: SVC,
        Authorization: 'Bearer ' + SVC,
        Accept: 'application/json',
        ...(body ? {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          'Content-Length': Buffer.byteLength(body),
        } : {}),
      },
    }
    const r = https.request(opts, res => {
      let d = ''
      res.on('data', c => (d += c))
      res.on('end', () => {
        try { resolve(JSON.parse(d)) } catch { resolve(d) }
      })
    })
    r.on('error', reject)
    if (body) r.write(body)
    r.end()
  })
}

const sbGet  = p      => sbReq('GET',  p)
const sbPost = (p, d) => sbReq('POST', p, d)

// ── TipTap helpers ────────────────────────────────────────────────────────────

function tiptapWithVideo(videoUrl) {
  // Training player auto-converts URL-only text paragraphs into video embeds
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: videoUrl }],
    }],
  }
}

function tiptapText(text) {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text }],
    }],
  }
}

// ── URL extraction ────────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/(?:www\.)?(?:loom\.com\/share\/[^\s"'<>]+|youtube\.com\/watch[^\s"'<>]+|youtu\.be\/[^\s"'<>]+)/

function extractUrl(val) {
  const s = String(val ?? '').trim()
  const m = s.match(URL_RE)
  return m ? m[0] : null
}

function findVideoUrl(row) {
  for (const cell of row) {
    const url = extractUrl(cell)
    if (url) return url
  }
  return null
}

function cleanTitle(raw) {
  // Strip embedded URLs from task titles
  return String(raw ?? '')
    .replace(URL_RE, '')
    .replace(/\s*[-–—]\s*$/, '')
    .trim()
}

// ── Sheet / row filtering ─────────────────────────────────────────────────────

// Sheets that are not client training modules
const SKIP_SHEETS = new Set(['Sheet17', 'Employees', 'Training to Jobs', 'General Training videos'])

const SKIP_ROW_VALUES = new Set([
  'tasks', 'task', 'completed', 'in progress', 'not yet started',
  'pending', 'yes', 'no', 'true', 'false', 'training', 'hands on',
])

function isSkipRow(raw) {
  const lower = String(raw ?? '').trim().toLowerCase()
  return !lower || lower.length < 3 || SKIP_ROW_VALUES.has(lower)
}

// ── Colors (cycle through palette) ───────────────────────────────────────────

const COLORS = [
  '#0891b2', '#0d9488', '#059669', '#7c3aed', '#db2777',
  '#ea580c', '#2563eb', '#16a34a', '#9333ea', '#dc2626',
  '#0284c7', '#0f766e', '#15803d', '#6d28d9', '#be185d',
]

function pickEmoji(name) {
  if (/general/i.test(name)) return '🎥'
  if (/GP|book/i.test(name))  return '📒'
  return '🏢'
}

// ── Extract task rows from a worksheet ───────────────────────────────────────

function extractTasks(ws) {
  const rows  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  const tasks = []

  for (let i = 1; i < rows.length; i++) {
    const row     = rows[i]
    const rawTitle = String(row[0] ?? '').trim()
    if (isSkipRow(rawTitle)) continue

    const urlInTitle = extractUrl(rawTitle)
    const title      = urlInTitle ? cleanTitle(rawTitle) || 'Training video' : rawTitle

    const videoUrl   = findVideoUrl(row) ?? urlInTitle
    tasks.push({ title, videoUrl })
  }

  return tasks
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const xlFile = process.argv[2]
  if (!xlFile) {
    console.error('Usage: node scripts/import-client-training.js "<path-to-xlsx>"')
    process.exit(1)
  }
  if (!fs.existsSync(xlFile)) {
    console.error('File not found:', xlFile)
    process.exit(1)
  }

  console.log('Reading:', xlFile)
  const wb = XLSX.readFile(xlFile)
  console.log(`Sheets: ${wb.SheetNames.length}\n`)

  // Fetch already-imported titles
  const existing = await sbGet('subjects?is_client_training=eq.true&select=title')
  const done = new Set((Array.isArray(existing) ? existing : []).map(s => s.title.trim().toLowerCase()))
  console.log(`Already imported: ${done.size} subjects\n`)

  let colorIdx = 0, created = 0, skipped = 0

  for (const sheetName of wb.SheetNames) {
    const label = `"${sheetName}"`

    if (SKIP_SHEETS.has(sheetName)) {
      console.log(`  --  ${label} (excluded)`)
      continue
    }
    if (/handover/i.test(sheetName)) {
      console.log(`  --  ${label} (handover sheet — skipped)`)
      continue
    }
    if (done.has(sheetName.trim().toLowerCase())) {
      console.log(`  ⏭   ${label} already imported`)
      skipped++
      continue
    }

    const tasks = extractTasks(wb.Sheets[sheetName])
    if (tasks.length === 0) {
      console.log(`  --  ${label} (no task rows found)`)
      continue
    }

    const withVideo = tasks.filter(t => t.videoUrl).length
    const color     = COLORS[colorIdx % COLORS.length]
    colorIdx++

    console.log(`\n→  ${label}: ${tasks.length} tasks, ${withVideo} with video`)

    // Create subject
    const subjectRes = await sbPost('subjects', {
      title:              sheetName.trim(),
      description:        `Client training tasks for ${sheetName}.`,
      emoji:              pickEmoji(sheetName),
      cover_color:        color,
      is_client_training: true,
      order_index:        900 + colorIdx,
    })
    const subject = Array.isArray(subjectRes) ? subjectRes[0] : subjectRes
    if (!subject?.id) {
      console.error(`  ✗ Subject creation failed:`, JSON.stringify(subjectRes).slice(0, 200))
      continue
    }
    console.log(`   subject → ${subject.id}`)

    // Create one topic
    const topicRes = await sbPost('topics', {
      subject_id:  subject.id,
      title:       'Training Tasks',
      order_index: 10,
    })
    const topic = Array.isArray(topicRes) ? topicRes[0] : topicRes
    if (!topic?.id) {
      console.error(`  ✗ Topic creation failed:`, topicRes)
      continue
    }
    console.log(`   topic  → ${topic.id}`)

    // Create steps
    for (let i = 0; i < tasks.length; i++) {
      const { title, videoUrl } = tasks[i]
      const content = videoUrl ? tiptapWithVideo(videoUrl) : tiptapText(title)
      const stepRes = await sbPost('steps', {
        topic_id:    topic.id,
        title,
        order_index: (i + 1) * 10,
        content,
      })
      const step = Array.isArray(stepRes) ? stepRes[0] : stepRes
      if (!step?.id) {
        console.error(`  ✗ Step failed "${title}":`, JSON.stringify(stepRes).slice(0, 100))
        continue
      }
      const icon = videoUrl ? '🎬' : '📋'
      process.stdout.write(`   ${icon} ${title.slice(0, 70)}\n`)
    }

    done.add(sheetName.trim().toLowerCase())
    created++
  }

  console.log(`\n✅  Done — created ${created} subjects, skipped ${skipped}.`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
