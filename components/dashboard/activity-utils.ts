import type { Database } from '@/types/database'

type ActivityRow = Pick<
  Database['public']['Tables']['activities']['Row'],
  'id' | 'title' | 'description' | 'type' | 'created_at'
>

export type DashboardActivity = {
  id: string
  title: string
  description: string | null
  type: string | null
  createdAt: string | null
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

export function formatRelativeTime(
  isoDate: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
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
  return diffDays < 0
    ? t('time.daysAgo', { count: Math.abs(diffDays) })
    : t('time.daysFromNow', { count: diffDays })
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
