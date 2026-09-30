'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInitials, cn } from '@/lib/utils'
import { Download, FileText, Users, Loader2, AlertCircle } from 'lucide-react'

export interface LearnerModuleRow {
  title: string
  done: number
  total: number
  pct: number
}

export interface LearnerQuizRow {
  title: string
  score: number
  passed: boolean
  date: string
}

export interface LearnerReport {
  id: string
  name: string
  email: string
  pod: string | null
  overallPct: number
  stepsDone: number
  stepsTotal: number
  modulesDone: number
  modulesTotal: number
  quizAverage: number | null
  lastActive: string | null
  pathModules: LearnerModuleRow[]
  clientModules: LearnerModuleRow[]
  quizzes: LearnerQuizRow[]
}

const VIOLET: [number, number, number] = [109, 40, 217]
const SLATE:  [number, number, number] = [51, 65, 85]

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusLabel(pct: number, started: boolean): string {
  if (pct === 100) return 'Completed'
  if (pct >= 50)   return 'On Track'
  if (started)     return 'In Progress'
  return 'Not Started'
}

async function pdfDeps() {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}

function drawHeader(doc: any, title: string, subtitle: string) {
  doc.setFillColor(...VIOLET)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('TrainHub', 14, 11)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('GP Bookkeeper Training Platform', 14, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 11, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(subtitle, doc.internal.pageSize.getWidth() - 14, 17, { align: 'right' })
  doc.setTextColor(...SLATE)
}

function drawFooter(doc: any) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} · TrainHub`,
      14, doc.internal.pageSize.getHeight() - 8
    )
    doc.text(`Page ${i} of ${pages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }
}

function statRow(doc: any, autoTable: any, y: number, stats: [string, string][]) {
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [stats.map(s => s[0])],
    body: [stats.map(s => s[1])],
    headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontSize: 7.5, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 12, fontStyle: 'bold', textColor: SLATE, halign: 'center', cellPadding: 3 },
    styles: { lineColor: [226, 232, 240], lineWidth: 0.2 },
    margin: { left: 14, right: 14 },
  })
  return (doc as any).lastAutoTable.finalY
}

function moduleTable(doc: any, autoTable: any, y: number, heading: string, rows: LearnerModuleRow[]) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE)
  doc.text(heading, 14, y + 10)
  autoTable(doc, {
    startY: y + 13,
    head: [['Module', 'Steps completed', 'Progress', 'Status']],
    body: rows.map(m => [
      m.title,
      `${m.done} / ${m.total}`,
      `${m.pct}%`,
      statusLabel(m.pct, m.done > 0),
    ]),
    headStyles: { fillColor: VIOLET, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: SLATE },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = data.cell.raw as string
        data.cell.styles.textColor =
          v === 'Completed' ? [5, 150, 105] :
          v === 'On Track'  ? [109, 40, 217] :
          v === 'In Progress' ? [217, 119, 6] : [148, 163, 184]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
  return (doc as any).lastAutoTable.finalY
}

// Always pulls the latest data straight from the database, ignoring whatever
// was rendered when the Reports page first loaded — this is what fixes stale
// numbers in the exported PDF.
async function fetchFreshLearners(): Promise<LearnerReport[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin/reports-data', {
    headers: { Authorization: `Bearer ${session?.access_token}` },
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? 'Failed to fetch latest report data')
  return json.learners as LearnerReport[]
}

