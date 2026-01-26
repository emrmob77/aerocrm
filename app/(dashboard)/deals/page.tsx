'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Types
interface Deal {
  id: string
  title: string
  company: string
  value: number
  stage: string
  contactName: string
  contactAvatar?: string
  lastActivity: string
  hasProposal?: boolean
  isHot?: boolean
  isStale?: boolean
}

// Mock data - will be replaced with Supabase data
const initialDeals: Deal[] = [
  { id: '1', title: 'SEO Optimizasyonu', company: 'ABC Teknoloji', value: 15000, stage: 'lead', contactName: 'Ahmet Yılmaz', lastActivity: '2 saat önce', isHot: true },
  { id: '2', title: 'Web Sitesi Yenileme', company: 'XYZ Holding', value: 45000, stage: 'lead', contactName: 'Mehmet Demir', lastActivity: '1 gün önce' },
  { id: '3', title: 'E-ticaret Entegrasyonu', company: 'DEF Retail', value: 28000, stage: 'proposal', contactName: 'Ayşe Kara', lastActivity: '3 saat önce', hasProposal: true },
  { id: '4', title: 'CRM Kurulumu', company: 'GHI Danışmanlık', value: 12000, stage: 'proposal', contactName: 'Fatma Şahin', lastActivity: '5 saat önce', hasProposal: true },
  { id: '5', title: 'Mobil Uygulama', company: 'JKL Startup', value: 75000, stage: 'negotiation', contactName: 'Ali Öztürk', lastActivity: '1 saat önce' },
  { id: '6', title: 'Dijital Pazarlama', company: 'MNO Ajans', value: 8000, stage: 'won', contactName: 'Zeynep Yıldız', lastActivity: '2 gün önce' },
  { id: '7', title: 'Sosyal Medya Yönetimi', company: 'PQR Media', value: 5000, stage: 'won', contactName: 'Can Aksoy', lastActivity: '1 hafta önce' },
  { id: '8', title: 'Bulut Altyapısı', company: 'STU Tech', value: 35000, stage: 'lost', contactName: 'Emre Yılmaz', lastActivity: '3 gün önce', isStale: true },
]

const stages = [
  { id: 'lead', label: 'Aday', color: 'bg-aero-slate-400', borderColor: 'border-aero-slate-400' },
  { id: 'proposal', label: 'Teklif Gönderildi', color: 'bg-aero-blue-500', borderColor: 'border-aero-blue-500' },
  { id: 'negotiation', label: 'Görüşme', color: 'bg-aero-amber-500', borderColor: 'border-aero-amber-500' },
  { id: 'won', label: 'Kazanıldı', color: 'bg-aero-green-500', borderColor: 'border-aero-green-500' },
  { id: 'lost', label: 'Kaybedildi', color: 'bg-aero-red-500', borderColor: 'border-aero-red-500' },
]

