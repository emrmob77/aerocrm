import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { messages } from '@/lib/i18n/messages'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const rangeOptions = [7, 30, 90, 180]

const getRangeDays = (value?: string | null) => {
  const parsed = Number(value)
  if (Number.isFinite(parsed) && rangeOptions.includes(parsed)) {
    return parsed
  }
  return 30
}

const parseDateInput = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const locale = getServerLocale()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const { searchParams } = new URL(request.url)
  const fromParam = parseDateInput(searchParams.get('from'))
  const toParam = parseDateInput(searchParams.get('to'))
  const rangeDays = getRangeDays(searchParams.get('range'))

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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

  const now = new Date()
  let rangeStart = new Date(now)
  let rangeEnd = new Date(now)

  if (fromParam && toParam) {
    const start = new Date(fromParam)
    const end = new Date(toParam)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    if (start.getTime() <= end.getTime()) {
      rangeStart = start
      rangeEnd = end
    } else {
      rangeStart = end
      rangeEnd = start
    }
  } else {
    rangeStart.setDate(now.getDate() - rangeDays)
    rangeEnd = now
  }

  const { data: proposalsData } = await supabase
    .from('proposals')
    .select('id, title, status, created_at, signed_at, public_url')
    .eq('team_id', profile.team_id)
    .gte('created_at', rangeStart.toISOString())
    .lte('created_at', rangeEnd.toISOString())
    .order('created_at', { ascending: false })

  const proposals = proposalsData ?? []
  const proposalIds = proposals.map((proposal) => proposal.id)

  const { data: viewsData } = proposalIds.length
    ? await supabase
        .from('proposal_views')
        .select('proposal_id, duration_seconds, created_at')
        .in('proposal_id', proposalIds)
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
    : { data: [] }

  const viewStats = new Map<string, { count: number; totalDuration: number }>()

  for (const view of viewsData ?? []) {
    const proposalId = view.proposal_id
    const current = viewStats.get(proposalId) ?? { count: 0, totalDuration: 0 }
    viewStats.set(proposalId, {
      count: current.count + 1,
      totalDuration: current.totalDuration + (view.duration_seconds ?? 0),
    })
  }

  const header = [...(messages[locale]?.api?.analytics?.exportHeaders ?? [])]

  const rows = proposals.map((proposal) => {
    const stats = viewStats.get(proposal.id)
    const avgDuration = stats && stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0
    return [
      proposal.id,
      proposal.title ?? '',
      proposal.status ?? '',
      formatDate(proposal.created_at, formatLocale),
      formatDate(proposal.signed_at, formatLocale),
      String(stats?.count ?? 0),
      String(avgDuration),
      proposal.public_url ?? '',
    ]
  })

  const csvLines = [header, ...rows]
    .map((line) => line.map((value) => escapeCsv(String(value))).join(','))
    .join('\n')

  const fileStamp = now.toISOString().split('T')[0]
  const filename = `spyglass-report-${fileStamp}.csv`

  return new Response(`\uFEFF${csvLines}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    },
  })
})
