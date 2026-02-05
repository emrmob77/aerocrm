export type TeamDealWithOwner = {
  id: string
  user_id: string
}

export const assignDealOwner = <T extends TeamDealWithOwner>(
  deals: T[],
  dealId: string,
  ownerId: string
): T[] => {
  let changed = false
  const next = deals.map((deal) => {
    if (deal.id !== dealId) {
      return deal
    }
    if (deal.user_id === ownerId) {
      return deal
    }
    changed = true
    return {
      ...deal,
      user_id: ownerId,
    }
  })

  return changed ? next : deals
}
