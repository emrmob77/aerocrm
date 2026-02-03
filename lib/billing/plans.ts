export type PlanId = 'starter' | 'growth' | 'scale'

export type PlanLimits = {
  users: number | null
  proposals: number | null
  storageGb: number | null
}

export type PlanDefinition = {
  id: PlanId
  priceMonthly: number
  currency: 'USD' | 'TRY'
  recommended?: boolean
  limits: PlanLimits
}

export type PlanCatalogItem = PlanDefinition & {
  priceId: string | null
}

export const planDefinitions: PlanDefinition[] = [
  {
    id: 'starter',
    priceMonthly: 29,
    currency: 'USD',
    limits: { users: 3, proposals: 10, storageGb: 5 },
  },
  {
    id: 'growth',
    priceMonthly: 79,
    currency: 'USD',
    recommended: true,
    limits: { users: 10, proposals: 200, storageGb: 50 },
  },
  {
    id: 'scale',
    priceMonthly: 149,
    currency: 'USD',
    limits: { users: 25, proposals: null, storageGb: 200 },
  },
]

export const normalizePlanId = (value?: string | null): PlanId => {
  if (!value) return 'starter'
  if (value === 'starter' || value === 'growth' || value === 'scale') return value
  if (value === 'solo') return 'starter'
  if (value === 'pro') return 'growth'
  if (value === 'team') return 'scale'
  return 'starter'
}

export const getPlanCatalog = (): PlanCatalogItem[] => {
  const priceMap: Record<PlanId, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    scale: process.env.STRIPE_PRICE_SCALE,
  }

  return planDefinitions.map((plan) => ({
    ...plan,
    priceId: priceMap[plan.id] ?? null,
  }))
}
