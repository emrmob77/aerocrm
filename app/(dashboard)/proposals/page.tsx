'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

const getStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'signed':
      return { label: t('proposals.status.signed'), className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    case 'pending':
      return { label: t('proposals.status.pending'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'viewed':
      return { label: t('proposals.status.viewed'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'draft':
      return { label: t('proposals.status.draft'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700' }
  }
}

export default function ProposalsPage() {
  const { t, formatNumber } = useI18n()
  const proposals = [
    {
      id: '1',
      title: t('proposals.samples.0.title'),
      client: t('proposals.samples.0.client'),
      value: 85800,
      status: 'pending',
      createdAt: t('proposals.samples.0.createdAt'),
    },
    {
      id: '2',
      title: t('proposals.samples.1.title'),
      client: t('proposals.samples.1.client'),
      value: 125000,
      status: 'signed',
      createdAt: t('proposals.samples.1.createdAt'),
    },
    {
      id: '3',
      title: t('proposals.samples.2.title'),
      client: t('proposals.samples.2.client'),
      value: 45000,
      status: 'viewed',
      createdAt: t('proposals.samples.2.createdAt'),
    },
    {
      id: '4',
      title: t('proposals.samples.3.title'),
      client: t('proposals.samples.3.client'),
      value: 35000,
      status: 'draft',
      createdAt: t('proposals.samples.3.createdAt'),
    },
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
            {t('proposals.title')}
          </h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">{t('proposals.subtitle')}</p>
        </div>
        <Link
          href="/proposals/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t('proposals.actions.new')}
        </Link>
      </div>
      
      {/* Proposals Table */}
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-[#e7ebf4] dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">
                  {t('proposals.table.title')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">
                  {t('proposals.table.client')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-right">
                  {t('proposals.table.value')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-center">
                  {t('proposals.table.status')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">
                  {t('proposals.table.date')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-center">
                  {t('proposals.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-800">
              {proposals.map((proposal) => {
                const statusBadge = getStatusBadge(proposal.status, t)
                return (
                  <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/proposals/${proposal.id}`} className="font-bold text-[#0d121c] dark:text-white hover:text-primary transition-colors">
                        {proposal.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#48679d]">{proposal.client}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-primary">
                        {formatNumber(proposal.value, {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                        })}
                      </span>
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
                          title={t('proposals.actions.view')}
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </Link>
                        <Link
                          href="/proposals/new"
                          className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </Link>
                        <button
                          className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title={t('common.copy')}
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
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.total')}</p>
          <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{proposals.length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.signed')}</p>
          <p className="text-2xl font-bold text-green-600">{proposals.filter(p => p.status === 'signed').length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.pending')}</p>
          <p className="text-2xl font-bold text-amber-600">{proposals.filter(p => p.status === 'pending').length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.totalValue')}</p>
          <p className="text-2xl font-bold text-primary">
            {formatNumber(proposals.reduce((sum, p) => sum + p.value, 0), {
              style: 'currency',
              currency: 'TRY',
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
