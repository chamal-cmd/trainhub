export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TEXT_TYPES = ['txt', 'md', 'csv', 'json', 'sql', 'ts', 'tsx', 'js', 'jsx']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (!TEXT_TYPES.includes(ext)) {
      return NextResponse.json({
        error: `PDF and DOCX parsing is not supported on Cloudflare. Please paste text directly using the "Paste Text" button, or convert your file to .txt first.`
      }, { status: 400 })
    }

    const content = await file.text()

    if (!content.trim()) {
      return NextResponse.json({ error: 'File is empty or unreadable' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('knowledge_files').insert({
      name:       file.name,
      content:    content.trim(),
      file_type:  ext,
      size_bytes: file.size,
      char_count: content.trim().length,
    })

    if (error) throw error

    return NextResponse.json({ ok: true, chars: content.trim().length })
  } catch (err: any) {
    console.error('Knowledge upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
