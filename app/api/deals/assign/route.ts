import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { canManageTeam } from '@/lib/team/member-permissions'
import type { Database } from '@/types/database'
import { notifyInApp } from '@/lib/notifications/server'

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as { dealId?: string; ownerId?: string } | null

  if (!payload?.dealId || !payload.ownerId) {
    return NextResponse.json({ error: t('api.deals.assignMissing') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return supabase
    }
  })()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('team_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  if (!canManageTeam(profile.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  const { data: member, error: memberError } = await admin
    .from('users')
    .select('id, full_name')
    .eq('id', payload.ownerId)
    .eq('team_id', profile.team_id)
    .maybeSingle()

  if (memberError || !member) {
    return NextResponse.json({ error: t('api.deals.ownerNotFound') }, { status: 404 })
  }

  const { data: dealBefore, error: dealBeforeError } = await admin
    .from('deals')
    .select('id, title, user_id, team_id')
    .eq('id', payload.dealId)
    .maybeSingle()

  if (dealBeforeError || !dealBefore) {
    return NextResponse.json({ error: t('api.deals.notFound') }, { status: 404 })
  }

  const isLegacyOwnedDeal = !dealBefore.team_id && dealBefore.user_id === user.id
  const isTeamDeal = dealBefore.team_id === profile.team_id
  if (!isLegacyOwnedDeal && !isTeamDeal) {
    return NextResponse.json({ error: t('api.deals.notFound') }, { status: 404 })
  }

  if (dealBefore.user_id === payload.ownerId) {
    return NextResponse.json({
      deal: {
        id: dealBefore.id,
        title: dealBefore.title,
        user_id: dealBefore.user_id,
      },
    })
  }

  const updatedAt = new Date().toISOString()

  const { data: deal, error } = await admin
    .from('deals')
    .update({
      user_id: payload.ownerId,
      team_id: dealBefore.team_id ?? profile.team_id,
      updated_at: updatedAt,
    })
    .eq('id', payload.dealId)
    .select('id, title, value, stage, user_id, updated_at')
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: t('api.deals.assignFailed') }, { status: 400 })
  }

  const { data: actor } = await admin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const assigneeName = member.full_name || t('header.userFallback')
  const actorName = actor?.full_name || t('header.userFallback')
  const dealTitle = deal.title || t('api.deals.dealFallback')

  const { error: activityError } = await admin.from('activities').insert({
    team_id: profile.team_id,
    user_id: user.id,
    type: 'deal_assigned',
    title: t('api.deals.activities.assignedTitle', { title: dealTitle }),
    description: t('api.deals.activities.assignedMessage', { assignee: assigneeName }),
    entity_type: 'deal',
    entity_id: deal.id,
    metadata: {
      deal_id: deal.id,
      assignee_id: member.id,
      assigned_by: user.id,
    },
  })
  if (activityError) {
    console.error('Failed to insert deal assignment activity:', activityError)
  }

  let notificationDelivered = false
  let notificationReason: 'preferences_disabled' | 'insert_failed' | null = null
  if (member.id !== user.id) {
    const notificationResult = await notifyInApp(admin as unknown as SupabaseClient<Database>, {
      userId: member.id,
      category: 'deals',
      type: 'deal_assigned',
      title: t('api.deals.notifications.assignedTitle'),
      message: t('api.deals.notifications.assignedMessage', { title: dealTitle, assigner: actorName }),
      actionUrl: `/deals/${deal.id}`,
      metadata: {
        deal_id: deal.id,
        assigned_by: user.id,
      },
    })
    notificationDelivered = notificationResult.delivered
    notificationReason = notificationResult.reason ?? null
    if (!notificationResult.delivered && notificationResult.reason === 'insert_failed') {
      console.error('Failed to insert deal assignment notification')
    }
  }

  const { error: metricsRefreshError } = await admin.rpc('refresh_dashboard_metrics')
  if (metricsRefreshError) {
    console.error('Failed to refresh dashboard metrics:', metricsRefreshError)
  }

  return NextResponse.json({ deal, notificationDelivered, notificationReason })
})
