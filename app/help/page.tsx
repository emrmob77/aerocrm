import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export default function HelpPage() {
  const t = getServerT()

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#f5f7fb] dark:from-[#0b1018] dark:to-[#121a27]">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('helpPage.title')}</h1>
          <p className="text-sm text-[#48679d] dark:text-gray-400">
            {t('helpPage.subtitle')}
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/forgot-password"
            className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-5 hover:border-primary/40 transition-colors"
          >
            <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{t('helpPage.cards.forgotPassword.title')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">{t('helpPage.cards.forgotPassword.description')}</p>
          </Link>
          <Link
            href="/settings/security"
            className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-5 hover:border-primary/40 transition-colors"
          >
            <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{t('helpPage.cards.security.title')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">{t('helpPage.cards.security.description')}</p>
          </Link>
          <Link
            href="/terms"
            className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-5 hover:border-primary/40 transition-colors"
          >
            <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{t('helpPage.cards.terms.title')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">{t('helpPage.cards.terms.description')}</p>
          </Link>
          <Link
            href="/privacy"
            className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-5 hover:border-primary/40 transition-colors"
          >
            <h2 className="text-base font-bold text-[#0d121c] dark:text-white">{t('helpPage.cards.privacy.title')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">{t('helpPage.cards.privacy.description')}</p>
          </Link>
        </section>

        <Link href="/login" className="inline-flex px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
          {t('helpPage.actions.backLogin')}
        </Link>
      </div>
    </main>
  )
}
