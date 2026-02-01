import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const allowedRoles = ['admin', 'member', 'viewer']

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: 'Üye ID zorunludur.' }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as { role?: string } | null

  if (!payload?.role || !allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: 'Geçerli bir rol seçin.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: 'Takım bilgisi bulunamadı.' }, { status: 400 })
  }

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id, role, team_id')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 })
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Takım sahibi rolü değiştirilemez.' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update({ role: payload.role })
    .eq('id', target.id)
    .eq('team_id', profile.team_id)
    .select('id, full_name, email, role')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Rol güncellenemedi.' }, { status: 400 })
  }

  return NextResponse.json({ member: updated })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: 'Üye ID zorunludur.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: 'Takım bilgisi bulunamadı.' }, { status: 400 })
  }

  if (params.id === user.id) {
    return NextResponse.json({ error: 'Kendinizi takımdan çıkaramazsınız.' }, { status: 400 })
  }

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 })
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Takım sahibi takımdan çıkarılamaz.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update({ team_id: null, role: 'member' })
    .eq('id', target.id)
    .eq('team_id', profile.team_id)

  if (error) {
    return NextResponse.json({ error: 'Üye çıkarılamadı.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
