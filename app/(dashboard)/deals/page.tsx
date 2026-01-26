'use client'

import { useState } from 'react'
import Link from 'next/link'

// Types
interface Deal {
  id: string
  title: string
  company: string
  value: number
  stage: string
  contactName: string
  contactAvatar?: string
  contactInitials?: string
  lastActivity: string
  badge?: { text: string; color: string }
  isUrgent?: boolean
}

// Mock data - tasarıma uygun
const initialDeals: Deal[] = [
  // Aday
  { id: '1', title: 'SaaS Kurumsal Üyeliği Paketi', company: 'Aero Tech', value: 45000, stage: 'lead', contactName: 'Ahmet Yılmaz', contactAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdeVX65uWg6bKSOW0sM1a-_vRTq_H_HVnvuj5p1KJzNw8227kVyr43AqA10CXVSpCzEmmhD6qgmcjWEULkUAVQZ3CRCDH1jMm7Cc5MmnW1wNxrcR8VjrTYXs6WCm8zqg6Bl1LSxWs6s3YSx8z5LzKLuZZnxapLuVEOK9JkoOnV-1PbEiuGHlhGdFHrjSrbzx5b2mZtEVNGU-LIm3qY7M7r5_3ktqNsJEbp3Me1EN-VZJkVX2tEMXvah8GjAoEYFkbxe6bsyGDW3g', lastActivity: '2 gün önce' },
  { id: '2', title: 'Lisans Yenileme & Destek', company: 'Yıldız Holding', value: 15000, stage: 'lead', contactName: 'Mehmet Akın', contactInitials: 'MA', lastActivity: 'Bugün', isUrgent: true },
  // Teklif Gönderildi
  { id: '3', title: 'Yıllık Bakım Anlaşması', company: 'Global Lojistik', value: 25000, stage: 'proposal', contactName: 'Ayşe Kara', contactAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLkmguiEjx1qMZ6Q1juCc2WyUiz-XRk11M2v51ryf6SpcNl-0z83u5RsfzxKXuNCQ3FBd5LDz-S6FGIPuJEQm5Z2s1yERZ1tj3ieITS2ohXV0Gx-75BgYWpleFZLrELzQy67pMmR0iSUFiF9MwPGyH0c2DAjceWs7ulXOEWwWZYPAcSTTZEICSPDBxwxiFEQNjABe_zF7lASI_BfqKzBVwAvNFbNYaIYdNisRnc9Z8LxueXbJzxvmq0aYsZK2kEWv1yKJtW56TlQ', lastActivity: 'Bekliyor • 3 gün', badge: { text: 'TEKLİF GÖNDERİLDİ', color: 'slate' } },
  { id: '4', title: 'Donanım Alımı Revizesi', company: 'Tekno Market', value: 60000, stage: 'proposal', contactName: 'Tarık Koç', contactInitials: 'TK', lastActivity: 'Dün güncellendi', badge: { text: 'TEKLİF GÖNDERİLDİ', color: 'slate' } },
  // Görüşme
  { id: '5', title: 'Kurumsal Dijital Çözümler', company: 'Mega İnşaat', value: 150000, stage: 'negotiation', contactName: 'Ali Öztürk', contactAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMHSDDeNIHV4jVW1OKzi2W4GuaoZoV3tVpOUzlkn9Ia48iyDsxdYyWf3KAilvwNSDDzlR_OjGkR-wd2fRANF-K1eCtRgEfLjeAr9dPjo3TxqIpTtz6cBy8U6kQsdgQQ8LwVAKB6OIgOamCBfPtpEOqVuxtp3kCko-fsoWQNJmx1bkLhbndW0sdzkcZY9YpiaaAq4ho1eMmQvLlYH8zphiq5txIfG3TfeylhuZbTTAti_ySlulC4PCa0YyHmM3-aSH_LgCJGxuPrA', lastActivity: 'Son görüşme: Pazartesi', badge: { text: 'TOPLANTI BEKLENİYOR', color: 'blue' } },
  // Kazanıldı
  { id: '6', title: 'Yıllık Danışmanlık', company: 'E-Ticaret A.Ş.', value: 45000, stage: 'won', contactName: 'Zeynep Yıldız', contactAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy9P1KhbaA0vTrs1kI2hQnDXsK_qY4weoC7KkwbcR2vn6AofAugJxVE9kTw2QcGXkHAODA-jSTW7pdCRfxEczjnML5QrsWPdXHdcNUVXSmn5-H9aMf3DDKsjf3ufN4jmq-tpqSJ7ROfQK1_RhjKjnSWWyWTshZGrLfFcLL4_RpovaOTx-bbO5FdqsR-LMyWs8FEcVcnU8wzRwA5cIFlnmEfydWLOPRsfcwcP-G_CSOHios4WQA2L11_RJCrIgN9VE7bhj3QtzxAg', lastActivity: 'Bugün kapatıldı', badge: { text: 'TAMAMLANDI', color: 'emerald' } },
]

const stages = [
  { id: 'lead', label: 'Aday' },
  { id: 'proposal', label: 'Teklif Gönderildi' },
  { id: 'negotiation', label: 'Görüşme' },
  { id: 'won', label: 'Kazanıldı' },
  { id: 'lost', label: 'Kaybedildi' },
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
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [showLost, setShowLost] = useState(false)

  // Get deals for a specific stage
  const getDealsByStage = (stageId: string) => 
    deals.filter(deal => deal.stage === stageId)

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

  // Calculate total pipeline value
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Page Header & Filter Section */}
      <div className="px-6 lg:px-10 py-6 space-y-4 bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[#0d121c] dark:text-white text-3xl font-black tracking-tight">Anlaşmalar</h1>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              Board
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">list</span>
              Liste
            </button>
          </div>
        </div>
        
        {/* Chips / Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <button className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 px-3 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-slate-500">person</span>
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Tüm Sorumlular</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 px-3 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-slate-500">calendar_today</span>
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Bu Ay</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 px-3 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-slate-500">sort</span>
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Sıralama: En Yeni</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1"></div>
          <button className="flex items-center gap-2 rounded-lg bg-primary/10 text-primary h-9 px-3 hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span className="text-sm font-bold">Filtreler</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Area */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto px-6 lg:px-10 pb-6 custom-scrollbar">
          <div className="flex gap-6 h-full min-h-[600px]">
            {/* Column 1: Aday */}
            <div 
              className="kanban-column flex flex-col gap-4"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('lead')}
            >
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Aday</span>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {getStageTotals('lead').count}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-500">{formatCurrency(getStageTotals('lead').value)}</span>
              </div>
              <div className="flex flex-col gap-3">
                {getDealsByStage('lead').map((deal) => (
                  <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>

            {/* Column 2: Teklif Gönderildi */}
            <div 
              className="kanban-column flex flex-col gap-4"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('proposal')}
            >
              <div className="flex items-center justify-between px-2 py-1 border-b-2 border-primary/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Teklif Gönderildi</span>
                  <span className="px-2 py-0.5 bg-primary/10 rounded-full text-[11px] font-bold text-primary">
                    {getStageTotals('proposal').count}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-500">{formatCurrency(getStageTotals('proposal').value)}</span>
              </div>
              <div className="flex flex-col gap-3">
                {getDealsByStage('proposal').map((deal) => (
                  <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} hasLeftBorder />
                ))}
              </div>
            </div>

            {/* Column 3: Görüşme */}
            <div 
              className="kanban-column flex flex-col gap-4"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('negotiation')}
            >
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Görüşme</span>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {getStageTotals('negotiation').count}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-500">{formatCurrency(getStageTotals('negotiation').value)}</span>
              </div>
              <div className="flex flex-col gap-3">
                {getDealsByStage('negotiation').map((deal) => (
                  <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>

            {/* Column 4: Kazanıldı */}
            <div 
              className="kanban-column flex flex-col gap-4"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('won')}
            >
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Kazanıldı</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {getStageTotals('won').count}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-500">{formatCurrency(getStageTotals('won').value)}</span>
              </div>
              <div className="flex flex-col gap-3">
                {getDealsByStage('won').map((deal) => (
                  <WonDealCard key={deal.id} deal={deal} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>

            {/* Column 5: Kaybedildi (Collapsed) */}
            {!showLost ? (
              <div 
                onClick={() => setShowLost(true)}
                className="collapsed-column bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center py-6 gap-6 group hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">unfold_more</span>
                <div className="flex items-center flex-col gap-1 h-full">
                  <p className="[writing-mode:vertical-lr] font-bold text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 uppercase tracking-widest text-sm">Kaybedildi</p>
                  <span className="mt-4 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-[11px] font-bold text-slate-500">
                    {getStageTotals('lost').count}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400">add_circle</span>
              </div>
            ) : (
              <div 
                className="kanban-column flex flex-col gap-4"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('lost')}
              >
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600 dark:text-red-400">Kaybedildi</span>
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full text-[11px] font-bold text-red-600 dark:text-red-400">
                      {getStageTotals('lost').count}
                    </span>
                  </div>
                  <button onClick={() => setShowLost(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {getDealsByStage('lost').map((deal) => (
                    <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 px-6 lg:px-10 pb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Şirket</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Anlaşma</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Aşama</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Değer</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Son Aktivite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {deals.map((deal) => {
                  const stage = stages.find(s => s.id === deal.stage)
                  return (
                    <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{deal.company}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{deal.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          deal.stage === 'won' ? 'bg-emerald-100 text-emerald-700' :
                          deal.stage === 'lost' ? 'bg-red-100 text-red-700' :
                          deal.stage === 'proposal' ? 'bg-primary/10 text-primary' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {stage?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-primary font-extrabold">{formatCurrency(deal.value)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{deal.lastActivity}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            <div className="size-6 rounded-full border border-white dark:border-slate-800 bg-slate-300"></div>
            <div className="size-6 rounded-full border border-white dark:border-slate-800 bg-slate-300"></div>
            <div className="size-6 rounded-full border border-white dark:border-slate-800 bg-slate-300 flex items-center justify-center text-[8px] text-slate-600">+3</div>
          </div>
          <span>5 aktif takım üyesi çevrimiçi</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Toplam Pipeline Değeri: <strong className="text-slate-600 dark:text-slate-300">{formatCurrency(totalPipelineValue)}</strong></span>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
          <span>Güncelleme: 2 dakika önce</span>
        </div>
      </footer>

      <style jsx>{`
        .kanban-column {
          min-width: 320px;
          max-width: 320px;
        }
        .collapsed-column {
          min-width: 60px;
          max-width: 60px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  )
}

// Deal Card Component
function DealCard({ deal, onDragStart, hasLeftBorder }: { deal: Deal; onDragStart: (deal: Deal) => void; hasLeftBorder?: boolean }) {
  return (
    <Link 
      href={`/deals/${deal.id}`}
      draggable
      onDragStart={() => onDragStart(deal)}
      className={`block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group ${hasLeftBorder ? 'border-l-4 border-l-primary' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{deal.company}</span>
        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary text-[20px]">more_horiz</span>
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug">{deal.title}</h3>
      
      {deal.badge && (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold mb-3 ${
          deal.badge.color === 'blue' ? 'bg-blue-50 text-blue-600' :
          deal.badge.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          <span className="material-symbols-outlined text-[14px]">
            {deal.badge.color === 'blue' ? 'forum' : 'description'}
          </span>
          {deal.badge.text}
        </div>
      )}
      
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="text-primary font-extrabold text-lg">{formatCurrency(deal.value)}</div>
          <div className={`flex items-center gap-1.5 text-xs ${deal.isUrgent ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[14px]">{deal.isUrgent ? 'priority_high' : 'schedule'}</span>
            {deal.lastActivity}
          </div>
        </div>
        {deal.contactAvatar ? (
          <div 
            className="size-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 bg-cover bg-center" 
            style={{ backgroundImage: `url("${deal.contactAvatar}")` }}
          />
        ) : (
          <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 border-2 border-white ring-1 ring-slate-100">
            {deal.contactInitials}
          </div>
        )}
      </div>
    </Link>
  )
}

// Won Deal Card Component (Special styling)
function WonDealCard({ deal, onDragStart }: { deal: Deal; onDragStart: (deal: Deal) => void }) {
  return (
    <Link 
      href={`/deals/${deal.id}`}
      draggable
      onDragStart={() => onDragStart(deal)}
      className="block bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute -right-2 -top-2 text-emerald-200/50 dark:text-emerald-900/20 pointer-events-none">
        <span className="material-symbols-outlined text-[80px]">check_circle</span>
      </div>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">{deal.company}</span>
        <span className="material-symbols-outlined text-emerald-300 group-hover:text-emerald-500 text-[20px]">verified</span>
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">{deal.title}</h3>
      
      {deal.badge && (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold mb-3">
          {deal.badge.text}
        </div>
      )}
      
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-emerald-600 font-extrabold text-lg">{formatCurrency(deal.value)}</div>
          <div className="text-slate-400 text-xs">{deal.lastActivity}</div>
        </div>
        {deal.contactAvatar ? (
          <div 
            className="size-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 bg-cover bg-center" 
            style={{ backgroundImage: `url("${deal.contactAvatar}")` }}
          />
        ) : (
          <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 border-2 border-white ring-1 ring-slate-100">
            {deal.contactInitials}
          </div>
        )}
      </div>
    </Link>
  )
}

