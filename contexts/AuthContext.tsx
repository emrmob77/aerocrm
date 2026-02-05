'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { clearAuthPersistence, getSupabaseClient, setAuthStorageMode } from '@/lib/supabase/client'
import { validateSignInCredentials, validateSignUpCredentials } from '@/lib/auth/credentials'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string, plan?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  signInWithGoogle: (rememberMe?: boolean) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const toAuthError = (message: string) => ({ name: 'AuthError', message, status: 400 } as AuthError)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          router.refresh()
        }
        if (event === 'SIGNED_OUT') {
          router.push('/login')
          router.refresh()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = useCallback(async (email: string, password: string, rememberMe = false) => {
    const validation = validateSignInCredentials(email, password)
    if (!validation.ok) {
      return { error: toAuthError('Invalid login credentials') }
    }

    try {
      setAuthStorageMode(rememberMe ? 'persistent' : 'session')
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.normalizedEmail,
        password,
      })

      if (!error && rememberMe) {
        // Supabase handles session persistence automatically
        // rememberMe is handled by default session duration
      }

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, fullName: string, plan = 'solo') => {
    const validation = validateSignUpCredentials(email, password, fullName)
    if (!validation.ok) {
      return { error: toAuthError('Invalid sign up credentials') }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: validation.normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: plan,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      // Profile will be created via auth callback or database trigger
      // The auth callback route handles profile creation for all auth methods

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    clearAuthPersistence()
    await supabase.auth.signOut()
  }, [supabase])

  const signInWithGoogle = useCallback(async (rememberMe = true) => {
    try {
      setAuthStorageMode(rememberMe ? 'persistent' : 'session')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }, [supabase])

  const resetPassword = useCallback(async (email: string) => {
    const validation = validateSignInCredentials(email, '000000')
    if (!validation.ok) {
      return { error: toAuthError('Invalid email') }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(validation.normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }, [supabase])

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }, [supabase])

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
