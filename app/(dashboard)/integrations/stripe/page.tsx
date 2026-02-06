'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type IntegrationData = {
  id?: string
  status: string
  credentials?: {
    secret_key: string
    webhook_secret?: string
  }
  connected_at?: string
  last_used_at?: string
  last_error?: string
}

export default function StripeSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [integration, setIntegration] = useState<IntegrationData | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  useEffect(() => {
    const fetchIntegration = async () => {
      try {
        const response = await fetch('/api/integrations/stripe')
        const data = await response.json()

        if (data.integration) {
          setIntegration(data.integration)
          if (data.integration.credentials) {
            setSecretKey(data.integration.credentials.secret_key || '')
            setWebhookSecret(data.integration.credentials.webhook_secret || '')
          }
        }
      } catch {
        showToast('error', 'Entegrasyon bilgileri yuklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    fetchIntegration()
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/integrations/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret_key: secretKey,
          webhook_secret: webhookSecret || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data.error || 'Kaydetme basarisiz oldu.')
        return
      }

      showToast('success', `Stripe baglantisi kuruldu${data.accountName ? ` (${data.accountName})` : ''}.`)
      setIntegration({
        id: data.integration?.id,
        status: 'connected',
        connected_at: data.integration?.connected_at,
      })
    } catch {
      showToast('error', 'Baglanti hatasi olustu.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setTesting(true)

    try {
      const response = await fetch('/api/integrations/stripe/test', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data.error || 'Test basarisiz oldu.')
        return
      }

      showToast('success', data.message || 'Stripe baglantisi dogrulandi.')
    } catch {
      showToast('error', 'Test sirasinda hata olustu.')
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Stripe baglantisini kaldirmak istediginizden emin misiniz?')) {
      return
    }

    setDisconnecting(true)

    try {
      const response = await fetch('/api/integrations/stripe', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        showToast('error', data.error || 'Baglanti kaldirilamadi.')
        return
      }

      showToast('success', 'Stripe baglantisi kaldirildi.')
      router.push('/integrations')
    } catch {
      showToast('error', 'Baglanti kaldirma sirasinda hata olustu.')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isConnected = integration?.status === 'connected'

  return (
    <div className="w-full py-2 lg:py-4">
      <main className="w-full max-w-3xl mx-auto">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.message}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/integrations" className="text-[#48679d] hover:text-primary transition-colors">
            Entegrasyonlar
          </Link>
          <span className="text-[#48679d]">/</span>
          <span className="text-[#0d121c] dark:text-white font-medium">Stripe</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-600 text-3xl">payments</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0d121c] dark:text-white">Stripe Odeme</h1>
                <p className="text-[#48679d] dark:text-slate-400 mt-1">
                  Abonelik ve faturalama islemlerinizi Stripe ile yonetin
                </p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Bagli</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">
              API Anahtarlari
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                  Secret Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="sk_live_... veya sk_test_..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48679d] hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showSecret ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                  Webhook Secret (opsiyonel)
                </label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="whsec_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48679d] hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showWebhookSecret ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-[#48679d] dark:text-slate-400 mt-1">
                  Webhook secret, faturalama webhooklari aktiflestiginde kullanilacaktir.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Kaydediliyor...' : 'Baglanti Kur'}
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Baglanti Testi</h2>
          <p className="text-sm text-[#48679d] dark:text-slate-400 mb-4">
            Kayitli anahtarlarla Stripe hesabina erisim dogrulanir.
          </p>
          <form onSubmit={handleTest}>
            <button
              type="submit"
              disabled={testing}
              className="bg-[#0d121c] dark:bg-white text-white dark:text-[#0d121c] font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {testing ? 'Test Ediliyor...' : 'Baglantiyi Test Et'}
            </button>
          </form>
        </div>

        {isConnected && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600">warning</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-300">Baglantiyi Kaldir</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Stripe baglantisini kaldirdiginizda abonelik ve fatura islemleri durdurulur.
                </p>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="mt-4 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {disconnecting ? 'Kaldiriliyor...' : 'Baglantiyi Kaldir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
