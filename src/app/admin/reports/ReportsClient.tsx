'use client'

import { Download, FileSpreadsheet, Users, Award } from 'lucide-react'

function downloadCSV(filename: string, rows: (string | number | boolean)[][]) {
  const csv = rows
    .map(r => r.map(cell => {
      const s = String(cell ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','))
    .join('\r\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export interface ProgressRow {
  name: string; email: string; module: string
  done: number; total: number; pct: number; status: string
  lastActive: string; joined: string
}
export interface QuizRow {
  name: string; email: string; quiz: string
  score: number; passed: boolean; date: string
}
export interface OverviewRow {
  name: string; email: string
  modulesAssigned: number; modulesComplete: number; overallPct: number
  stepsDone: number; stepsTotal: number
  quizPassed: number; quizTotal: number
  lastActive: string; joined: string
}

interface Props {
  progressRows: ProgressRow[]
  quizRows: QuizRow[]
  overviewRows: OverviewRow[]
}

export default function ReportsClient({ progressRows, quizRows, overviewRows }: Props) {

  function dlProgress() {
    downloadCSV('trainhub_team_progress.csv', [
      ['Name', 'Email', 'Module', 'Steps Completed', 'Total Steps', '% Complete', 'Status', 'Last Active', 'Joined'],
      ...progressRows.map(r => [r.name, r.email, r.module, r.done, r.total, r.pct + '%', r.status, r.lastActive, r.joined]),
    ])
  }

  function dlQuiz() {
    downloadCSV('trainhub_quiz_results.csv', [
      ['Name', 'Email', 'Quiz', 'Score', 'Pass/Fail', 'Date'],
      ...quizRows.map(r => [r.name, r.email, r.quiz, r.score + '%', r.passed ? 'Pass' : 'Fail', r.date]),
    ])
  }

  function dlOverview() {
    downloadCSV('trainhub_overview.csv', [
      ['Name', 'Email', 'Modules Assigned', 'Modules Completed', 'Overall %', 'Steps Done', 'Total Steps', 'Quizzes Passed', 'Quizzes Total', 'Last Active', 'Joined'],
      ...overviewRows.map(r => [r.name, r.email, r.modulesAssigned, r.modulesComplete, r.overallPct + '%', r.stepsDone, r.stepsTotal, r.quizPassed, r.quizTotal, r.lastActive, r.joined]),
    ])
  }

  const reports = [
    {
      key: 'overview',
      icon: Users,
      title: 'Team Overview',
      description: 'One row per learner — overall completion %, steps, quizzes.',
      count: overviewRows.length,
      countLabel: 'learners',
      onDownload: dlOverview,
      headers: ['Name', 'Email', 'Modules', 'Complete', 'Overall %', 'Quizzes Passed', 'Last Active'],
      rows: overviewRows.map(r => [
        r.name, r.email, String(r.modulesAssigned),
        `${r.modulesComplete}/${r.modulesAssigned}`,
        `${r.overallPct}%`,
        `${r.quizPassed}/${r.quizTotal}`,
        r.lastActive,
      ]),
    },
    {
      key: 'progress',
      icon: FileSpreadsheet,
      title: 'Module Progress',
      description: 'One row per learner per module — detailed step completion.',
      count: progressRows.length,
      countLabel: 'rows',
      onDownload: dlProgress,
      headers: ['Name', 'Email', 'Module', 'Steps Done', 'Total', '%', 'Status', 'Last Active'],
      rows: progressRows.map(r => [r.name, r.email, r.module, String(r.done), String(r.total), `${r.pct}%`, r.status, r.lastActive]),
    },
    {
      key: 'quiz',
      icon: Award,
      title: 'Quiz Results',
      description: 'Every quiz attempt with score and pass/fail.',
      count: quizRows.length,
      countLabel: 'attempts',
      onDownload: dlQuiz,
      headers: ['Name', 'Email', 'Quiz', 'Score', 'Result', 'Date'],
      rows: quizRows.map(r => [r.name, r.email, r.quiz, `${r.score}%`, r.passed ? 'Pass' : 'Fail', r.date]),
    },
  ]

  return (
    <div className="space-y-8">
      {reports.map(rep => (
        <div key={rep.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <rep.icon className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">{rep.title}</h2>
                <p className="text-xs text-slate-400">{rep.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:block">
                {rep.count} {rep.countLabel}
              </span>
              <button
                onClick={rep.onDownload}
                className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-violet-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Preview table */}
          {rep.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {rep.headers.map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rep.rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className={i < rep.rows.slice(0, 8).length - 1 ? 'border-b border-slate-50' : ''}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rep.rows.length > 8 && (
                <p className="text-xs text-slate-400 text-center py-3 border-t border-slate-50">
                  + {rep.rows.length - 8} more rows in the downloaded file
                </p>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">No data yet.</div>
          )}
        </div>
      ))}
    </div>
  )
}
