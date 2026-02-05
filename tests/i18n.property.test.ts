import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { messages } from '@/lib/i18n/messages'
import {
  getNestedValue,
  interpolateMessage,
  localeFormatMap,
  normalizeLocale,
} from '@/lib/i18n/utils'

const flattenStringPaths = (value: unknown, prefix = ''): string[] => {
  if (typeof value === 'string') {
    return prefix ? [prefix] : []
  }
  if (!value || typeof value !== 'object') {
    return []
  }

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    result.push(...flattenStringPaths(nested, path))
  }
  return result
}

const trKeys = flattenStringPaths(messages.tr)
const enKeySet = new Set(flattenStringPaths(messages.en))
const sharedStringKeys = trKeys.filter((key) => enKeySet.has(key))
const sharedKeysArb = fc.constantFrom(...(sharedStringKeys.length > 0 ? sharedStringKeys : ['common.appName']))

// Feature: aero-crm-platform, Property 23: Dil Değişikliği Tutarlılığı
describe('I18n property tests', () => {
  it('should normalize any locale value consistently', () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: undefined }), (rawLocale) => {
        const normalized = normalizeLocale(rawLocale ?? null)
        expect(normalized === 'tr' || normalized === 'en').toBe(true)
        expect(normalizeLocale(normalized)).toBe(normalized)
      }),
      { numRuns: 100 }
    )
  })

  it('should resolve shared translation keys for both locales', () => {
    fc.assert(
      fc.property(sharedKeysArb, (key) => {
        const trValue = getNestedValue(messages.tr as unknown as Record<string, unknown>, key)
        const enValue = getNestedValue(messages.en as unknown as Record<string, unknown>, key)
        expect(typeof trValue).toBe('string')
        expect(typeof enValue).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('should interpolate placeholders deterministically for any variable set', () => {
    fc.assert(
      fc.property(
        sharedKeysArb,
        fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), fc.string({ maxLength: 20 })),
        fc.boolean(),
        (key, vars, useEnglish) => {
          const locale = normalizeLocale(useEnglish ? 'en' : 'tr')
          const template = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key)
          if (typeof template !== 'string') return

          const first = interpolateMessage(template, vars)
          const second = interpolateMessage(template, vars)
          expect(first).toBe(second)
          expect(typeof first).toBe('string')
          expect(localeFormatMap[locale]).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
        }
      ),
      { numRuns: 100 }
    )
  })
})
