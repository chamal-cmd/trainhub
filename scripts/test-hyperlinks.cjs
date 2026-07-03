const xlsx = require('xlsx')

// Test with cellStyles only (same as import script)
console.log('=== With cellStyles:true only ===')
const wb1 = xlsx.readFile('C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx', { cellStyles: true })
const ws1 = wb1.Sheets['M3']
const cell1 = ws1[xlsx.utils.encode_cell({ r: 1, c: 11 })] // row 1, col 11 (L2)
console.log('cell.l:', cell1?.l)
console.log('cell.v:', cell1?.v)
console.log('cell.t:', cell1?.t)

// Test without any options
console.log('\n=== No options ===')
const wb2 = xlsx.readFile('C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx')
const ws2 = wb2.Sheets['M3']
const cell2 = ws2[xlsx.utils.encode_cell({ r: 1, c: 11 })]
console.log('cell.l:', cell2?.l)
console.log('cell.v:', cell2?.v)

// Now check with same options as diagnostic
console.log('\n=== With cellStyles+cellHTML+cellFormula ===')
const wb3 = xlsx.readFile('C:\\Users\\ChamalAb\\Downloads\\GP Bookkeeper Training.xlsx', { cellStyles: true, cellHTML: true, cellFormula: true })
const ws3 = wb3.Sheets['M3']
const cell3 = ws3[xlsx.utils.encode_cell({ r: 1, c: 11 })]
console.log('cell.l:', cell3?.l)
console.log('cell.v:', cell3?.v)

// Also scan all cols in row 1 for any cell with .l
console.log('\n=== All cells in M3 row 1 with hyperlinks ===')
for (let col = 0; col < 20; col++) {
  const addr = xlsx.utils.encode_cell({ r: 1, c: col })
  const cell = ws3[addr]
  if (cell && cell.l) {
    console.log(`col ${col} (${addr}): v="${cell.v}", Target="${cell.l.Target}"`)
  }
}
