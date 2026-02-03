import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

export const POST = withApiLogging(async (_: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data: template, error } = await supabase
    .from('templates')
    .select('id, usage_count')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !template) {
    return NextResponse.json({ error: t('api.templates.notFound') }, { status: 404 })
  }

  const nextCount = (template.usage_count ?? 0) + 1
  await supabase.from('templates').update({ usage_count: nextCount }).eq('id', params.id)

  return NextResponse.json({ usageCount: nextCount })
})
