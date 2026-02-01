import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: template, error } = await supabase
    .from('templates')
    .select('id, usage_count')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !template) {
    return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })
  }

  const nextCount = (template.usage_count ?? 0) + 1
  await supabase.from('templates').update({ usage_count: nextCount }).eq('id', params.id)

  return NextResponse.json({ usageCount: nextCount })
}
