import type { PlanId } from './plans'

export type StripePriceMap = Partial<Record<PlanId, string>>

const PLAN_ALIASES: Record<string, PlanId> = {
  starter: 'starter',
  growth: 'growth',
  scale: 'scale',
  solo: 'starter',
  pro: 'growth',
  team: 'scale',
}

export const buildStripePriceMap = (
  env: Record<string, string | undefined> = process.env
): StripePriceMap => {
  const map: StripePriceMap = {}
  if (env.STRIPE_PRICE_STARTER) map.starter = env.STRIPE_PRICE_STARTER
  if (env.STRIPE_PRICE_GROWTH) map.growth = env.STRIPE_PRICE_GROWTH
  if (env.STRIPE_PRICE_SCALE) map.scale = env.STRIPE_PRICE_SCALE
  return map
}

export const resolvePlanFromMetadata = (planId?: string | null): PlanId | null => {
  if (!planId) return null
  const normalized = planId.trim().toLowerCase()
  return PLAN_ALIASES[normalized] ?? null
}

export const resolvePlanFromPriceId = (
  priceId?: string | null,
  priceMap: StripePriceMap = buildStripePriceMap()
): PlanId | null => {
  if (!priceId) return null
  const match = (Object.keys(priceMap) as PlanId[]).find((plan) => priceMap[plan] === priceId)
  return match ?? null
}

export const applyPlanChange = (
  currentPlan: PlanId,
  change: {
    metadataPlanId?: string | null
    priceId?: string | null
    priceMap?: StripePriceMap
  }
): PlanId => {
  const planFromMetadata = resolvePlanFromMetadata(change.metadataPlanId)
  if (planFromMetadata) return planFromMetadata

  const planFromPrice = resolvePlanFromPriceId(change.priceId, change.priceMap)
  if (planFromPrice) return planFromPrice

  return currentPlan
}
