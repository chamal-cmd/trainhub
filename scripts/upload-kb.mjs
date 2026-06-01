// Bulk upload knowledge base files to Supabase
// Run with: node scripts/upload-kb.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { extname, basename } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const SUPABASE_URL = 'https://yqefhohpfdcfripuswpw.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ'

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

const FILES = [
  'C:\\Users\\ChamalAb\\Downloads\\how to onboard a client.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Know Your Client.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Key Aspects of Service Fee Income i.txt',
  'C:\\Users\\ChamalAb\\Downloads\\How and Why is Income Reported.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Profit and Loss Statement in Medical Practice Explained.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Billings vs Receipts.txt',
  'C:\\Users\\ChamalAb\\Downloads\\What is Workcover.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Tyro.txt',
  'C:\\Users\\ChamalAb\\Downloads\\bank reconciliation impact.txt',
  'C:\\Users\\ChamalAb\\Downloads\\how does meducare work.txt',
  'C:\\Users\\ChamalAb\\Downloads\\What is Medicare.txt',
  'C:\\Users\\ChamalAb\\Downloads\\GP_Bookkeeper_Employee_Policy_Document__2_.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\0001 Hi, so welcome to GP Book Keep.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Applying Leave in Hubstaff.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Applying for Leave Process Update 📝.txt',
  'C:\\Users\\ChamalAb\\Downloads\\fathom 2.txt',
  'C:\\Users\\ChamalAb\\Downloads\\fathom 1.txt',
  'C:\\Users\\ChamalAb\\Downloads\\trick byte 10 link google.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 09 - Using Asana in Slack.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 08-manage priority.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 07 - Managing Important Messages.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 06 - Hiver Email Templates.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 05 - Schedule Your Emails.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 04 - Create Asana Tasks Directly from Gmail.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 03 - Adding Documents from Gmail to Drive.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 02 - Summarize Your Emails Using AI.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Trick Byte 01 - Send Your Links in a Professional Way.txt',
  'C:\\Users\\ChamalAb\\Downloads\\dext clearing sample video 2.txt',
  'C:\\Users\\ChamalAb\\Downloads\\dext clearing sample video 1.txt',
  'C:\\Users\\ChamalAb\\Downloads\\how to add cost documents to dext.txt',
  'C:\\Users\\ChamalAb\\Downloads\\INTRODUCTION TO DEXT.txt',
  'C:\\Users\\ChamalAb\\Downloads\\dEXT 1.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Touchstone benchmarks for medical practices- training for the staff Loom - 3 May 2024.txt',
  'C:\\Users\\ChamalAb\\Downloads\\surgical partners training.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Tanda trainig session.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Email- when bookkeeper is transitioning out of role.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Email- Dext.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Email -Normal version.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Applying for Leave Process Update.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Structuring Client Meetings.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Asana Project Structure for New Clients.txt',
  'C:\\Users\\ChamalAb\\Downloads\\Roadmap of a client.txt',
  'C:\\Users\\ChamalAb\\Downloads\\how to onboard a new client.txt',
  // PDFs
  'C:\\Users\\ChamalAb\\Downloads\\impact on Bookkeepers.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\how does medicare work.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\what is medicare.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\Individual_Banking_Model__Flow_Of_Funds__2_.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\Signed Leave Policy of GPBK .pdf',
  'C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Hub - 14022026.pdf',
  // DOCX
  'C:\\Users\\ChamalAb\\Downloads\\How to create client account in dext.docx',
  'C:\\Users\\ChamalAb\\Downloads\\Learning Materials Asana Board.docx',
]

// Skip duplicate .srt files (same content as matching .txt)
// Skip Fathom PDF (too image-heavy, txt version already included)

async function extractText(filePath) {
  const ext = extname(filePath).toLowerCase()

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse')
    const buf = readFileSync(filePath)
    const data = await pdfParse(buf)
    return data.text.trim()
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value.trim()
  }

  // txt, srt, md, csv, json etc
  return readFileSync(filePath, 'utf-8').trim()
}

async function run() {
  // Fetch existing file names to avoid duplicates
  const { data: existing } = await admin.from('knowledge_files').select('name')
  const existingNames = new Set((existing ?? []).map(f => f.name))

  let uploaded = 0, skipped = 0, failed = 0

  for (const filePath of FILES) {
    const name = basename(filePath)

    if (!existsSync(filePath)) {
      console.log(`⚠️  Not found: ${name}`)
      failed++
      continue
    }

    if (existingNames.has(name)) {
      console.log(`⏭  Already exists: ${name}`)
      skipped++
      continue
    }

    try {
      const content = await extractText(filePath)
      if (!content) { console.log(`⚠️  Empty: ${name}`); failed++; continue }

      const { error } = await admin.from('knowledge_files').insert({
        name,
        content,
        file_type: extname(filePath).slice(1),
        size_bytes: readFileSync(filePath).length,
        char_count: content.length,
      })

      if (error) throw error
      console.log(`✅ Uploaded: ${name} (${content.length} chars)`)
      uploaded++
    } catch (e) {
      console.error(`❌ Failed: ${name} — ${e.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`)
}

run()
