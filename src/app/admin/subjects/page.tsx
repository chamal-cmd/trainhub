'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, FileText, HelpCircle, ArrowRight, Trash2, Copy, MoreVertical, Pencil, Clock, Globe, Lock, Eye, Users, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}yr ago`
}

type SubjectRow = {
  id: string
  title: string
  description: string | null
  emoji: string
  cover_color: string
  created_at: string
  updated_at: string
  topics: { id: string; steps: { id: string }[] }[]
  quizzes: { id: string }[]
  assignments: { id: string }[]
}

export default function SubjectsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openMenu,    setOpenMenu]    = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [renaming,    setRenaming]    = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => { loadSubjects() }, [])

  // Close menus on outside click
  useEffect(() => {
    function close() { setOpenMenu(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  async function loadSubjects() {
    const [subjectsRes, usersRes] = await Promise.all([
      supabase
        .from('subjects')
        .select(`id, title, description, emoji, cover_color, created_at, updated_at, topics(id, steps(id)), quizzes(id), assignments(id)`)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])
    setSubjects(subjectsRes.data ?? [])
    setTotalUsers(usersRes.count ?? 0)
    setLoading(false)
  }

  async function deleteSubject(subject: SubjectRow) {
    if (!confirm(`Delete "${subject.title}"? This will remove all topics, steps and content. This cannot be undone.`)) return
    setDeleting(subject.id)
    await supabase.from('subjects').delete().eq('id', subject.id)
    setSubjects(prev => prev.filter(s => s.id !== subject.id))
    setDeleting(null)
  }

  async function duplicateSubject(subject: SubjectRow) {
    setDuplicating(subject.id)
    const { data: newSubj } = await supabase
      .from('subjects')
      .insert({
        title: `${subject.title} (Copy)`,
        description: subject.description,
        emoji: subject.emoji,
        cover_color: subject.cover_color,
      })
      .select('id').single()

    if (newSubj) {
      // Duplicate topics + steps
      const { data: topics } = await supabase
        .from('topics').select('*, steps(*)').eq('subject_id', subject.id).order('order_index')

      for (const topic of topics ?? []) {
        const { data: newTopic } = await supabase
          .from('topics')
          .insert({ subject_id: newSubj.id, title: topic.title, order_index: topic.order_index })
          .select('id').single()
        if (newTopic) {
          for (const step of (topic.steps ?? []).sort((a: any, b: any) => a.order_index - b.order_index)) {
            await supabase.from('steps').insert({
              topic_id: newTopic.id, title: step.title,
              order_index: step.order_index, content: step.content
            })
          }
        }
      }
      await loadSubjects()
      router.push(`/admin/subjects/${newSubj.id}`)
    }
    setDuplicating(null)
  }

  async function renameSubject(id: string) {
    if (!renameValue.trim()) return
    await supabase.from('subjects').update({ title: renameValue.trim() }).eq('id', id)
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, title: renameValue.trim() } : s))
    setRenaming(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  const totalSubjects = subjects.length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Training Library</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalSubjects === 0
              ? 'Create your first training module to get started.'
              : `${totalSubjects} module${totalSubjects !== 1 ? 's' : ''} · click any card to edit content`}
          </p>
        </div>
        <Link href="/admin/subjects/new">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Module
          </button>
        </Link>
      </div>

      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subject, i) => {
            const topicsCount = subject.topics?.length ?? 0
            const stepsCount = subject.topics?.reduce((acc, t) => acc + (t.steps?.length ?? 0), 0) ?? 0
            const hasQuiz = subject.quizzes?.length > 0
            const accessCount = subject.assignments?.length ?? 0
            const isEveryone = totalUsers > 0 && accessCount >= totalUsers
            const isRestricted = !isEveryone
            const isDeleting = deleting === subject.id
            const isDuplicating = duplicating === subject.id

            return (
              <div
                key={subject.id}
                className={cn(
                  'bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group overflow-hidden animate-fade-up relative',
                  isDeleting && 'opacity-50 pointer-events-none'
                )}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Color strip */}
                <div className="h-1 w-full" style={{ backgroundColor: subject.cover_color }} />

                <div className="p-5">
                  {/* Icon + title + menu */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: subject.cover_color + '1A', boxShadow: `0 0 0 1px ${subject.cover_color}20` }}
                    >
                      {subject.emoji}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                        {subject.title}
                      </h3>
                      {subject.description ? (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{subject.description}</p>
                      ) : (
                        <p className="text-xs text-slate-300 mt-0.5 italic">No description</p>
                      )}
                    </div>

                    {/* 3-dot menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpenMenu(openMenu === subject.id ? null : subject.id) }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === subject.id && (
                        <div
                          className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 w-48 text-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Rename (inline) */}
                          {renaming === subject.id ? (
                            <div className="flex items-center gap-1 px-2 py-1.5">
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') renameSubject(subject.id); if (e.key === 'Escape') setRenaming(null) }}
                                className="flex-1 text-xs border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-400 min-w-0"
                              />
                              <button onClick={() => renameSubject(subject.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setRenaming(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setRenameValue(subject.title); setRenaming(subject.id) }}
                              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors w-full text-left"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400" /> Rename
                            </button>
                          )}

                          {/* Manage Access */}
                          <Link href={`/admin/subjects/${subject.id}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors">
                            <Users className="w-3.5 h-3.5 text-slate-400" /> Manage Access
                          </Link>

                          {/* Preview */}
                          <Link href={`/training/${subject.id}`} target="_blank"
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors">
                            <Eye className="w-3.5 h-3.5 text-slate-400" /> Preview
                          </Link>

                          {/* Edit content */}
                          <Link href={`/admin/subjects/${subject.id}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> Edit content
                          </Link>

                          {/* Quiz Builder */}
                          <Link href={`/admin/subjects/${subject.id}/quiz`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Quiz Builder
                          </Link>

                          {/* Duplicate */}
                          <button
                            onClick={() => { setOpenMenu(null); duplicateSubject(subject) }}
                            disabled={isDuplicating}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors w-full text-left"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          {/* Delete */}
                          <button
                            onClick={() => { setOpenMenu(null); deleteSubject(subject) }}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 transition-colors w-full text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete module
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats + edit button */}
                  <div className="flex items-center gap-1 pt-4 border-t border-slate-50 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <BookOpen className="w-3 h-3" />
                      {topicsCount} topic{topicsCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <FileText className="w-3 h-3" />
                      {stepsCount} step{stepsCount !== 1 ? 's' : ''}
                    </div>
                    {hasQuiz && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2.5 py-1.5">
                        <HelpCircle className="w-3 h-3" /> Quiz
                      </div>
                    )}
                    {isRestricted ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5" title={`Only ${accessCount} ${accessCount === 1 ? 'person has' : 'people have'} access`}>
                        <Lock className="w-3 h-3" /> {accessCount} {accessCount === 1 ? 'person' : 'people'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5" title="Everyone has access">
                        <Globe className="w-3 h-3" /> Everyone
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-slate-300 ml-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(subject.updated_at || subject.created_at)}
                    </div>
                    <Link href={`/admin/subjects/${subject.id}`} className="ml-auto">
                      <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        Edit <ArrowRight className="w-3 h-3" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add new card */}
          <Link href="/admin/subjects/new">
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center py-12 px-6 min-h-[160px]">
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">New Module</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-5">
            <BookOpen className="w-9 h-9 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Your library is empty</h3>
          <p className="text-slate-400 text-sm mb-7 text-center max-w-xs">
            Start by creating a training module. Add topics, steps, and a quiz.
          </p>
          <Link href="/admin/subjects/new">
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Create First Module
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
