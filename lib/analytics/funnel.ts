import type { Proposal, ProposalView } from '@/types'

type ProposalLike = Pick<Proposal, 'id'> & { status?: string | null }
type ProposalViewLike = Pick<ProposalView, 'proposal_id'> & { duration_seconds?: number | null }

export const isSentStatus = (status?: string | null) =>
  status === 'sent' || status === 'pending' || status === 'viewed' || status === 'signed'

export const isViewedStatus = (status?: string | null) => status === 'viewed' || status === 'signed'

export const isSignedStatus = (status?: string | null) => status === 'signed'

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const toPercent = (part: number, total: number) => {
  if (total <= 0) return 0
  return clampPercent(Math.round((part / total) * 100))
}

export type ConversionFunnelMetrics = {
  sentCount: number
  viewedCount: number
  engagedCount: number
  signedCount: number
  sentPercent: number
  viewedPercent: number
  engagedPercent: number
  signedPercent: number
  viewedFlex: number
  engagedFlex: number
  signedFlex: number
}

export const buildConversionFunnel = (
  proposals: ProposalLike[],
  views: ProposalViewLike[],
  engagedThresholdSeconds = 60
): ConversionFunnelMetrics => {
  const sentProposalIds = new Set<string>()
  const viewedProposalIds = new Set<string>()
  const signedProposalIds = new Set<string>()

  for (const proposal of proposals) {
    if (!proposal?.id) continue
    if (isSentStatus(proposal.status)) {
      sentProposalIds.add(proposal.id)
    }
    if (isViewedStatus(proposal.status)) {
      viewedProposalIds.add(proposal.id)
    }
    if (isSignedStatus(proposal.status)) {
      signedProposalIds.add(proposal.id)
    }
  }

  const sentCount = sentProposalIds.size
  const viewedRaw = viewedProposalIds.size
  const signedRaw = signedProposalIds.size

  const engagedProposalIds = new Set<string>()
  for (const view of views) {
    const proposalId = view?.proposal_id
    if (!proposalId || !viewedProposalIds.has(proposalId)) continue
    if ((view.duration_seconds ?? 0) >= engagedThresholdSeconds) {
      engagedProposalIds.add(proposalId)
    }
  }

  // Signed proposals are always considered engaged in the funnel.
  signedProposalIds.forEach((proposalId) => {
    engagedProposalIds.add(proposalId)
  })

  const viewedCount = Math.min(viewedRaw, sentCount)
  const engagedRaw = engagedProposalIds.size
  const engagedCount = Math.min(Math.max(engagedRaw, signedRaw), viewedCount)
  const signedCount = Math.min(signedRaw, engagedCount)

  const sentPercent = sentCount > 0 ? 100 : 0
  const viewedPercent = toPercent(viewedCount, sentCount)
  const engagedPercent = toPercent(engagedCount, sentCount)
  const signedPercent = toPercent(signedCount, sentCount)

  return {
    sentCount,
    viewedCount,
    engagedCount,
    signedCount,
    sentPercent,
    viewedPercent,
    engagedPercent,
    signedPercent,
    viewedFlex: Math.max(0.32, viewedPercent / 100),
    engagedFlex: Math.max(0.28, engagedPercent / 100),
    signedFlex: Math.max(0.22, signedPercent / 100),
  }
}
