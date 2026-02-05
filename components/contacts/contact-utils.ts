export const formatCurrency = (value: number, locale = 'tr-TR', currency = 'TRY') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export const formatRelativeTime = (
  isoDate: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) => {
  const target = new Date(isoDate)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) {
    return diffSeconds <= 0 ? t('time.justNow') : t('time.soon')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  const absMinutes = Math.abs(diffMinutes)

  if (absMinutes < 60) {
    return diffMinutes < 0
      ? t('time.minutesAgo', { count: Math.abs(diffMinutes) })
      : t('time.minutesFromNow', { count: diffMinutes })
  }

  const diffHours = Math.round(diffMinutes / 60)
  const absHours = Math.abs(diffHours)

  if (absHours < 24) {
    return diffHours < 0
      ? t('time.hoursAgo', { count: Math.abs(diffHours) })
      : t('time.hoursFromNow', { count: diffHours })
  }

  const diffDays = Math.round(diffHours / 24)
  if (diffDays === -1) {
    return t('time.yesterday')
  }
  if (diffDays === 1) {
    return t('time.tomorrow')
  }
  return diffDays < 0
    ? t('time.daysAgo', { count: Math.abs(diffDays) })
    : t('time.daysFromNow', { count: diffDays })
}

export const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '??'
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const getCustomFields = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

export const parseContactTags = (customFields: unknown): string[] => {
  const record = getCustomFields(customFields)
  if (!record) return []
  const tags = record.tags
  if (Array.isArray(tags)) {
    return tags.map((tag) => `${tag}`.trim()).filter(Boolean)
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

export const normalizeTagInput = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  )

export type ContactFilterType = 'all' | 'new' | 'highValue' | 'inactive'

export type ContactFilterInput = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  company: string | null
  totalValue: number
  createdAt: string
  lastActivityAt: string
}

export const matchesContactQuery = (contact: ContactFilterInput, query: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return (
    contact.fullName.toLowerCase().includes(normalizedQuery) ||
    (contact.email ?? '').toLowerCase().includes(normalizedQuery) ||
    (contact.phone ?? '').toLowerCase().includes(normalizedQuery) ||
    (contact.company ?? '').toLowerCase().includes(normalizedQuery)
  )
}

export const filterContacts = (
  contacts: ContactFilterInput[],
  query: string,
  filter: ContactFilterType
) =>
  contacts.filter((contact) => {
    if (!matchesContactQuery(contact, query)) {
      return false
    }

    if (filter === 'new') {
      return isWithinDays(contact.createdAt, 7)
    }

    if (filter === 'highValue') {
      return contact.totalValue >= 50000
    }

    if (filter === 'inactive') {
      return isOlderThanDays(contact.lastActivityAt, 30)
    }

    return true
  })

export const isWithinDays = (isoDate: string, days: number) => {
  const target = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  return diffMs <= days * 24 * 60 * 60 * 1000
}

export const isOlderThanDays = (isoDate: string, days: number) => {
  const target = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  return diffMs > days * 24 * 60 * 60 * 1000
}
