/**
 * cleanup-frequency.js
 *
 * 1. Removes "Frequency:" paragraphs from all client training step content
 * 2. Reports steps that have a video attachment but the URL won't embed
 */

const https  = require('https')
const path   = require('path')
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

const get   = p      => req('GET',   p)
const patch = (p, d) => req('PATCH', p, d)

function isFrequencyParagraph(node) {
  if (node.type !== 'paragraph') return false
  const text = (node.content ?? []).map(c => c.text ?? '').join('').trim()
  return /^frequency:/i.test(text)
}

function resolveEmbedUrl(url) {
  if (!url) return null
  if (url.includes('loom.com/share/')) {
    const afterShare = url.split('loom.com/share/')[1] ?? ''
    const id = afterShare.split('?')[0]
    return id ? `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true` : null
  }
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) return url
  return null
}

async function main() {
  // Load all client training subjects → topics → steps
  const subjects = await get(
    'subjects?is_client_training=eq.true&select=id,title,topics(id,steps(id,title,content))'
  )
  if (!Array.isArray(subjects)) { console.error('Failed to load subjects:', subjects); process.exit(1) }

  let freqCleaned = 0
  let alreadyClean = 0
  const brokenVideos = []

  for (const sub of subjects) {
    for (const topic of (sub.topics ?? [])) {
      for (const step of (topic.steps ?? [])) {
        const content = step.content
        if (!content) continue

        // ── Check for broken video attachments ───────────────────────────────
        const atts = content.attachments ?? []
        for (const att of atts) {
          if (att.type === 'video_url' && att.url) {
            if (!resolveEmbedUrl(att.url)) {
              brokenVideos.push({ subject: sub.title, step: step.title, url: att.url })
            }
          }
        }

        // ── Strip frequency paragraphs ────────────────────────────────────────
        const nodes = content.content ?? []
        const cleaned = nodes.filter(n => !isFrequencyParagraph(n))

        if (cleaned.length === nodes.length) {
          alreadyClean++
          continue
        }

        const newContent = { ...content, content: cleaned }
        await patch(`steps?id=eq.${step.id}`, { content: newContent })
        freqCleaned++
        console.log(`  ✓ Cleaned: [${sub.title}] ${step.title}`)
      }
    }
  }

  console.log(`\n✅ Frequency cleanup: ${freqCleaned} steps patched, ${alreadyClean} already clean`)

  if (brokenVideos.length) {
    console.log(`\n⚠️  Steps with unembeddable video URLs (${brokenVideos.length}):`)
    for (const b of brokenVideos) {
      console.log(`  [${b.subject}] "${b.step}" → ${b.url}`)
    }
  } else {
    console.log('\n✅ All video URLs are embeddable')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
