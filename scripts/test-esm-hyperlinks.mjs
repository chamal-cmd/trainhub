import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const xlsx = require('xlsx')

const EXCEL_PATH = 'C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx'

console.log('Loading Excel with cellStyles:true…')
const wb = xlsx.readFile(EXCEL_PATH, { cellStyles: true })
const ws = wb.Sheets['M3']
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' })

console.log('Total rows:', rows.length)

function extractHyperlinksFromRow(ws, rowIndex) {
  for (let col = 0; col < 30; col++) {
    const addr = xlsx.utils.encode_cell({ r: rowIndex, c: col })
    const cell = ws[addr]
    if (!cell) continue
    const linkUrl = cell.l?.Target ?? ''
    if (linkUrl.includes('loom.com/share/')) return linkUrl.split('?')[0]
    if (linkUrl.includes('youtube.com/watch') || linkUrl.includes('youtu.be/')) return linkUrl.split('?')[0]
    const val = typeof cell.v === 'string' ? cell.v.trim() : ''
    if (val.includes('loom.com/share/')) return val.split('?')[0]
    if (val.includes('youtube.com/watch') || val.includes('youtu.be/')) return val.split('?')[0]
  }
  return null
}

console.log('\nTesting rows 1-10:')
for (let i = 1; i <= Math.min(10, rows.length - 1); i++) {
  const taskName = String(rows[i]?.[0] ?? '').trim()
  const url = extractHyperlinksFromRow(ws, i)
  console.log(`Row ${i}: "${taskName}" → ${url || 'NO URL'}`)
}
