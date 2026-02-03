'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSupabase, useUser } from '@/hooks'
import { formatCurrency, normalizeStage } from '@/components/deals/stage-utils'
import { useI18n } from '@/lib/i18n'

type MemberRow = {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
}

type InviteRow = {
  id: string
  email: string
  role: string
  status: string
  token: string
  created_at: string
  expires_at: string | null
}

type DealRow = {
  id: string
  title: string
  value: number
  stage: string
  user_id: string
  contactName: string
}

const getInitials = (value: string) => {
  const parts = value.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '??'
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const isInviteExpired = (invite: InviteRow) => {
  if (!invite.expires_at) return false
  return new Date(invite.expires_at).getTime() < Date.now()
}

export default function TeamSettingsPage() {
  const supabase = useSupabase()
  const { user, authUser, loading: authLoading } = useUser()
  const { t, locale } = useI18n()
  const currencyLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const currencyCode = locale === 'en' ? 'USD' : 'TRY'
  const formatMoney = (value: number) => formatCurrency(value, currencyLocale, currencyCode)

  const roleOptions = useMemo(
    () => [
      { id: 'owner', label: t('teamSettings.roles.owner') },
      { id: 'admin', label: t('teamSettings.roles.admin') },
      { id: 'member', label: t('teamSettings.roles.member') },
      { id: 'viewer', label: t('teamSettings.roles.viewer') },
    ],
    [t]
  )

  const roleLabelMap = useMemo(
    () =>
      roleOptions.reduce<Record<string, string>>((acc, role) => {
        acc[role.id] = role.label
        return acc
      }, {}),
    [roleOptions]
  )

  const [members, setMembers] = useState<MemberRow[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [deals, setDeals] = useState<DealRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isInviting, setIsInviting] = useState(false)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null)
  const [assignDealId, setAssignDealId] = useState('')
  const [assignOwnerId, setAssignOwnerId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return
      if (!authUser || !user?.team_id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      const [membersResponse, invitesResponse, dealsResponse] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, email, role, avatar_url')
          .eq('team_id', user.team_id)
          .order('created_at', { ascending: true }),
        fetch('/api/team/invites').then((response) => response.json().catch(() => null)),
        supabase
          .from('deals')
          .select('id, title, value, stage, user_id, contact:contacts(full_name)')
          .eq('team_id', user.team_id)
          .order('updated_at', { ascending: false }),
      ])

      const membersData = membersResponse.data ?? []
      setMembers(
        membersData.map((member) => ({
          id: member.id,
          name: member.full_name,
          email: member.email,
          role: member.role,
          avatar: member.avatar_url ?? null,
        }))
      )

      const invitesData = (invitesResponse?.invites ?? []) as InviteRow[]
      setInvites(invitesData)

      const dealsData = dealsResponse.data ?? []
      setDeals(
        dealsData.map((deal) => ({
          id: deal.id,
          title: deal.title,
          value: deal.value ?? 0,
          stage: deal.stage,
          user_id: deal.user_id,
          contactName: (deal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback'),
        }))
      )

      const openDeals = dealsData.filter((deal) => {
        const stage = normalizeStage(deal.stage)
        return stage !== 'won' && stage !== 'lost'
      })
      if (!assignDealId && openDeals.length > 0) {
        setAssignDealId(openDeals[0].id)
      }
      if (!assignOwnerId && membersData.length > 0) {
        setAssignOwnerId(membersData[0].id)
      }

      setIsLoading(false)
    }

    loadData()
  }, [authLoading, authUser, supabase, user?.team_id, t])

  const pendingInvites = invites.filter((invite) => invite.status === 'pending' && !isInviteExpired(invite))
  const expiredInvites = invites.filter((invite) => invite.status === 'pending' && isInviteExpired(invite))

  const tableRows = useMemo(() => {
    const memberRows = members.map((member) => ({
      id: member.id,
      type: 'member' as const,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar,
      status: 'active' as const,
    }))

    const inviteRows = invites
      .filter((invite) => invite.status !== 'accepted')
      .map((invite) => ({
        id: invite.id,
        type: 'invite' as const,
        name: invite.email.split('@')[0] || t('teamSettings.inviteFallback'),
        email: invite.email,
        role: invite.role,
        status: isInviteExpired(invite) ? 'expired' : invite.status,
        token: invite.token,
        createdAt: invite.created_at,
        expiresAt: invite.expires_at,
      }))

    const allRows = [...memberRows, ...inviteRows]
    const query = searchQuery.trim().toLowerCase()
    if (!query) return allRows

    return allRows.filter((row) => row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query))
  }, [members, invites, searchQuery, t])

  const performanceRows = useMemo(() => {
    const map = new Map(
      members.map((member) => [
        member.id,
        {
          id: member.id,
          name: member.name,
          role: member.role,
          deals: 0,
          pipeline: 0,
          won: 0,
          closed: 0,
        },
      ])
    )

    deals.forEach((deal) => {
      const owner = map.get(deal.user_id)
      if (!owner) return
      const stage = normalizeStage(deal.stage)
      owner.deals += 1
      if (stage === 'won') {
        owner.won += 1
        owner.closed += 1
      } else if (stage === 'lost') {
        owner.closed += 1
      } else {
        owner.pipeline += deal.value ?? 0
      }
    })

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      winRate: entry.closed > 0 ? Math.round((entry.won / entry.closed) * 100) : 0,
    }))
  }, [members, deals])

  const totalPipeline = performanceRows.reduce((sum, row) => sum + row.pipeline, 0)
  const totalDeals = performanceRows.reduce((sum, row) => sum + row.deals, 0)
  const totalWon = performanceRows.reduce((sum, row) => sum + row.won, 0)
  const totalClosed = performanceRows.reduce((sum, row) => sum + row.closed, 0)
  const teamWinRate = totalClosed > 0 ? Math.round((totalWon / totalClosed) * 100) : 0

  const assignableDeals = deals.filter((deal) => {
    const stage = normalizeStage(deal.stage)
    return stage !== 'won' && stage !== 'lost'
  })

  const handleInvite = async () => {
    if (isInviting) return
    if (!inviteEmail.trim()) {
      toast.error(t('teamSettings.errors.emailRequired'))
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/team/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(t('teamSettings.errors.inviteFailed'))
        setIsInviting(false)
        return
      }

      const invite = payload?.invite as InviteRow
      const inviteLink = payload?.inviteLink as string | undefined
      setInvites((prev) => [invite, ...prev])
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteModal(false)

      if (inviteLink && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink)
        toast.success(t('teamSettings.success.inviteSentCopied'))
      } else {
        toast.success(t('teamSettings.success.inviteSent'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('teamSettings.errors.inviteFailed'))
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, nextRole: string) => {
    if (updatingMemberId) return
    setUpdatingMemberId(memberId)
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(t('teamSettings.errors.roleUpdateFailed'))
        setUpdatingMemberId(null)
        return
      }
      const updated = payload?.member as { id: string; role: string }
      setMembers((prev) => prev.map((member) => (member.id === updated.id ? { ...member, role: updated.role } : member)))
      toast.success(t('teamSettings.success.roleUpdated'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('teamSettings.errors.roleUpdateFailed'))
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (removingMemberId) return
    setRemovingMemberId(memberId)
    try {
      const response = await fetch(`/api/team/members/${memberId}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(t('teamSettings.errors.memberRemoveFailed'))
        setRemovingMemberId(null)
        return
      }
      setMembers((prev) => prev.filter((member) => member.id !== memberId))
      toast.success(t('teamSettings.success.memberRemoved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('teamSettings.errors.memberRemoveFailed'))
    } finally {
      setRemovingMemberId(null)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    if (resendingInviteId) return
    setResendingInviteId(inviteId)
    try {
      const response = await fetch(`/api/team/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(t('teamSettings.errors.inviteRenewFailed'))
        setResendingInviteId(null)
        return
      }
      const updated = payload?.invite as InviteRow
      const inviteLink = payload?.inviteLink as string | undefined
      setInvites((prev) => prev.map((invite) => (invite.id === updated.id ? updated : invite)))

      if (inviteLink && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink)
        toast.success(t('teamSettings.success.inviteRenewedCopied'))
      } else {
        toast.success(t('teamSettings.success.inviteRenewed'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('teamSettings.errors.inviteRenewFailed'))
    } finally {
      setResendingInviteId(null)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (revokingInviteId) return
    setRevokingInviteId(inviteId)
    try {
      const response = await fetch(`/api/team/invites/${inviteId}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(t('teamSettings.errors.inviteRevokeFailed'))
        setRevokingInviteId(null)
        return
      }
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
      toast.success(t('teamSettings.success.inviteRevoked'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('teamSettings.errors.inviteRevokeFailed'))
    } finally {
      setRevokingInviteId(null)
    }
  }

  const handleAssignDeal = async () => {
    if (isAssigning || !assignDealId || !assignOwnerId) return
    setIsAssigning(true)
    try {
      const response = await fetch('/api/deals/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: assignDealId, ownerId: assignOwnerId }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(t('teamSettings.errors.assignFailed'))
        setIsAssigning(false)
        return
      }
      const updated = payload?.deal as { id: string; user_id: string }
      setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? { ...deal, user_id: updated.user_id } : deal)))
      toast.success(t('teamSettings.success.dealAssigned'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('teamSettings.errors.assignFailed'))
    } finally {
      setIsAssigning(false)
    }
  }

  if (!authLoading && (!authUser || !user?.team_id)) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white">{t('teamSettings.title')}</h1>
        <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <p className="text-sm text-[#48679d]">{t('teamSettings.emptyTeam')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-8">
      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link href="/settings" className="text-[#48679d] dark:text-gray-400 hover:text-primary">{t('settings.title')}</Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-primary">{t('teamSettings.title')}</span>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">{t('teamSettings.title')}</h1>
            <p className="text-[#48679d] dark:text-gray-400">{t('teamSettings.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            {t('teamSettings.inviteMember')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">group</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">{t('teamSettings.stats.totalMembers')}</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{members.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">{t('teamSettings.stats.openInvites')}</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{pendingInvites.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <span className="material-symbols-outlined text-amber-600">schedule</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">{t('teamSettings.stats.expiredInvites')}</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{expiredInvites.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <span className="material-symbols-outlined text-blue-600">bar_chart</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">{t('teamSettings.stats.winRate')}</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">%{teamWinRate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-700">
              <h3 className="font-bold text-[#0d121c] dark:text-white">{t('teamSettings.performance.title')}</h3>
              <p className="text-sm text-[#48679d]">
                {t('teamSettings.performance.summary', { deals: totalDeals, value: formatMoney(totalPipeline) })}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-[#48679d] dark:text-gray-400 border-b border-[#e7ebf4] dark:border-gray-700">
                    <th className="px-6 py-4 font-semibold">{t('teamSettings.performance.columns.member')}</th>
                    <th className="px-6 py-4 font-semibold">{t('teamSettings.performance.columns.deals')}</th>
                    <th className="px-6 py-4 font-semibold">{t('teamSettings.performance.columns.pipeline')}</th>
                    <th className="px-6 py-4 font-semibold">{t('teamSettings.performance.columns.won')}</th>
                    <th className="px-6 py-4 font-semibold">{t('teamSettings.performance.columns.winRate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
                  {performanceRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0d121c] dark:text-white">{row.name}</span>
                          <span className="text-xs text-[#48679d]">
                            {roleLabelMap[row.role] ?? t('teamSettings.roles.member')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#0d121c] dark:text-white">{row.deals}</td>
                      <td className="px-6 py-4 text-sm text-[#0d121c] dark:text-white">{formatMoney(row.pipeline)}</td>
                      <td className="px-6 py-4 text-sm text-[#0d121c] dark:text-white">{row.won}</td>
                      <td className="px-6 py-4 text-sm text-[#0d121c] dark:text-white">%{row.winRate}</td>
                    </tr>
                  ))}
                  {performanceRows.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-[#48679d]" colSpan={5}>
                        {t('teamSettings.performance.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-bold text-[#0d121c] dark:text-white">{t('teamSettings.assign.title')}</h3>
              <p className="text-sm text-[#48679d]">{t('teamSettings.assign.description')}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#48679d] mb-1">{t('teamSettings.assign.dealLabel')}</label>
                <select
                  value={assignDealId}
                  onChange={(event) => setAssignDealId(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
                >
                  {assignableDeals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title} • {deal.contactName} • {formatMoney(deal.value)}
                    </option>
                  ))}
                  {assignableDeals.length === 0 && <option value="">{t('teamSettings.assign.noDeals')}</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#48679d] mb-1">{t('teamSettings.assign.ownerLabel')}</label>
                <select
                  value={assignOwnerId}
                  onChange={(event) => setAssignOwnerId(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                  {members.length === 0 && <option value="">{t('teamSettings.assign.noMembers')}</option>}
                </select>
              </div>
              <button
                onClick={handleAssignDeal}
                disabled={isAssigning || assignableDeals.length === 0 || members.length === 0}
                className="w-full h-10 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {isAssigning ? t('teamSettings.assign.assigning') : t('teamSettings.assign.assign')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-[#0d121c] dark:text-white">{t('teamSettings.list.title')}</h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('teamSettings.list.searchPlaceholder')}
                className="pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 w-72"
              />
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-[#48679d] dark:text-gray-400 border-b border-[#e7ebf4] dark:border-gray-700">
                <th className="px-6 py-4 font-semibold">{t('teamSettings.list.columns.member')}</th>
                <th className="px-6 py-4 font-semibold">{t('teamSettings.list.columns.role')}</th>
                <th className="px-6 py-4 font-semibold">{t('teamSettings.list.columns.status')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('teamSettings.list.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
              {tableRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(row.name)}
                      </div>
                      <div>
                        <p className="font-bold text-[#0d121c] dark:text-white">{row.name}</p>
                        <p className="text-sm text-[#48679d]">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {row.type === 'member' ? (
                      row.role === 'owner' ? (
                        <span className="text-sm font-semibold text-[#48679d]">
                          {roleLabelMap[row.role] ?? t('teamSettings.roles.owner')}
                        </span>
                      ) : (
                        <select
                          value={row.role}
                          onChange={(event) => handleRoleChange(row.id, event.target.value)}
                          disabled={updatingMemberId === row.id}
                          className="text-sm bg-gray-50 dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                        >
                          {roleOptions
                            .filter((role) => role.id !== 'owner')
                            .map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.label}
                              </option>
                            ))}
                        </select>
                      )
                    ) : (
                      <span className="text-sm font-semibold text-[#48679d]">
                        {roleLabelMap[row.role] ?? t('teamSettings.roles.member')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {row.type === 'member' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {t('teamSettings.status.active')}
                      </span>
                    ) : row.status === 'expired' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {t('teamSettings.status.expired')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {t('teamSettings.status.pending')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {row.type === 'invite' && (
                        <button
                          onClick={() => handleResendInvite(row.id)}
                          disabled={resendingInviteId === row.id}
                          className="text-primary hover:underline text-sm font-bold disabled:opacity-60"
                        >
                          {resendingInviteId === row.id ? t('teamSettings.actions.sending') : t('teamSettings.actions.resend')}
                        </button>
                      )}
                      {row.type === 'invite' && (
                        <button
                          onClick={() => handleRevokeInvite(row.id)}
                          disabled={revokingInviteId === row.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      )}
                      {row.type === 'member' && row.role !== 'owner' && row.id !== authUser?.id && (
                        <button
                          onClick={() => handleRemoveMember(row.id)}
                          disabled={removingMemberId === row.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-xl">person_remove</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && !isLoading && (
                <tr>
                  <td className="px-6 py-6 text-sm text-[#48679d]" colSpan={4}>
                    {t('teamSettings.list.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('teamSettings.modal.title')}</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#0d121c] dark:text-white">
                    {t('teamSettings.modal.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder={t('teamSettings.modal.emailPlaceholder')}
                    className="w-full px-4 py-2.5 border border-[#e7ebf4] dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#0d121c] dark:text-white">
                    {t('teamSettings.modal.roleLabel')}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e7ebf4] dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900"
                  >
                    {roleOptions.filter((role) => role.id !== 'owner').map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-[#48679d] hover:text-[#0d121c] text-sm font-bold transition-colors"
                >
                  {t('teamSettings.modal.cancel')}
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isInviting}
                  className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {isInviting ? t('teamSettings.modal.sendingInvite') : t('teamSettings.modal.sendInvite')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