// Format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [showLost, setShowLost] = useState(false)

  // Filter deals by search query
  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get deals for a specific stage
  const getDealsByStage = (stageId: string) => 
    filteredDeals.filter(deal => deal.stage === stageId)

  // Calculate stage totals
  const getStageTotals = (stageId: string) => {
    const stageDeals = getDealsByStage(stageId)
    return {
      count: stageDeals.length,
      value: stageDeals.reduce((sum, deal) => sum + deal.value, 0)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stageId: string) => {
    if (draggedDeal) {
      setDeals(deals.map(deal => 
        deal.id === draggedDeal.id ? { ...deal, stage: stageId } : deal
      ))
      setDraggedDeal(null)
    }
  }

  // Visible stages
  const visibleStages = showLost ? stages : stages.filter(s => s.id !== 'lost')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-aero-slate-900 dark:text-white">Anlaşmalar</h1>
          <p className="text-sm text-aero-slate-500 mt-1">
            Toplam {filteredDeals.length} anlaşma • {formatCurrency(filteredDeals.reduce((sum, d) => sum + d.value, 0))} pipeline değeri
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg text-aero-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Anlaşma ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-60"
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-aero-slate-100 dark:bg-aero-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-aero-slate-600 text-aero-slate-900 dark:text-white shadow-sm'
                  : 'text-aero-slate-500 dark:text-aero-slate-400'
              )}
            >
              <span className="material-symbols-outlined text-lg">view_kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-aero-slate-600 text-aero-slate-900 dark:text-white shadow-sm'
                  : 'text-aero-slate-500 dark:text-aero-slate-400'
              )}
            >
              <span className="material-symbols-outlined text-lg">view_list</span>
            </button>
          </div>

          {/* New Deal Button */}
          <Link
            href="/deals/new"
            className="btn-primary btn-md"
          >
            <span className="material-symbols-outlined text-lg mr-1">add</span>
            Yeni Anlaşma
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleStages.map((stage) => {
            const totals = getStageTotals(stage.id)
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-72"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage Header */}
                <div className={cn('rounded-t-lg p-3', stage.color)}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">{stage.label}</h3>
                    <span className="text-white/80 text-xs font-medium">
                      {totals.count} • {formatCurrency(totals.value)}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="bg-aero-slate-100 dark:bg-aero-slate-800/50 rounded-b-lg p-2 min-h-[400px] space-y-2">
                  {getDealsByStage(stage.id).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal)}
                      className={cn(
                        'bg-white dark:bg-aero-slate-800 rounded-lg p-4 shadow-sm border cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
                        deal.isHot && 'border-l-4 border-l-aero-red-500',
                        deal.isStale && 'border-l-4 border-l-aero-amber-500',
                        !deal.isHot && !deal.isStale && 'border-aero-slate-200 dark:border-aero-slate-700'
                      )}
                    >
                      {/* Company & Title */}
                      <p className="font-semibold text-sm text-aero-slate-900 dark:text-white truncate">
                        {deal.company}
                      </p>
                      <p className="text-xs text-aero-slate-500 truncate mt-0.5">
                        {deal.title}
                      </p>

                      {/* Value */}
                      <p className="text-lg font-bold text-aero-blue-500 mt-2">
                        {formatCurrency(deal.value)}
                      </p>

                      {/* Badges */}
                      {deal.hasProposal && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-aero-blue-50 dark:bg-aero-blue-900/30 text-aero-blue-600 dark:text-aero-blue-400 rounded text-xs">
                          <span className="material-symbols-outlined text-sm">description</span>
                          Teklif Gönderildi
                        </span>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-aero-slate-100 dark:border-aero-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center text-aero-blue-600 dark:text-aero-blue-400 text-xs font-medium">
                            {deal.contactName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs text-aero-slate-500 truncate max-w-[100px]">
                            {deal.contactName}
                          </span>
                        </div>
                        <span className="text-xs text-aero-slate-400">
                          {deal.lastActivity}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Add Deal Button */}
                  <button className="w-full p-3 border-2 border-dashed border-aero-slate-300 dark:border-aero-slate-600 rounded-lg text-aero-slate-400 hover:border-aero-blue-400 hover:text-aero-blue-500 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span className="text-sm">Ekle</span>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Show/Hide Lost Column */}
          {!showLost && (
            <button
              onClick={() => setShowLost(true)}
              className="flex-shrink-0 w-12 h-full min-h-[450px] bg-aero-slate-100 dark:bg-aero-slate-800/50 rounded-lg flex flex-col items-center justify-center gap-2 text-aero-slate-400 hover:text-aero-slate-600 hover:bg-aero-slate-200 dark:hover:bg-aero-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
              <span className="text-xs [writing-mode:vertical-rl] rotate-180">Kaybedildi</span>
            </button>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-aero-slate-50 dark:bg-aero-slate-800">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Anlaşma</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Kişi</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Aşama</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Değer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Son Aktivite</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aero-slate-200 dark:divide-aero-slate-700">
              {filteredDeals.map((deal) => {
                const stage = stages.find(s => s.id === deal.stage)
                return (
                  <tr 
                    key={deal.id} 
                    className="hover:bg-aero-slate-50 dark:hover:bg-aero-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-aero-slate-900 dark:text-white">{deal.company}</p>
                      <p className="text-sm text-aero-slate-500">{deal.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center text-aero-blue-600 dark:text-aero-blue-400 text-xs font-medium">
                          {deal.contactName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-aero-slate-700 dark:text-aero-slate-300">{deal.contactName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', {
                        'badge-gray': stage?.id === 'lead',
                        'badge-blue': stage?.id === 'proposal',
                        'badge-amber': stage?.id === 'negotiation',
                        'badge-green': stage?.id === 'won',
                        'badge-red': stage?.id === 'lost',
                      })}>
                        {stage?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-aero-slate-900 dark:text-white">
                        {formatCurrency(deal.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-aero-slate-500">
                      {deal.lastActivity}
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 rounded-lg hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-aero-slate-400">more_vert</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
