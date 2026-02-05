import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { insertRealtimeNotification, updateRealtimeNotificationRead } from '@/lib/notifications/realtime-utils'

type TestNotification = {
  id: string
  read: boolean
  message: string
}

const notificationArb = fc.record({
  id: fc.uuid(),
  read: fc.boolean(),
  message: fc.string({ minLength: 1, maxLength: 120 }),
})

describe('Realtime notification property tests', () => {
  it('Property 15: insert stream should stay deduplicated, ordered, and capped', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(notificationArb, { selector: (item) => item.id, maxLength: 40 }).chain((initial) =>
          fc.record({
            initial: fc.constant(initial),
            stream: fc.array(notificationArb, { maxLength: 120 }),
            limit: fc.integer({ min: Math.max(1, initial.length), max: 100 }),
          })
        ),
        ({ initial, stream, limit }) => {
          let state: TestNotification[] = initial
          for (const item of stream) {
            state = insertRealtimeNotification(state, item, limit)
          }

          expect(state.length).toBeLessThanOrEqual(limit)
          expect(new Set(state.map((item) => item.id)).size).toBe(state.length)

          const seen = new Set(initial.map((item) => item.id))
          const prepended: TestNotification[] = []
          for (const item of stream) {
            if (seen.has(item.id)) continue
            seen.add(item.id)
            prepended.unshift(item)
          }
          const expected = [...prepended, ...initial].slice(0, limit)
          expect(state.map((item) => item.id)).toStrictEqual(expected.map((item) => item.id))
        }
      )
    )
  })

  it('Property 15: read updates should only affect the targeted notification', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(notificationArb, { selector: (item) => item.id, maxLength: 80 }),
        fc.uuid(),
        fc.option(fc.boolean(), { nil: undefined }),
        (initial, targetId, nextRead) => {
          const next = updateRealtimeNotificationRead(initial, targetId, nextRead)

          expect(next.length).toBe(initial.length)
          for (let index = 0; index < initial.length; index += 1) {
            const prev = initial[index]
            const item = next[index]
            if (prev.id === targetId) {
              expect(item.read).toBe(nextRead ?? prev.read)
            } else {
              expect(item).toStrictEqual(prev)
            }
          }
        }
      )
    )
  })
})
