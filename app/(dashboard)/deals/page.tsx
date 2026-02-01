import { redirect } from 'next/navigation'
import { DealsBoard } from '@/components/deals'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { normalizeStage } from '@/components/deals'

export const dynamic = 'force-dynamic'

type DealRow = Pick<
  Database['public']['Tables']['deals']['Row'],
  'id' | 'title' | 'value' | 'stage' | 'updated_at' | 'contact_id' | 'user_id'
>

type DealContact = {
  full_name: string | null
  company: string | null
}

type DealOwner = {
  full_name: string | null
  avatar_url: string | null
}

export default async function DealsPage() {
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

  let dealsQuery = supabase
    .from('deals')
    .select('id, title, value, stage, updated_at, contact_id, user_id, contacts(full_name, company), users(full_name, avatar_url)')
    .order('updated_at', { ascending: false })

  if (teamId) {
    dealsQuery = dealsQuery.eq('team_id', teamId)
  } else {
    dealsQuery = dealsQuery.eq('user_id', user.id)
  }

  const { data: deals } = await dealsQuery

  const mappedDeals = (deals ?? []).map((deal) => {
    const record = deal as DealRow & {
      contacts?: DealContact | DealContact[] | null
      users?: DealOwner | DealOwner[] | null
    }
    const contact = Array.isArray(record.contacts) ? record.contacts[0] : record.contacts
    const owner = Array.isArray(record.users) ? record.users[0] : record.users
    const contactName = contact?.full_name?.trim() || 'Bilinmeyen Kişi'
    const initials = contactName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    const ownerName = owner?.full_name?.trim() || 'Sorumlu'
    const ownerInitials = ownerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    return {
      id: deal.id,
      title: deal.title,
      company: contact?.company ?? 'Bilinmiyor',
      value: deal.value ?? 0,
      stage: normalizeStage(deal.stage),
      contactName,
      contactInitials: initials || '??',
      ownerName,
      ownerInitials: ownerInitials || '??',
      ownerAvatarUrl: owner?.avatar_url ?? null,
      updatedAt: deal.updated_at ?? new Date().toISOString(),
    }
  })

  return (
    <DealsBoard
      initialDeals={mappedDeals}
      teamId={teamId}
      userId={user.id}
    />
  )
}
