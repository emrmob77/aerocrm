import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import type { Database } from '@/types/database'
import { ProposalActions } from '@/components/proposals/ProposalActions'

export const dynamic = 'force-dynamic'

type ProposalRow = Pick<
  Database['public']['Tables']['proposals']['Row'],
  'id' | 'title' | 'status' | 'created_at' | 'public_url'
>

type ProposalContact = {
  full_name: string | null
  company: string | null
}

type ProposalDeal = {
  value: number | null
}

const getStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'signed':
      return { label: t('proposals.status.signed'), className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    case 'pending':
      return { label: t('proposals.status.pending'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'sent':
      return { label: t('proposals.status.sent'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'viewed':
      return { label: t('proposals.status.viewed'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'draft':
      return { label: t('proposals.status.draft'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
    case 'failed':
      return { label: t('proposals.status.failed'), className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    case 'expired':
      return { label: t('proposals.status.expired'), className: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700' }
  }
}

export default async function ProposalsPage() {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  const currency = locale === 'en' ? 'USD' : 'TRY'
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(localeCode, { style: 'currency', currency, minimumFractionDigits: 0 }).format(value)
  const formatDate = (value?: string | null) => {
    if (!value) return t('common.unknown')
    return new Intl.DateTimeFormat(localeCode, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id ?? null

  let proposalsQuery = supabase
    .from('proposals')
    .select('id, title, status, created_at, public_url, contacts(full_name, company), deals(value)')
    .order('created_at', { ascending: false })

  if (teamId) {
    proposalsQuery = proposalsQuery.or(`team_id.eq.${teamId},and(team_id.is.null,user_id.eq.${user.id})`)
  } else {
    proposalsQuery = proposalsQuery.eq('user_id', user.id)
  }

  const { data: proposals } = await proposalsQuery

  const mappedProposals = (proposals ?? []).map((proposal) => {
    const record = proposal as ProposalRow & {
      contacts?: ProposalContact | ProposalContact[] | null
      deals?: ProposalDeal | ProposalDeal[] | null
    }
    const contact = Array.isArray(record.contacts) ? record.contacts[0] : record.contacts
    const deal = Array.isArray(record.deals) ? record.deals[0] : record.deals
    const clientName =
      contact?.full_name?.trim() ||
      contact?.company?.trim() ||
      t('common.unknown')

    return {
      id: proposal.id,
      title: proposal.title,
      client: clientName,
      value: deal?.value ?? 0,
      status: proposal.status ?? 'draft',
      createdAt: formatDate(proposal.created_at),
      publicUrl: proposal.public_url ?? null,
    }
  })

  const signedCount = mappedProposals.filter((proposal) => proposal.status === 'signed').length
  const pendingCount = mappedProposals.filter((proposal) => ['pending', 'sent'].includes(proposal.status)).length
  const totalValue = mappedProposals.reduce((sum, proposal) => sum + proposal.value, 0)

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
              {mappedProposals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#48679d]">
                    {t('common.empty')}
                  </td>
                </tr>
              )}
              {mappedProposals.map((proposal) => {
                const statusBadge = getStatusBadge(proposal.status, t)
                return (
                  <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="font-bold text-[#0d121c] dark:text-white hover:text-primary transition-colors"
                      >
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
                      <ProposalActions id={proposal.id} publicUrl={proposal.publicUrl} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.total')}</p>
          <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{mappedProposals.length}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.signed')}</p>
          <p className="text-2xl font-bold text-green-600">{signedCount}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.pending')}</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-4 rounded-xl border border-[#e7ebf4] dark:border-gray-800">
          <p className="text-sm text-[#48679d] mb-1">{t('proposals.stats.totalValue')}</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
        </div>
      </div>
    </div>
  )
}
