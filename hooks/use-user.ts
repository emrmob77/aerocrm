'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'
import { useAppStore } from '@/store'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

export function useUser() {
  const supabase = useSupabase()
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setAuthUser(authUser)
        
        if (authUser) {
          // Fetch user profile from users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()
          
          if (profile) {
            setUser(profile as User)
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setUser(profile as User)
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setUser])

  return {
    user,
    authUser,
    loading,
    isAuthenticated: !!authUser,
  }
}
