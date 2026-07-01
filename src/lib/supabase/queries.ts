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

/** All step IDs across every subject (all subjects are visible to all users) */
export const getAssignmentSteps = cache(async (_userId: string): Promise<string[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subjects')
    .select('topics(steps(id))')
  return (data ?? []).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) =>
      (t.steps ?? []).map((st: any) => st.id)
    )
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