export default function ReportsDownloads({ learners: initialLearners }: { learners: LearnerReport[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function downloadLearnerPdf(initial: LearnerReport) {
    setBusy(initial.email)
    setError('')
    try {
      const fresh = await fetchFreshLearners()
      const l = fresh.find(x => x.id === initial.id) ?? initial

      const { jsPDF, autoTable } = await pdfDeps()
      const doc = new jsPDF()

      drawHeader(doc, 'Learner Progress Report', fmtDate(new Date().toISOString()))

      // Learner identity
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(l.name, 14, 38)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(
        `${l.email}${l.pod ? '  ·  Pod: ' + l.pod.replace(/_/g, ' ') : ''}  ·  Last active: ${fmtDate(l.lastActive)}`,
        14, 44
      )
      doc.setTextColor(...SLATE)

      // Summary stats
      let y = statRow(doc, autoTable, 49, [
        ['OVERALL COMPLETION', `${l.overallPct}%`],
        ['MODULES COMPLETED', `${l.modulesDone} / ${l.modulesTotal}`],
        ['STEPS COMPLETED', `${l.stepsDone} / ${l.stepsTotal}`],
        ['QUIZZES PASSED', `${l.quizzes.filter(q => q.passed).length} / ${l.quizzes.length}`],
        ['AVG QUIZ SCORE', l.quizAverage != null ? `${l.quizAverage}%` : '—'],
      ])

      // Learning path
      if (l.pathModules.length > 0) {
        y = moduleTable(doc, autoTable, y, 'Learning Path Progress', l.pathModules)
      }

      // Client training
      if (l.clientModules.some(m => m.done > 0)) {
        y = moduleTable(doc, autoTable, y, 'Client Training Progress',
          l.clientModules.filter(m => m.done > 0 || m.pct > 0))
      }

      // Quiz results
      if (l.quizzes.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Quiz Results', 14, y + 10)
        autoTable(doc, {
          startY: y + 13,
          head: [['Quiz', 'Score', 'Result', 'Date']],
          body: l.quizzes.map(q => [q.title, `${q.score}%`, q.passed ? 'Pass' : 'Fail', fmtDate(q.date)]),
          headStyles: { fillColor: VIOLET, fontSize: 8.5 },
          bodyStyles: { fontSize: 8.5, textColor: SLATE },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
          margin: { left: 14, right: 14 },
          didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 2) {
              data.cell.styles.textColor = data.cell.raw === 'Pass' ? [5, 150, 105] : [220, 38, 38]
              data.cell.styles.fontStyle = 'bold'
            }
          },
        })
      }

      drawFooter(doc)
      doc.save(`trainhub-report-${l.name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate PDF')
    } finally {
      setBusy(null)
    }
  }

  async function downloadTeamPdf() {
    setBusy('__team__')
    setError('')
    try {
      const learners = await fetchFreshLearners()

      const { jsPDF, autoTable } = await pdfDeps()
      const doc = new jsPDF('landscape')

      drawHeader(doc, 'Team Progress Summary', fmtDate(new Date().toISOString()))

      const avg = learners.length > 0
        ? Math.round(learners.reduce((s, l) => s + l.overallPct, 0) / learners.length) : 0
      const withQuizzes = learners.filter(l => l.quizAverage != null)
      const quizAvg = withQuizzes.length > 0
        ? Math.round((withQuizzes.reduce((s, l) => s + (l.quizAverage ?? 0), 0) / withQuizzes.length) * 10) / 10 : null

      let y = statRow(doc, autoTable, 34, [
        ['TEAM MEMBERS', String(learners.length)],
        ['AVERAGE COMPLETION', `${avg}%`],
        ['AVG QUIZ SCORE', quizAvg != null ? `${quizAvg}%` : '—'],
        ['FULLY TRAINED', String(learners.filter(l => l.overallPct === 100).length)],
        ['NOT STARTED', String(learners.filter(l => l.stepsDone === 0).length)],
      ])

      autoTable(doc, {
        startY: y + 8,
        head: [['Learner', 'Email', 'Pod', 'Modules', 'Steps', 'Overall', 'Quizzes Passed', 'Avg Score', 'Last Active', 'Status']],
        body: learners.map(l => [
          l.name,
          l.email,
          l.pod ? l.pod.replace(/_/g, ' ') : '—',
          `${l.modulesDone}/${l.modulesTotal}`,
          `${l.stepsDone}/${l.stepsTotal}`,
          `${l.overallPct}%`,
          `${l.quizzes.filter(q => q.passed).length}/${l.quizzes.length}`,
          l.quizAverage != null ? `${l.quizAverage}%` : '—',
          fmtDate(l.lastActive),
          statusLabel(l.overallPct, l.stepsDone > 0),
        ]),
        headStyles: { fillColor: VIOLET, fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5, textColor: SLATE },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 9: { halign: 'center' } },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 9) {
            const v = data.cell.raw as string
            data.cell.styles.textColor =
              v === 'Completed' ? [5, 150, 105] :
              v === 'On Track'  ? [109, 40, 217] :
              v === 'In Progress' ? [217, 119, 6] : [148, 163, 184]
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })

      drawFooter(doc)
      doc.save('trainhub-team-summary.pdf')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate PDF')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Downloadable Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed PDF reports — per learner or for the whole team
          </p>
        </div>
        <button
          onClick={downloadTeamPdf}
          disabled={busy !== null}
          className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60"
        >
          {busy === '__team__' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
          Team Summary PDF
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-6 py-3 bg-red-50 border-b border-red-100 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
        {initialLearners.map(l => (
          <div key={l.email} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-sm font-bold text-violet-700">
              {getInitials(l.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {l.modulesDone}/{l.modulesTotal} modules · {l.stepsDone}/{l.stepsTotal} steps · {l.quizzes.filter(q => q.passed).length} quizzes passed
                {l.quizAverage != null && ` · ${l.quizAverage}% avg`}
              </p>
            </div>
            <span className={cn(
              'text-sm font-bold w-12 text-right shrink-0',
              l.overallPct === 100 ? 'text-emerald-600' :
              l.overallPct >= 50   ? 'text-violet-600'  :
              l.overallPct > 0     ? 'text-amber-600'   : 'text-slate-300'
            )}>
              {l.overallPct}%
            </span>
            <button
              onClick={() => downloadLearnerPdf(l)}
              disabled={busy !== null}
              className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-60 shrink-0"
            >
              {busy === l.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PDF
            </button>
          </div>
        ))}
        {initialLearners.length === 0 && (
          <div className="px-6 py-10 text-center">
            <FileText className="w-7 h-7 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No learners yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
