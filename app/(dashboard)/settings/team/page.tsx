import { redirect } from 'next/navigation'
import TeamSettingsPageClient, {
  type DealRow,
  type InviteRow,
  type MemberRow,
} from './TeamSettingsPageClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type MemberQueryRow = {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url: string | null
  allowed_screens: string[] | null
}

type InviteQueryRow = {
  id: string
  email: string
  role: string
  status: string
  token: string
  created_at: string
  expires_at: string | null
}

type DealQueryRow = {
  id: string
  title: string
  value: number | null
  stage: string
  user_id: string
  contact: { full_name?: string } | Array<{ full_name?: string }> | null
}

const mapMembers = (rows: MemberQueryRow[]): MemberRow[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    avatar: row.avatar_url,
    allowedScreens: row.allowed_screens ?? null,
  }))

const mapInvites = (rows: InviteQueryRow[]): InviteRow[] =>
  rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    token: row.token,
    created_at: row.created_at,
    expires_at: row.expires_at,
  }))

const mapDeals = (rows: DealQueryRow[]): DealRow[] =>
  rows.map((row) => {
    const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact
    return {
      id: row.id,
      title: row.title,
      value: row.value ?? 0,
      stage: row.stage,
      user_id: row.user_id,
      contactName: contact?.full_name ?? 'Musteri',
    }
  })

export default async function TeamSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, team_id')
    .eq('id', authUser.id)
    .maybeSingle()

  const teamId = profile?.team_id ?? null
  if (!teamId) {
    return (
      <TeamSettingsPageClient
        initialMembers={[]}
        initialInvites={[]}
        initialDeals={[]}
        initialTeamId={null}
        initialCurrentUser={
          profile
            ? {
                id: profile.id,
                role: profile.role,
                team_id: profile.team_id,
              }
            : null
        }
        initialAuthUserId={authUser.id}
      />
    )
  }

  const [membersResult, invitesResult, dealsResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, role, avatar_url, allowed_screens')
      .eq('team_id', teamId)
      .order('full_name', { ascending: true }),
    supabase
      .from('team_invites')
      .select('id, email, role, status, token, created_at, expires_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false }),
    supabase
      .from('deals')
      .select('id, title, value, stage, user_id, contact:contacts(full_name)')
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false }),
  ])

  const initialMembers = mapMembers((membersResult.data ?? []) as MemberQueryRow[])
  const initialInvites = mapInvites((invitesResult.data ?? []) as InviteQueryRow[])
  const initialDeals = mapDeals((dealsResult.data ?? []) as DealQueryRow[])

  return (
    <TeamSettingsPageClient
      initialMembers={initialMembers}
      initialInvites={initialInvites}
      initialDeals={initialDeals}
      initialTeamId={teamId}
      initialCurrentUser={
        profile
          ? {
              id: profile.id,
              role: profile.role,
              team_id: profile.team_id,
            }
          : null
      }
      initialAuthUserId={authUser.id}
    />
  )
}
