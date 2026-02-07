import { redirect } from 'next/navigation'
import { DealsBoard } from '@/components/deals'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import { normalizeStage } from '@/components/deals'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

type DealRow = Pick<
  Database['public']['Tables']['deals']['Row'],
  'id' | 'title' | 'value' | 'stage' | 'updated_at' | 'created_at' | 'contact_id' | 'user_id'
>

type DealContact = {
  full_name: string | null
  company: string | null
}

type TeamMember = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export default async function DealsPage() {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
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
  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return null
    }
  })()

  let members: TeamMember[] = []
  if (teamId) {
    const membersClient = admin ?? supabase
    const { data: teamMembers } = await membersClient
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('team_id', teamId)
      .order('full_name', { ascending: true })
    members = (teamMembers ?? []) as TeamMember[]
  } else {
    const { data: selfMember } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    members = selfMember ? [selfMember as TeamMember] : []
  }

  const ownerMap = new Map(members.map((member) => [member.id, member]))

  let dealsQuery = supabase
    .from('deals')
    .select('id, title, value, stage, updated_at, created_at, contact_id, user_id, contacts(full_name, company)')
    .order('updated_at', { ascending: false })

  if (teamId) {
    dealsQuery = dealsQuery.or(
      `team_id.eq.${teamId},user_id.eq.${user.id}`
    )
  } else {
    dealsQuery = dealsQuery.eq('user_id', user.id)
  }

  const { data: deals } = await dealsQuery

  const mappedDeals = (deals ?? []).map((deal) => {
    const record = deal as DealRow & {
      contacts?: DealContact | DealContact[] | null
    }
    const contact = Array.isArray(record.contacts) ? record.contacts[0] : record.contacts
    const owner = record.user_id ? ownerMap.get(record.user_id) : null
    const contactName = contact?.full_name?.trim() || t('deals.unknownContact')
    const initials = contactName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    const ownerName = owner?.full_name?.trim() || t('deals.ownerFallback')
    const ownerInitials = ownerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    return {
      id: deal.id,
      title: deal.title,
      company: contact?.company ?? t('common.unknown'),
      value: deal.value ?? 0,
      stage: normalizeStage(deal.stage),
      contactName,
      contactInitials: initials || '??',
      ownerName,
      ownerInitials: ownerInitials || '??',
      ownerAvatarUrl: owner?.avatar_url ?? null,
      ownerId: deal.user_id ?? null,
      updatedAt: deal.updated_at ?? new Date().toISOString(),
      createdAt: deal.created_at ?? deal.updated_at ?? new Date().toISOString(),
    }
  })

  return (
    <DealsBoard
      initialDeals={mappedDeals}
      initialMembers={members.map((member) => ({
        id: member.id,
        name: member.full_name?.trim() || t('deals.ownerFallback'),
        avatarUrl: member.avatar_url ?? null,
      }))}
      teamId={teamId}
      userId={user.id}
    />
  )
}
