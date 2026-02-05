'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks'
import { useI18n } from '@/lib/i18n'

export default function SecuritySettingsPage() {
  const { t } = useI18n()
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch {
      toast.error(t('securitySettings.errors.signOutFailed'))
      setIsSigningOut(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
            {t('settings.sections.security.title')}
          </h1>
          <p className="text-[#48679d] dark:text-gray-400">
            {t('settings.sections.security.description')}
          </p>
        </div>
        <Link
          href="/settings"
          className="px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg text-sm font-semibold text-[#48679d] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t('securitySettings.actions.backSettings')}
        </Link>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{t('securitySettings.cards.password.title')}</h2>
          <p className="text-sm text-[#48679d] dark:text-gray-400">
            {t('securitySettings.cards.password.description')}
          </p>
        </div>
        <Link
          href="/reset-password"
          className="inline-flex px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t('securitySettings.cards.password.action')}
        </Link>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{t('securitySettings.cards.session.title')}</h2>
          <p className="text-sm text-[#48679d] dark:text-gray-400">
            {t('securitySettings.cards.session.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
          {isSigningOut ? t('securitySettings.cards.session.signingOut') : t('securitySettings.cards.session.signOut')}
        </button>
      </div>
    </div>
  )
}
