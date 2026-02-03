import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { ActivityFeed, MetricsGrid, QuickActions, WebhookActivity, mapActivityRow, type DashboardActivity } from '@/components/dashboard'
import { getServerLocale, getServerT } from '@/lib/i18n/server'

const quickActions = (t: (key: string) => string) => [
  { label: t('dashboard.quickActions.newDeal'), icon: 'add_task', href: '/deals/new' },
  { label: t('dashboard.quickActions.newProposal'), icon: 'note_add', href: '/proposals/new' },
  { label: t('dashboard.quickActions.newContact'), icon: 'person_add', href: '/contacts/new' },
  { label: t('dashboard.quickActions.report'), icon: 'analytics', href: '/reports' },
]

type DashboardMetricsArray = Database['public']['Functions']['get_dashboard_metrics']['Returns']
type DashboardMetrics = DashboardMetricsArray[number]

type ActivityRow = Pick<
  Database['public']['Tables']['activities']['Row'],
  'id' | 'title' | 'description' | 'type' | 'created_at'
>
type DealRow = Database['public']['Tables']['deals']['Row']
type DealMetricRow = Pick<DealRow, 'id' | 'stage' | 'value' | 'created_at'>

type UserProfile = {
  full_name: string
  team_id: string | null
}

const emptyMetrics: DashboardMetrics = {
  open_deals: 0,
  monthly_revenue: 0,
  conversion_rate: 0,
  pipeline_value: 0,
}

const closedStages = new Set(['Kazanıldı', 'Kaybedildi', 'won', 'lost', 'closed_won', 'closed_lost'])
const wonStages = new Set(['Kazanıldı', 'won', 'closed_won'])

const buildMetricsFromDeals = (deals: DealMetricRow[]): DashboardMetrics => {
  if (deals.length === 0) {
    return emptyMetrics
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let openDeals = 0
  let pipelineValue = 0
  let wonDeals = 0
  let monthlyRevenue = 0

  for (const deal of deals) {
    const isClosed = closedStages.has(deal.stage)
    if (!isClosed) {
      openDeals += 1
      pipelineValue += deal.value ?? 0
    }

    if (wonStages.has(deal.stage)) {
      wonDeals += 1
      if (deal.created_at) {
        const createdAt = new Date(deal.created_at)
        if (createdAt >= monthStart) {
          monthlyRevenue += deal.value ?? 0
        }
      }
    }
  }

  const conversionRate = deals.length > 0 ? (wonDeals / deals.length) * 100 : 0

  return {
    open_deals: openDeals,
    monthly_revenue: monthlyRevenue,
    conversion_rate: conversionRate,
    pipeline_value: pipelineValue,
  }
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
  if (Number.isNaN(value)) {
    return '0%'
  }

  const normalized = value <= 1 ? value * 100 : value
  return `${Math.round(normalized)}%`
}

const getGreeting = (t: (key: string) => string) => {
  const hour = new Date().getHours()
  if (hour < 6) return t('dashboard.greeting.night')
  if (hour < 12) return t('dashboard.greeting.morning')
  if (hour < 18) return t('dashboard.greeting.day')
  if (hour < 22) return t('dashboard.greeting.evening')
  return t('dashboard.greeting.night')
}

const getDisplayName = (profile: UserProfile | null, email?: string | null, fallback?: string) => {
  if (profile?.full_name) {
    return profile.full_name.split(' ')[0]
  }

  if (email) {
    return email.split('@')[0]
  }

  return fallback || 'User'
}

const buildMetrics = (locale: string, t: (key: string) => string, metrics: DashboardMetrics) => [
  {
    label: t('dashboard.metrics.openDeals'),
    value: formatNumber(locale, metrics.open_deals ?? 0),
    badge: null,
    badgeColor: 'text-green-500',
    icon: 'assignment',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    badgeType: t('dashboard.metrics.active'),
  },
  {
    label: t('dashboard.metrics.monthlyWon'),
    value: formatCurrency(locale, metrics.monthly_revenue ?? 0),
    badge: null,
    badgeColor: 'text-green-500',
    icon: 'payments',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconColor: 'text-green-600',
    badgeType: null,
  },
  {
    label: t('dashboard.metrics.conversion'),
    value: formatPercent(metrics.conversion_rate ?? 0),
    badge: null,
    badgeColor: 'text-green-500',
    icon: 'trending_up',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-600',
    badgeType: null,
  },
  {
    label: t('dashboard.metrics.pipeline'),
    value: formatCurrency(locale, metrics.pipeline_value ?? 0),
    badge: null,
    badgeColor: '',
    icon: 'account_tree',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    iconColor: 'text-orange-600',
    badgeType: t('dashboard.metrics.total'),
  },
]

const mapActivities = (rows: ActivityRow[] | null): DashboardActivity[] => {
  if (!rows) {
    return []
  }

  return rows.map(mapActivityRow)
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale() === 'en' ? 'en-US' : 'tr-TR'
  const { data: { user } } = await supabase.auth.getUser()

  let profile: UserProfile | null = null
  if (user?.id) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, team_id')
      .eq('id', user.id)
      .single()

    if (userProfile) {
      profile = userProfile
    }
  }

  const teamId = profile?.team_id ?? null

  const metricsPromise = supabase.rpc('get_dashboard_metrics')
  let activitiesQuery = supabase
    .from('activities')
    .select('id, title, description, type, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (teamId) {
    activitiesQuery = activitiesQuery.eq('team_id', teamId)
  }

  const [{ data: metrics, error: metricsError }, { data: activityRows }] = await Promise.all([
    metricsPromise,
    activitiesQuery,
  ])

  let metricsData = metrics ?? emptyMetrics
  const metricsAllZero =
    (metricsData.open_deals ?? 0) === 0 &&
    (metricsData.monthly_revenue ?? 0) === 0 &&
    (metricsData.conversion_rate ?? 0) === 0 &&
    (metricsData.pipeline_value ?? 0) === 0

  if (metricsError || !metrics || metricsAllZero) {
    let dealsQuery = supabase
      .from('deals')
      .select('id, stage, value, created_at')

    if (teamId) {
      dealsQuery = dealsQuery.eq('team_id', teamId)
    } else if (user?.id) {
      dealsQuery = dealsQuery.eq('user_id', user.id)
    }

    const { data: deals } = await dealsQuery
    if (deals && deals.length > 0) {
      metricsData = buildMetricsFromDeals(deals)
    }
  }

  const activities = mapActivities(activityRows)
  const greeting = getGreeting(t)
  const displayName = getDisplayName(profile, user?.email, t('header.userFallback'))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          {greeting}, {displayName}!
        </h2>
        <p className="text-[#48679d] dark:text-gray-400">
          {t('dashboard.overview')}
        </p>
      </div>

      <MetricsGrid metrics={buildMetrics(locale, t, metricsData)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <ActivityFeed initialActivities={activities} teamId={teamId} />
          <WebhookActivity />
        </div>
        <div className="flex flex-col gap-8">
          <QuickActions actions={quickActions(t)} />
        </div>
      </div>
    </div>
  )
}
