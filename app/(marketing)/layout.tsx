import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { MarketingLocaleSwitch } from '@/components/marketing/MarketingLocaleSwitch'
import { MarketingFunnelTracker } from '@/components/marketing/MarketingFunnelTracker'

export const dynamic = 'force-dynamic'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)
  const isTr = locale === 'tr'

  const navLinks = [
    { href: '/features', label: copy.nav.features },
    { href: '/pricing', label: copy.nav.pricing },
    { href: '/platform/integrations', label: copy.nav.integrations },
    { href: '/security', label: copy.nav.security },
    { href: '/faq', label: copy.nav.faq },
    { href: '/contact', label: copy.nav.contact },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-aero-slate-50 to-white text-aero-slate-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_52%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_42%)]" />

      <header className="sticky top-0 z-40 border-b border-aero-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="mr-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-sm font-bold text-white shadow-md">
              A
            </div>
            <div>
              <p className="text-sm font-extrabold leading-none">AERO CRM</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-funnel-event={`nav_${link.href.replace(/\//g, '_').replace(/^_+/, '') || 'home'}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-aero-slate-600 transition hover:bg-aero-slate-100 hover:text-aero-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <MarketingLocaleSwitch />
            <Link href="/login" data-funnel-event="nav_login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-aero-slate-600 hover:text-aero-slate-900 sm:inline-flex">
              {copy.nav.login}
            </Link>
            <Link href="/register" data-funnel-event="nav_register" className="inline-flex rounded-lg bg-aero-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-aero-blue-600">
              {copy.nav.start}
            </Link>
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-aero-slate-200/70 px-4 py-2 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-funnel-event={`mobile_nav_${link.href.replace(/\//g, '_').replace(/^_+/, '') || 'home'}`}
              className="shrink-0 rounded-full border border-aero-slate-200 px-3 py-1 text-xs font-semibold text-aero-slate-600 transition hover:border-aero-blue-200 hover:text-aero-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <MarketingFunnelTracker />
      <main>{children}</main>

      <footer className="border-t border-aero-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div className="space-y-2">
            <p className="text-sm font-black">AERO CRM</p>
            <p className="text-sm text-aero-slate-500">{copy.home.socialProof}</p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-aero-slate-900">{copy.footer.product}</p>
            <Link href="/features" className="block text-aero-slate-500 hover:text-aero-slate-900">{copy.nav.features}</Link>
            <Link href="/pricing" className="block text-aero-slate-500 hover:text-aero-slate-900">{copy.nav.pricing}</Link>
            <Link href="/platform/integrations" className="block text-aero-slate-500 hover:text-aero-slate-900">{copy.nav.integrations}</Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-aero-slate-900">{copy.footer.company}</p>
            <Link href="/contact" className="block text-aero-slate-500 hover:text-aero-slate-900">{copy.nav.contact}</Link>
            <Link href="/help" className="block text-aero-slate-500 hover:text-aero-slate-900">{isTr ? 'Yardım' : 'Help'}</Link>
            <Link href="/book-demo" className="block text-aero-slate-500 hover:text-aero-slate-900">{copy.footer.cta}</Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-aero-slate-900">{copy.footer.legal}</p>
            <Link href="/terms" className="block text-aero-slate-500 hover:text-aero-slate-900">{isTr ? 'Koşullar' : 'Terms'}</Link>
            <Link href="/privacy" className="block text-aero-slate-500 hover:text-aero-slate-900">{isTr ? 'Gizlilik' : 'Privacy'}</Link>
          </div>
        </div>

        <div className="border-t border-aero-slate-200 px-4 py-4 text-center text-xs text-aero-slate-500 md:px-6">
          {copy.footer.copyright}
        </div>
      </footer>
    </div>
  )
}
