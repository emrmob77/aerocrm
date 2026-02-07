import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import ReportsPageClient from './ReportsPageClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  buildReportsSummary,
  EMPTY_REPORTS_SUMMARY,
  type DateRange,
  type ReportType,
  type ReportsSummary,
} from '@/lib/reports/summary'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = (await createServerSupabaseClient()) as SupabaseClient<Database>
  const admin = (() => {
    try {
      return createSupabaseAdminClient() as SupabaseClient<Database>
    } catch {
      return supabase
    }
  })()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await admin
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  const initialReportType: ReportType = 'sales'
  const initialDateRange: DateRange = '30d'
  const teamId = profile?.team_id ?? null
  const reportTypes: ReportType[] = ['sales', 'deals', 'team', 'forecast']

  if (!teamId) {
    const emptyByType = reportTypes.reduce(
      (acc, type) => {
        acc[type] = EMPTY_REPORTS_SUMMARY
        return acc
      },
      {} as Record<ReportType, ReportsSummary>
    )

    return (
      <ReportsPageClient
        initialSummary={EMPTY_REPORTS_SUMMARY}
        initialSummaryByType={emptyByType}
        initialReportType={initialReportType}
        initialDateRange={initialDateRange}
        hasTeam={false}
      />
    )
  }

  const initialSummaries = await Promise.all(
    reportTypes.map(async (reportType) => {
      const summary = await buildReportsSummary({
        supabase: admin,
        teamId,
        reportType,
        range: initialDateRange,
      })

      return [reportType, summary] as const
    })
  )

  const initialSummaryByType = Object.fromEntries(initialSummaries) as Record<ReportType, ReportsSummary>
  const initialSummary = initialSummaryByType[initialReportType]

  return (
    <ReportsPageClient
      initialSummary={initialSummary}
      initialSummaryByType={initialSummaryByType}
      initialReportType={initialReportType}
      initialDateRange={initialDateRange}
      hasTeam={true}
    />
  )
}
