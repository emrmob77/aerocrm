import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/types/database'

type NotificationCategory = 'deals' | 'proposals' | 'system'

type NotificationPreferencesRow = Pick<
  Database['public']['Tables']['notification_preferences']['Row'],
  'in_app_enabled' | 'deals_enabled' | 'proposals_enabled' | 'system_enabled'
>

type NotificationInsertPayload = {
  userId: string
  type: string
  title: string
  message: string
  actionUrl?: string | null
  metadata?: Json
  category?: NotificationCategory
  respectPreferences?: boolean
}

type NotifyResult = {
  delivered: boolean
  reason?: 'preferences_disabled' | 'insert_failed'
}

const isCategoryEnabled = (
  preferences: NotificationPreferencesRow | null,
  category: NotificationCategory
) => {
  if (!preferences) return true
  if (!preferences.in_app_enabled) return false

  if (category === 'deals') return preferences.deals_enabled
  if (category === 'proposals') return preferences.proposals_enabled
  return preferences.system_enabled
}

const resolveNotificationClient = (
  fallbackClient: SupabaseClient<Database>
): { primary: SupabaseClient<Database>; fallback: SupabaseClient<Database> | null } => {
  try {
    const admin = createSupabaseAdminClient()
    return { primary: admin, fallback: admin === fallbackClient ? null : fallbackClient }
  } catch {
    return { primary: fallbackClient, fallback: null }
  }
}

const fetchPreferences = async (
  client: SupabaseClient<Database>,
  userId: string
) => {
  const { data, error } = await client
    .from('notification_preferences')
    .select('in_app_enabled, deals_enabled, proposals_enabled, system_enabled')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return null
  }
  return (data ?? null) as NotificationPreferencesRow | null
}

export async function notifyInApp(
  supabase: SupabaseClient<Database>,
  payload: NotificationInsertPayload
): Promise<NotifyResult> {
  const { primary, fallback } = resolveNotificationClient(supabase)
  const category = payload.category ?? 'system'
  const respectPreferences = payload.respectPreferences !== false

  if (respectPreferences) {
    const preferences = await fetchPreferences(primary, payload.userId)
    if (!isCategoryEnabled(preferences, category)) {
      return { delivered: false, reason: 'preferences_disabled' }
    }
  }

  const insertData: Database['public']['Tables']['notifications']['Insert'] = {
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    read: false,
    action_url: payload.actionUrl ?? null,
    metadata: (payload.metadata ?? {}) as Json,
  }

  const primaryInsert = await primary.from('notifications').insert(insertData)
  if (!primaryInsert.error) {
    return { delivered: true }
  }

  if (!fallback) {
    return { delivered: false, reason: 'insert_failed' }
  }

  const fallbackInsert = await fallback.from('notifications').insert(insertData)
  if (!fallbackInsert.error) {
    return { delivered: true }
  }

  return { delivered: false, reason: 'insert_failed' }
}
