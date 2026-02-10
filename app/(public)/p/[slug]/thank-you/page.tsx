import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { buildProposalSmartVariableMap, resolveSmartVariablesInText } from '@/lib/proposals/smart-variables'

export const revalidate = 0

type SignatureData = {
  name?: string
  signed_at?: string
}

export default async function PublicProposalThankYouPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale() === 'en' ? 'en-US' : 'tr-TR'

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, status, public_url, signed_at, signature_data, contact:contacts(full_name)')
    .like('public_url', `%/p/${params.slug}`)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !proposal) {
    notFound()
  }

  const signatureData = (proposal.signature_data ?? {}) as SignatureData
  const signedAt = signatureData.signed_at || proposal.signed_at
  const signerName = signatureData.name?.trim()
  const isSigned = proposal.status === 'signed' || Boolean(signedAt) || Boolean(signerName)

  if (!isSigned) {
    redirect(`/p/${params.slug}`)
  }

  const contactName = (proposal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback')
  const pdfUrl = `/api/proposals/pdf?slug=${encodeURIComponent(params.slug)}`
  const formattedDate = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
  const smartVariableMap = buildProposalSmartVariableMap({
    clientName: contactName,
    proposalNumber: proposal.id,
    formattedDate,
    totalFormatted: '-',
  })
  const resolvedTitle = resolveSmartVariablesInText(proposal.title ?? t('api.proposals.fallbackTitle'), smartVariableMap)
  const signedAtText =
    signedAt && !Number.isNaN(Date.parse(signedAt))
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(signedAt))
      : null

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-[#e7ebf4] bg-white p-8 shadow-xl sm:p-10">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <span className="material-symbols-outlined text-5xl">check_circle</span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#48679d]">{t('publicProposal.header.kicker')}</p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#0d121c]">
            {t('publicProposal.confirmation.title')}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {t('publicProposal.confirmation.description')}
          </p>
          <p className="mt-3 text-sm font-medium text-[#48679d]">
            {t('publicProposal.header.preparedFor', { name: contactName })}
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border border-[#e7ebf4] bg-[#f8fafc] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('proposalPreview.signature.dateLabel')}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0d121c]">
              {signedAtText ?? t('common.unknown')}
            </p>
          </div>
          {signerName && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('publicProposal.signature.nameLabel')}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0d121c]">{signerName}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('proposalPreview.hero.badge')}</p>
            <p className="mt-1 text-sm font-semibold text-[#0d121c]">{resolvedTitle}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={pdfUrl}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t('publicProposal.confirmation.download')}
          </a>
          <Link
            href={`/p/${params.slug}`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#d7ddea] px-5 text-sm font-semibold text-[#0d121c] hover:border-primary/40 hover:text-primary transition-colors"
          >
            {t('publicProposal.confirmation.backToProposal')}
          </Link>
        </div>
      </div>
    </main>
  )
}
