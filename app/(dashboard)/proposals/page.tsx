'use client'

import Link from 'next/link'

// Sample proposals data
const proposals = [
  { id: '1', title: 'ABC Şirketi Web Sitesi Teklifi', client: 'ABC Şirketi', value: 85800, status: 'pending', createdAt: '24 May 2024', expiresAt: '7 Haz 2024' },
  { id: '2', title: 'Global Tech Kurumsal CRM', client: 'Global Tech Inc.', value: 125000, status: 'signed', createdAt: '20 May 2024', signedAt: '22 May 2024' },
  { id: '3', title: 'E-Ticaret Entegrasyonu', client: 'MarketPlus A.Ş.', value: 45000, status: 'viewed', createdAt: '18 May 2024', viewedAt: '19 May 2024' },
  { id: '4', title: 'SEO Danışmanlık Paketi', client: 'Dijital Medya Ltd.', value: 35000, status: 'draft', createdAt: '15 May 2024' },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value)
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'signed':
      return { label: 'İmzalandı', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    case 'pending':
      return { label: 'Bekliyor', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'viewed':
      return { label: 'Görüntülendi', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'draft':
      return { label: 'Taslak', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700' }
  }
}

export default function ProposalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Teklifler</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">Tekliflerinizi oluşturun ve yönetin.</p>
        </div>
        <Link
          href="/proposals/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Yeni Teklif
        </Link>
      </div>
      
      {/* Proposals Table */}
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-[#e7ebf4] dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">Teklif</th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-right">Değer</th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-center">Durum</th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-center">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-800">
              {proposals.map((proposal) => {
                const statusBadge = getStatusBadge(proposal.status)
                return (
                  <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/proposals/${proposal.id}`} className="font-bold text-[#0d121c] dark:text-white hover:text-primary transition-colors">
                        {proposal.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#48679d]">{proposal.client}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-primary">{formatCurrency(proposal.value)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#48679d]">{proposal.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </Link>
                        <Link
                          href="/proposals/new"
                          className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </Link>
                        <button
                          className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Kopyala"
                        >
                          <span className="material-symbols-outlined text-xl">content_copy</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">Toplam Teklif</p>
          <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{proposals.length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">İmzalanan</p>
          <p className="text-2xl font-bold text-green-600">{proposals.filter(p => p.status === 'signed').length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">Bekleyen</p>
          <p className="text-2xl font-bold text-amber-600">{proposals.filter(p => p.status === 'pending').length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">Toplam Değer</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(proposals.reduce((sum, p) => sum + p.value, 0))}</p>
        </div>
      </div>
    </div>
  )
}
