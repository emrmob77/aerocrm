import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type ImportEntity = 'contacts' | 'deals' | 'proposals' | 'sales'

type ImportPayload = {
  entity?: ImportEntity
  fileName?: string
  rows?: Record<string, string | null>[]
}

type ImportError = {
  row: number
  message: string
}

const parseNumber = (value?: string | null) => {
  if (!value) return null
  const raw = value.toString().trim()
  if (!raw) return null
  let cleaned = raw.replace(/[^\d,.-]/g, '')
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.')
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '')
  }
  const parsed = Number.parseFloat(cleaned)
  return Number.isNaN(parsed) ? null : parsed
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

const normalizeText = (value?: string | null) => value?.toString().trim() || null

const getContactNameFromEmail = (email: string, fallback: string) => email.split('@')[0] || fallback

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as ImportPayload | null
  const entity = payload?.entity
  const rows = Array.isArray(payload?.rows) ? payload?.rows : []
  const customerFallback = t('header.customerFallback')

  if (!entity || !['contacts', 'deals', 'proposals', 'sales'].includes(entity)) {
    return NextResponse.json({ error: t('api.errors.invalidDataType') }, { status: 400 })
  }

  if (!rows.length) {
    return NextResponse.json({ error: t('api.data.importNoData') }, { status: 400 })
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
    .select('team_id, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { data: job, error: jobError } = await supabase
    .from('data_import_jobs')
    .insert({
      user_id: user.id,
      team_id: profile.team_id,
      entity,
      file_name: payload?.fileName ?? null,
      status: 'processing',
      total_rows: rows.length,
      created_at: now,
    })
    .select('id')
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: t('api.data.importRecordFailed') }, { status: 400 })
  }

  const errors: ImportError[] = []
  let successCount = 0

  const upsertContact = async (params: { email?: string | null; name?: string | null }) => {
    const email = normalizeText(params.email)
    const name = normalizeText(params.name)
    if (!email && !name) {
      return null
    }
    if (email) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id, full_name')
        .eq('team_id', profile.team_id)
        .eq('email', email)
        .maybeSingle()
      if (existing?.id) {
        return existing.id
      }
    }

    if (name) {
      const { data: byName } = await supabase
        .from('contacts')
        .select('id')
        .eq('team_id', profile.team_id)
        .eq('full_name', name)
        .maybeSingle()
      if (byName?.id) {
        return byName.id
      }
    }

    const fullName = name ?? (email ? getContactNameFromEmail(email, customerFallback) : customerFallback)
    const { data: created, error } = await supabase
      .from('contacts')
      .insert({
        full_name: fullName,
        email,
        user_id: user.id,
        team_id: profile.team_id,
      })
      .select('id')
      .single()

    if (error || !created) {
      return null
    }
    return created.id
  }

  try {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] as Record<string, string | null>
      try {
        if (entity === 'contacts') {
          const fullName = normalizeText(row.full_name) ?? normalizeText(row.name)
          if (!fullName) {
            throw new Error(t('api.data.fullNameRequired'))
          }
          const { error } = await supabase.from('contacts').insert({
            full_name: fullName,
            email: normalizeText(row.email),
            phone: normalizeText(row.phone),
            company: normalizeText(row.company),
            position: normalizeText(row.position),
            address: normalizeText(row.address),
            user_id: user.id,
            team_id: profile.team_id,
          })
          if (error) {
            throw new Error(error.message || t('api.data.recordCreateFailed'))
          }
          successCount += 1
        }

        if (entity === 'deals') {
          const title = normalizeText(row.title)
          if (!title) {
            throw new Error(t('api.data.dealTitleRequired'))
          }
          const contactId =
            normalizeText(row.contact_id) ??
            (await upsertContact({
              email: row.contact_email,
              name: row.contact_name,
            }))

          if (!contactId) {
            throw new Error(t('api.data.customerMissing'))
          }

          const { error } = await supabase.from('deals').insert({
            title,
            value: parseNumber(row.value) ?? 0,
            currency: (normalizeText(row.currency) ?? 'TRY').toUpperCase(),
            stage: normalizeText(row.stage) ?? 'lead',
            expected_close_date: parseDate(row.expected_close_date),
            probability: parseNumber(row.probability),
            notes: normalizeText(row.notes),
            contact_id: contactId,
            user_id: user.id,
            team_id: profile.team_id,
          })
          if (error) {
            throw new Error(error.message || t('api.data.dealCreateFailed'))
          }
          successCount += 1
        }

        if (entity === 'sales') {
          const title = normalizeText(row.title)
          if (!title) {
            throw new Error(t('api.data.saleTitleRequired'))
          }
          const contactId =
            normalizeText(row.contact_id) ??
            (await upsertContact({
              email: row.contact_email,
              name: row.contact_name,
            }))

          if (!contactId) {
            throw new Error(t('api.data.customerMissing'))
          }

          const { error } = await supabase.from('deals').insert({
            title,
            value: parseNumber(row.value) ?? 0,
            currency: (normalizeText(row.currency) ?? 'TRY').toUpperCase(),
            stage: 'won',
            expected_close_date: parseDate(row.sales_date) ?? parseDate(row.expected_close_date),
            probability: 100,
            notes: normalizeText(row.notes),
            contact_id: contactId,
            user_id: user.id,
            team_id: profile.team_id,
          })
          if (error) {
            throw new Error(error.message || t('api.data.saleSaveFailed'))
          }
          successCount += 1
        }

        if (entity === 'proposals') {
          const title = normalizeText(row.title)
          if (!title) {
            throw new Error(t('api.data.proposalTitleRequired'))
          }
          const contactId =
            normalizeText(row.contact_id) ??
            (await upsertContact({
              email: row.contact_email,
              name: row.contact_name,
            }))

          if (!contactId) {
            throw new Error(t('api.data.customerMissing'))
          }

          const { error } = await supabase.from('proposals').insert({
            title,
            contact_id: contactId,
            deal_id: normalizeText(row.deal_id),
            user_id: user.id,
            team_id: profile.team_id,
            blocks: [],
            status: normalizeText(row.status) ?? 'draft',
            expires_at: parseDate(row.expires_at),
          })

          if (error) {
            throw new Error(error.message || t('api.data.proposalCreateFailed'))
          }
          successCount += 1
        }
      } catch (error) {
        errors.push({
          row: index + 1,
          message: error instanceof Error ? error.message : t('api.data.rowFailed'),
        })
      }
    }

    const status = errors.length > 0 ? 'completed_with_errors' : 'completed'
    await supabase
      .from('data_import_jobs')
      .update({
        status,
        success_count: successCount,
        error_count: errors.length,
        errors: errors.slice(0, 50) as Json,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return NextResponse.json({
      jobId: job.id,
      status,
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    })
  } catch (error) {
    await supabase
      .from('data_import_jobs')
      .update({
        status: 'failed',
        error_count: errors.length,
        errors: errors.slice(0, 50) as Json,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : t('api.data.importFailed') },
      { status: 400 }
    )
  }
})
