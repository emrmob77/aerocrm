'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/components/deals'

type ReportType = 'sales' | 'deals' | 'team' | 'forecast'
type DateRange = '7d' | '30d' | '90d' | '12m'

// KPI Data
const kpiData = {
  totalRevenue: { value: 1245800, change: 18.2, trend: 'up' as const },
  closedDeals: { value: 47, change: 12, trend: 'up' as const },
  avgDealSize: { value: 26506, change: -5.3, trend: 'down' as const },
  winRate: { value: 68, change: 4.2, trend: 'up' as const },
}

// Top performers
const topPerformers = [
  { name: 'Ahmet Yılmaz', avatar: 'AY', deals: 12, revenue: 320000, target: 85 },
  { name: 'Caner Yılmaz', avatar: 'CY', deals: 10, revenue: 285000, target: 78 },
  { name: 'Elif Demir', avatar: 'ED', deals: 9, revenue: 245000, target: 72 },
  { name: 'Mert Kaya', avatar: 'MK', deals: 8, revenue: 198000, target: 65 },
]

// Pipeline data
const pipelineStages = [
  { id: 'lead', count: 24, value: 480000, color: 'bg-slate-400' },
  { id: 'proposal', count: 18, value: 520000, color: 'bg-primary' },
  { id: 'negotiation', count: 12, value: 380000, color: 'bg-amber-500' },
  { id: 'won', count: 47, value: 1245800, color: 'bg-emerald-500' },
  { id: 'lost', count: 8, value: 180000, color: 'bg-red-500' },
]

// Monthly data for chart
const monthlyData = [
  { monthIndex: 0, revenue: 85000, deals: 4 },
  { monthIndex: 1, revenue: 92000, deals: 5 },
  { monthIndex: 2, revenue: 128000, deals: 6 },
  { monthIndex: 3, revenue: 145000, deals: 8 },
  { monthIndex: 4, revenue: 168000, deals: 7 },
  { monthIndex: 5, revenue: 195000, deals: 9 },
]

// Recent reports
const recentReports = [
  { id: 1, nameKey: 'reports.samples.monthlySales', type: 'sales', date: '2024-05-24', status: 'ready' },
  { id: 2, nameKey: 'reports.samples.teamPerformance', type: 'team', date: '2024-05-20', status: 'ready' },
  { id: 3, nameKey: 'reports.samples.pipelineHealth', type: 'deals', date: '2024-05-15', status: 'ready' },
  { id: 4, nameKey: 'reports.samples.q2Forecast', type: 'forecast', date: '2024-05-10', status: 'generating' },
]

