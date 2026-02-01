import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { dealId?: string; ownerId?: string } | null

  if (!payload?.dealId || !payload.ownerId) {
    return NextResponse.json({ error: 'Anlaşma ve sorumlu seçilmelidir.' }, { status: 400 })
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

  const { data: member, error: memberError } = await supabase
    .from('users')
    .select('id')
    .eq('id', payload.ownerId)
    .eq('team_id', profile.team_id)
    .maybeSingle()

  if (memberError || !member) {
    return NextResponse.json({ error: 'Sorumlu kişi bulunamadı.' }, { status: 404 })
  }

  const updatedAt = new Date().toISOString()

  const { data: deal, error } = await supabase
    .from('deals')
    .update({ user_id: payload.ownerId, updated_at: updatedAt })
    .eq('id', payload.dealId)
    .eq('team_id', profile.team_id)
    .select('id, title, value, stage, user_id, updated_at')
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: 'Anlaşma atanamadı.' }, { status: 400 })
  }

  return NextResponse.json({ deal })
}
