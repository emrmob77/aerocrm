'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useUser } from '@/hooks'

export default function ProfileSettingsPage() {
  const { t } = useI18n()
  const { user, authUser, loading } = useUser()

  const fullName =
    user?.full_name ||
    (typeof authUser?.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : null) ||
    '-'
  const email = user?.email || authUser?.email || '-'
  const role = user?.role || '-'
  const teamId = user?.team_id || '-'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
            {t('settings.sections.profile.title')}
          </h1>
          <p className="text-[#48679d] dark:text-gray-400">
            {t('settings.sections.profile.description')}
          </p>
        </div>
        <Link
          href="/settings"
          className="px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg text-sm font-semibold text-[#48679d] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t('profileSettings.actions.backSettings')}
        </Link>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        {loading ? (
          <p className="text-sm text-[#48679d] dark:text-gray-400">{t('common.loading')}</p>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('profileSettings.fields.fullName')}</dt>
              <dd className="mt-1 text-sm font-semibold text-[#0d121c] dark:text-white">{fullName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('profileSettings.fields.email')}</dt>
              <dd className="mt-1 text-sm font-semibold text-[#0d121c] dark:text-white">{email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('profileSettings.fields.role')}</dt>
              <dd className="mt-1 text-sm font-semibold text-[#0d121c] dark:text-white">{role}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('profileSettings.fields.teamId')}</dt>
              <dd className="mt-1 text-sm font-semibold text-[#0d121c] dark:text-white break-all">{teamId}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 flex flex-wrap gap-3">
        <Link
          href="/settings/team"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t('profileSettings.actions.openTeam')}
        </Link>
        <Link
          href="/settings/security"
          className="px-4 py-2 rounded-lg border border-[#ced8e9] dark:border-gray-700 text-sm font-semibold text-[#48679d] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t('profileSettings.actions.openSecurity')}
        </Link>
      </div>
    </div>
  )
}
