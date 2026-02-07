import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildProposalPdf, toPdfFileName } from '@/lib/proposals/pdf'

type PricingBlock = {
  type: string
  data?: {
    items?: Array<{
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
  const pricingItems = blocks
    .filter((block) => block.type === 'pricing')
    .flatMap((block) => (Array.isArray(block.data?.items) ? block.data.items : []))
  const total = pricingItems.reduce((sum, item) => sum + toNumber(item.qty) * toNumber(item.price), 0)
  const currency = pricingItems.find((item) => typeof item.currency === 'string' && item.currency.trim())?.currency?.trim() || 'TRY'
  const contactName = (proposal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback')
  const signatureData = (proposal.signature_data ?? {}) as { name?: string; signed_at?: string }

  const pdfBytes = buildProposalPdf({
    title: proposal.title || t('api.proposals.fallbackTitle'),
    clientName: contactName,
    publicUrl: proposal.public_url || '',
    status: proposal.status || 'signed',
    signedAt: signatureData.signed_at || proposal.signed_at,
    signerName: signatureData.name || null,
    total,
    currency,
  })

  const fileName = toPdfFileName(proposal.title || '', slug)

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
})
