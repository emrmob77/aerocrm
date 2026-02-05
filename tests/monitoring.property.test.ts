import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type InsertCall = {
  table: string
  payload: unknown
}

const createMockSupabase = () => {
  const calls: InsertCall[] = []
  const client = {
    from: (table: string) => ({
      insert: async (payload: unknown) => {
        calls.push({ table, payload })
        return { error: null }
      },
    }),
  }

  return { client: client as unknown as SupabaseClient<Database>, calls }
}

const methodArb = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
const pathArb = fc
  .array(fc.constantFrom('api', 'monitoring', 'log', 'overview', 'usage', 'health', 'items'), {
    minLength: 1,
    maxLength: 5,
  })
  .map((parts) => `/${parts.join('/')}`)
const statusArb = fc.integer({ min: 200, max: 599 }).filter((status) => status !== 204 && status !== 205 && status !== 304)

// Feature: aero-crm-platform, Property 22: Otomatik Hata Raporlaması
describe('Monitoring property tests', () => {
  it('should automatically create error logs for 5xx API responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        statusArb,
        methodArb,
        pathArb,
        async (status, method, path) => {
          const { client, calls } = createMockSupabase()
          const request = new Request(`https://aero.test${path}`, { method })
          const handler = withApiLogging(
            async () => new Response('ok', { status }),
            { supabase: client, userId: 'user-1', teamId: 'team-1' }
          )

          const response = await handler(request, {})
          expect(response.status).toBe(status)

          const usageCalls = calls.filter((entry) => entry.table === 'api_usage_logs')
          const systemCalls = calls.filter((entry) => entry.table === 'system_logs')

          expect(usageCalls.length).toBe(1)
          if (status >= 500) {
            expect(systemCalls.length).toBe(1)
          } else {
            expect(systemCalls.length).toBe(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should skip automatic error logging when skipErrorLog is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        methodArb,
        pathArb,
        async (method, path) => {
          const { client, calls } = createMockSupabase()
          const request = new Request(`https://aero.test${path}`, { method })
          const handler = withApiLogging(
            async () => new Response(JSON.stringify({ ok: false }), { status: 503 }),
            { supabase: client, userId: 'user-1', teamId: 'team-1', skipErrorLog: true }
          )

          await handler(request, {})
          const systemCalls = calls.filter((entry) => entry.table === 'system_logs')
          expect(systemCalls).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
