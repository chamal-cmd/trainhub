/**
 * fix-missing-videos.js
 *
 * Rescans the Excel file using BOTH plain-text cell values AND Excel hyperlinks.
 * For already-imported subjects: patches steps that are missing video attachments.
 * For sheets not yet imported: creates the subject/topic/steps.
 *
 * Run:
 *   node scripts/fix-missing-videos.js "C:\Users\ChamalAb\Downloads\GP Bookkeeper Training (1).xlsx"
 */

const https  = require('https')
const fs     = require('fs')
const path   = require('path')
const xlsx   = require('xlsx')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co'
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const ADMIN   = 'ba75f37f-e8ce-4c70-b9b6-8e2c09c4c81f'

if (!SB_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

// ── REST helpers ──────────────────────────────────────────────────────────────

function req(method, urlPath, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : undefined
    const opts = {
      hostname: SB_BASE,
      path: '/rest/v1/' + urlPath,
      method,
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Accept: 'application/json' },
    }
    if (body) {
      opts.headers['Content-Type']  = 'application/json'
      opts.headers['Prefer']        = 'return=representation'
      opts.headers['Content-Length'] = Buffer.byteLength(body)
    }
    const r = https.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } })
    })
    r.on('error', reject)
    if (body) r.write(body)
    r.end()
  })
}

const get    = p      => req('GET',   p)
const post   = (p, d) => req('POST',  p, d)
const patch  = (p, d) => req('PATCH', p, d)

// ── TipTap helpers ────────────────────────────────────────────────────────────

const txt  = (t, marks = []) => ({ type: 'text', text: t, ...(marks.length ? { marks } : {}) })
const bold = t => txt(t, [{ type: 'bold' }])
const p    = (...c) => ({ type: 'paragraph', content: c })
const doc  = (...nodes) => ({ type: 'doc', content: nodes })

function makeStepContent(taskName, frequency, videoUrl) {
  const nodes = []
  if (frequency) nodes.push(p(bold('Frequency: '), txt(frequency)))
  const content = doc(...(nodes.length ? nodes : [p(txt('Watch the training video for this task.'))]))
  if (videoUrl) content.attachments = [{ type: 'video_url', url: normalizeUrl(videoUrl), name: taskName }]
  return content
}

function normalizeUrl(url) {
  url = url.trim()
  if (!url.startsWith('http')) url = 'https://' + url
  // ensure www. for loom URLs
  if (url.includes('loom.com') && !url.includes('www.loom.com')) {
    url = url.replace('loom.com', 'www.loom.com')
  }
  return url
}

// ── Skip list ─────────────────────────────────────────────────────────────────

const SKIP_SHEETS = new Set([
  'General Training videos', 'Sheet17', 'Employees',
  'FTE Capacity', 'Training to Jobs', 'M3',
])

// ── Colors ────────────────────────────────────────────────────────────────────

const COLORS = [
  '#0891b2','#0d9488','#059669','#7c3aed','#db2777',
  '#ea580c','#2563eb','#16a34a','#9333ea','#dc2626',
  '#0284c7','#0f766e','#15803d','#6d28d9','#be185d',
]

// ── Extract all hyperlinks from a sheet, keyed by row index ───────────────────

function getRowHyperlinks(ws) {
  const byRow = {}
  for (const [cellRef, cell] of Object.entries(ws)) {
    if (cellRef.startsWith('!') || !cell || !cell.l || !cell.l.Target) continue
    const decoded = xlsx.utils.decode_cell(cellRef)
    if (!byRow[decoded.r]) byRow[decoded.r] = []
    byRow[decoded.r].push(cell.l.Target)
  }
  return byRow
}

// ── Extract tasks from a sheet using BOTH plain text AND hyperlinks ───────────

const SKIP_VALUES = new Set(['not yet started','in progress','completed','yes','no','true','false',''])
const META_STARTS = ['entity/', 'xero file', 'splashtop', 'best practice', 'status legend', 'colour legend']
const VIDEO_HOSTS = ['loom.com', 'youtube.com', 'youtu.be']

function isVideoUrl(str) {
  return VIDEO_HOSTS.some(h => str.includes(h))
}

