import type { Database } from '@/types/database'

type ActivityRow = Database['public']['Tables']['activities']['Row']

export type DashboardActivity = {
  id: string
  title: string
  description: string | null
  type: string | null
  createdAt: string
}

const activityTypeMap: Record<string, { icon: string; iconBg: string; iconColor: string }> = {
  proposal_sent: {
    icon: 'mail',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-primary',
  },
  deal_won: {
    icon: 'check_circle',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600',
  },
  meeting_scheduled: {
    icon: 'event',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600',
  },
}

export const defaultActivityPresentation = {
  icon: 'bolt',
  iconBg: 'bg-gray-100 dark:bg-gray-800',
  iconColor: 'text-[#48679d] dark:text-gray-400',
}

export function getActivityPresentation(type: string | null) {
  if (!type) {
    return defaultActivityPresentation
  }
  return activityTypeMap[type] ?? defaultActivityPresentation
}

export function formatRelativeTime(isoDate: string) {
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
  return diffDays < 0 ? `${Math.abs(diffDays)} gün önce` : `${diffDays} gün sonra`
}

export function mapActivityRow(row: ActivityRow): DashboardActivity {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    type: row.type ?? null,
    createdAt: row.created_at,
  }
}
