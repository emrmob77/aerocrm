import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { getDbStage, normalizeStage, type StageId } from '@/components/deals/stage-utils'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type CreateDealPayload = {
  title?: string
  value?: number
  stage?: StageId | string
  contactId?: string
  ownerId?: string
  expectedCloseDate?: string | null
  notes?: string | null
}

const normalizeText = (value?: string | null) => value?.trim() || ''

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as CreateDealPayload | null

  const title = normalizeText(payload?.title)
  if (!title) {
    return NextResponse.json({ error: t('api.deals.titleRequired') }, { status: 400 })
  }

  const contactId = payload?.contactId ?? null
  if (!contactId) {
    return NextResponse.json({ error: t('api.deals.contactRequired') }, { status: 400 })
  }

  const value = Number(payload?.value ?? 0)
  if (!Number.isFinite(value)) {
    return NextResponse.json({ error: t('api.deals.valueInvalid') }, { status: 400 })
  }

  const stage = normalizeStage(payload?.stage ?? 'lead')

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

  const ownerId = payload?.ownerId || user.id

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      title,
      value,
      stage: getDbStage(stage),
      contact_id: contactId,
      user_id: ownerId,
      team_id: profile.team_id,
      expected_close_date: payload?.expectedCloseDate || null,
      notes: payload?.notes || null,
    })
    .select('id, title, value, stage, contact_id, user_id, team_id, created_at, updated_at')
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: t('api.deals.createFailed') }, { status: 400 })
  }

  await dispatchWebhookEvent({
    supabase,
    teamId: profile.team_id,
    event: 'deal.created',
    data: {
      dealId: deal.id,
      title: deal.title,
      value: deal.value,
      stage: normalizeStage(deal.stage),
      contactId: deal.contact_id,
      ownerId: deal.user_id,
    },
  })

  return NextResponse.json({ deal })
})
