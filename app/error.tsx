'use client'

import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useI18n()
  useEffect(() => {
    // Hata loglaması yapılabilir
    console.error('Application error:', error)
    const context = {
      digest: error.digest,
      stack: error.stack,
      href: typeof window !== 'undefined' ? window.location.href : undefined,
    }
    fetch('/api/monitoring/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message: error.message || t('errorPage.unknown'),
        source: 'app/error',
        context,
      }),
    }).catch(() => undefined)
  }, [error, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-aero-slate-50 dark:bg-aero-slate-900 p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto bg-aero-red-100 dark:bg-aero-red-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-aero-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-aero-slate-900 dark:text-white">
            {t('errorPage.title')}
          </h1>
          <p className="text-aero-slate-600 dark:text-aero-slate-400">
            {t('errorPage.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary btn-md"
          >
            {t('errorPage.retry')}
          </button>
          <a
            href="/"
            className="btn-secondary btn-md"
          >
            {t('errorPage.backHome')}
          </a>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-aero-slate-500 cursor-pointer hover:text-aero-slate-700">
              {t('errorPage.details')}
            </summary>
            <pre className="mt-2 p-4 bg-aero-slate-100 dark:bg-aero-slate-800 rounded-lg text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
