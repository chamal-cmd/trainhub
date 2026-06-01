/**
 * Cached Supabase queries using React's cache().
 *
 * React cache() deduplicates calls within a single server render cycle —
 * so layout + page calling getUser() / getProfile() hits the DB only ONCE
 * instead of 2-3 times per navigation.
 */
import { cache } from 'react'
import { createClient } from './server'

/** Cached auth — deduped per request */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/** Cached profile — deduped per request */
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', userId)
    .single()
  return data
})

/** Cached step progress IDs — deduped per request */
export const getCompletedStepIds = cache(async (userId: string): Promise<Set<string>> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('step_progress')
    .select('step_id')
    .eq('user_id', userId)
  return new Set((data ?? []).map(p => p.step_id))
})

/** Cached assignment step counts — deduped per request */
export const getAssignmentSteps = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('assignments')
    .select('subjects(topics(steps(id)))')
    .eq('user_id', userId)
  return (data ?? []).flatMap((a: any) =>
    (a.subjects as any)?.topics?.flatMap((t: any) =>
      t.steps?.map((s: any) => s.id) ?? []
    ) ?? []
  )
})

/** Completion rate — uses cached helpers so no extra DB hits */
export const getCompletionRate = cache(async (userId: string): Promise<number> => {
  const [allIds, completedIds] = await Promise.all([
    getAssignmentSteps(userId),
    getCompletedStepIds(userId),
  ])
  return allIds.length > 0
    ? Math.round((allIds.filter(id => completedIds.has(id)).length / allIds.length) * 100)
    : 0
})
