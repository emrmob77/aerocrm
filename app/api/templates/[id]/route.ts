import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { normalizeTemplatePayload, type TemplatePayload } from '@/lib/templates/template-utils'

export const PATCH = withApiLogging(async (request: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as TemplatePayload | null
  const normalized = normalizeTemplatePayload(payload)
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const updates = {
    name: typeof payload?.name === 'string' ? normalized.name : undefined,
    description: normalized.description,
    category: normalized.category,
    is_public: normalized.is_public,
    blocks: normalized.blocks,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: t('api.templates.updateFailed') }, { status: 400 })
  }

  return NextResponse.json({ template: data })
})

export const GET = withApiLogging(async (_: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data, error } = await supabase.from('templates').select('*').eq('id', params.id).maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: t('api.templates.notFound') }, { status: 404 })
  }

  return NextResponse.json({ template: data })
})

export const DELETE = withApiLogging(async (_: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { error } = await supabase.from('templates').delete().eq('id', params.id).eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: t('api.templates.deleteFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})