function extractTasks(ws) {
  const range = xlsx.utils.decode_range(ws['!ref'] || 'A1:A1')
  const rowHyperlinks = getRowHyperlinks(ws)
  const tasks = []

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    // Get cell values for this row
    const rowVals = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[xlsx.utils.encode_cell({ r, c })]
      rowVals.push(cell ? String(cell.v ?? '') : '')
    }

    const taskRaw = rowVals[0].trim()
    if (!taskRaw) continue
    if (SKIP_VALUES.has(taskRaw.toLowerCase())) continue
    if (META_STARTS.some(m => taskRaw.toLowerCase().startsWith(m))) break
    if (taskRaw.length < 3) continue

    // Find video URL: check plain text first, then hyperlinks
    let videoUrl = ''
    for (const v of rowVals) {
      if (isVideoUrl(v)) { videoUrl = v.trim(); break }
    }
    if (!videoUrl) {
      for (const target of (rowHyperlinks[r] ?? [])) {
        if (isVideoUrl(target)) { videoUrl = normalizeUrl(target); break }
      }
    }

    // Find frequency/remarks
    let frequency = ''
    for (let i = 2; i <= 5; i++) {
      const v = (rowVals[i] ?? '').trim()
      if (v && !SKIP_VALUES.has(v.toLowerCase()) &&
          !isVideoUrl(v) && !/^(completed|started|progress)$/i.test(v)) {
        frequency = v; break
      }
    }

    tasks.push({ task: taskRaw, frequency, videoUrl })
  }

  return tasks
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const xlFile = process.argv[2]
  if (!xlFile || !fs.existsSync(xlFile)) {
    console.error('Usage: node scripts/fix-missing-videos.js <path-to-excel>')
    process.exit(1)
  }

  console.log('Reading Excel:', xlFile)
  const wb = xlsx.readFile(xlFile, { cellFormula: false })

  // Load all existing client training subjects with their topics + steps
  const existing = await get('subjects?is_client_training=eq.true&select=id,title,topics(id,steps(id,title,content,order_index))')
  const existingMap = {}
  for (const s of (Array.isArray(existing) ? existing : [])) {
    existingMap[s.title.toLowerCase().trim()] = s
  }
  console.log(`Existing client training subjects: ${Object.keys(existingMap).length}`)

  let colorIdx = Object.keys(existingMap).length % COLORS.length
  let updated = 0, created = 0, skipped = 0, videoPatched = 0

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) continue

    const ws    = wb.Sheets[sheetName]
    const tasks = extractTasks(ws)

    const tasksWithVideo = tasks.filter(t => t.videoUrl)
    if (tasksWithVideo.length === 0) {
      console.log(`  ⚪ Skipping "${sheetName}" — no video links found`)
      skipped++
      continue
    }

    const title   = sheetName.trim()
    const titleLC = title.toLowerCase()
    const subj    = existingMap[titleLC]

    if (!subj) {
      // ── NEW subject — create from scratch ──────────────────────────────────
      console.log(`\n➕ Creating NEW subject "${title}" (${tasks.length} tasks, ${tasksWithVideo.length} with video)`)

      const color = COLORS[colorIdx++ % COLORS.length]
      const subRes = await post('subjects', {
        title,
        description: `Client training module for ${title}.`,
        emoji: '🏥',
        cover_color: color,
        is_client_training: true,
        created_by: ADMIN,
        order_index: 900 + colorIdx,
      })
      const sub = Array.isArray(subRes) ? subRes[0] : subRes
      if (!sub?.id) { console.error('  ✗ Subject failed:', JSON.stringify(subRes).slice(0, 200)); continue }

      const topicRes = await post('topics', { subject_id: sub.id, title: 'Training Tasks', order_index: 10 })
      const topic    = Array.isArray(topicRes) ? topicRes[0] : topicRes
      if (!topic?.id) { console.error('  ✗ Topic failed:', topicRes); continue }

      for (let i = 0; i < tasks.length; i++) {
        const { task, frequency, videoUrl } = tasks[i]
        const stepRes = await post('steps', {
          topic_id: topic.id, title: task, order_index: (i + 1) * 10,
          content: makeStepContent(task, frequency, videoUrl),
        })
        const step = Array.isArray(stepRes) ? stepRes[0] : stepRes
        if (!step?.id) { console.error(`  ✗ Step failed for "${task}":`, stepRes); continue }
        console.log(`  ${videoUrl ? '🎬' : '📋'}  ${task.slice(0, 60)}`)
      }

      existingMap[titleLC] = { id: sub.id }
      created++
      continue
    }

    // ── EXISTING subject — patch missing videos ────────────────────────────────
    console.log(`\n🔄 Updating "${title}"`)

    const topic = subj.topics?.[0]
    if (!topic) { console.log(`  ⚠️  No topics found`); continue }

    // Build a map of existing steps by normalised title
    const stepByTitle = {}
    for (const s of (topic.steps ?? [])) {
      stepByTitle[s.title.toLowerCase().trim()] = s
    }

    let patchedThisSubj = 0
    let addedSteps = 0

    for (let i = 0; i < tasks.length; i++) {
      const { task, frequency, videoUrl } = tasks[i]
      if (!videoUrl) continue  // nothing to update

      const key  = task.toLowerCase().trim()
      const step = stepByTitle[key]

      if (!step) {
        // Step doesn't exist at all — create it
        const stepRes = await post('steps', {
          topic_id: topic.id, title: task,
          order_index: (topic.steps?.length + addedSteps + 1) * 10,
          content: makeStepContent(task, frequency, videoUrl),
        })
        const newStep = Array.isArray(stepRes) ? stepRes[0] : stepRes
        if (newStep?.id) {
          addedSteps++
          console.log(`  ➕ Added new step: ${task.slice(0, 60)}`)
        }
        continue
      }

      // Check if it already has a video
      const existingAtts = step.content?.attachments ?? []
      const hasVideo = existingAtts.some(a => a.type === 'video_url' && a.url)
      if (hasVideo) continue  // already has video, skip

      // Patch: add the video attachment
      const newContent = {
        ...step.content,
        attachments: [{ type: 'video_url', url: videoUrl, name: task }],
      }
      await patch(`steps?id=eq.${step.id}`, { content: newContent })
      patchedThisSubj++
      videoPatched++
      console.log(`  🎬 Patched video for: ${task.slice(0, 60)}`)
    }

    if (patchedThisSubj === 0 && addedSteps === 0) {
      console.log(`  ✓ Already up to date`)
    } else {
      console.log(`  ✓ Patched ${patchedThisSubj} steps, added ${addedSteps} new steps`)
    }
    updated++
  }

  console.log(`\n✅ Done!`)
  console.log(`   Created: ${created} new subjects`)
  console.log(`   Updated: ${updated} existing subjects`)
  console.log(`   Videos patched: ${videoPatched}`)
  console.log(`   Skipped (no videos): ${skipped}`)
}

main().catch(err => { console.error(err); process.exit(1) })
