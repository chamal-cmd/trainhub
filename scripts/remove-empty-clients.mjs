// Remove client training subjects that have no Loom/YouTube video content
// Run: SUPABASE_SERVICE_ROLE_KEY=... node scripts/remove-empty-clients.mjs

const SB_URL = 'https://yqefhohpfdcfripuswpw.supabase.co'
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SVC) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const headers = { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` }

async function get(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers })
  return res.json()
}

async function del(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method: 'DELETE', headers })
  if (!res.ok) console.warn(`  DELETE failed: ${await res.text()}`)
}

function hasVideo(step) {
  const text = JSON.stringify(step.content ?? '')
  return text.includes('loom.com') || text.includes('youtube.com') || text.includes('youtu.be') || text.includes('vimeo.com')
}

const subjects = await get('subjects?select=id,title,topics(id,steps(id,content))&emoji=eq.📋&cover_color=eq.%236366f1')

const toDelete = []
const toKeep   = []

for (const s of subjects ?? []) {
  const allSteps = (s.topics ?? []).flatMap(t => t.steps ?? [])
  if (allSteps.some(hasVideo)) {
    toKeep.push(s.title)
  } else {
    toDelete.push(s)
  }
}

console.log(`\nKeeping (${toKeep.length}):`)
toKeep.forEach(t => console.log(`  ✓ ${t}`))

console.log(`\nRemoving (${toDelete.length}):`)
toDelete.forEach(s => console.log(`  ✗ ${s.title}`))

if (toDelete.length === 0) { console.log('\nNothing to remove.'); process.exit(0) }

console.log('\nDeleting…')
for (const s of toDelete) {
  await del(`subjects?id=eq.${s.id}`)
  console.log(`  Deleted: ${s.title}`)
}

console.log('\n✅ Done')
