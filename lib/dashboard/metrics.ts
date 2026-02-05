export type DashboardMetricsValue = {
  open_deals?: number | null
  monthly_revenue?: number | null
  conversion_rate?: number | null
  pipeline_value?: number | null
}

export type DashboardMetricCard = {
  label: string
  value: string
  badge?: string | null
  badgeColor?: string
  icon: string
  iconBg: string
  iconColor: string
  badgeType?: string | null
}

const MAX_ABS_METRIC = 1_000_000_000_000

const toSafeNumber = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  if (value > MAX_ABS_METRIC) {
    return MAX_ABS_METRIC
  }
  if (value < -MAX_ABS_METRIC) {
    return -MAX_ABS_METRIC
  }
  return value
}

const formatCurrency = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: locale.startsWith('en') ? 'USD' : 'TRY',
    maximumFractionDigits: 0,
  }).format(value)

const formatNumber = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number) => {
  const safeValue = toSafeNumber(value)
  const normalized = safeValue <= 1 ? safeValue * 100 : safeValue
  return `${Math.round(normalized)}%`
}

export const buildDashboardMetrics = (
  locale: string,
  t: (key: string) => string,
  metrics: DashboardMetricsValue
): DashboardMetricCard[] => [
  {
    label: t('dashboard.metrics.openDeals'),
    value: formatNumber(locale, toSafeNumber(metrics.open_deals)),
    badge: null,
    badgeColor: 'text-green-500',
    icon: 'assignment',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    badgeType: t('dashboard.metrics.active'),
  },
  {
    label: t('dashboard.metrics.monthlyWon'),
    value: formatCurrency(locale, toSafeNumber(metrics.monthly_revenue)),
    badge: null,
    badgeColor: 'text-green-500',
    icon: 'payments',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconColor: 'text-green-600',
    badgeType: null,
  },
  {
    label: t('dashboard.metrics.conversion'),
    value: formatPercent(toSafeNumber(metrics.conversion_rate)),
    badge: null,
    badgeColor: 'text-green-500',
    icon: 'trending_up',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-600',
    badgeType: null,
  },
  {
    label: t('dashboard.metrics.pipeline'),
    value: formatCurrency(locale, toSafeNumber(metrics.pipeline_value)),
    badge: null,
    badgeColor: '',
    icon: 'account_tree',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    iconColor: 'text-orange-600',
    badgeType: t('dashboard.metrics.total'),
  },
]
