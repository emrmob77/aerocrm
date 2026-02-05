import { cookies } from 'next/headers'
import { messages } from './messages'
import { getNestedValue, interpolateMessage, normalizeLocale } from './utils'

export const getServerLocale = () => {
  const store = cookies()
  return normalizeLocale(store.get('aero_locale')?.value)
}

export const getServerT = () => {
  const locale = getServerLocale()
  return (key: string, vars?: Record<string, string | number>) => {
    const value = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key)
    if (!value || typeof value !== 'string') return key
    return interpolateMessage(value, vars)
  }
}
