import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { buildImportReport, computeImportSuccessRate, type ImportRowError } from '@/lib/data/import-reporting'

const importErrorArb = fc.record({
  row: fc.integer({ min: -30, max: 500 }),
  message: fc.string({ maxLength: 120 }),
})

// Feature: aero-crm-platform, Property 17: Veri İçe Aktarma Raporlaması
describe('Data import reporting property tests', () => {
  it('should produce bounded success/error counts and valid success ratio for any import outcome', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 400 }),
        fc.integer({ min: -50, max: 400 }),
        fc.array(importErrorArb, { maxLength: 500 }),
        fc.integer({ min: -10, max: 120 }),
        (totalRowsInput, successCountInput, rawErrors, maxStoredErrorsInput) => {
          const report = buildImportReport({
            totalRows: totalRowsInput,
            successCount: successCountInput,
            errors: rawErrors as ImportRowError[],
            maxStoredErrors: maxStoredErrorsInput,
          })

          expect(report.totalRows).toBeGreaterThanOrEqual(0)
          expect(report.errorCount).toBeGreaterThanOrEqual(0)
          expect(report.successCount).toBeGreaterThanOrEqual(0)

          expect(report.errorCount).toBeLessThanOrEqual(report.totalRows)
          expect(report.successCount).toBeLessThanOrEqual(report.totalRows - report.errorCount)
          expect(report.successCount + report.errorCount).toBeLessThanOrEqual(report.totalRows)

          expect(report.successRate).toBeGreaterThanOrEqual(0)
          expect(report.successRate).toBeLessThanOrEqual(100)
          expect(report.successRate).toBe(computeImportSuccessRate(report.successCount, report.totalRows))

          if (report.errorCount === 0) {
            expect(report.status).toBe('completed')
          } else {
            expect(report.status).toBe('completed_with_errors')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve ordered error reporting and enforce storage cap deterministically', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 300 }),
        fc.array(importErrorArb, { maxLength: 500 }),
        fc.integer({ min: 0, max: 80 }),
        (totalRows, rawErrors, maxStoredErrors) => {
          const reportA = buildImportReport({
            totalRows,
            successCount: totalRows,
            errors: rawErrors as ImportRowError[],
            maxStoredErrors,
          })
          const reportB = buildImportReport({
            totalRows,
            successCount: totalRows,
            errors: rawErrors as ImportRowError[],
            maxStoredErrors,
          })

          expect(reportA).toStrictEqual(reportB)
          expect(reportA.errors.length).toBe(reportA.errorCount)
          expect(reportA.storedErrors.length).toBeLessThanOrEqual(reportA.errorCount)
          expect(reportA.storedErrors.length).toBeLessThanOrEqual(Math.max(0, Math.floor(maxStoredErrors)))

          for (let index = 0; index < reportA.storedErrors.length; index += 1) {
            expect(reportA.storedErrors[index]).toStrictEqual(reportA.errors[index])
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
