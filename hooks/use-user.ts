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

  useEffect(() => {
    let isMounted = true

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

    const loadProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
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
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [authLoading, authUser, setUser, supabase])

  return {
    user,
    authUser,
    loading,
    isAuthenticated: !!authUser,
  }
}
