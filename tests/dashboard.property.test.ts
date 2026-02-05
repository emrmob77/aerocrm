import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { buildDashboardMetrics, type DashboardMetricsValue } from '@/lib/dashboard/metrics'

const maybeMetricArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.double({ noNaN: false, noDefaultInfinity: false })
)

const metricsArb = fc.record({
  open_deals: maybeMetricArb,
  monthly_revenue: maybeMetricArb,
  conversion_rate: maybeMetricArb,
  pipeline_value: maybeMetricArb,
}) as fc.Arbitrary<DashboardMetricsValue>

// Feature: aero-crm-platform, Property 3: Dashboard Metrik Görünürlüğü
describe('Dashboard Metric Visibility', () => {
  it('should always render all metric cards with display-safe values', () => {
    fc.assert(
      fc.property(metricsArb, (metrics) => {
        const cards = buildDashboardMetrics('en-US', (key) => key, metrics)

        expect(cards).toHaveLength(4)
        for (const card of cards) {
          expect(card.label.length).toBeGreaterThan(0)
          expect(card.value.length).toBeGreaterThan(0)
          expect(card.value.includes('NaN')).toBe(false)
          expect(card.value.includes('Infinity')).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })
})
