import { cookies } from 'next/headers'
import { messages, type Locale } from './messages'

const normalizeLocale = (value?: string | null): Locale => (value === 'en' ? 'en' : 'tr')

const getValue = (obj: Record<string, any>, path: string) =>
  path.split('.').reduce((acc, key) => (acc && key in acc ? acc[key] : null), obj)

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
    const value = getValue(messages[locale] as unknown as Record<string, any>, key)
    if (!value || typeof value !== 'string') return key
    return interpolate(value, vars)
  }
}
