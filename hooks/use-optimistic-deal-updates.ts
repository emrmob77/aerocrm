'use client'

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import toast from 'react-hot-toast'
import { applyOptimisticDealStage } from '@/components/deals/kanban-utils'
import type { StageId } from '@/components/deals/stage-utils'

type DealMember = {
  id: string
  name: string
  avatarUrl: string | null
}

type DealCardData = {
  id: string
  title: string
  company: string
  value: number
  stage: StageId
  contactName: string
  contactInitials: string
  ownerName: string
  ownerInitials: string
  ownerAvatarUrl?: string | null
  ownerId: string | null
  updatedAt: string
  createdAt: string
}

const createInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '??'
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

type UseOptimisticDealUpdatesParams = {
  deals: DealCardData[]
  setDeals: Dispatch<SetStateAction<DealCardData[]>>
  memberMap: Map<string, DealMember>
  t: (key: string, vars?: Record<string, string | number>) => string
}

export const useOptimisticDealUpdates = ({
  deals,
  setDeals,
  memberMap,
  t,
}: UseOptimisticDealUpdatesParams) => {
  const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null)
  const [ownerUpdatingId, setOwnerUpdatingId] = useState<string | null>(null)

  const applyStageChange = useCallback(
    async (dealId: string, targetStage: StageId) => {
      const current = deals.find((deal) => deal.id === dealId)
      if (!current || current.stage === targetStage) {
        return
      }

      const previousStage = current.stage
      const previousUpdatedAt = current.updatedAt
      const now = new Date().toISOString()

      setDeals((prev) => applyOptimisticDealStage(prev, dealId, targetStage, now))

      setStageUpdatingId(dealId)
      try {
        const response = await fetch('/api/deals/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId, stage: targetStage }),
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          setDeals((prev) => applyOptimisticDealStage(prev, dealId, previousStage, previousUpdatedAt))
          toast.error(payload?.error || t('deals.stageUpdateError'))
          return
        }

        const updatedAt = payload?.deal?.updated_at
        if (updatedAt) {
          setDeals((prev) =>
            prev.map((deal) =>
              deal.id === dealId
                ? {
                    ...deal,
                    updatedAt,
                  }
                : deal
            )
          )
        }
      } catch (error) {
        setDeals((prev) => applyOptimisticDealStage(prev, dealId, previousStage, previousUpdatedAt))
        toast.error(error instanceof Error ? error.message : t('deals.stageUpdateError'))
      } finally {
        setStageUpdatingId((prev) => (prev === dealId ? null : prev))
      }
    },
    [deals, setDeals, t]
  )

  const assignOwner = useCallback(
    async (dealId: string, nextOwnerId: string) => {
      const current = deals.find((deal) => deal.id === dealId)
      if (!current) return
      if (!nextOwnerId) return
      if (current.ownerId === nextOwnerId) return

      const previousOwnerId = current.ownerId
      const previousOwnerName = current.ownerName
      const previousOwnerInitials = current.ownerInitials
      const previousOwnerAvatarUrl = current.ownerAvatarUrl ?? null
      const nextMember = memberMap.get(nextOwnerId)
      const nextOwnerName = nextMember?.name ?? t('deals.ownerFallback')
      const nextOwnerInitials = createInitials(nextOwnerName)

      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                ownerId: nextOwnerId,
                ownerName: nextOwnerName,
                ownerInitials: nextOwnerInitials,
                ownerAvatarUrl: nextMember?.avatarUrl ?? null,
              }
            : deal
        )
      )

      setOwnerUpdatingId(dealId)
      try {
        const response = await fetch('/api/deals/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId, ownerId: nextOwnerId }),
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          setDeals((prev) =>
            prev.map((deal) =>
              deal.id === dealId
                ? {
                    ...deal,
                    ownerId: previousOwnerId,
                    ownerName: previousOwnerName,
                    ownerInitials: previousOwnerInitials,
                    ownerAvatarUrl: previousOwnerAvatarUrl,
                  }
                : deal
            )
          )
          toast.error(payload?.error || t('deals.assignError'))
        } else if (payload?.notificationDelivered === false) {
          if (payload?.notificationReason === 'preferences_disabled') {
            toast.error(t('deals.assignNotificationDisabled'))
          } else {
            toast.error(t('deals.assignNotificationWarning'))
          }
        }
      } catch (error) {
        setDeals((prev) =>
          prev.map((deal) =>
            deal.id === dealId
              ? {
                  ...deal,
                  ownerId: previousOwnerId,
                  ownerName: previousOwnerName,
                  ownerInitials: previousOwnerInitials,
                  ownerAvatarUrl: previousOwnerAvatarUrl,
                }
              : deal
          )
        )
        toast.error(error instanceof Error ? error.message : t('deals.assignError'))
      } finally {
        setOwnerUpdatingId((prev) => (prev === dealId ? null : prev))
      }
    },
    [deals, memberMap, setDeals, t]
  )

  return {
    stageUpdatingId,
    ownerUpdatingId,
    applyStageChange,
    assignOwner,
  }
}
