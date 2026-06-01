// run-seed-team-training.mjs
// Inserts the Team Training subject, topics and steps directly via Supabase REST API.
// Run with: node scripts/run-seed-team-training.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yqefhohpfdcfripuswpw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjA1MzEsImV4cCI6MjA5NDk5NjUzMX0.fWeJDJi8W_tZS99evVuXqa2xK_g8aFDRGKctdUk9skA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Helper ────────────────────────────────────────────────────────────────────
function stepContent(text, attachments = []) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }]
      }
    ],
    attachments
  }
}

function videoAtt(name, url) {
  return { type: 'video_url', name, url }
}

function pdfAtt(name, url) {
  return { type: 'pdf', name, url }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding Team Training...\n')

  // ── Guard: check if already exists ──────────────────────────────────────────
  const { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .eq('title', 'Team Training')
    .single()

  if (existing) {
    console.log('⚠️  Team Training already exists (id:', existing.id, ') — aborting.')
    process.exit(0)
  }

  // ── 1. Insert subject ────────────────────────────────────────────────────────
  const { data: subject, error: subjErr } = await supabase
    .from('subjects')
    .insert({ title: 'Team Training', description: 'Recorded team training sessions, discussions and resources.', emoji: '🎥', cover_color: '#f97316' })
    .select()
    .single()

  if (subjErr) { console.error('❌ Subject insert failed:', subjErr.message); process.exit(1) }
  console.log('✅ Subject created:', subject.id)

  const subjId = subject.id

  // ── Topic definitions ────────────────────────────────────────────────────────
  const topics = [
    {
      title: 'Surgical Partner Discussion - February 9th',
      order_index: 1,
      stepTitle: 'Session Recording',
      stepText: 'Watch the session recording below.',
      attachments: [
        videoAtt('Surgical Partner Training Session', 'https://drive.google.com/file/d/1HXbohCrs9mcGJ4u8i0ujd0F-wPamZ566/view')
      ]
    },
    {
      title: 'Tanda Discussion - February 23rd',
      order_index: 2,
      stepTitle: 'Session Recording',
      stepText: 'Watch the session recording below.',
      attachments: [
        videoAtt('Tanda Discussion Recording', 'https://drive.google.com/file/d/1ttPJVPSI43-4ZOH6dM7oejZrbsA0EM9j/view')
      ]
    },
    {
      title: 'Payroll Tax Training - June 7th',
      order_index: 3,
      stepTitle: 'Session Recording',
      stepText: 'Watch the session recording and review the reference document below.',
      attachments: [
        videoAtt('Payroll Tax Training (Vimeo)', 'https://vimeo.com/941888751/363ba582a0'),
        videoAtt('Payroll Tax Training (Loom)', 'https://www.loom.com/share/dd5f6bdab1284b8f800b9e61bb01dd17'),
        pdfAtt('Individual Banking Model – Flow Of Funds', 'https://trainual-prod.s3.amazonaws.com/uploads/step_attachment/attach/548222/Individual_Banking_Model__Flow_Of_Funds__2_.pdf?X-Amz-Expires=604800&X-Amz-Date=20260525T063909Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT4UPBYSK7XGDLMOY%2F20260525%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=89e582b30b9f458bd8eb6f77e2ceac60fbd6491486beffc67dd19fa0406e3cc7')
      ]
    },
    {
      title: 'Fraud Detection - July 26th',
      order_index: 4,
      stepTitle: 'Session Recording',
      stepText: 'Watch the session recording below.',
      attachments: [
        videoAtt('Fraud Detection Training Session', 'https://vimeo.com/962156479/0c162a70ea')
      ]
    },
    {
      title: 'Benchmark Your Practice - August 23rd',
      order_index: 5,
      stepTitle: 'Session Recording',
      stepText: 'Watch the session recording and download the industry report below.',
      attachments: [
        videoAtt('Benchmark Your Practice (Loom)', 'https://www.loom.com/share/6f766004b5b94503805faac1c7fdd193'),
        pdfAtt('2023 Touchstone General Practice Industry Report', 'https://trainual-prod.s3.amazonaws.com/uploads/step_attachment/attach/548223/2023_Touchstone_General_Practice_Industry_Report__final___1_.pdf?X-Amz-Expires=604800&X-Amz-Date=20260525T064019Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT4UPBYSK7XGDLMOY%2F20260525%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=0170730d44832d4322d23099152e176a9a3af494d9f453f291a84c079706729e')
      ]
    },
    {
      title: 'Review of Monthly Profit and Loss',
      order_index: 6,
      stepTitle: 'Session Overview',
      stepText: 'Content for this session will be added soon.',
      attachments: []
    },
    {
      title: 'How To Leverage AI - September 13th',
      order_index: 7,
      stepTitle: 'Session Recording',
      stepText: 'Watch the session recording below.',
      attachments: [
        videoAtt('How To Leverage AI – Training Session', 'https://vimeo.com/982894973/bea3208d13')
      ]
    },
    {
      title: 'GP Registrars',
      order_index: 8,
      stepTitle: 'Session Overview',
      stepText: 'Content for this session will be added soon.',
      attachments: []
    }
  ]

  // ── 2. Insert topics + steps ─────────────────────────────────────────────────
  for (const t of topics) {
    const { data: topic, error: topicErr } = await supabase
      .from('topics')
      .insert({ subject_id: subjId, title: t.title, order_index: t.order_index })
      .select()
      .single()

    if (topicErr) { console.error(`❌ Topic "${t.title}" failed:`, topicErr.message); continue }
    console.log(`  📁 Topic: ${t.title}`)

    const { error: stepErr } = await supabase
      .from('steps')
      .insert({
        topic_id: topic.id,
        title: t.stepTitle,
        order_index: 1,
        content: stepContent(t.stepText, t.attachments)
      })

    if (stepErr) { console.error(`    ❌ Step insert failed:`, stepErr.message) }
    else { console.log(`    📄 Step: ${t.stepTitle} (${t.attachments.length} attachment${t.attachments.length !== 1 ? 's' : ''})`) }
  }

  console.log('\n🎉 Done! Team Training is ready.')
  console.log('👉 Now assign it to users via the admin panel.')
}

seed().catch(console.error)
