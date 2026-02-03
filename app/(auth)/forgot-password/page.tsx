'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { resetPassword, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(t('auth.forgot.error'))
      setIsLoading(false)
    } else {
      setEmailSent(true)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Email sent success state
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-aero-slate-50 dark:bg-aero-slate-900">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-aero-green-100 dark:bg-aero-green-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-aero-green-500">mark_email_read</span>
          </div>
          <h2 className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-4">
            {t('auth.forgot.emailSentTitle')}
          </h2>
          <p className="text-aero-slate-600 dark:text-aero-slate-400 mb-8">
            {t('auth.forgot.emailSentBody', { email })}
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('auth.forgot.backToLogin')}
            </Link>
            <p className="text-sm text-aero-slate-500">
              {t('auth.forgot.noEmail')}{' '}
              <button
                onClick={() => {
                  setEmailSent(false)
                  setIsLoading(false)
                }}
                className="text-primary hover:underline"
              >
                {t('auth.forgot.resend')}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-aero-slate-50 dark:bg-aero-slate-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="ml-3 font-bold text-2xl text-aero-slate-900 dark:text-white">AERO</span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-aero-slate-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-aero-blue-500">lock_reset</span>
            </div>
            <h2 className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-2">
              {t('auth.forgot.title')}
            </h2>
            <p className="text-aero-slate-500 dark:text-aero-slate-400 text-sm">
              {t('auth.forgot.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-aero-red-50 dark:bg-aero-red-900/20 border border-aero-red-200 dark:border-aero-red-800 rounded-lg">
              <p className="text-sm text-aero-red-600 dark:text-aero-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 mb-1.5">
                {t('auth.email')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-aero-slate-400">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="input pl-12"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary btn-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.forgot.submitting')}
                </span>
              ) : (
                t('auth.forgot.submit')
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-aero-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t('auth.forgot.backLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
