import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export default function HomePage() {
  const t = getServerT()
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-aero-blue-600">A</span>
          </div>
          <h1 className="text-4xl font-bold text-white">AERO CRM</h1>
        </div>

        {/* Tagline */}
        <p className="text-xl text-aero-blue-100">
          {t('landing.tagline')}
        </p>

        <p className="text-aero-blue-200 text-lg">
          {t('landing.description')}
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-semibold text-white">{t('landing.features.fastProposal.title')}</h3>
            <p className="text-sm text-aero-blue-200">{t('landing.features.fastProposal.description')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white">{t('landing.features.kanban.title')}</h3>
            <p className="text-sm text-aero-blue-200">{t('landing.features.kanban.description')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">👁️</div>
            <h3 className="font-semibold text-white">{t('landing.features.spyglass.title')}</h3>
            <p className="text-sm text-aero-blue-200">{t('landing.features.spyglass.description')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">🔗</div>
            <h3 className="font-semibold text-white">{t('landing.features.integrations.title')}</h3>
            <p className="text-sm text-aero-blue-200">{t('landing.features.integrations.description')}</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="btn btn-lg bg-white text-aero-blue-600 hover:bg-aero-blue-50 shadow-lg"
          >
            {t('landing.cta.login')}
          </Link>
          <Link
            href="/register"
            className="btn btn-lg border-2 border-white text-white hover:bg-white/10"
          >
            {t('landing.cta.start')}
          </Link>
        </div>

        {/* Footer */}
        <p className="text-aero-blue-300 text-sm mt-12">
          {t('landing.footer')}
        </p>
      </div>
    </div>
  )
}
