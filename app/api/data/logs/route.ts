import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
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

  const [importsResponse, exportsResponse] = await Promise.all([
    supabase
      .from('data_import_jobs')
      .select('id, entity, status, total_rows, success_count, error_count, file_name, created_at, completed_at')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('data_export_jobs')
      .select('id, entity, status, row_count, file_name, created_at, completed_at')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  return NextResponse.json({
    imports: importsResponse.data ?? [],
    exports: exportsResponse.data ?? [],
  })
}
