import { describe, expect, it } from 'vitest'
import { createSupabaseTestClient, getSupabaseTestEnv } from '@/lib/supabase'

const RUN_DB_PERF_TESTS = process.env.RUN_DB_PERF_TESTS === 'true'
const perfThresholdMs = Number(process.env.DB_PERF_THRESHOLD_MS ?? 1500)

const testEnv = (() => {
  try {
    return getSupabaseTestEnv()
  } catch {
    return null
  }
})()

const shouldRun = RUN_DB_PERF_TESTS && Boolean(testEnv?.serviceRoleKey)

const measure = async (query: () => PromiseLike<{ error: { message: string } | null }>) => {
  const startedAt = Date.now()
  const result = await query()
  const durationMs = Date.now() - startedAt
  return { durationMs, error: result.error }
}

describe.skipIf(!shouldRun)('Database Query Performance', () => {
  const supabase = createSupabaseTestClient({ useServiceRole: true })

  it('proposals latest list query should be fast', async () => {
    const { durationMs, error } = await measure(() =>
      supabase.from('proposals').select('id, team_id, status, created_at').order('created_at', { ascending: false }).limit(25)
    )
    expect(error?.message).toBeUndefined()
    expect(durationMs).toBeLessThan(perfThresholdMs)
  })

  it('notifications unread-first query should be fast', async () => {
    const { durationMs, error } = await measure(() =>
      supabase.from('notifications').select('id, user_id, read, created_at').order('created_at', { ascending: false }).limit(50)
    )
    expect(error?.message).toBeUndefined()
    expect(durationMs).toBeLessThan(perfThresholdMs)
  })

  it('public proposal lookup query should be fast', async () => {
    const { durationMs, error } = await measure(() =>
      supabase
        .from('proposals')
        .select('id, public_url')
        .like('public_url', '%/p/%')
        .order('created_at', { ascending: false })
        .limit(20)
    )
    expect(error?.message).toBeUndefined()
    expect(durationMs).toBeLessThan(perfThresholdMs)
  })
})
