import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(_: Request, context: { params: { id?: string } }) {
  const id = context.params.id
  if (!id) {
    return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { error } = await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Kayıt silinemedi.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
