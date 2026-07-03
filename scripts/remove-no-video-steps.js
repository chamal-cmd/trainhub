/**
 * remove-no-video-steps.js
 * Deletes all client training steps that have no video attachment.
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

const get = p => req('GET', p)
const del = p => req('DELETE', p)

function hasVideo(step) {
  // Check attachments
  const atts = step.content?.attachments ?? []
  if (atts.some(a => a.type === 'video_url' && a.url)) return true
  // Check inline URL paragraph (old format)
  const nodes = step.content?.content ?? []
  return nodes.some(n =>
    n.type === 'paragraph' &&
    n.content?.length === 1 &&
    ['loom.com', 'youtube.com', 'youtu.be'].some(h => (n.content[0]?.text ?? '').includes(h))
  )
}

async function main() {
  const subjects = await get(
    'subjects?is_client_training=eq.true&select=id,title,topics(id,steps(id,title,content))'
  )
  if (!Array.isArray(subjects)) { console.error('Failed:', subjects); process.exit(1) }

  let deleted = 0

  for (const sub of subjects) {
    for (const topic of (sub.topics ?? [])) {
      const toDelete = (topic.steps ?? []).filter(s => !hasVideo(s))
      for (const step of toDelete) {
        await del(`steps?id=eq.${step.id}`)
        deleted++
        console.log(`  🗑  [${sub.title}] ${step.title}`)
      }
    }
  }

  console.log(`\n✅ Deleted ${deleted} steps with no video`)
}

main().catch(err => { console.error(err); process.exit(1) })
