import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type ViewPayload = {
  slug?: string
}

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as ViewPayload | null
  const slug = payload?.slug?.trim()

  if (!slug) {
    return NextResponse.json({ error: t('api.proposals.slugRequired') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, status, public_url, title, user_id, team_id')
    .like('public_url', `%/p/${slug}`)
    .maybeSingle()

  if (!proposal?.id) {
    return NextResponse.json({ tracked: false })
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent')

  await supabase.from('proposal_views').insert({
    proposal_id: proposal.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    blocks_viewed: {},
  })

  const shouldNotify = proposal.status !== 'viewed' && proposal.status !== 'signed' && proposal.status !== 'draft'

  if (proposal.status !== 'signed' && proposal.status !== 'draft') {
    await supabase.from('proposals').update({ status: 'viewed' }).eq('id', proposal.id)
  }

  if (shouldNotify && proposal.user_id) {
    const title = proposal.title ?? t('api.proposals.fallbackTitle')
    await supabase.from('notifications').insert({
      user_id: proposal.user_id,
      type: 'proposal_viewed',
      title: t('api.proposals.notifications.viewedTitle'),
      message: t('api.proposals.notifications.viewedMessage', { title }),
      read: false,
      action_url: `/proposals/${proposal.id}`,
      metadata: {
        proposal_id: proposal.id,
        status: 'viewed',
      },
    })

    if (proposal.team_id) {
      await dispatchWebhookEvent({
        supabase,
        teamId: proposal.team_id,
        event: 'proposal.viewed',
        data: {
          proposal_id: proposal.id,
          title: proposal.title,
          status: 'viewed',
          public_url: proposal.public_url,
        },
      })
    }
  }

  return NextResponse.json({ tracked: true })
})
