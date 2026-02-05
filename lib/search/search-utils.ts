export const SEARCH_TYPES = ['deals', 'contacts', 'proposals'] as const

export type SearchType = (typeof SEARCH_TYPES)[number]
export type SearchDateRange = 'all' | '7d' | '30d' | '90d'

export type SearchFiltersInput = {
  types?: string[]
  stages?: string[]
  statuses?: string[]
  dateRange?: SearchDateRange
}

export type NormalizedSearchFilters = {
  types: SearchType[]
  stages: string[]
  statuses: string[]
  dateRange: SearchDateRange
}

export type SearchResults = {
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

const uniqueValues = (values?: string[]) => {
  const result: string[] = []
  const seen = new Set<string>()

  for (const raw of values ?? []) {
    const value = raw.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }

  return result
}

const normalizeText = (value: string | null | undefined) => sanitizeSearchQuery(value ?? '').toLowerCase()

const isDateRange = (value: string | undefined): value is SearchDateRange =>
  value === 'all' || value === '7d' || value === '30d' || value === '90d'

export const sanitizeSearchQuery = (value: string) => value.replace(/[%_,]/g, ' ').trim()

export const isSearchQueryMeaningful = (value: string) => sanitizeSearchQuery(value).length >= 2

export const buildSearchDateFrom = (range?: SearchDateRange, nowMs = Date.now()) => {
  if (!range || range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const timestamp = nowMs - days * 24 * 60 * 60 * 1000
  if (!Number.isFinite(timestamp)) return null

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export const resolveSearchTypes = (values?: string[]) => {
  const validTypes = uniqueValues(values).filter((value): value is SearchType =>
    SEARCH_TYPES.includes(value as SearchType)
  )
  return validTypes.length > 0 ? validTypes : [...SEARCH_TYPES]
}

export const normalizeSearchFilters = (filters?: SearchFiltersInput): NormalizedSearchFilters => ({
  types: resolveSearchTypes(filters?.types),
  stages: uniqueValues(filters?.stages),
  statuses: uniqueValues(filters?.statuses),
  dateRange: isDateRange(filters?.dateRange) ? filters.dateRange : 'all',
})

const matchesDateRange = (updatedAt: string, dateFrom: string | null) => {
  if (!dateFrom) return true
  const updatedTs = Date.parse(updatedAt)
  const fromTs = Date.parse(dateFrom)
  if (!Number.isFinite(updatedTs) || !Number.isFinite(fromTs)) return false
  return updatedTs >= fromTs
}

const includesQuery = (
  normalizedQuery: string,
  values: Array<string | null | undefined>
) => {
  if (!normalizedQuery) return true
  return values.some((value) => normalizeText(value).includes(normalizedQuery))
}

export const applyRealtimeSearchFilters = (
  results: SearchResults,
  rawQuery: string,
  rawFilters?: SearchFiltersInput,
  nowMs = Date.now()
): SearchResults => {
  const filters = normalizeSearchFilters(rawFilters)
  const query = normalizeText(rawQuery)
  const dateFrom = buildSearchDateFrom(filters.dateRange, nowMs)

  const includeDeals = filters.types.includes('deals')
  const includeContacts = filters.types.includes('contacts')
  const includeProposals = filters.types.includes('proposals')

  return {
    deals: includeDeals
      ? results.deals.filter((deal) => {
          const matchesStage = filters.stages.length === 0 || filters.stages.includes(deal.stage)
          const matchesDate = matchesDateRange(deal.updated_at, dateFrom)
          const matchesQuery = includesQuery(query, [
            deal.title,
            deal.contact?.full_name,
            deal.contact?.company,
          ])
          return matchesStage && matchesDate && matchesQuery
        })
      : [],
    contacts: includeContacts
      ? results.contacts.filter((contact) => {
          const matchesDate = matchesDateRange(contact.updated_at, dateFrom)
          const matchesQuery = includesQuery(query, [contact.full_name, contact.email, contact.company])
          return matchesDate && matchesQuery
        })
      : [],
    proposals: includeProposals
      ? results.proposals.filter((proposal) => {
          const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(proposal.status)
          const matchesDate = matchesDateRange(proposal.updated_at, dateFrom)
          const matchesQuery = includesQuery(query, [proposal.title, proposal.contact?.full_name])
          return matchesStatus && matchesDate && matchesQuery
        })
      : [],
  }
}

export const toggleSearchFilterValue = (current: string[], id: string) =>
  current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
