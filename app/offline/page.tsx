import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export default function OfflinePage() {
  const t = getServerT()

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-6">
      <section className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-sm text-center">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">AERO CRM</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('common.offlineTitle')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          {t('common.offlineSubtitle')}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          {t('common.tryAgain')}
        </Link>
      </section>
    </main>
  )
}
