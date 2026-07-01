/**
 * Upload General SOPs from DOCX files into Supabase.
 * Creates a "General SOPs" subject with category topics and one step per DOCX.
 * Content stored as { type: 'html', html: '...' } in steps.content JSONB.
 *
 * Run from: C:\Dev\Demo dash
 *   node scripts/upload-general-sops.mjs
 */

import mammoth from 'mammoth'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://yqefhohpfdcfripuswpw.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ'

const SOP_DIR =
  'C:/Users/ChamalAb/OneDrive - MAS Holdings (Pvt) Ltd/Desktop/SOP/General SOPs'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Each entry: { category, title, file }
const SOPS = [
  // Asana & Project Management
  { category: 'Asana & Project Management', title: 'Applying Leave in Asana',             file: 'Applying Leave-Leave Approval in Asana.docx' },
  { category: 'Asana & Project Management', title: 'Asana Project Structure for New Clients', file: 'Asana Project Structure for New Clients.docx' },
  { category: 'Asana & Project Management', title: 'Create Asana Task from Gmail',         file: 'Create an Asana Task Directly from Gmail Using the Asana Add-on.docx' },
  { category: 'Asana & Project Management', title: 'Structuring a New Client in Asana',    file: 'Structuring a New Client Project in Asana.docx' },
  { category: 'Asana & Project Management', title: 'Using Asana in Slack',                 file: 'Using Asana in Slack.docx' },

  // Email & Communication
  { category: 'Email & Communication', title: 'Adding Docs from Gmail to Drive',       file: 'Adding Documents from Gmail to Drive.docx' },
  { category: 'Email & Communication', title: 'Hiver Email Templates',                 file: 'Create and Use Hiver Email Templates in Gmail.docx' },
  { category: 'Email & Communication', title: 'Link Google Calendar to Slack',         file: 'Link Google Calendar to Slack Meetings.docx' },
  { category: 'Email & Communication', title: 'Hiver Notification Settings',           file: 'Manage Priority Hiver Notification Settings.docx' },
  { category: 'Email & Communication', title: 'Managing Important Messages',           file: 'Managing Important Messages.docx' },
  { category: 'Email & Communication', title: 'Schedule Your Emails',                  file: 'Schedule Your Emails.docx' },
  { category: 'Email & Communication', title: 'Send Links Professionally',             file: 'Send your links in a professional way.docx' },
  { category: 'Email & Communication', title: 'Summarize Emails with AI',              file: 'Summarize Your Emails Using AI.docx' },

  // Reporting & Finance
  { category: 'Reporting & Finance', title: 'Fathom Reporting Fundamentals',              file: 'Fathom reporting 1.docx' },
  { category: 'Reporting & Finance', title: 'Fathom Monthly Performance Report Review',   file: 'Fathom Reporting Monthly Performance Report Review.docx' },
  { category: 'Reporting & Finance', title: 'Payroll Tax Reference & Q&A Process',        file: 'Payroll Tax Reference Review and Team Q&A Process.docx' },
  { category: 'Reporting & Finance', title: 'GP Industry Benchmarks & KPI Tracking',      file: 'Review General Practice Industry Benchmarks and Apply Insights to Client KPI Tracking.docx' },
  { category: 'Reporting & Finance', title: 'Monthly Performance Report – NorthEast',     file: 'SOP_Monthly_Performance_Report_NorthEastGeneral.docx' },

  // HR & Rostering
  { category: 'HR & Rostering', title: 'Record Leave in Hubstaff',         file: 'Applying Leave-Record Leave in Hubstaff.docx' },
  { category: 'HR & Rostering', title: 'Tanda: Make a Roster (A)',         file: 'Tanda how to make a roster on tanda.docx' },
  { category: 'HR & Rostering', title: 'Tanda: Make a Roster (B)',         file: 'Tanda how to make a roster tanda.docx' },
  { category: 'HR & Rostering', title: 'Tanda: Approve Timesheets',        file: 'Tanda-How to Approve Timesheets on Tanda.docx' },

  // Client Meetings
  { category: 'Client Meetings', title: 'How to Structure a Client Meeting', file: 'How to structure a meeting -How To Structure A Client Meeting.docx' },

  // Tools & Software
  { category: 'Tools & Software', title: 'Introduction to Dext', file: 'Introduction to Dext.docx' },
]

function cleanHtml(html) {
  return html
    .replace(/<img[^>]*src=""[^>]*>/gi, '')   // remove images that failed to upload
    .replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, '')  // remove any residual base64
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function uploadImage(buffer, contentType, slug, counter) {
  const ext = (contentType?.split('/')[1] ?? 'png').split(';')[0]
  const filename = `${slug}-${counter}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('sop-images')
    .upload(filename, buffer, { contentType, upsert: true })
  if (error) { console.warn(`    WARN image upload: ${error.message}`); return '' }
  const { data: { publicUrl } } = supabase.storage.from('sop-images').getPublicUrl(filename)
  return publicUrl
}

async function convertDocx(filePath, sopTitle) {
  const slug = sopTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)
  let imageCounter = 0
  const result = await mammoth.convertToHtml(
    { path: filePath },
    {
      convertImage: mammoth.images.inline(async (element) => {
        imageCounter++
        try {
          const buffer = await element.read()
          const src = await uploadImage(buffer, element.contentType, slug, imageCounter)
          return { src }
        } catch (e) {
          console.warn(`    WARN: image read failed: ${e.message}`)
          return { src: '' }
        }
      }),
    }
  )
  return cleanHtml(result.value)
}

async function main() {
  console.log('Updating General SOPs images...\n')

  // 0. Ensure sop-images storage bucket exists (public)
  await supabase.storage.createBucket('sop-images', { public: true })

  // 1. Find existing "General SOPs" subject — do NOT delete it
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('title', 'General SOPs')
    .single()

  if (!subject?.id) {
    throw new Error('General SOPs subject not found in database. Run the original full upload first.')
  }
  console.log(`Found subject: ${subject.id}\n`)

  // 2. Load existing topics for this subject
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('id, title')
    .eq('subject_id', subject.id)

  const topicMap = Object.fromEntries((existingTopics ?? []).map(t => [t.title, t.id]))

  // 3. For each SOP, re-convert the DOCX (now with images) and update the step content
  for (const sop of SOPS) {
    const filePath = path.join(SOP_DIR, sop.file)
    const topicId = topicMap[sop.category]
    if (!topicId) {
      console.warn(`  SKIP: topic "${sop.category}" not found — run full upload first`)
      continue
    }

    let html = ''
    try {
      html = await convertDocx(filePath, sop.title)
    } catch (e) {
      console.warn(`  WARN: Could not parse ${sop.file}: ${e.message}`)
      continue
    }

    // Find the existing step by title within this topic and update its content
    const { data: existingStep } = await supabase
      .from('steps')
      .select('id')
      .eq('topic_id', topicId)
      .eq('title', sop.title)
      .single()

    if (existingStep?.id) {
      const { error } = await supabase
        .from('steps')
        .update({ content: { type: 'html', html } })
        .eq('id', existingStep.id)
      if (error) console.error(`  ERROR updating "${sop.title}": ${error.message}`)
      else console.log(`  ✓ Updated: ${sop.category} / ${sop.title}`)
    } else {
      console.warn(`  SKIP: step "${sop.title}" not found in topic "${sop.category}"`)
    }
  }

  console.log('\nDone! SOP images updated — no content was deleted.')
}

main().catch(e => { console.error(e); process.exit(1) })
