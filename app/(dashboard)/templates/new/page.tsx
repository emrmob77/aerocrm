'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

export default function NewTemplatePage() {
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    router.replace('/proposals/new?mode=template')
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined text-3xl text-primary">auto_awesome</span>
        <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{t('common.loading')}</p>
        <p className="text-xs text-[#48679d] dark:text-gray-400">{t('templatesNew.subtitle')}</p>
      </div>
    </div>
  )
}
