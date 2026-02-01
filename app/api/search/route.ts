import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type SearchFilters = {
  types?: string[]
  stages?: string[]
  statuses?: string[]
  dateRange?: '7d' | '30d' | '90d' | 'all'
}

type SearchPayload = {
  query?: string
  filters?: SearchFilters
  track?: boolean
}

const sanitizeQuery = (value: string) => value.replace(/[%_,]/g, ' ').trim()

const buildDateFrom = (range?: SearchFilters['dateRange']) => {
  if (!range || range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SearchPayload | null
  const query = payload?.query?.trim() ?? ''
  const sanitized = sanitizeQuery(query)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  if (!sanitized || sanitized.length < 2) {
    return NextResponse.json({
      query,
      results: { deals: [], contacts: [], proposals: [] },
    })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  const teamId = profile?.team_id ?? null
  const filters = payload?.filters ?? {}
  const dateFrom = buildDateFrom(filters.dateRange)
  const types = filters.types?.length ? filters.types : ['deals', 'contacts', 'proposals']
  const like = `%${sanitized}%`

  const tasks: Promise<unknown>[] = []
  const results = {
    deals: [],
    contacts: [],
    proposals: [],
  } as {
    deals: {
      id: string
      title: string
      value: number
      currency: string
      stage: string
      updated_at: string
      contact?: { full_name?: string | null; company?: string | null } | null
    }[]
    contacts: {
      id: string
      full_name: string
      email: string | null
      company: string | null
      updated_at: string
    }[]
    proposals: {
      id: string
      title: string
      status: string
      updated_at: string
      contact?: { full_name?: string | null } | null
    }[]
  }

  if (types.includes('deals')) {
    let dealsQuery = supabase
      .from('deals')
      .select('id, title, value, currency, stage, updated_at, contact:contacts(full_name, company)')
      .order('updated_at', { ascending: false })
      .limit(20)
      .or(`title.ilike.${like},notes.ilike.${like}`)

    if (teamId) {
      dealsQuery = dealsQuery.eq('team_id', teamId)
    }
    if (filters.stages?.length) {
      dealsQuery = dealsQuery.in('stage', filters.stages)
    }
    if (dateFrom) {
      dealsQuery = dealsQuery.gte('updated_at', dateFrom)
    }

    tasks.push(
      Promise.resolve(dealsQuery).then(({ data }) => {
        results.deals = (data ?? []) as typeof results.deals
      })
    )
  }

  if (types.includes('contacts')) {
    let contactsQuery = supabase
      .from('contacts')
      .select('id, full_name, email, company, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20)
      .or(`full_name.ilike.${like},email.ilike.${like},company.ilike.${like}`)

    if (teamId) {
      contactsQuery = contactsQuery.eq('team_id', teamId)
    }
    if (dateFrom) {
      contactsQuery = contactsQuery.gte('updated_at', dateFrom)
    }

    tasks.push(
      Promise.resolve(contactsQuery).then(({ data }) => {
        results.contacts = (data ?? []) as typeof results.contacts
      })
    )
  }

  if (types.includes('proposals')) {
    let proposalsQuery = supabase
      .from('proposals')
      .select('id, title, status, updated_at, contact:contacts(full_name)')
      .order('updated_at', { ascending: false })
      .limit(20)
      .or(`title.ilike.${like}`)

    if (teamId) {
      proposalsQuery = proposalsQuery.eq('team_id', teamId)
    }
    if (filters.statuses?.length) {
      proposalsQuery = proposalsQuery.in('status', filters.statuses)
    }
    if (dateFrom) {
      proposalsQuery = proposalsQuery.gte('updated_at', dateFrom)
    }

    tasks.push(
      Promise.resolve(proposalsQuery).then(({ data }) => {
        results.proposals = (data ?? []) as typeof results.proposals
      })
    )
  }

  await Promise.all(tasks)

  if (payload?.track) {
    await supabase.from('search_history').insert({
      user_id: user.id,
      query: sanitized,
      filters: {
        types,
        stages: filters.stages ?? [],
        statuses: filters.statuses ?? [],
        dateRange: filters.dateRange ?? 'all',
      },
    })
  }

  return NextResponse.json({
    query: sanitized,
    results,
  })
}
