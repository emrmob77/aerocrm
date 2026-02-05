import type { Locale } from './messages'

export const localeFormatMap: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
}

export const normalizeLocale = (value?: string | null): Locale => (value === 'en' ? 'en' : 'tr')

export const getNestedValue = (obj: Record<string, unknown>, path: string) =>
  path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return null
    const record = acc as Record<string, unknown>
    return key in record ? record[key] : null
  }, obj)

export const interpolateMessage = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}
