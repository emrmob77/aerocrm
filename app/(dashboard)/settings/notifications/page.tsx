'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSupabase, useUser } from '@/hooks'
import type { NotificationPreference } from '@/types'
import { useI18n } from '@/lib/i18n'

type PreferenceKey =
  | 'email_enabled'
  | 'in_app_enabled'
  | 'push_enabled'
  | 'proposals_enabled'
  | 'deals_enabled'
  | 'system_enabled'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationSettingsPage() {
  const { t } = useI18n()
  const supabase = useSupabase()
  const { authUser, loading: authLoading } = useUser()
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  const userId = authUser?.id ?? null

  useEffect(() => {
    const loadPreferences = async () => {
      if (authLoading) return
      if (!userId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        toast.error(t('notificationSettings.errors.fetch'))
        setIsLoading(false)
        return
      }

      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: userId })
          .select('*')
          .single()

        if (insertError || !created) {
          toast.error(t('notificationSettings.errors.create'))
          setIsLoading(false)
          return
        }
        setPreferences(created as NotificationPreference)
      } else {
        setPreferences(data as NotificationPreference)
      }

      if (typeof window !== 'undefined') {
        setPushSupported('serviceWorker' in navigator && 'PushManager' in window)
        setPushPermission(Notification.permission)
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = await registration?.pushManager.getSubscription()
        setPushEnabled(Boolean(subscription))
      }

      setIsLoading(false)
    }

    loadPreferences()
  }, [authLoading, supabase, t, userId])

  const updatePreference = async (key: PreferenceKey, value: boolean) => {
    if (!preferences || !userId) return
    setIsSaving(true)
    const next = { ...preferences, [key]: value } as NotificationPreference
    setPreferences(next)
    const { error } = await supabase
      .from('notification_preferences')
      .update({ [key]: value })
      .eq('id', preferences.id)

    if (error) {
      toast.error(t('notificationSettings.errors.update'))
      setPreferences(preferences)
    }
    setIsSaving(false)
  }

  const enablePush = async () => {
    if (!userId) return
    if (!pushSupported) {
      toast.error(t('notificationSettings.errors.pushUnsupported'))
      return
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      toast.error(t('notificationSettings.errors.vapidMissing'))
      return
    }

    setPushBusy(true)
    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission !== 'granted') {
        toast.error(t('notificationSettings.errors.permissionDenied'))
        setPushBusy(false)
        return
      }

      const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register('/sw.js'))

      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }))

      const payload = subscription.toJSON()
      if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
        throw new Error(t('notificationSettings.errors.subscriptionMissing'))
      }

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: payload.endpoint,
          p256dh: payload.keys.p256dh,
          auth: payload.keys.auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' }
      )

      if (error) {
        throw new Error(t('notificationSettings.errors.subscriptionFailed'))
      }

      setPushEnabled(true)
      await updatePreference('push_enabled', true)
      toast.success(t('notificationSettings.success.pushEnabled'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('notificationSettings.errors.pushEnableFailed'))
    } finally {
      setPushBusy(false)
    }
  }

  const disablePush = async () => {
    if (!userId) return
    setPushBusy(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint).eq('user_id', userId)
      }
      setPushEnabled(false)
      await updatePreference('push_enabled', false)
      toast.success(t('notificationSettings.success.pushDisabled'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('notificationSettings.errors.pushDisableFailed'))
    } finally {
      setPushBusy(false)
    }
  }

  const channelCards = useMemo(() => {
    if (!preferences) return []
    return [
      {
        id: 'in_app_enabled' as PreferenceKey,
        title: t('notificationSettings.channels.inApp.title'),
        description: t('notificationSettings.channels.inApp.description'),
        enabled: preferences.in_app_enabled,
      },
      {
        id: 'email_enabled' as PreferenceKey,
        title: t('notificationSettings.channels.email.title'),
        description: t('notificationSettings.channels.email.description'),
        enabled: preferences.email_enabled,
      },
    ]
  }, [preferences, t])

  const pushStatusLabel = pushSupported
    ? t(`notificationSettings.pushStatus.${pushPermission}`)
    : t('notificationSettings.pushStatus.unsupported')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          {t('notificationSettings.title')}
        </h1>
        <p className="text-[#48679d] dark:text-gray-400">{t('notificationSettings.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 text-sm text-[#48679d]">
          {t('notificationSettings.loading')}
        </div>
      ) : !preferences ? (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 text-sm text-[#48679d]">
          {t('notificationSettings.loadFailed')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channelCards.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{card.title}</h3>
                  <p className="text-xs text-[#48679d] mt-1">{card.description}</p>
                </div>
                <button
                  onClick={() => updatePreference(card.id, !card.enabled)}
                  disabled={isSaving}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    card.enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span>{card.enabled ? t('notificationSettings.states.active') : t('notificationSettings.states.inactive')}</span>
                  <span className="material-symbols-outlined text-lg">
                    {card.enabled ? 'toggle_on' : 'toggle_off'}
                  </span>
                </button>
              </div>
            ))}

            <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('notificationSettings.channels.push.title')}</h3>
                <p className="text-xs text-[#48679d] mt-1">
                  {t('notificationSettings.channels.push.description', { status: pushStatusLabel })}
                </p>
              </div>
              <button
                onClick={pushEnabled ? disablePush : enablePush}
                disabled={!pushSupported || pushBusy}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pushEnabled
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <span>{pushEnabled ? t('notificationSettings.states.active') : t('notificationSettings.states.inactive')}</span>
                <span className="material-symbols-outlined text-lg">
                  {pushEnabled ? 'notifications_active' : 'notifications_off'}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('notificationSettings.types.title')}</h3>
              <p className="text-xs text-[#48679d] mt-1">{t('notificationSettings.types.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'proposals_enabled',
                  title: t('notificationSettings.types.proposals.title'),
                  description: t('notificationSettings.types.proposals.description'),
                },
                {
                  id: 'deals_enabled',
                  title: t('notificationSettings.types.deals.title'),
                  description: t('notificationSettings.types.deals.description'),
                },
                {
                  id: 'system_enabled',
                  title: t('notificationSettings.types.system.title'),
                  description: t('notificationSettings.types.system.description'),
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    updatePreference(
                      item.id as PreferenceKey,
                      !(preferences as NotificationPreference)[item.id as PreferenceKey]
                    )
                  }
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    (preferences as NotificationPreference)[item.id as PreferenceKey]
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#0d121c] dark:text-white">{item.title}</p>
                      <p className="text-xs text-[#48679d] mt-1">{item.description}</p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-[#48679d]">
                      {(preferences as NotificationPreference)[item.id as PreferenceKey] ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
