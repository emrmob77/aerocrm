'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

type DashboardAutoRefreshProps = {
  teamId: string | null
  userId: string | null
}

export function DashboardAutoRefresh({ teamId, userId }: DashboardAutoRefreshProps) {
  const router = useRouter()
  const supabase = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    if (!teamId && !userId) return

    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
      refreshTimer = setTimeout(() => {
        router.refresh()
      }, 350)
    }

    const dealsFilter = teamId ? `team_id=eq.${teamId}` : `user_id=eq.${userId}`
    const activitiesFilter = teamId ? `team_id=eq.${teamId}` : `user_id=eq.${userId}`

    const channel = supabase
      .channel(`dashboard-refresh-${teamId ?? userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals', filter: dealsFilter },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities', filter: activitiesFilter },
        scheduleRefresh
      )
      .subscribe()

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
      supabase.removeChannel(channel)
    }
  }, [router, supabase, teamId, userId])

  return null
}
