import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { applySignatureToBlocks } from '@/lib/proposals/signature-utils'
import type { Database } from '@/types/database'
import { notifyInApp } from '@/lib/notifications/server'

type SignPayload = {
  slug?: string
  signature?: string
  name?: string
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
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  const signedAt = new Date().toISOString()
  const blocks = Array.isArray(proposal.blocks) ? proposal.blocks : []
  const { blocks: nextBlocks } = applySignatureToBlocks(blocks as Array<{ type: string; data?: Record<string, unknown> }>, signature, name, signedAt)

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
    await notifyInApp(supabase as unknown as SupabaseClient<Database>, {
      userId: proposal.user_id,
      category: 'proposals',
      type: 'proposal_signed',
      title: t('api.proposals.notifications.signedTitle'),
      message: t('api.proposals.notifications.signedMessage', { title }),
      actionUrl: `/proposals/${proposal.id}`,
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
