import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import {
  buildReportsSummary,
  type DateRange,
  type ReportType,
} from '@/lib/reports/summary'
import type { Database } from '@/types/database'

const isValidReportType = (value: string | null): value is ReportType =>
  value === 'sales' || value === 'deals' || value === 'team' || value === 'forecast'

const isValidRange = (value: string | null): value is DateRange =>
  value === '7d' || value === '30d' || value === '90d' || value === '12m'

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const url = new URL(request.url)
  const reportTypeParam = url.searchParams.get('type')
  const rangeParam = url.searchParams.get('range')

  const reportType: ReportType = isValidReportType(reportTypeParam) ? reportTypeParam : 'sales'
  const range: DateRange = isValidRange(rangeParam) ? rangeParam : '30d'

  const supabase = (await createServerSupabaseClient()) as SupabaseClient<Database>
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const admin = (() => {
    try {
      return createSupabaseAdminClient() as SupabaseClient<Database>
    } catch {
      return supabase
    }
  })()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const summary = await buildReportsSummary({
    supabase: admin,
    teamId: profile.team_id,
    reportType,
    range,
  })

  return NextResponse.json(summary)
})
