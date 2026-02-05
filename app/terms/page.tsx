import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export default function TermsPage() {
  const t = getServerT()

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#f5f7fb] dark:from-[#0b1018] dark:to-[#121a27]">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('termsPage.title')}</h1>
          <p className="text-sm text-[#48679d] dark:text-gray-400">
            {t('termsPage.subtitle')}
          </p>
        </div>

        <section className="bg-white dark:bg-[#161e2b] border border-[#e7ebf4] dark:border-gray-800 rounded-xl p-6 space-y-4 text-sm text-[#0d121c] dark:text-gray-100">
          <p>
            {t('termsPage.items.first')}
          </p>
          <p>
            {t('termsPage.items.second')}
          </p>
          <p>
            {t('termsPage.items.third')}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
            {t('termsPage.actions.backRegister')}
          </Link>
          <Link
            href="/privacy"
            className="px-4 py-2 rounded-lg border border-[#ced8e9] dark:border-gray-700 text-sm font-semibold text-[#48679d] dark:text-gray-300"
          >
            {t('termsPage.actions.privacy')}
          </Link>
        </div>
      </div>
    </main>
  )
}
