export type StageId = 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'

export type StageConfig = {
  id: StageId
  label: string
  dbValues: string[]
}

export const stageConfigs: StageConfig[] = [
  { id: 'lead', label: 'Aday', dbValues: ['lead', 'aday'] },
  { id: 'proposal', label: 'Teklif Gönderildi', dbValues: ['proposal', 'proposal_sent', 'teklif', 'teklif gönderildi'] },
  { id: 'negotiation', label: 'Görüşme', dbValues: ['negotiation', 'görüşme', 'meeting'] },
  { id: 'won', label: 'Kazanıldı', dbValues: ['won', 'kazanıldı', 'closed_won'] },
  { id: 'lost', label: 'Kaybedildi', dbValues: ['lost', 'kaybedildi', 'closed_lost'] },
]

export const normalizeStage = (value?: string | null): StageId => {
  if (!value) {
    return 'lead'
  }

  const normalized = value.toLowerCase()
  const match = stageConfigs.find(stage =>
    stage.dbValues.some(dbValue => dbValue.toLowerCase() === normalized)
  )

  return match?.id ?? 'lead'
}

export const getDbStage = (stageId: StageId) => {
  const stage = stageConfigs.find(item => item.id === stageId)
  return stage?.dbValues[0] ?? stageId
}

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

export const getActivityMeta = (stage: StageId, updatedAt: string): ActivityMeta => {
  const target = new Date(updatedAt)
  const now = new Date()
  const relative = formatRelativeTime(updatedAt)

  if (stage === 'lead') {
    if (isSameDay(target, now)) {
      return { label: 'Bugün', tone: 'urgent', icon: 'priority_high' }
    }
    if (isYesterday(target, now)) {
      return { label: 'Dün', tone: 'urgent', icon: 'priority_high' }
    }
    return { label: relative, tone: 'muted', icon: 'schedule' }
  }

  if (stage === 'proposal') {
    return { label: `Bekliyor • ${relative}`, tone: 'muted' }
  }

  if (stage === 'negotiation') {
    return { label: `Son görüşme: ${relative}`, tone: 'muted' }
  }

  if (stage === 'won') {
    if (isSameDay(target, now)) {
      return { label: 'Bugün kapatıldı', tone: 'muted' }
    }
    return { label: `Kapatıldı • ${relative}`, tone: 'muted' }
  }

  if (stage === 'lost') {
    return { label: `Kaybedildi • ${relative}`, tone: 'muted' }
  }

  return { label: relative, tone: 'muted' }
}
