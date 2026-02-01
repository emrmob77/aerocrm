export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export const formatRelativeTime = (isoDate: string) => {
  const target = new Date(isoDate)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) {
    return diffSeconds <= 0 ? 'Az önce' : 'Birazdan'
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  const absMinutes = Math.abs(diffMinutes)

  if (absMinutes < 60) {
    return diffMinutes < 0 ? `${Math.abs(diffMinutes)} dk önce` : `${diffMinutes} dk sonra`
  }

  const diffHours = Math.round(diffMinutes / 60)
  const absHours = Math.abs(diffHours)

  if (absHours < 24) {
    return diffHours < 0 ? `${Math.abs(diffHours)} saat önce` : `${diffHours} saat sonra`
  }

  const diffDays = Math.round(diffHours / 24)
  if (diffDays === -1) {
    return 'Dün'
  }
  if (diffDays === 1) {
    return 'Yarın'
  }
  return diffDays < 0 ? `${Math.abs(diffDays)} gün önce` : `${diffDays} gün sonra`
}

export const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '??'
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

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
