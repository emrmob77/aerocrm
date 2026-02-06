'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import type {
  GenericIntegrationConfig,
  GenericIntegrationProvider,
  IntegrationFieldConfig,
} from '@/lib/integrations/provider-config'

type IntegrationData = {
  id?: string
  status: string
  credentials?: Record<string, string>
  connected_at?: string
  last_used_at?: string
  last_error?: string
}

const createInitialValues = (fields: IntegrationFieldConfig[]) => {
  const values: Record<string, string> = {}
  for (const field of fields) {
    if (field.type === 'select' && field.options?.[0]) {
      values[field.key] = field.options[0].value
      continue
    }
    values[field.key] = ''
  }
  return values
}

export default function GenericIntegrationSettingsPage({
  provider,
  config,
}: {
  provider: GenericIntegrationProvider
  config: GenericIntegrationConfig
}) {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [integration, setIntegration] = useState<IntegrationData | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    createInitialValues(config.fields)
  )

  const isConnected = integration?.status === 'connected'
  const payload = useMemo(() => {
    const next: Record<string, string> = {}
    for (const field of config.fields) {
      next[field.key] = formValues[field.key] || ''
    }
    return next
  }, [config.fields, formValues])

  useEffect(() => {
    const fetchIntegration = async () => {
      try {
        const response = await fetch(`/api/integrations/${provider}`)
        const data = await response.json()

        if (data.integration) {
          setIntegration(data.integration)
          setFormValues((prev) => {
            const next = { ...prev }
            for (const field of config.fields) {
              if (field.sensitive) continue
              const value = data.integration.credentials?.[field.key]
              if (typeof value === 'string') {
                next[field.key] = value
              }
            }
            return next
          })
        }
      } catch {
        showToast('error', t('integrationsGeneric.errors.fetch'))
      } finally {
        setLoading(false)
      }
    }

    fetchIntegration()
  }, [config.fields, provider, t])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        showToast('error', data.error || t('integrationsGeneric.errors.save'))
        return
      }

      showToast('success', t('integrationsGeneric.success.connected', { provider: config.name }))
      setIntegration({
        id: data.integration?.id,
        status: 'connected',
        connected_at: data.integration?.connected_at,
      })
    } catch {
      showToast('error', t('integrationsGeneric.errors.connection'))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setTesting(true)

    try {
      const response = await fetch(`/api/integrations/${provider}/test`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        showToast('error', data.error || t('integrationsGeneric.errors.test'))
        return
      }

      showToast('success', data.message || t('integrationsGeneric.success.test', { provider: config.name }))
    } catch {
      showToast('error', t('integrationsGeneric.errors.test'))
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(t('integrationsGeneric.confirmDisconnect', { provider: config.name }))) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        showToast('error', data.error || t('integrationsGeneric.errors.disconnect'))
        return
      }

      showToast('success', t('integrationsGeneric.success.disconnected', { provider: config.name }))
      router.push('/integrations')
    } catch {
      showToast('error', t('integrationsGeneric.errors.disconnect'))
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
            {t('integrationsGeneric.breadcrumb.integrations')}
          </Link>
          <span className="text-[#48679d]">/</span>
          <span className="text-[#0d121c] dark:text-white font-medium">{config.name}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`size-14 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${config.iconColor} text-3xl`}>{config.icon}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                  {config.name}
                </h1>
                <p className="text-[#48679d] dark:text-slate-400 mt-1">
                  {t(config.descriptionKey)}
                </p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t('integrationsGeneric.status.connected')}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">
              {t('integrationsGeneric.sections.credentials')}
            </h2>
            <div className="space-y-4">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-1.5">
                    {t(field.labelKey)}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formValues[field.key] || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      required={field.required}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formValues[field.key] || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-28"
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formValues[field.key] || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? t('integrationsGeneric.actions.saving') : t('integrationsGeneric.actions.connect')}
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">
            {t('integrationsGeneric.sections.test')}
          </h2>
          <p className="text-sm text-[#48679d] dark:text-slate-400 mb-4">
            {t('integrationsGeneric.testDescription', { provider: config.name })}
          </p>
          <form onSubmit={handleTest}>
            <button
              type="submit"
              disabled={testing || !isConnected}
              className="w-full bg-[#f3f6fc] dark:bg-slate-800 text-[#0d121c] dark:text-white font-medium py-2.5 rounded-lg hover:bg-[#e8eef9] dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {testing ? t('integrationsGeneric.actions.testing') : t('integrationsGeneric.actions.test')}
            </button>
          </form>
        </div>

        {isConnected && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
              {t('integrationsGeneric.sections.disconnect')}
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {t('integrationsGeneric.disconnectDescription', { provider: config.name })}
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {disconnecting
                ? t('integrationsGeneric.actions.disconnecting')
                : t('integrationsGeneric.actions.disconnect')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
