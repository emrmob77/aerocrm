'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useUser } from '@/hooks'

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { authUser, loading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        toast.error(payload?.error || 'Davet kabul edilemedi.')
        setIsSubmitting(false)
        return
      }
      toast.success('Takıma katıldınız.')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Davet kabul edilemedi.')
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
        <h1 className="text-2xl font-extrabold text-[#0d121c]">Takım Daveti</h1>
        <p className="text-sm text-[#48679d]">
          AERO CRM takımına katılmak için daveti onaylayın.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Kontrol ediliyor...</p>
        ) : authUser ? (
          <button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? 'Onaylanıyor' : 'Daveti Kabul Et'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Devam etmek için giriş yapın.</p>
            <Link
              href="/login"
              className="inline-flex w-full justify-center h-11 items-center rounded-lg border border-[#e7ebf4] text-sm font-bold text-[#0d121c] hover:bg-gray-50"
            >
              Giriş Yap
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
