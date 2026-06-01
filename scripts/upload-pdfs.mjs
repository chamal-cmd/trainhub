// Upload PDFs via the running Next.js API endpoint (which has working pdf-parse)
import { readFileSync } from 'fs'
import { basename } from 'path'

const PDFS = [
  'C:\\Users\\ChamalAb\\Downloads\\GP_Bookkeeper_Employee_Policy_Document__2_.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\impact on Bookkeepers.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\how does medicare work.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\what is medicare.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\Individual_Banking_Model__Flow_Of_Funds__2_.pdf',
  'C:\\Users\\ChamalAb\\Downloads\\Signed Leave Policy of GPBK .pdf',
  'C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Hub - 14022026.pdf',
]

async function uploadFile(filePath) {
  const name = basename(filePath)
  const buf = readFileSync(filePath)
  const blob = new Blob([buf], { type: 'application/pdf' })

  const form = new FormData()
  form.append('file', blob, name)

  const res = await fetch('http://localhost:3000/api/knowledge/upload', {
    method: 'POST',
    body: form,
  })

  const body = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`)
  return body
}

for (const filePath of PDFS) {
  const name = basename(filePath)
  try {
    await uploadFile(filePath)
    console.log(`✅ Uploaded: ${name}`)
  } catch (e) {
    console.error(`❌ Failed: ${name} — ${e.message}`)
  }
}

console.log('Done')
