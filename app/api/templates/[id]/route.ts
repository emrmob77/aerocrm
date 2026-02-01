import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type TemplatePayload = {
  name?: string
  description?: string
  category?: string
  is_public?: boolean
  blocks?: unknown
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = (await request.json().catch(() => null)) as TemplatePayload | null
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const updates = {
    name: payload?.name?.trim(),
    description: payload?.description?.trim() ?? null,
    category: payload?.category?.trim() ?? null,
    is_public: payload?.is_public ?? false,
    blocks: payload?.blocks ?? [],
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
    return NextResponse.json({ error: 'Şablon güncellenemedi.' }, { status: 400 })
  }

  return NextResponse.json({ template: data })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data, error } = await supabase.from('templates').select('*').eq('id', params.id).maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })
  }

  return NextResponse.json({ template: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { error } = await supabase.from('templates').delete().eq('id', params.id).eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Şablon silinemedi.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
