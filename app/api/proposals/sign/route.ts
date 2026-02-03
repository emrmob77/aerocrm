import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type SignPayload = {
  slug?: string
  signature?: string
  name?: string
}

type SignatureBlock = {
  id: string
  type: 'signature'
  data: {
    label?: string
    required?: boolean
    signatureImage?: string
    signedName?: string
    signedAt?: string
  }
}

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as SignPayload | null
  const slug = payload?.slug?.trim()
  const signature = payload?.signature?.trim()
  const name = payload?.name?.trim()

  if (!slug || !signature || !name) {
    return NextResponse.json({ error: t('api.proposals.signatureMissing') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, blocks, status, public_url, title, user_id, team_id')
    .like('public_url', `%/p/${slug}`)
    .maybeSingle()

  if (error || !proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  const signedAt = new Date().toISOString()
  const blocks = Array.isArray(proposal.blocks) ? proposal.blocks : []
  const nextBlocks = blocks.map((block) => {
    if (block?.type === 'signature') {
      return {
        ...block,
        data: {
          ...(block as SignatureBlock).data,
          signatureImage: signature,
          signedName: name,
          signedAt,
        },
      }
    }
    return block
  })

  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      blocks: nextBlocks,
      status: 'signed',
      signed_at: signedAt,
      signature_data: {
        name,
        image: signature,
        signed_at: signedAt,
      },
    })
    .eq('id', proposal.id)

  if (updateError) {
    return NextResponse.json({ error: t('api.proposals.signFailed') }, { status: 400 })
  }

  if (proposal.status !== 'signed' && proposal.user_id) {
    const title = proposal.title ?? t('api.proposals.fallbackTitle')
    await supabase.from('notifications').insert({
      user_id: proposal.user_id,
      type: 'proposal_signed',
      title: t('api.proposals.notifications.signedTitle'),
      message: t('api.proposals.notifications.signedMessage', { title }),
      read: false,
      action_url: `/proposals/${proposal.id}`,
      metadata: {
        proposal_id: proposal.id,
        status: 'signed',
      },
    })

    if (proposal.team_id) {
      await dispatchWebhookEvent({
        supabase,
        teamId: proposal.team_id,
        event: 'proposal.signed',
        data: {
          proposal_id: proposal.id,
          title: proposal.title,
          status: 'signed',
          public_url: proposal.public_url,
          signed_at: signedAt,
        },
      })
    }
  }

  return NextResponse.json({ success: true, signedAt })
})
