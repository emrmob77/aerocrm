'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const { error: resetError } = await resetPassword(email)

    if (resetError) {
      setError('Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol edin.')
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-aero-green-100 dark:bg-aero-green-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-aero-green-500">mark_email_read</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-3">
            E-posta Gönderildi!
          </h2>
          <p className="text-[#48679d] dark:text-gray-400 mb-6">
            Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
            Lütfen gelen kutunuzu kontrol edin.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-[#f5f6f8] dark:bg-[#101722]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-primary text-4xl font-black tracking-tighter">AERO</h1>
          </Link>
          <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-2">
            Şifrenizi mi Unuttunuz?
          </h2>
          <p className="text-[#48679d] dark:text-gray-400">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#0d121c] dark:text-gray-200 text-base font-medium leading-normal">
              E-posta
            </label>
            <div className="flex w-full items-stretch rounded-lg shadow-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e-posta@adresiniz.com"
                className="flex w-full min-w-0 flex-1 rounded-l-lg text-[#0d121c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] h-14 placeholder:text-[#48679d]/50 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal transition-colors"
                required
              />
              <div className="text-[#48679d] flex border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                <span className="material-symbols-outlined">mail</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex h-14 items-center justify-center rounded-lg bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Gönderiliyor...
              </span>
            ) : (
              'Şifre Sıfırlama Linki Gönder'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link href="/login" className="text-primary font-semibold hover:underline inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
