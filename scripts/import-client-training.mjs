// Import client training content from GP Bookkeeper Training.xlsx into Supabase
// Run: node scripts/import-client-training.mjs

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const xlsx = require('xlsx')

const SB_URL = 'https://yqefhohpfdcfripuswpw.supabase.co'
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SVC) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var first')
  process.exit(1)
}

const EXCEL_PATH = 'C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx'

// Sheets that are client training trackers (whitelist)
const CLIENT_SHEETS = [
  'M3', 'GP Book', 'GDMC', 'SMC', 'Riverstone', 'Northeast',
  'Rural', 'KFMP', 'Karis Medical', 'GHFP & Nurture',
  'Top Health - Nidusha', 'Ocean Grove - Peter', 'Niroga - Anj',
  'Kims Entities - Shiv', 'Clinic Academy', 'Mokare', 'Matt C.',
  'Springs', 'Plantagenet Medical',
]

// Status words to skip as task names
const STATUS_WORDS = new Set([
  'completed', 'not yet started', 'in progress', 'training', 'hands on',
  'remarks', 'tasks', 'task', '', 'done', 'ongoing',
])

const LOOM_RE    = /https?:\/\/(www\.)?loom\.com\/share\/[\w?&=%.-]+/gi
const YOUTUBE_RE = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+)/gi

function extractVideoUrl(cells) {
  const text = cells.join(' ')
  const loom = text.match(LOOM_RE)
  if (loom) return loom[0].split('?')[0]
  const yt = text.match(YOUTUBE_RE)
  if (yt) return yt[0]
  return null
}

// Extract Loom/YouTube URLs from Excel cell hyperlinks (cell.l.Target)
function extractHyperlinksFromRow(ws, rowIndex) {
  // Scan all columns up to 30 to find any hyperlink with a video URL
  for (let col = 0; col < 30; col++) {
    const addr = xlsx.utils.encode_cell({ r: rowIndex, c: col })
    const cell = ws[addr]
    if (!cell) continue
    // Check hyperlink target
    const linkUrl = cell.l?.Target ?? ''
    if (linkUrl.includes('loom.com/share/')) return linkUrl
    if (linkUrl.includes('youtube.com/watch') || linkUrl.includes('youtu.be/')) return linkUrl.split('?')[0]
    // Also check cell value in case URL is stored as plain text
    const val = typeof cell.v === 'string' ? cell.v.trim() : ''
    if (val.includes('loom.com/share/')) return val
    if (val.includes('youtube.com/watch') || val.includes('youtu.be/')) return val.split('?')[0]
  }
  return null
}

function cleanStr(v) {
  if (v == null || v === '') return ''
  return String(v).trim().replace(/\s+/g, ' ')
}

async function sbPost(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SVC,
      'Authorization': `Bearer ${SVC}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`POST ${path}: ${JSON.stringify(data)}`)
  return data
}

async function sbPatch(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      'apikey': SVC,
      'Authorization': `Bearer ${SVC}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path}: ${await res.text()}`)
}

async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
  })
  return res.json()
}

async function getMaxOrderIndex() {
  const subjects = await sbGet('subjects?select=order_index&order=order_index.desc&limit=1')
  return (subjects?.[0]?.order_index ?? 0)
}

async function deleteExistingClientTraining() {
  // Find and delete subjects that end in " Training" and were created by this import
  const subjects = await sbGet('subjects?select=id,title&title=like.*%20Training*')
  for (const s of subjects ?? []) {
    if (CLIENT_SHEETS.some(cs => s.title.startsWith(cs))) {
      console.log(`  Deleting existing: ${s.title}`)
      const res = await fetch(`${SB_URL}/rest/v1/subjects?id=eq.${s.id}`, {
        method: 'DELETE',
        headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` },
      })
      if (!res.ok) console.warn(`    Delete failed: ${await res.text()}`)
    }
  }
}

async function importSheet(sheetName, rows, ws, orderIndex) {
  const tasks = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const taskName = cleanStr(row[0])

    // Skip empty, status words, and header-like rows
    if (!taskName || STATUS_WORDS.has(taskName.toLowerCase())) continue
    if (taskName.length < 2) continue

    const cells = row.map(c => cleanStr(c)).filter(Boolean)
    const videoUrl = extractHyperlinksFromRow(ws, i)
    if (videoUrl) console.log(`    🎬 Row ${i} "${taskName}" → ${videoUrl}`)

    // Find frequency/remarks (usually 2nd–5th non-status cell)
    let frequency = ''
    for (let j = 1; j < Math.min(row.length, 6); j++) {
      const val = cleanStr(row[j])
      if (val && !STATUS_WORDS.has(val.toLowerCase()) && val.length > 2 && !val.includes('loom') && !val.includes('http')) {
        frequency = val
        break
      }
    }

    if (videoUrl) tasks.push({ taskName, videoUrl, frequency })
  }

  if (tasks.length === 0) {
    console.log(`  Skipping ${sheetName} — no tasks found`)
    return
  }

  console.log(`  Creating subject: "${sheetName} Training" with ${tasks.length} tasks`)

  // Create the subject
  const [subject] = await sbPost('subjects', {
    title: `${sheetName} Training`,
    description: `Training tasks and procedures for the ${sheetName} client`,
    emoji: '📋',
    cover_color: '#6366f1',
    order_index: orderIndex,
  })

  // Create one topic per task
  for (let ti = 0; ti < tasks.length; ti++) {
    const { taskName, videoUrl, frequency } = tasks[ti]

    const [topic] = await sbPost('topics', {
      subject_id: subject.id,
      title: taskName,
      order_index: ti,
    })

    // Build step content
    let contentDoc
    if (videoUrl) {
      contentDoc = {
        type: 'doc',
        content: [
          ...(frequency ? [{
            type: 'paragraph',
            content: [{ type: 'text', text: `Frequency: ${frequency}` }],
          }] : []),
          {
            type: 'paragraph',
            content: [{ type: 'text', text: videoUrl }],
          },
        ],
      }
    } else {
      contentDoc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: frequency ? `Frequency: ${frequency}` : `Complete the ${taskName} task as required.` }],
          },
        ],
      }
    }

    await sbPost('steps', {
      topic_id: topic.id,
      title: videoUrl ? `${taskName} — Training Video` : taskName,
      content: contentDoc,
      order_index: 0,
    })
  }

  console.log(`  ✓ Done: ${sheetName} Training`)
}

async function main() {
  console.log('Reading Excel file…')
  const wb = xlsx.readFile(EXCEL_PATH, { cellStyles: true })

  console.log('\nCleaning up existing client training subjects…')
  await deleteExistingClientTraining()

  let orderIndex = await getMaxOrderIndex()

  for (const sheetName of CLIENT_SHEETS) {
    if (!wb.SheetNames.includes(sheetName)) {
      console.log(`  Sheet "${sheetName}" not found, skipping`)
      continue
    }

    const ws = wb.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' })

    console.log(`\nProcessing: ${sheetName}`)
    await importSheet(sheetName, rows, ws, ++orderIndex)
  }

  console.log('\n✅ Import complete!')
}

main().catch(console.error)
