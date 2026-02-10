import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildProposalPdf, toPdfFileName } from '@/lib/proposals/pdf'
import {
  buildProposalSmartVariableMap,
  getProposalPricingSummary,
  resolveSmartVariablesInText,
} from '@/lib/proposals/smart-variables'

type PricingBlock = {
  type: string
  data?: {
    items?: Array<{
      name?: string
      unit?: string
      qty?: number
      price?: number
      currency?: string
    }>
  }
}

const toNumber = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const locale = getServerLocale()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim()

  if (!slug) {
    return NextResponse.json({ error: t('api.proposals.slugRequired') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, status, public_url, signed_at, signature_data, blocks, contact:contacts(full_name)')
    .like('public_url', `%/p/${slug}`)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  if (proposal.status !== 'signed') {
    return NextResponse.json({ error: t('api.proposals.signatureMissing') }, { status: 400 })
  }

  const blocks = (Array.isArray(proposal.blocks) ? proposal.blocks : []) as PricingBlock[]
  const pricingSummary = getProposalPricingSummary(blocks, locale === 'en' ? 'USD' : 'TRY')
  const contactName = (proposal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback')
  const formattedDate = new Intl.DateTimeFormat(localeCode, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
  const formattedTotal = new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: pricingSummary.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pricingSummary.total)
  const smartVariableMap = buildProposalSmartVariableMap({
    clientName: contactName,
    proposalNumber: proposal.id,
    formattedDate,
    totalFormatted: formattedTotal,
  })

  const pricingItems = blocks
    .filter((block) => block.type === 'pricing')
    .flatMap((block) => (Array.isArray(block.data?.items) ? block.data.items : []))
  const normalizedItems = pricingItems.map((item, index) => {
    const qty = toNumber(item.qty)
    const price = toNumber(item.price)
    const currencyValue = item.currency?.trim() || 'TRY'
    return {
      name: resolveSmartVariablesInText(
        item.name?.trim() || `${t('proposalPreview.pricing.columns.description')} ${index + 1}`,
        smartVariableMap
      ),
      qty,
      unit: resolveSmartVariablesInText(item.unit?.trim() || '', smartVariableMap) || null,
      price,
      currency: currencyValue,
      total: qty * price,
    }
  })
  const signatureData = (proposal.signature_data ?? {}) as { name?: string; signed_at?: string }
  const resolvedTitle = resolveSmartVariablesInText(proposal.title || t('api.proposals.fallbackTitle'), smartVariableMap)

  const pdfBytes = buildProposalPdf({
    title: resolvedTitle,
    clientName: contactName,
    publicUrl: proposal.public_url || '',
    status: proposal.status || 'signed',
    signedAt: signatureData.signed_at || proposal.signed_at,
    signerName: signatureData.name || null,
    total: pricingSummary.total,
    currency: pricingSummary.currency,
    lineItems: normalizedItems,
  })

  const fileName = toPdfFileName(resolvedTitle, slug)

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(pdfBytes.byteLength),
      'Content-Transfer-Encoding': 'binary',
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
})
