const xlsx = require('xlsx')

const wb = xlsx.readFile('C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx', {
  cellStyles: true, cellHTML: true, cellFormula: true,
})
const ws = wb.Sheets['M3']
const range = xlsx.utils.decode_range(ws['!ref'])

console.log('=== M3 sheet, rows 1-8, all columns ===')
for (let r = 1; r <= Math.min(8, range.e.r); r++) {
  process.stdout.write(`Row ${r}: `)
  const rowData = []
  for (let c = 0; c <= Math.min(15, range.e.c); c++) {
    const addr = xlsx.utils.encode_cell({ r, c })
    const cell = ws[addr]
    if (!cell) continue
    const entry = { col: c, v: cell.v, t: cell.t }
    if (cell.l) entry.link = cell.l
    if (cell.h && cell.h.includes('href')) entry.html = cell.h
    if (cell.f) entry.formula = cell.f
    rowData.push(entry)
  }
  console.log(JSON.stringify(rowData))
}

// Also check the links array if it exists
console.log('\n=== Sheet links ===')
console.log(ws['!links'] ? JSON.stringify(ws['!links'].slice(0, 10)) : 'none')