export default function ReportsPage() {
  const { t, locale, formatNumber, formatDate } = useI18n()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const currency = locale === 'en' ? 'USD' : 'TRY'
  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  const reportTypes = [
    { id: 'sales' as ReportType, label: t('reports.types.sales'), icon: 'trending_up' },
    { id: 'deals' as ReportType, label: t('reports.types.deals'), icon: 'handshake' },
    { id: 'team' as ReportType, label: t('reports.types.team'), icon: 'group' },
    { id: 'forecast' as ReportType, label: t('reports.types.forecast'), icon: 'query_stats' },
  ]

  const dateRanges = [
    { id: '7d' as DateRange, label: t('reports.ranges.days7') },
    { id: '30d' as DateRange, label: t('reports.ranges.days30') },
    { id: '90d' as DateRange, label: t('reports.ranges.days90') },
    { id: '12m' as DateRange, label: t('reports.ranges.months12') },
  ]

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue))
  const chartData = useMemo(
    () =>
      monthlyData.map((item) => {
        const date = new Date(2024, item.monthIndex, 1)
        return {
          ...item,
          label: date.toLocaleDateString(formatLocale, { month: 'short' }),
        }
      }),
    [formatLocale]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('reports.title')}</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range.id
                    ? 'bg-primary text-white'
                    : 'text-[#48679d] hover:text-[#0d121c] dark:hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Link
            href="/reports/import-export"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#0d121c] dark:text-white rounded-lg text-sm font-bold hover:border-primary/30 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">swap_vert</span>
            {t('reports.importExport')}
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">download</span>
            {t('reports.export')}
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
              activeReport === report.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#48679d] hover:text-primary hover:border-primary/30'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{report.icon}</span>
            {report.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">{t('reports.kpi.totalRevenue')}</p>
            <span className="material-symbols-outlined text-primary">payments</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">
            {formatCurrency(kpiData.totalRevenue.value, formatLocale, currency)}
          </p>
          <div className={`flex items-center gap-1 text-sm font-semibold ${kpiData.totalRevenue.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-sm">
              {kpiData.totalRevenue.trend === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {t('reports.kpi.changeMonth', {
              value: `${kpiData.totalRevenue.change > 0 ? '+' : ''}${formatNumber(kpiData.totalRevenue.change)}`,
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">{t('reports.kpi.closedDeals')}</p>
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">{kpiData.closedDeals.value}</p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {t('reports.kpi.changeThisMonth', {
              value: `${kpiData.closedDeals.change > 0 ? '+' : ''}${kpiData.closedDeals.change}`,
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">{t('reports.kpi.avgDeal')}</p>
            <span className="material-symbols-outlined text-amber-500">speed</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">
            {formatCurrency(kpiData.avgDealSize.value, formatLocale, currency)}
          </p>
          <div className={`flex items-center gap-1 text-sm font-semibold ${kpiData.avgDealSize.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-sm">
              {kpiData.avgDealSize.trend === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {t('reports.kpi.changeMonth', {
              value: `${kpiData.avgDealSize.change > 0 ? '+' : ''}${formatNumber(kpiData.avgDealSize.change)}`,
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">{t('reports.kpi.winRate')}</p>
            <span className="material-symbols-outlined text-primary">trophy</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">
            {formatNumber(kpiData.winRate.value)}%
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {t('reports.kpi.changeMonth', {
              value: `${kpiData.winRate.change > 0 ? '+' : ''}${formatNumber(kpiData.winRate.change)}`,
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('reports.charts.revenueTrend')}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[#48679d]">{t('reports.charts.revenueLabel')}</span>
              </div>
            </div>
          </div>
          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs font-bold text-[#0d121c] dark:text-white mb-1">
                    {formatCurrency(item.revenue, formatLocale, currency)}
                  </span>
                  <div 
                    className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden transition-all hover:bg-primary/30"
                    style={{ height: `${(item.revenue / maxRevenue) * 180}px` }}
                  >
                    <div 
                      className="absolute bottom-0 w-full bg-primary rounded-t-lg"
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-[#48679d]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-6">{t('reports.pipeline.title')}</h3>
          <div className="space-y-4">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#0d121c] dark:text-white">{t(`stages.${stage.id}`)}</span>
                  <span className="text-sm font-bold text-[#48679d]">{t('reports.pipeline.deals', { count: stage.count })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded-full`}
                      style={{ width: `${(stage.value / 1500000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#48679d] w-20 text-right">
                    {formatCurrency(stage.value, formatLocale, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#e7ebf4] dark:border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#0d121c] dark:text-white">{t('reports.pipeline.total')}</span>
              <span className="text-lg font-extrabold text-primary">
                {formatCurrency(pipelineStages.reduce((sum, s) => sum + s.value, 0), formatLocale, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('reports.topPerformers.title')}</h3>
            <span className="text-xs font-bold text-[#48679d] uppercase">{t('reports.topPerformers.thisMonth')}</span>
          </div>
          <div className="space-y-4">
            {topPerformers.map((person, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  {person.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#0d121c] dark:text-white">{person.name}</span>
                    <span className="text-sm font-bold text-primary">{formatCurrency(person.revenue, formatLocale, currency)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${person.target}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#48679d]">{person.target}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('reports.recent.title')}</h3>
            <button className="text-sm font-bold text-primary hover:underline">{t('reports.recent.viewAll')}</button>
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div 
                key={report.id} 
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  report.type === 'sales' ? 'bg-primary/10 text-primary' :
                  report.type === 'team' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  report.type === 'deals' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                }`}>
                  <span className="material-symbols-outlined text-xl">
                    {report.type === 'sales' ? 'trending_up' :
                     report.type === 'team' ? 'group' :
                     report.type === 'deals' ? 'handshake' : 'query_stats'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#0d121c] dark:text-white group-hover:text-primary transition-colors">
                    {t(report.nameKey)}
                  </p>
                  <p className="text-xs text-[#48679d]">
                    {formatDate(report.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {report.status === 'ready' ? (
                  <button className="p-2 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    {t('reports.recent.generating')}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 border-2 border-dashed border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm font-bold text-[#48679d] hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            {t('reports.recent.new')}
          </button>
        </div>
      </div>
    </div>
  )
}
