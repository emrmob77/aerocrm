import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import type { Database } from '@/types/database'
import { notifyInApp } from '@/lib/notifications/server'

type ViewPayload = {
  slug?: string
}

const automatedUserAgentPatterns = [
  'bot',
  'crawler',
  'spider',
  'slurp',
  'headless',
  'preview',
  'facebookexternalhit',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'twitterbot',
  'applebot',
  'bingpreview',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'curl/',
  'postman',
  'insomnia',
  'python-requests',
  'node-fetch',
]

const isAutomatedView = (request: Request, userAgent: string | null) => {
  const normalizedAgent = userAgent?.toLowerCase() ?? ''
  if (normalizedAgent && automatedUserAgentPatterns.some((pattern) => normalizedAgent.includes(pattern))) {
    return true
  }

  const purposeHeader = (request.headers.get('purpose') || request.headers.get('x-purpose') || '').toLowerCase()
  if (purposeHeader.includes('preview') || purposeHeader.includes('prefetch')) {
    return true
  }

  const secPurposeHeader = (request.headers.get('sec-purpose') || '').toLowerCase()
  if (secPurposeHeader.includes('prefetch')) {
    return true
  }

  return false
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
    .is('deleted_at', null)
    .maybeSingle()

  if (!proposal?.id) {
    return NextResponse.json({ tracked: false })
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent')?.trim() || null

  if (isAutomatedView(request, userAgent)) {
    return NextResponse.json({ tracked: false, skipped: 'automated' })
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let isInternalViewer = false
  if (authUser?.id) {
    if (proposal.user_id && authUser.id === proposal.user_id) {
      isInternalViewer = true
    } else if (proposal.team_id) {
      const { data: member } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .eq('team_id', proposal.team_id)
        .maybeSingle()
      isInternalViewer = Boolean(member?.id)
    }
  }

  if (isInternalViewer) {
    return NextResponse.json({ tracked: false, skipped: 'internal' })
  }

  const dedupeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  let recentViewQuery = supabase
    .from('proposal_views')
    .select('id')
    .eq('proposal_id', proposal.id)
    .gte('created_at', dedupeSince)
    .order('created_at', { ascending: false })
    .limit(1)

  recentViewQuery = ipAddress ? recentViewQuery.eq('ip_address', ipAddress) : recentViewQuery.is('ip_address', null)
  recentViewQuery = userAgent ? recentViewQuery.eq('user_agent', userAgent) : recentViewQuery.is('user_agent', null)

  const { data: recentView } = await recentViewQuery.maybeSingle()
  if (recentView?.id) {
    return NextResponse.json({ tracked: false, skipped: 'deduplicated' })
  }

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
    await notifyInApp(supabase as unknown as SupabaseClient<Database>, {
      userId: proposal.user_id,
      category: 'proposals',
      type: 'proposal_viewed',
      title: t('api.proposals.notifications.viewedTitle'),
      message: t('api.proposals.notifications.viewedMessage', { title }),
      actionUrl: `/proposals/${proposal.id}`,
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
