import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export default function NotFound() {
  const t = getServerT()
  return (
    <div className="min-h-screen flex items-center justify-center bg-aero-slate-50 dark:bg-aero-slate-900 p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Illustration */}
        <div className="text-8xl font-bold text-aero-blue-500/20">404</div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-aero-slate-900 dark:text-white">
            {t('notFound.title')}
          </h1>
          <p className="text-aero-slate-600 dark:text-aero-slate-400">
            {t('notFound.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary btn-md">
            {t('notFound.backHome')}
          </Link>
          <Link href="/dashboard" className="btn-secondary btn-md">
            {t('notFound.backDashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}
