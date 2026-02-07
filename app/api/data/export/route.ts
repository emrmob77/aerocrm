import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type ExportEntity = 'contacts' | 'deals' | 'proposals' | 'sales'
type ExportFormat = 'csv' | 'excel'
type CsvDelimiter = 'comma' | 'semicolon' | 'tab'

const escapeCsv = (value: string) => {
  const sanitized = value.replace(/"/g, '""')
  if (sanitized.search(/("|,|\n)/g) >= 0) {
    return `"${sanitized}"`
  }
  return sanitized
}

const toCsv = (headers: string[], rows: string[][], delimiter: string) => {
  const lines = [headers.map(escapeCsv).join(delimiter)]
  rows.forEach((row) => {
    lines.push(row.map((value) => escapeCsv(value)).join(delimiter))
  })
  return lines.join('\n')
}

const toExcel = (headers: string[], rows: string[][]) => {
  const headerRow = `<tr>${headers.map((value) => `<th>${value}</th>`).join('')}</tr>`
  const bodyRows = rows
    .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join('')}</tr>`)
    .join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table>${headerRow}${bodyRows}</table></body></html>`
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const { searchParams } = new URL(request.url)
  const entity = searchParams.get('entity') as ExportEntity | null
  const format = (searchParams.get('format') as ExportFormat | null) ?? 'csv'
  const delimiterParam = (searchParams.get('delimiter') as CsvDelimiter | null) ?? 'semicolon'

  if (!entity || !['contacts', 'deals', 'proposals', 'sales'].includes(entity)) {
    return NextResponse.json({ error: t('api.errors.invalidDataType') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
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

  let headers: string[] = []
  let rows: string[][] = []

  if (entity === 'contacts') {
    const { data } = await supabase
      .from('contacts')
      .select('full_name, email, phone, company, position, address, created_at')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })

    headers = ['full_name', 'email', 'phone', 'company', 'position', 'address', 'created_at']
    rows =
      data?.map((item) => [
        item.full_name ?? '',
        item.email ?? '',
        item.phone ?? '',
        item.company ?? '',
        item.position ?? '',
        item.address ?? '',
        item.created_at ?? '',
      ]) ?? []
  }

  if (entity === 'deals') {
    const { data } = await supabase
      .from('deals')
      .select('title, value, currency, stage, expected_close_date, probability, notes, created_at, contact:contacts(full_name, email)')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })

    headers = [
      'title',
      'value',
      'currency',
      'stage',
      'expected_close_date',
      'probability',
      'notes',
      'contact_name',
      'contact_email',
      'created_at',
    ]
    rows =
      data?.map((item) => [
        item.title ?? '',
        `${item.value ?? 0}`,
        item.currency ?? 'TRY',
        item.stage ?? '',
        item.expected_close_date ?? '',
        item.probability?.toString() ?? '',
        item.notes ?? '',
        (item.contact as { full_name?: string | null } | null)?.full_name ?? '',
        (item.contact as { email?: string | null } | null)?.email ?? '',
        item.created_at ?? '',
      ]) ?? []
  }

  if (entity === 'sales') {
    const { data } = await supabase
      .from('deals')
      .select('title, value, currency, expected_close_date, notes, created_at, contact:contacts(full_name, email), stage')
      .eq('team_id', profile.team_id)
      .in('stage', ['won', 'kazanıldı', 'closed_won'])
      .order('created_at', { ascending: false })

    headers = ['title', 'value', 'currency', 'sales_date', 'notes', 'contact_name', 'contact_email', 'created_at']
    rows =
      data?.map((item) => [
        item.title ?? '',
        `${item.value ?? 0}`,
        item.currency ?? 'TRY',
        item.expected_close_date ?? '',
        item.notes ?? '',
        (item.contact as { full_name?: string | null } | null)?.full_name ?? '',
        (item.contact as { email?: string | null } | null)?.email ?? '',
        item.created_at ?? '',
      ]) ?? []
  }

  if (entity === 'proposals') {
    const { data } = await supabase
      .from('proposals')
      .select('title, status, expires_at, signed_at, created_at, deal_id, contact:contacts(full_name, email)')
      .eq('team_id', profile.team_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    headers = [
      'title',
      'status',
      'deal_id',
      'expires_at',
      'signed_at',
      'contact_name',
      'contact_email',
      'created_at',
    ]
    rows =
      data?.map((item) => [
        item.title ?? '',
        item.status ?? '',
        item.deal_id ?? '',
        item.expires_at ?? '',
        item.signed_at ?? '',
        (item.contact as { full_name?: string | null } | null)?.full_name ?? '',
        (item.contact as { email?: string | null } | null)?.email ?? '',
        item.created_at ?? '',
      ]) ?? []
  }

  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  const extension = format === 'excel' ? 'xls' : 'csv'
  const fileName = `aero-${entity}-${timestamp}.${extension}`

  await supabase.from('data_export_jobs').insert({
    user_id: user.id,
    team_id: profile.team_id,
    entity,
    status: 'completed',
    row_count: rows.length,
    file_name: fileName,
    completed_at: new Date().toISOString(),
  })

  const delimiter =
    delimiterParam === 'comma' ? ',' : delimiterParam === 'tab' ? '\t' : ';'
  const body =
    format === 'excel'
      ? toExcel(headers, rows)
      : `\ufeff${toCsv(headers, rows, delimiter)}`
  const contentType =
    format === 'excel'
      ? 'application/vnd.ms-excel; charset=utf-8'
      : 'text/csv; charset=utf-8'

  const encodedFileName = encodeURIComponent(fileName)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
    },
  })
})
