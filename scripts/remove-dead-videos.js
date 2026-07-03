/**
 * remove-dead-videos.js
 * Checks every client training step's Loom video URL.
 * Deletes steps where the Loom video returns 404 (deleted/private).
 */

const https = require('https')
const http  = require('http')
const path  = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SB_BASE = 'yqefhohpfdcfripuswpw.supabase.co'
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
if (!SB_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

function sbReq(method, urlPath, data) {
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

const get = p => sbReq('GET', p)
const del = p => sbReq('DELETE', p)

// Follow redirects and return final status code
function checkUrl(url) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.request(url, { method: 'HEAD', timeout: 8000 }, res => {
      const status = res.statusCode
      if (status >= 300 && status < 400 && res.headers.location) {
        checkUrl(res.headers.location).then(resolve)
      } else {
        resolve(status)
      }
    })
    req.on('error', () => resolve(0))
    req.on('timeout', () => { req.destroy(); resolve(0) })
    req.end()
  })
}

// Extract the first clean Loom/YouTube URL from a (possibly messy) string
function extractUrl(raw) {
  const match = raw.match(/https?:\/\/[^\s"'<>]+loom\.com\/(?:share|embed)\/[A-Za-z0-9]+[^\s"'<>]*/i)
    ?? raw.match(/https?:\/\/[^\s"'<>]+(?:youtube\.com|youtu\.be)\/[^\s"'<>]*/i)
  return match ? match[0] : null
}

// Convert embed URL back to share URL for checking
function toShareUrl(url) {
  if (url.includes('loom.com/embed/')) {
    const id = url.split('loom.com/embed/')[1]?.split('?')[0]
    return id ? `https://www.loom.com/share/${id}` : url
  }
  return url
}

async function main() {
  const subjects = await get(
    'subjects?is_client_training=eq.true&select=id,title,topics(id,steps(id,title,content))'
  )
  if (!Array.isArray(subjects)) { console.error('Failed:', subjects); process.exit(1) }

  // Collect all steps with video URLs
  const stepsWithVideo = []
  for (const sub of subjects) {
    for (const topic of (sub.topics ?? [])) {
      for (const step of (topic.steps ?? [])) {
        const atts = step.content?.attachments ?? []
        const videoAtt = atts.find(a => a.type === 'video_url' && a.url)
        if (videoAtt) {
          const cleanUrl = extractUrl(videoAtt.url) ?? videoAtt.url
          stepsWithVideo.push({ step, subject: sub.title, url: cleanUrl })
        }
      }
    }
  }

  console.log(`Checking ${stepsWithVideo.length} video URLs…\n`)

  let deleted = 0
  let ok = 0
  let errors = 0

  for (const { step, subject, url } of stepsWithVideo) {
    const shareUrl = toShareUrl(url)
    const status = await checkUrl(shareUrl)

    if (status === 404 || status === 410) {
      console.log(`  🗑  404 — [${subject}] ${step.title}`)
      console.log(`       ${shareUrl}`)
      await del(`steps?id=eq.${step.id}`)
      deleted++
    } else if (status === 0) {
      console.log(`  ⚠️  timeout/error — [${subject}] ${step.title}`)
      errors++
    } else {
      ok++
    }
  }

  console.log(`\n✅ Done — ${ok} OK, ${deleted} dead (deleted), ${errors} unreachable`)
}

main().catch(err => { console.error(err); process.exit(1) })
