import { redirect } from 'next/navigation'
import NotificationsPageClient from './NotificationsPageClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, message, read, action_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <NotificationsPageClient
      initialNotifications={(data ?? []) as Array<{
        id: string
        type: string
        title: string
        message: string
        read: boolean
        action_url: string | null
        created_at: string
      }>}
      initialUserId={user.id}
    />
  )
}
