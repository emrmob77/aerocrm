import { redirect } from 'next/navigation'
import ProductsPageClient, { type Product } from './ProductsPageClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const mapProductRow = (
  row: {
    id: string
    name: string
    description: string | null
    price: number | null
    currency: string
    category: string | null
    active: boolean | null
    created_at: string | null
    updated_at: string | null
  },
  fallbackDate = new Date().toISOString()
): Product => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  price: row.price ?? 0,
  currency: row.currency ?? 'TRY',
  category: row.category ?? null,
  isActive: row.active ?? true,
  createdAt: row.created_at ?? fallbackDate,
  updatedAt: row.updated_at ?? fallbackDate,
})

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  const teamId = profile?.team_id ?? null
  if (!teamId) {
    return <ProductsPageClient initialProducts={[]} initialTeamId={null} />
  }

  const { data } = await supabase
    .from('products')
    .select('id, name, description, price, currency, category, active, created_at, updated_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  const initialProducts = (data ?? []).map((row) =>
    mapProductRow({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      currency: row.currency,
      category: row.category,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  )

  return <ProductsPageClient initialProducts={initialProducts} initialTeamId={teamId} />
}
