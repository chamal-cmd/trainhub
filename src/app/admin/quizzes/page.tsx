export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import QuizBankClient from './QuizBankClient'

export default async function QuizzesPage() {
  const supabase = await createClient()

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, title, order_index, topics(id, title, order_index, ai_quiz)')
    .order('order_index')

  const sorted = (subjects ?? []).map((s: any) => ({
    id: s.id as string,
    title: s.title as string,
    topics: (s.topics as any[])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((t: any) => ({
        id: t.id as string,
        title: t.title as string,
        ai_quiz: t.ai_quiz ?? null,
      })),
  }))

  return <QuizBankClient subjects={sorted} />
}
