'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

type PresenceUser = {
  user_id: string
  name?: string | null
}

export function useTeamPresence(teamId?: string | null, userId?: string | null, userName?: string | null) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [members, setMembers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!teamId || !userId) {
      setMembers([])
      return
    }

    const channel = supabase.channel(`team-presence-${teamId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    const syncMembers = () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>
      const next = Object.values(state).flat()
      setMembers(next)
    }

    channel.on('presence', { event: 'sync' }, syncMembers)
    channel.on('presence', { event: 'join' }, syncMembers)
    channel.on('presence', { event: 'leave' }, syncMembers)

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: userId, name: userName ?? null })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, teamId, userId, userName])

  return {
    members,
    count: members.length,
  }
}
