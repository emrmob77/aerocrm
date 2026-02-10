import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { normalizeStage } from '@/components/deals/stage-utils'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type ProposalRow = Pick<
  Database['public']['Tables']['proposals']['Row'],
  | 'id'
  | 'title'
  | 'status'
  | 'public_url'
  | 'created_at'
  | 'updated_at'
  | 'expires_at'
  | 'signed_at'
  | 'signature_data'
  | 'deal_id'
>

type ProposalContact = Pick<Database['public']['Tables']['contacts']['Row'], 'full_name' | 'company' | 'email'>
type ProposalViewRow = Pick<
  Database['public']['Tables']['proposal_views']['Row'],
  'id' | 'created_at' | 'ip_address' | 'user_agent' | 'duration_seconds'
>
type DealRow = Pick<Database['public']['Tables']['deals']['Row'], 'id' | 'title' | 'stage' | 'value' | 'currency'>

type SignatureData = {
  name?: string
  signed_at?: string
}

const formatDateTime = (value: string | null | undefined, locale: string) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

const formatMoney = (value: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const maskIpAddress = (value: unknown) => {
  if (typeof value !== 'string') return '-'
  const ip = value.trim()
  if (!ip) return '-'
  if (ip.includes(':')) return '****:****'
  const parts = ip.split('.')
  if (parts.length !== 4) return ip
  return `${parts[0]}.${parts[1]}.*.*`
}

const summarizeAgent = (value: string | null) => {
  if (!value) return '-'
  const userAgent = value.toLowerCase()
  if (userAgent.includes('edg/')) return 'Edge'
  if (userAgent.includes('chrome/')) return 'Chrome'
  if (userAgent.includes('safari/') && !userAgent.includes('chrome/')) return 'Safari'
  if (userAgent.includes('firefox/')) return 'Firefox'
  if (userAgent.includes('mobile')) return 'Mobile Browser'
  return 'Browser'
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
      return { label: t('proposals.status.draft'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
    case 'failed':
      return { label: t('proposals.status.failed'), className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    case 'expired':
      return { label: t('proposals.status.expired'), className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
  }
}

export default async function ProposalDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  const copy =
    locale === 'en'
      ? {
          back: 'Back to Proposals',
          subtitle: 'Proposal status and engagement details',
          infoTitle: 'Proposal Info',
          activityTitle: 'View Activity',
          noViews: 'No view activity yet.',
          publicLink: 'Public link',
          openLink: 'Open public page',
          copiedHint: 'Link can be copied from the table actions.',
          relatedDeal: 'Related deal',
          dealStage: 'Deal stage',
          value: 'Value',
          customer: 'Customer',
          customerEmail: 'Customer email',
          createdAt: 'Created',
          updatedAt: 'Updated',
          signedAt: 'Signed at',
          signer: 'Signer',
          expiresAt: 'Expires at',
          totalViews: 'Total views',
          latestView: 'Latest view',
          tableTime: 'Time',
          tableIp: 'IP',
          tableAgent: 'Client',
          tableDuration: 'Duration',
          seconds: 'sec',
          unknown: 'Unknown',
        }
      : {
          back: 'Tekliflere Dön',
          subtitle: 'Teklif durumu ve etkileşim detayları',
          infoTitle: 'Teklif Bilgisi',
          activityTitle: 'Görüntüleme Aktivitesi',
          noViews: 'Henüz görüntüleme aktivitesi yok.',
          publicLink: 'Public link',
          openLink: 'Public sayfayı aç',
          copiedHint: 'Linki tablo aksiyonlarından kopyalayabilirsiniz.',
          relatedDeal: 'İlgili anlaşma',
          dealStage: 'Anlaşma aşaması',
          value: 'Değer',
          customer: 'Müşteri',
          customerEmail: 'Müşteri e-postası',
          createdAt: 'Oluşturulma',
          updatedAt: 'Güncelleme',
          signedAt: 'İmzalanma',
          signer: 'İmzalayan',
          expiresAt: 'Son geçerlilik',
          totalViews: 'Toplam görüntüleme',
          latestView: 'Son görüntüleme',
          tableTime: 'Zaman',
          tableIp: 'IP',
          tableAgent: 'İstemci',
          tableDuration: 'Süre',
          seconds: 'sn',
          unknown: 'Bilinmiyor',
        }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: proposalData, error: proposalError } = await supabase
    .from('proposals')
    .select('id, title, status, public_url, created_at, updated_at, expires_at, signed_at, signature_data, deal_id, contact:contacts(full_name, company, email)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (proposalError || !proposalData) {
    notFound()
  }

  const proposal = proposalData as ProposalRow & {
    contact?: ProposalContact | ProposalContact[] | null
  }
  const contact = Array.isArray(proposal.contact) ? proposal.contact[0] : proposal.contact

  const [viewsResult, countResult, dealResult] = await Promise.all([
    supabase
      .from('proposal_views')
      .select('id, created_at, ip_address, user_agent, duration_seconds')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('proposal_views')
      .select('id', { head: true, count: 'exact' })
      .eq('proposal_id', proposal.id),
    proposal.deal_id
      ? supabase
          .from('deals')
          .select('id, title, stage, value, currency')
          .eq('id', proposal.deal_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const views = (viewsResult.data ?? []) as ProposalViewRow[]
  const viewCount = countResult.count ?? views.length
  const deal = (dealResult.data ?? null) as DealRow | null
  const latestView = views[0]

  const signatureData = (proposal.signature_data ?? {}) as SignatureData
  const signedAt = signatureData.signed_at ?? proposal.signed_at
  const signerName = signatureData.name ?? null
  const statusBadge = getStatusBadge(proposal.status ?? 'draft', t)
  const contactName = contact?.full_name?.trim() || contact?.company?.trim() || copy.unknown
  const contactEmail = contact?.email?.trim() || copy.unknown

  const dealStage = deal ? normalizeStage(deal.stage) : null
  const dealValue = deal ? formatMoney(deal.value ?? 0, localeCode, deal.currency ?? (locale === 'en' ? 'USD' : 'TRY')) : null

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#48679d] hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {copy.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">
              {proposal.title}
            </h1>
            <p className="mt-1 text-sm text-[#48679d] dark:text-gray-400">{copy.subtitle}</p>
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold h-fit ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{copy.infoTitle}</h2>
          <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.customer}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">{contactName}</dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.customerEmail}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">{contactEmail}</dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.createdAt}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">
                {formatDateTime(proposal.created_at, localeCode)}
              </dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.updatedAt}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">
                {formatDateTime(proposal.updated_at, localeCode)}
              </dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.signedAt}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">
                {formatDateTime(signedAt, localeCode)}
              </dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.signer}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">{signerName ?? copy.unknown}</dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.expiresAt}</dt>
              <dd className="mt-1 font-semibold text-[#0d121c] dark:text-white">
                {formatDateTime(proposal.expires_at, localeCode)}
              </dd>
            </div>
            <div>
              <dt className="text-[#48679d] dark:text-gray-400">{copy.publicLink}</dt>
              <dd className="mt-1">
                {proposal.public_url ? (
                  <a
                    href={proposal.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline break-all"
                  >
                    {proposal.public_url}
                  </a>
                ) : (
                  <span className="font-semibold text-[#0d121c] dark:text-white">{copy.unknown}</span>
                )}
              </dd>
            </div>
          </dl>

          {deal ? (
            <div className="mt-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#48679d] dark:text-gray-400">{copy.relatedDeal}</p>
                  <Link href={`/deals/${deal.id}`} className="text-sm font-bold text-[#0d121c] dark:text-white hover:text-primary">
                    {deal.title}
                  </Link>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#48679d] dark:text-gray-400">
                    {copy.dealStage}: <span className="font-semibold text-[#0d121c] dark:text-white">{t(`stages.${dealStage}`)}</span>
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {copy.value}: {dealValue}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-sm text-[#48679d] dark:text-gray-400">{copy.totalViews}</p>
            <p className="text-3xl font-extrabold text-[#0d121c] dark:text-white">{viewCount}</p>
          </div>
          <div>
            <p className="text-sm text-[#48679d] dark:text-gray-400">{copy.latestView}</p>
            <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
              {latestView ? formatDateTime(latestView.created_at, localeCode) : copy.noViews}
            </p>
          </div>
          {proposal.public_url ? (
            <a
              href={proposal.public_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              {copy.openLink}
            </a>
          ) : null}
          <p className="text-xs text-gray-500">{copy.copiedHint}</p>
        </section>
      </div>

      <section className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e7ebf4] dark:border-gray-800">
          <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{copy.activityTitle}</h2>
        </div>
        {views.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[#48679d] dark:text-gray-400">{copy.noViews}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#48679d]">{copy.tableTime}</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#48679d]">{copy.tableIp}</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#48679d]">{copy.tableAgent}</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#48679d] text-right">{copy.tableDuration}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-800">
                {views.map((view) => (
                  <tr key={view.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3 text-sm text-[#0d121c] dark:text-white">
                      {formatDateTime(view.created_at, localeCode)}
                    </td>
                    <td className="px-5 py-3 text-sm text-[#48679d] dark:text-gray-400">{maskIpAddress(view.ip_address)}</td>
                    <td className="px-5 py-3 text-sm text-[#48679d] dark:text-gray-400">{summarizeAgent(view.user_agent)}</td>
                    <td className="px-5 py-3 text-sm text-right text-[#0d121c] dark:text-white">
                      {view.duration_seconds ? `${Math.round(view.duration_seconds)} ${copy.seconds}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
