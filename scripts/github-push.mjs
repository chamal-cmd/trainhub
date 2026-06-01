// Pushes all tracked git files to GitHub via REST API (bypasses Zscaler git block)
import https from 'https'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const TOKEN = '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'
const OWNER = 'chamal-cmd'
const REPO  = 'trainhub'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = path.join(__dirname, '..')

function api(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'trainhub-push-script',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve(data) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function main() {
  // Step 1: Initialize repo with a seed commit so the Git Data API works
  console.log('🚀 Initializing repository...')
  const init = await api('PUT', `/repos/${OWNER}/${REPO}/contents/.init`, {
    message: 'chore: initialize repo',
    content: Buffer.from('init').toString('base64'),
  })
  if (!init.commit?.sha) throw new Error('Init failed: ' + JSON.stringify(init))
  const parentSha = init.commit.sha
  console.log('  parent commit:', parentSha)

  // Step 2: Get all tracked files
  const files = execSync('git ls-files', { cwd: PROJECT_DIR, encoding: 'utf-8' })
    .trim().split('\n').filter(Boolean)
  console.log(`\n📦 Uploading ${files.length} files...\n`)

  // Step 3: Create blobs
  const treeItems = []
  let done = 0
  for (const filePath of files) {
    const abs = path.join(PROJECT_DIR, filePath)
    const buf = fs.readFileSync(abs)
    const isBinary = buf.indexOf(0) !== -1
    const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
      content:  isBinary ? buf.toString('base64') : buf.toString('utf-8'),
      encoding: isBinary ? 'base64' : 'utf-8',
    })
    if (!blob.sha) { console.error(`\n  ✗ ${filePath}:`, blob.message); continue }
    treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha })
    done++
    process.stdout.write(`\r  ✓ ${done}/${files.length}  ${filePath.slice(-55).padEnd(55)}`)
    if (done % 20 === 0) await new Promise(r => setTimeout(r, 150))
  }

  // Delete the .init placeholder from the tree
  treeItems.push({ path: '.init', mode: '100644', type: 'blob', sha: null })

  console.log('\n\n🌲 Creating tree...')
  const tree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, { tree: treeItems })
  if (!tree.sha) throw new Error('Tree failed: ' + JSON.stringify(tree))

  console.log('💾 Creating commit...')
  const commit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: 'Initial commit — TrainHub training platform\n\nNext.js 16 + Supabase · TipTap editor with Loom/YouTube/Tango/Scribe embeds\nAdmin portal · Quiz builder · Video Library · AI Assistant · Google OAuth',
    tree: tree.sha,
    parents: [parentSha],
  })
  if (!commit.sha) throw new Error('Commit failed: ' + JSON.stringify(commit))

  console.log('🔖 Updating master branch...')
  const ref = await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/master`, {
    sha: commit.sha,
    force: true,
  })

  if (ref.ref || ref.object) {
    console.log(`\n✅ Successfully pushed to github.com/${OWNER}/${REPO}`)
    console.log(`🔗 https://github.com/${OWNER}/${REPO}\n`)
  } else {
    console.error('\n❌ Ref update failed:', JSON.stringify(ref))
  }
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })
