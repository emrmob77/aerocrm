'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const email = searchParams.get('email')?.trim()

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-aero-slate-50 dark:bg-aero-slate-900">
      <div className="w-full max-w-xl rounded-2xl border border-aero-slate-200 dark:border-aero-slate-800 bg-white dark:bg-aero-slate-950 shadow-xl p-8 md:p-10">
        <div className="w-16 h-16 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl text-aero-blue-600 dark:text-aero-blue-300">mark_email_unread</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-aero-slate-900 dark:text-white">
          {t('auth.verifyPage.title')}
        </h1>
        <p className="mt-3 text-aero-slate-600 dark:text-aero-slate-300">
          {t('auth.verifyPage.subtitle')}
        </p>

        {email && (
          <div className="mt-5 rounded-lg border border-aero-slate-200 dark:border-aero-slate-800 bg-aero-slate-50 dark:bg-aero-slate-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-aero-slate-500 dark:text-aero-slate-400">
              {t('auth.verifyPage.emailLabel')}
            </p>
            <p className="mt-1 text-sm font-semibold text-aero-slate-900 dark:text-white">{email}</p>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-aero-slate-200 dark:border-aero-slate-800 p-4">
          <p className="text-sm font-semibold text-aero-slate-900 dark:text-white">
            {t('auth.verifyPage.checklistTitle')}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-aero-slate-600 dark:text-aero-slate-300">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base mt-0.5 text-aero-green-600 dark:text-aero-green-400">check_circle</span>
              <span>{t('auth.verifyPage.stepInbox')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base mt-0.5 text-aero-green-600 dark:text-aero-green-400">check_circle</span>
              <span>{t('auth.verifyPage.stepSpam')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base mt-0.5 text-aero-green-600 dark:text-aero-green-400">check_circle</span>
              <span>{t('auth.verifyPage.stepLink')}</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('auth.verifyPage.backToLogin')}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-aero-slate-200 dark:border-aero-slate-700 text-aero-slate-700 dark:text-aero-slate-200 font-semibold hover:border-primary/40 hover:text-primary transition-colors"
          >
            {t('auth.verifyPage.backToRegister')}
          </Link>
        </div>
      </div>
    </div>
  )
}
