'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const { t } = useI18n()
  const router = useRouter()
  const [authState, setAuthState] = useState<'authenticated' | 'unauthenticated'>('unauthenticated')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    const supabase = getSupabaseClient()

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return
      setAuthState(user ? 'authenticated' : 'unauthenticated')
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      if (session?.user) {
        setAuthState('authenticated')
        return
      }
      setAuthState((current) => (current === 'authenticated' ? 'authenticated' : 'unauthenticated'))
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleAccept = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/team/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || t('invite.errors.accept'))
        setIsSubmitting(false)
        return
      }
      toast.success(t('invite.success'))
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('invite.errors.accept'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
      <div className="max-w-md w-full bg-white border border-[#e7ebf4] rounded-2xl shadow-lg p-8 text-center space-y-4">
        <div className="mx-auto size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">group_add</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#0d121c]">{t('invite.title')}</h1>
        <p className="text-sm text-[#48679d]">
          {t('invite.subtitle')}
        </p>

        {authState === 'authenticated' ? (
          <button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? t('invite.accepting') : t('invite.accept')}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t('invite.loginPrompt')}</p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invite/${params.token}`)}`}
              className="inline-flex w-full justify-center h-11 items-center rounded-lg border border-[#e7ebf4] text-sm font-bold text-[#0d121c] hover:bg-gray-50"
            >
              {t('invite.login')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
