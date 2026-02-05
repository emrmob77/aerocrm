import type { StageId } from './stage-utils'

type DealWithStage = {
  id: string
  stage: StageId
  updatedAt: string
}

export const applyOptimisticDealStage = <T extends DealWithStage>(
  deals: T[],
  dealId: string,
  targetStage: StageId,
  updatedAt: string
) => {
  const current = deals.find((deal) => deal.id === dealId)
  if (!current || current.stage === targetStage) {
    return deals
  }

  return deals.map((deal) =>
    deal.id === dealId
      ? {
          ...deal,
          stage: targetStage,
          updatedAt,
        }
      : deal
  )
}

export const resolveDropStage = <T extends Pick<DealWithStage, 'id' | 'stage'>>(
  overId: unknown,
  deals: T[]
): StageId | null => {
  const id = String(overId)
  if (id.startsWith('stage-')) {
    return id.replace('stage-', '') as StageId
  }

  if (id.startsWith('deal-')) {
    const dealId = id.replace('deal-', '')
    const deal = deals.find((item) => item.id === dealId)
    return deal?.stage ?? null
  }

  return null
}
