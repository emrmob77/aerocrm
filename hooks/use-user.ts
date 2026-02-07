'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'
import { useAppStore } from '@/store'
import type { User } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function useUser() {
  const supabase = useSupabase()
  const { user: authUser, loading: authLoading } = useAuth()
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const hasMatchingProfile = !!authUser && !!user && user.id === authUser.id
  const resolvedUser = hasMatchingProfile ? user : null

  useEffect(() => {
    let isMounted = true
    let profileChannel: ReturnType<typeof supabase.channel> | null = null

    if (authLoading) {
      setLoading(true)
      return () => {
        isMounted = false
      }
    }

    if (!authUser) {
      setUser(null)
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    if (user && user.id !== authUser.id) {
      // Prevent rendering stale profile data from a previous session/user.
      setUser(null)
    }

    const loadProfile = async (silent = false) => {
      if (!silent && isMounted) {
        setLoading(true)
      }

      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, role, team_id, avatar_url, language, allowed_screens, created_at, updated_at')
          .eq('id', authUser.id)
          .single()

        if (!isMounted) {
          return
        }

        if (profile) {
          setUser(profile as User)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error getting user:', error)
        }
      } finally {
        if (isMounted && !silent) {
          setLoading(false)
        }
      }
    }

    loadProfile(false)

    profileChannel = supabase
      .channel(`user-profile-${authUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${authUser.id}` }, () => {
        loadProfile(true)
      })
      .subscribe()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadProfile(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibility)
      if (profileChannel) {
        supabase.removeChannel(profileChannel)
      }
    }
  }, [authLoading, authUser, setUser, supabase, user])

  const isLoadingProfile = !!authUser && (!hasMatchingProfile || loading)
  const isLoading = authLoading || isLoadingProfile

  return {
    user: resolvedUser,
    authUser,
    loading: isLoading,
    isAuthenticated: !!authUser,
  }
}
