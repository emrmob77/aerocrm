import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import DealDetailsClient from './DealDetailsClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import { normalizeStage } from '@/components/deals/stage-utils'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

type DealRow = Database['public']['Tables']['deals']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type TeamMemberRow = Pick<UserRow, 'id' | 'full_name' | 'email' | 'role' | 'avatar_url' | 'allowed_screens'>
type DealProductRow = Database['public']['Tables']['deal_products']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']
type ProposalRow = Database['public']['Tables']['proposals']['Row']
type ActivityRow = Database['public']['Tables']['activities']['Row']

type DealProductItem = DealProductRow & {
  product?: ProductRow | null
}

type DealFileRow = {
  id: string
  deal_id: string
  name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export default async function DealDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const supabaseDb = supabase as unknown as SupabaseClient<Database>
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

  const { data: dealRow, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', params.id)
    .single()

  if (dealError || !dealRow) {
    return (
      <DealDetailsClient
        dealId={params.id}
        authUserId={user.id}
        teamId={teamId}
        initialDeal={null}
        initialContact={null}
        initialOwner={null}
        initialDealProducts={[]}
        initialProposals={[]}
        initialActivities={[]}
        initialFiles={[]}
        initialContacts={[]}
        initialTeamMembers={[]}
        initialProducts={[]}
        averageDays={null}
        initialError={t('deals.detail.notFound')}
      />
    )
  }

  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return null
    }
  })()
  const membersClient = teamId && admin ? admin : supabase

  const contactPromise = dealRow.contact_id
    ? supabase
        .from('contacts')
        .select('*')
        .eq('id', dealRow.contact_id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null })
  const ownerPromise = dealRow.user_id
    ? membersClient
        .from('users')
        .select('id, full_name, avatar_url, email, role, allowed_screens')
        .eq('id', dealRow.user_id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null })

  const contactsQuery = supabase
    .from('contacts')
    .select('id, full_name, email, phone, company, position, address, user_id, team_id, created_at, updated_at')
    .order('created_at', { ascending: false })

  const membersQuery = membersClient
    .from('users')
    .select('id, full_name, avatar_url, email, role, allowed_screens')
    .order('full_name', { ascending: true })

  const productsQuery = supabase
    .from('products')
    .select('id, name, price, currency, category, active, team_id, created_at, updated_at')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (teamId) {
    contactsQuery.eq('team_id', teamId)
    membersQuery.eq('team_id', teamId)
    productsQuery.eq('team_id', teamId)
  } else {
    contactsQuery.eq('user_id', user.id)
    membersQuery.eq('id', user.id)
    productsQuery.eq('team_id', user.id)
  }

  const dealProductsPromise = supabase
    .from('deal_products')
    .select('*')
    .eq('deal_id', params.id)
    .order('created_at', { ascending: false })

  const proposalPromise = supabase
    .from('proposals')
    .select('id, title, status, created_at, updated_at, public_url, deal_id, contact_id, user_id, team_id, blocks, expires_at, signed_at, signature_data')
    .eq('deal_id', params.id)
    .order('created_at', { ascending: false })

  const activityPromise = supabase
    .from('activities')
    .select('id, type, title, description, user_id, team_id, entity_type, entity_id, metadata, created_at')
    .eq('entity_type', 'deal')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: false })

  const filePromise = supabaseDb
    .from('deal_files')
    .select('id, deal_id, name, file_path, file_size, mime_type, uploaded_by, created_at')
    .eq('deal_id', params.id)
    .order('created_at', { ascending: false })

  const averagePromise = teamId
    ? supabase
        .from('deals')
        .select('created_at, stage')
        .eq('team_id', teamId)
    : Promise.resolve({ data: null, error: null })

  const [
    contactRes,
    ownerRes,
    contactsRes,
    membersRes,
    productsRes,
    dealProductsRes,
    proposalRes,
    activityRes,
    fileRes,
    averageRes,
  ] = await Promise.all([
    contactPromise,
    ownerPromise,
    contactsQuery,
    membersQuery,
    productsQuery,
    dealProductsPromise,
    proposalPromise,
    activityPromise,
    filePromise,
    averagePromise,
  ])

  const contact = (contactRes.data ?? null) as ContactRow | null
  let owner = (ownerRes.data ?? null) as TeamMemberRow | null
  let teamMembers = (membersRes.data ?? []) as TeamMemberRow[]

  if (!owner && dealRow.user_id) {
    owner = teamMembers.find((member) => member.id === dealRow.user_id) ?? null
  }
  if (owner && !teamMembers.some((member) => member.id === owner.id)) {
    teamMembers = [owner, ...teamMembers]
  }

  const dealProductRows = dealProductsRes.data ?? []
  const productIds = (dealProductRows ?? []).map((item) => item.product_id)
  let productMap = new Map<string, ProductRow>()
  if (productIds.length > 0) {
    const { data: productRows } = await supabase
      .from('products')
      .select('id, name, price, currency, category, active, team_id, created_at, updated_at, description')
      .in('id', productIds)
    productMap = new Map((productRows ?? []).map((item) => [item.id, item]))
  }

  const dealProducts = (dealProductRows ?? []).map((item) => ({
    ...item,
    product: productMap.get(item.product_id) ?? null,
  })) as DealProductItem[]

  let averageDays: number | null = null
  if (teamId) {
    const rows = averageRes.data ?? []
    const openDeals = rows.filter((row) => {
      const stage = normalizeStage(row.stage)
      return stage !== 'won' && stage !== 'lost'
    })

    if (openDeals.length > 0) {
      const now = Date.now()
      const totalDays = openDeals.reduce((sum, row) => {
        const created = new Date(row.created_at).getTime()
        const diff = now - created
        return sum + Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
      }, 0)

      averageDays = Math.round(totalDays / openDeals.length)
    }
  }

  return (
    <DealDetailsClient
      dealId={params.id}
      authUserId={user.id}
      teamId={teamId}
      initialDeal={dealRow as DealRow}
      initialContact={contact}
      initialOwner={owner}
      initialDealProducts={dealProducts}
      initialProposals={(proposalRes.data ?? []) as ProposalRow[]}
      initialActivities={(activityRes.data ?? []) as ActivityRow[]}
      initialFiles={(fileRes.data ?? []) as DealFileRow[]}
      initialContacts={(contactsRes.data ?? []) as ContactRow[]}
      initialTeamMembers={teamMembers}
      initialProducts={(productsRes.data ?? []) as ProductRow[]}
      averageDays={averageDays}
    />
  )
}
