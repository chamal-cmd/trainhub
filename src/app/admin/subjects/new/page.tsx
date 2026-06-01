'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { COVER_COLORS, COVER_EMOJIS } from '@/lib/utils'

export default function NewSubjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COVER_COLORS[0])
  const [emoji, setEmoji] = useState(COVER_EMOJIS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: dbError } = await supabase
      .from('subjects')
      .insert({ title: title.trim(), description: description.trim() || null, cover_color: color, emoji, created_by: user?.id })
      .select('id')
      .single()

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    // Auto-assign new module to ALL users by default
    const { data: profiles } = await supabase.from('profiles').select('id')
    if (profiles?.length) {
      await supabase.from('assignments').insert(
        profiles.map(p => ({ user_id: p.id, subject_id: data.id }))
      )
    }

    router.push(`/admin/subjects/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/admin/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Training Module</h1>
      <p className="text-slate-500 text-sm mb-8">Set up a new subject with topics and training steps.</p>

      <form onSubmit={handleCreate} className="space-y-6 bg-white rounded-2xl border border-slate-200 p-7">
        {/* Preview */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: color + '25' }}
          >
            {emoji}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{title || 'Module Title'}</p>
            <p className="text-xs text-slate-400">{description || 'Module description'}</p>
          </div>
          <div className="ml-auto w-1 h-12 rounded-full" style={{ backgroundColor: color }} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Module Title *</Label>
          <Input
            id="title"
            placeholder="e.g. Employee Onboarding, Safety Training"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Briefly describe what this training covers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Emoji picker */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-2">
            {COVER_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} disabled={!title.trim()}>
            Create Module
          </Button>
          <Link href="/admin/subjects">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
