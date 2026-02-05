import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { ContactsDirectory } from '@/components/contacts'

export const dynamic = 'force-dynamic'

type ContactRow = Database['public']['Tables']['contacts']['Row']
type ContactCore = Pick<
  ContactRow,
  'id' | 'full_name' | 'email' | 'phone' | 'company' | 'position' | 'created_at' | 'updated_at' | 'user_id' | 'team_id' | 'custom_fields'
>
type DealRow = Database['public']['Tables']['deals']['Row']
type DealForStats = Pick<DealRow, 'contact_id' | 'value' | 'updated_at' | 'created_at'>

type DealStats = {
  totalValue: number
  lastActivityAt: string
  dealsCount: number
}

const buildDealStats = (deals: DealForStats[]) => {
  const stats = new Map<string, DealStats>()

  for (const deal of deals) {
    const contactId = deal.contact_id
    if (!contactId) continue

    const dealActivityAt = deal.updated_at ?? deal.created_at ?? new Date().toISOString()
    const existing = stats.get(contactId) ?? {
      totalValue: 0,
      lastActivityAt: dealActivityAt,
      dealsCount: 0,
    }

    const updatedAt = deal.updated_at ?? deal.created_at
    if (updatedAt && new Date(updatedAt) > new Date(existing.lastActivityAt)) {
      existing.lastActivityAt = updatedAt
    }

    existing.totalValue += deal.value ?? 0
    existing.dealsCount += 1
    stats.set(contactId, existing)
  }

  return stats
}

export default async function ContactsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id ?? null

  let contactsQuery = supabase
    .from('contacts')
    .select('id, full_name, email, phone, company, position, created_at, updated_at, user_id, team_id, custom_fields')
    .order('updated_at', { ascending: false })

  if (teamId) {
    contactsQuery = contactsQuery.eq('team_id', teamId)
  } else {
    contactsQuery = contactsQuery.eq('user_id', user.id)
  }

  const { data: contacts } = await contactsQuery

  const contactIds = (contacts ?? []).map((contact) => contact.id)

  let deals: DealForStats[] = []
  if (contactIds.length > 0) {
    let dealsQuery = supabase
      .from('deals')
      .select('id, contact_id, value, updated_at, created_at, stage, team_id, user_id')
      .in('contact_id', contactIds)

    if (teamId) {
      dealsQuery = dealsQuery.eq('team_id', teamId)
    } else {
      dealsQuery = dealsQuery.eq('user_id', user.id)
    }

    const { data: dealsData } = await dealsQuery
    deals = dealsData ?? []
  }

  const dealStats = buildDealStats(deals)

  const now = new Date().toISOString()
  const initialContacts = (contacts ?? []).map((contact: ContactCore) => {
    const stats = dealStats.get(contact.id)
    const fallbackLast = contact.updated_at ?? contact.created_at ?? now

    return {
      id: contact.id,
      fullName: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      position: contact.position,
      createdAt: contact.created_at ?? now,
      updatedAt: contact.updated_at ?? now,
      totalValue: stats?.totalValue ?? 0,
      lastActivityAt: stats?.lastActivityAt ?? fallbackLast,
      dealsCount: stats?.dealsCount ?? 0,
      customFields: contact.custom_fields ?? null,
    }
  })

  return <ContactsDirectory initialContacts={initialContacts} teamId={teamId} userId={user.id} />
}
