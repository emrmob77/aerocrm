import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { getDbStage, normalizeStage, type StageId } from '@/components/deals/stage-utils'
import { getServerT } from '@/lib/i18n/server'

type StageUpdatePayload = {
  dealId?: string
  stage?: StageId | string
}

export async function POST(request: Request) {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as StageUpdatePayload | null

  if (!payload?.dealId) {
    return NextResponse.json({ error: t('api.deals.idRequired') }, { status: 400 })
  }

  if (!payload?.stage) {
    return NextResponse.json({ error: t('api.deals.stageRequired') }, { status: 400 })
  }

  const nextStage = normalizeStage(payload.stage)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { data: current, error: currentError } = await supabase
    .from('deals')
    .select('id, stage, title, value, contact_id, user_id, team_id')
    .eq('id', payload.dealId)
    .eq('team_id', profile.team_id)
    .single()

  if (currentError || !current) {
    return NextResponse.json({ error: t('api.deals.notFound') }, { status: 404 })
  }

  const previousStage = normalizeStage(current.stage)
  if (previousStage === nextStage) {
    return NextResponse.json({ deal: current })
  }

  const updatedAt = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('deals')
    .update({ stage: getDbStage(nextStage), updated_at: updatedAt })
    .eq('id', payload.dealId)
    .eq('team_id', profile.team_id)
    .select('id, stage, title, value, contact_id, user_id, team_id, updated_at')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: t('api.deals.stageUpdateFailed') }, { status: 400 })
  }

  if (nextStage === 'won' || nextStage === 'lost') {
    await dispatchWebhookEvent({
      supabase,
      teamId: profile.team_id,
      event: nextStage === 'won' ? 'deal.won' : 'deal.lost',
      data: {
        dealId: updated.id,
        title: updated.title,
        value: updated.value,
        previousStage,
        stage: nextStage,
        contactId: updated.contact_id,
        ownerId: updated.user_id,
      },
    })
  }

  return NextResponse.json({ deal: updated })
}
