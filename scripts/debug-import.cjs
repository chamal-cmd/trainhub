const xlsx = require('xlsx')

const wb = xlsx.readFile('C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx', { cellStyles: true })
const ws = wb.Sheets['M3']
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' })

console.log('Total rows from sheet_to_json:', rows.length)
console.log('Row 0 (header):', rows[0]?.slice(0, 5))
console.log('Row 1 data:', rows[1]?.slice(0, 5))
console.log('Row 1 length:', rows[1]?.length)

// Test extractHyperlinksFromRow for row i=1
function extractHyperlinksFromRow(ws, rowIndex) {
  for (let col = 0; col < 30; col++) {
    const addr = xlsx.utils.encode_cell({ r: rowIndex, c: col })
    const cell = ws[addr]
    if (!cell) continue
    const linkUrl = cell.l?.Target ?? ''
    if (linkUrl.includes('loom.com/share/')) {
      console.log(`  Found loom at col ${col} (${addr}): ${linkUrl}`)
      return linkUrl.split('?')[0]
    }
    const val = typeof cell.v === 'string' ? cell.v.trim() : ''
    if (val.includes('loom.com/share/')) {
      console.log(`  Found loom TEXT at col ${col} (${addr}): ${val}`)
      return val.split('?')[0]
    }
  }
  return null
}

console.log('\nTesting row 1:')
const result = extractHyperlinksFromRow(ws, 1)
console.log('Result:', result)

console.log('\nTesting rows 1-5:')
for (let i = 1; i <= 5; i++) {
  const taskName = rows[i]?.[0]
  const url = extractHyperlinksFromRow(ws, i)
  console.log(`Row ${i}: "${taskName}" → ${url || 'NO URL'}`)
}
