'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { messages, type Locale } from './messages'

type I18nContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  get: (key: string) => unknown
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

const LOCALE_STORAGE_KEY = 'aero_locale'
const localeMap: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
}

const I18nContext = createContext<I18nContextValue | null>(null)

const normalizeLocale = (value?: string | null): Locale => (value === 'en' ? 'en' : 'tr')

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr')

  useEffect(() => {
    const cookieLocale = readCookie(LOCALE_STORAGE_KEY)
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null
    const initial = cookieLocale || stored
    if (initial) {
      const normalized = normalizeLocale(initial)
      setLocaleState(normalized)
      document.documentElement.lang = normalized
    }

    fetch('/api/settings/language')
      .then((res) => res.json())
      .then((data) => {
        if (data?.language) {
          const normalized = normalizeLocale(data.language)
          setLocaleState(normalized)
          localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
          document.documentElement.lang = normalized
        }
      })
      .catch(() => undefined)
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
      document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000`
      document.documentElement.lang = next
    }
    fetch('/api/settings/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: next }),
    }).catch(() => undefined)
  }

  const t = (key: string, vars?: Record<string, string | number>) => {
    const value = getValue(messages[locale] as unknown as Record<string, unknown>, key)
    if (!value || typeof value !== 'string') return key
    return interpolate(value, vars)
  }

  const get = (key: string) => getValue(messages[locale] as unknown as Record<string, unknown>, key)

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const value = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return new Intl.DateTimeFormat(localeMap[locale], options).format(value)
  }

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(localeMap[locale], options).format(value)

  const contextValue: I18nContextValue = { locale, setLocale, t, get, formatDate, formatNumber }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
