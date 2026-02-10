export type StageId = 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'

export type StageConfig = {
  id: StageId
  label: string
  dbValues: string[]
}

type BaseStageConfig = {
  id: StageId
  labelKey: string
  dbValues: string[]
}

const baseStageConfigs: BaseStageConfig[] = [
  { id: 'lead', labelKey: 'stages.lead', dbValues: ['lead', 'aday'] },
  { id: 'negotiation', labelKey: 'stages.negotiation', dbValues: ['negotiation', 'görüşme', 'meeting'] },
  { id: 'proposal', labelKey: 'stages.proposal', dbValues: ['proposal', 'proposal_sent', 'teklif', 'teklif gönderildi'] },
  { id: 'won', labelKey: 'stages.won', dbValues: ['won', 'kazanıldı', 'closed_won'] },
  { id: 'lost', labelKey: 'stages.lost', dbValues: ['lost', 'kaybedildi', 'closed_lost'] },
]

export const getStageConfigs = (t: (key: string) => string): StageConfig[] =>
  baseStageConfigs.map((stage) => ({
    id: stage.id,
    label: t(stage.labelKey),
    dbValues: stage.dbValues,
  }))

export const normalizeStage = (value?: string | null): StageId => {
  if (!value) {
    return 'lead'
  }

  const normalized = value.toLowerCase()
  const match = baseStageConfigs.find(stage =>
    stage.dbValues.some(dbValue => dbValue.toLowerCase() === normalized)
  )

  return match?.id ?? 'lead'
}

export const getDbStage = (stageId: StageId) => {
  const stage = baseStageConfigs.find(item => item.id === stageId)
  return stage?.dbValues[0] ?? stageId
}

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

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const isYesterday = (target: Date, now: Date) => {
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffDays = Math.round((startOfTarget.getTime() - startOfNow.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays === -1
}

export type ActivityMeta = {
  label: string
  tone: 'normal' | 'urgent' | 'muted'
  icon?: string
}

export const getActivityMeta = (
  stage: StageId,
  updatedAt: string,
  t: (key: string, vars?: Record<string, string | number>) => string
): ActivityMeta => {
  const target = new Date(updatedAt)
  const now = new Date()
  const relative = formatRelativeTime(updatedAt, t)

  if (stage === 'lead') {
    if (isSameDay(target, now)) {
      return { label: t('time.today'), tone: 'urgent', icon: 'priority_high' }
    }
    if (isYesterday(target, now)) {
      return { label: t('time.yesterday'), tone: 'urgent', icon: 'priority_high' }
    }
    return { label: relative, tone: 'muted', icon: 'schedule' }
  }

  if (stage === 'proposal') {
    return { label: t('time.awaiting', { value: relative }), tone: 'muted' }
  }

  if (stage === 'negotiation') {
    return { label: t('time.lastMeeting', { value: relative }), tone: 'muted' }
  }

  if (stage === 'won') {
    if (isSameDay(target, now)) {
      return { label: t('time.closedToday'), tone: 'muted' }
    }
    return { label: t('time.closed', { value: relative }), tone: 'muted' }
  }

  if (stage === 'lost') {
    return { label: t('time.lost', { value: relative }), tone: 'muted' }
  }

  return { label: relative, tone: 'muted' }
}
