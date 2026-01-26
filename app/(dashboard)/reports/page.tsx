'use client'

import { useState } from 'react'

type ReportType = 'sales' | 'deals' | 'team' | 'forecast'
type DateRange = '7d' | '30d' | '90d' | '12m'

// KPI Data
const kpiData = {
  totalRevenue: { value: '₺1.245.800', change: '+18.2%', trend: 'up' },
  closedDeals: { value: '47', change: '+12', trend: 'up' },
  avgDealSize: { value: '₺26.506', change: '-5.3%', trend: 'down' },
  winRate: { value: '%68', change: '+4.2%', trend: 'up' },
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
  { name: 'Aday', count: 24, value: 480000, color: 'bg-slate-400' },
  { name: 'Teklif', count: 18, value: 520000, color: 'bg-primary' },
  { name: 'Görüşme', count: 12, value: 380000, color: 'bg-amber-500' },
  { name: 'Kazanıldı', count: 47, value: 1245800, color: 'bg-emerald-500' },
  { name: 'Kaybedildi', count: 8, value: 180000, color: 'bg-red-500' },
]

// Monthly data for chart
const monthlyData = [
  { month: 'Oca', revenue: 85000, deals: 4 },
  { month: 'Şub', revenue: 92000, deals: 5 },
  { month: 'Mar', revenue: 128000, deals: 6 },
  { month: 'Nis', revenue: 145000, deals: 8 },
  { month: 'May', revenue: 168000, deals: 7 },
  { month: 'Haz', revenue: 195000, deals: 9 },
]

// Recent reports
const recentReports = [
  { id: 1, name: 'Aylık Satış Raporu', type: 'sales', date: '24 May 2024', status: 'ready' },
  { id: 2, name: 'Takım Performans Analizi', type: 'team', date: '20 May 2024', status: 'ready' },
  { id: 3, name: 'Pipeline Sağlık Raporu', type: 'deals', date: '15 May 2024', status: 'ready' },
  { id: 4, name: 'Q2 Tahmin Raporu', type: 'forecast', date: '10 May 2024', status: 'generating' },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value)
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  const reportTypes = [
    { id: 'sales' as ReportType, label: 'Satış Raporu', icon: 'trending_up' },
    { id: 'deals' as ReportType, label: 'Anlaşmalar', icon: 'handshake' },
    { id: 'team' as ReportType, label: 'Takım Performansı', icon: 'group' },
    { id: 'forecast' as ReportType, label: 'Tahminler', icon: 'query_stats' },
  ]

  const dateRanges = [
    { id: '7d' as DateRange, label: 'Son 7 Gün' },
    { id: '30d' as DateRange, label: 'Son 30 Gün' },
    { id: '90d' as DateRange, label: 'Son 90 Gün' },
    { id: '12m' as DateRange, label: 'Son 12 Ay' },
  ]

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Raporlar</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">Detaylı satış raporları ve analizler</p>
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
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">download</span>
            Dışa Aktar
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
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">Toplam Gelir</p>
            <span className="material-symbols-outlined text-primary">payments</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">{kpiData.totalRevenue.value}</p>
          <div className={`flex items-center gap-1 text-sm font-semibold ${kpiData.totalRevenue.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-sm">
              {kpiData.totalRevenue.trend === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {kpiData.totalRevenue.change} geçen aya göre
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">Kapatılan Anlaşma</p>
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">{kpiData.closedDeals.value}</p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {kpiData.closedDeals.change} bu ay
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">Ort. Anlaşma Değeri</p>
            <span className="material-symbols-outlined text-amber-500">speed</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">{kpiData.avgDealSize.value}</p>
          <div className={`flex items-center gap-1 text-sm font-semibold ${kpiData.avgDealSize.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-sm">
              {kpiData.avgDealSize.trend === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {kpiData.avgDealSize.change} geçen aya göre
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">Kazanma Oranı</p>
            <span className="material-symbols-outlined text-primary">trophy</span>
          </div>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">{kpiData.winRate.value}</p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {kpiData.winRate.change} geçen aya göre
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Gelir Trendi</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[#48679d]">Gelir</span>
              </div>
            </div>
          </div>
          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4">
            {monthlyData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs font-bold text-[#0d121c] dark:text-white mb-1">
                    {formatCurrency(item.revenue)}
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
                <span className="text-xs font-medium text-[#48679d]">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-6">Pipeline Özeti</h3>
          <div className="space-y-4">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#0d121c] dark:text-white">{stage.name}</span>
                  <span className="text-sm font-bold text-[#48679d]">{stage.count} anlaşma</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded-full`}
                      style={{ width: `${(stage.value / 1500000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#48679d] w-20 text-right">
                    {formatCurrency(stage.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#e7ebf4] dark:border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#0d121c] dark:text-white">Toplam Pipeline</span>
              <span className="text-lg font-extrabold text-primary">
                {formatCurrency(pipelineStages.reduce((sum, s) => sum + s.value, 0))}
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
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">En İyi Performanslar</h3>
            <span className="text-xs font-bold text-[#48679d] uppercase">Bu Ay</span>
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
                    <span className="text-sm font-bold text-primary">{formatCurrency(person.revenue)}</span>
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
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Son Raporlar</h3>
            <button className="text-sm font-bold text-primary hover:underline">Tümünü Gör</button>
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
                    {report.name}
                  </p>
                  <p className="text-xs text-[#48679d]">{report.date}</p>
                </div>
                {report.status === 'ready' ? (
                  <button className="p-2 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Hazırlanıyor
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 border-2 border-dashed border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm font-bold text-[#48679d] hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Yeni Rapor Oluştur
          </button>
        </div>
      </div>
    </div>
  )
}
