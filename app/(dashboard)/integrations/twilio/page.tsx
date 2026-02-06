'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

type IntegrationData = {
  id?: string
  status: string
  credentials?: {
    account_sid: string
    auth_token: string
    from_sms: string
    from_whatsapp: string
  }
  connected_at?: string
  last_used_at?: string
  last_error?: string
}

export default function TwilioSettingsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [integration, setIntegration] = useState<IntegrationData | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [fromSms, setFromSms] = useState('')
  const [fromWhatsapp, setFromWhatsapp] = useState('')

  // Test form state
  const [testTo, setTestTo] = useState('')
  const defaultTestMessage = t('integrationsTwilio.test.defaultMessage')
  const [testMessage, setTestMessage] = useState(defaultTestMessage)
  const defaultMessageRef = useRef(defaultTestMessage)
  const [testMethod, setTestMethod] = useState<'sms' | 'whatsapp'>('sms')

  useEffect(() => {
    if (testMessage === defaultMessageRef.current) {
      setTestMessage(defaultTestMessage)
    }
    defaultMessageRef.current = defaultTestMessage
  }, [defaultTestMessage, testMessage])

  // Fetch current integration
  useEffect(() => {
    const fetchIntegration = async () => {
      try {
        const response = await fetch('/api/integrations/twilio')
        const data = await response.json()

        if (data.integration) {
          setIntegration(data.integration)
          if (data.integration.credentials) {
            setAccountSid(data.integration.credentials.account_sid || '')
            setAuthToken(data.integration.credentials.auth_token || '')
            setFromSms(data.integration.credentials.from_sms || '')
            setFromWhatsapp(data.integration.credentials.from_whatsapp || '')
          }
        }
      } catch {
        showToast('error', t('integrationsTwilio.errors.fetch'))
      } finally {
        setLoading(false)
      }
    }

    fetchIntegration()
  }, [t])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/integrations/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_sid: accountSid,
          auth_token: authToken,
          from_sms: fromSms || undefined,
          from_whatsapp: fromWhatsapp || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data.error || t('integrationsTwilio.errors.save'))
        return
      }

      showToast(
        'success',
        t('integrationsTwilio.success.connected', {
          account: data.accountName ? ` (${data.accountName})` : '',
        })
      )
      setIntegration({
        id: data.integration?.id,
        status: 'connected',
        connected_at: data.integration?.connected_at,
      })
    } catch {
      showToast('error', t('integrationsTwilio.errors.connection'))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setTesting(true)

    try {
      const response = await fetch('/api/integrations/twilio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testTo,
          message: testMessage,
          method: testMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data.error || t('integrationsTwilio.errors.test'))
        return
      }

      showToast('success', data.message || t('integrationsTwilio.success.test'))
    } catch {
      showToast('error', t('integrationsTwilio.errors.test'))
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(t('integrationsTwilio.confirmDisconnect'))) {
      return
    }

    setDisconnecting(true)

    try {
      const response = await fetch('/api/integrations/twilio', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        showToast('error', data.error || t('integrationsTwilio.errors.disconnect'))
        return
      }

      showToast('success', t('integrationsTwilio.success.disconnected'))
      router.push('/integrations')
    } catch {
      showToast('error', t('integrationsTwilio.errors.disconnect'))
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
        {/* Toast */}
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/integrations" className="text-[#48679d] hover:text-primary transition-colors">
            {t('integrationsTwilio.breadcrumb.integrations')}
          </Link>
          <span className="text-[#48679d]">/</span>
          <span className="text-[#0d121c] dark:text-white font-medium">Twilio</span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 256 256" fill="none">
                  <rect width="256" height="256" rx="28" fill="#F22F46"/>
                  <path d="M128 47C82.3 47 46 83.3 46 129C46 174.7 82.3 211 128 211C173.7 211 210 174.7 210 129C210 83.3 173.7 47 128 47ZM128 187C95.2 187 69 160.8 69 128C69 95.2 95.2 69 128 69C160.8 69 187 95.2 187 128C187 160.8 160.8 187 128 187Z" fill="white"/>
                  <circle cx="128" cy="128" r="23" fill="white"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                  {t('integrationsTwilio.title')}
                </h1>
                <p className="text-[#48679d] dark:text-slate-400 mt-1">
                  {t('integrationsTwilio.subtitle')}
                </p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t('integrationsTwilio.status.connected')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave}>
          <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">
              {t('integrationsTwilio.sections.credentials')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                  Account SID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                  Auth Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48679d] hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showToken ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                    {t('integrationsTwilio.fields.fromSms')}
                  </label>
                  <input
                    type="tel"
                    value={fromSms}
                    onChange={(e) => setFromSms(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="+905xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                    {t('integrationsTwilio.fields.fromWhatsapp')}
                  </label>
                  <input
                    type="tel"
                    value={fromWhatsapp}
                    onChange={(e) => setFromWhatsapp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="+14155238886"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Section - Only show when connected */}
          {isConnected && (
            <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">
                {t('integrationsTwilio.sections.test')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                    {t('integrationsTwilio.fields.testTo')}
                  </label>
                  <input
                    type="tel"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="+905xxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                    {t('integrationsTwilio.fields.testMessage')}
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    placeholder={t('integrationsTwilio.placeholders.testMessage')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                    {t('integrationsTwilio.fields.testMethod')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="testMethod"
                        value="sms"
                        checked={testMethod === 'sms'}
                        onChange={() => setTestMethod('sms')}
                        className="w-4 h-4 text-primary border-[#ced8e9] focus:ring-primary"
                      />
                      <span className="text-sm text-[#0d121c] dark:text-white">SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="testMethod"
                        value="whatsapp"
                        checked={testMethod === 'whatsapp'}
                        onChange={() => setTestMethod('whatsapp')}
                        className="w-4 h-4 text-primary border-[#ced8e9] focus:ring-primary"
                      />
                      <span className="text-sm text-[#0d121c] dark:text-white">WhatsApp</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !testTo}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-all"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      {t('integrationsTwilio.actions.testing')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">send</span>
                      {t('integrationsTwilio.actions.test')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {disconnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    {t('integrationsTwilio.actions.disconnecting')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">link_off</span>
                    {t('integrationsTwilio.actions.disconnect')}
                  </>
                )}
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={saving || !accountSid || !authToken}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-all"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('integrationsTwilio.actions.saving')}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">{t('integrationsTwilio.info.title')}</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li>{t('integrationsTwilio.info.steps.0')}</li>
                <li>{t('integrationsTwilio.info.steps.1')}</li>
                <li>{t('integrationsTwilio.info.steps.2')}</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
