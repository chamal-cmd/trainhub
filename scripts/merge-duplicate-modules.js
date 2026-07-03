/**
 * merge-duplicate-modules.js
 * Merges "XYZ" + "XYZ Training" pairs into one module.
 * Also renames lone "X Training" subjects by stripping " Training".
 */

const https = require('https')
const path  = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co'
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
if (!SB_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

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
      opts.headers['Content-Type']   = 'application/json'
      opts.headers['Prefer']         = 'return=representation'
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

const get   = p      => req('GET',    p)
const patch = (p, d) => req('PATCH',  p, d)
const del   = p      => req('DELETE', p)

async function main() {
  const subjects = await get(
    'subjects?is_client_training=eq.true&select=id,title,topics(id,title,steps(id,order_index))&order=title'
  )
  if (!Array.isArray(subjects)) { console.error('Failed:', subjects); process.exit(1) }

  const byTitle = {}
  for (const s of subjects) byTitle[s.title] = s

  // Pairs: [keep title, drop title]
  // The non-Training version is kept; Training version is merged into it then deleted.
  const MERGE_PAIRS = [
    ['GDMC',                    'GDMC Training'],
    ['GHFP & Nurture',          'GHFP & Nurture Training'],
    ['GP Book',                 'GP Book Training'],
    ['KFMP',                    'KFMP Training'],
    ['Matt C.',                 'Matt C. Training'],
    ['Mokare',                  'Mokare Training'],
    ['Northeast',               'Northeast Training'],
    ['Ocean Grove - Peter',     'Ocean Grove - Peter Training'],
    ['Plantagenet Medical',     'Plantagenet Medical Training'],
    ['Riverstone',              'Riverstone Training'],
    ['SMC',                     'SMC Training'],
    ['Top Health - Nidusha',    'Top Health - Nidusha Training'],
    ['Niroga - Anj',            'Niroga - Anj Training'],
  ]

  // Orphan "Training" subjects with no counterpart — just strip the suffix
  const RENAME_ONLY = ['Karis Medical Training', 'M3 Training', 'Rural Training']

  // ── Merge pairs ──────────────────────────────────────────────────────────────
  for (const [keepTitle, dropTitle] of MERGE_PAIRS) {
    const keep = byTitle[keepTitle]
    const drop = byTitle[dropTitle]

    if (!keep) { console.log(`⚠️  "${keepTitle}" not found — skipping`); continue }
    if (!drop) { console.log(`⚠️  "${dropTitle}" not found — skipping`); continue }

    const keepTopic = keep.topics?.[0]
    const dropTopic = drop.topics?.[0]

    if (!keepTopic) { console.log(`⚠️  "${keepTitle}" has no topic`); continue }

    if (dropTopic?.steps?.length) {
      // Find max order_index in keep topic so we append after existing steps
      const keepSteps = keepTopic.steps ?? []
      const maxOrder  = keepSteps.reduce((m, s) => Math.max(m, s.order_index ?? 0), 0)

      // Move steps from drop topic → keep topic with new order_index values
      const dropSteps = [...(dropTopic.steps ?? [])].sort((a, b) => a.order_index - b.order_index)
      for (let i = 0; i < dropSteps.length; i++) {
        const step = dropSteps[i]
        await patch(`steps?id=eq.${step.id}`, {
          topic_id:    keepTopic.id,
          order_index: maxOrder + (i + 1) * 10,
        })
      }
      console.log(`  ✓ Moved ${dropSteps.length} steps from "${dropTitle}" → "${keepTitle}"`)
    }

    // Delete drop topic and subject
    if (dropTopic) await del(`topics?id=eq.${dropTopic.id}`)
    await del(`subjects?id=eq.${drop.id}`)
    console.log(`  🗑  Deleted "${dropTitle}"`)
  }

  // ── Rename orphans ────────────────────────────────────────────────────────────
  for (const title of RENAME_ONLY) {
    const sub = byTitle[title]
    if (!sub) { console.log(`⚠️  "${title}" not found — skipping`); continue }
    const newTitle = title.replace(/ Training$/, '')
    await patch(`subjects?id=eq.${sub.id}`, { title: newTitle })
    console.log(`  ✏️  Renamed "${title}" → "${newTitle}"`)
  }

  console.log('\n✅ Done')
}

main().catch(err => { console.error(err); process.exit(1) })
