import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type TemplatePayload = {
  name?: string
  description?: string
  category?: string
  is_public?: boolean
  blocks?: unknown
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') ?? 'team'

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

  let templatesQuery = supabase
    .from('templates')
    .select('id, name, description, category, is_public, usage_count, updated_at, team_id, user_id, created_at, blocks')
    .order('updated_at', { ascending: false })

  if (scope === 'public') {
    templatesQuery = templatesQuery.eq('is_public', true)
  } else if (scope === 'all') {
    templatesQuery = templatesQuery.or(`team_id.eq.${profile.team_id},is_public.eq.true`)
  } else {
    templatesQuery = templatesQuery.eq('team_id', profile.team_id)
  }

  const { data, error } = await templatesQuery

  if (error) {
    return NextResponse.json({ error: t('api.templates.fetchFailed') }, { status: 400 })
  }

  return NextResponse.json({ templates: data ?? [] })
})

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as TemplatePayload | null
  const name = payload?.name?.trim()

  if (!name) {
    return NextResponse.json({ error: t('api.templates.nameRequired') }, { status: 400 })
  }

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

  const { data, error } = await supabase
    .from('templates')
    .insert({
      name,
      description: payload?.description?.trim() ?? null,
      category: payload?.category?.trim() ?? null,
      is_public: payload?.is_public ?? false,
      blocks: payload?.blocks ?? [],
      usage_count: 0,
      user_id: user.id,
      team_id: profile.team_id,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: t('api.templates.createFailed') }, { status: 400 })
  }

  return NextResponse.json({ template: data })
})
