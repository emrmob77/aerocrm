import { cookies } from 'next/headers'
import { messages, type Locale } from './messages'

const normalizeLocale = (value?: string | null): Locale => (value === 'en' ? 'en' : 'tr')

const getValue = (obj: Record<string, unknown>, path: string) =>
  path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return null
    const record = acc as Record<string, unknown>
    return key in record ? record[key] : null
  }, obj)

const interpolate = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}

export const getServerLocale = () => {
  const store = cookies()
  return normalizeLocale(store.get('aero_locale')?.value)
}

export const getServerT = () => {
  const locale = getServerLocale()
  return (key: string, vars?: Record<string, string | number>) => {
    const value = getValue(messages[locale] as unknown as Record<string, unknown>, key)
    if (!value || typeof value !== 'string') return key
    return interpolate(value, vars)
  }
}
