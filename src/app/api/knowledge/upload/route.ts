import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext    = file.name.split('.').pop()?.toLowerCase() ?? ''

  // Plain text formats — read directly
  if (['txt', 'md', 'csv', 'json', 'sql', 'ts', 'tsx', 'js'].includes(ext)) {
    return buffer.toString('utf-8')
  }

  // PDF — use pdf-parse
  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  }

  // DOCX — use mammoth
  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const result  = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['txt', 'md', 'csv', 'json', 'pdf', 'docx', 'sql'].includes(ext)) {
      return NextResponse.json({ error: `File type .${ext} not supported` }, { status: 400 })
    }

    // Extract text
    const content = await extractText(file)
    if (!content.trim()) {
      return NextResponse.json({ error: 'Could not extract text from this file' }, { status: 400 })
    }

    // Store in DB
    const supabase = await createClient()
    const { error } = await supabase.from('knowledge_files').insert({
      name:       file.name,
      content:    content.trim(),
      file_type:  ext,
      size_bytes: file.size,
      char_count: content.trim().length,
    })

    if (error) throw error

    return NextResponse.json({ ok: true, chars: content.length })
  } catch (err: any) {
    console.error('Knowledge upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
