import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const xlsx = require('xlsx')

const EXCEL_PATH = 'C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx'
const wb = xlsx.readFile(EXCEL_PATH, { cellStyles: true })

const sheets = ['M3', 'GDMC', 'KFMP']
for (const name of sheets) {
  const ws = wb.Sheets[name]
  if (!ws) continue
  console.log(`\n=== ${name} ===`)
  for (let col = 0; col < 30; col++) {
    for (let row = 1; row <= 5; row++) {
      const addr = xlsx.utils.encode_cell({ r: row, c: col })
      const cell = ws[addr]
      if (cell?.l?.Target?.includes('loom.com/share/')) {
        console.log(`  ${addr}: ${cell.l.Target}`)
      }
    }
  }
}
