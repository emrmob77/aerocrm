import { MainLayout } from '@/components/layout'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { User } from '@/types'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let adminClient: ReturnType<typeof createSupabaseAdminClient> | null = null
  let initialUser: User | null = null

  // Self-heal profile/team relation for legacy or OAuth users.
  const ensured = await ensureUserProfileAndTeam(supabase, user)
  if (!ensured?.teamId) {
    try {
      adminClient = createSupabaseAdminClient()
      await ensureUserProfileAndTeam(adminClient, user)
    } catch {
      // ignore: downstream routes still guard and show localized errors
    }
  }

  const profileSelect =
    'id, email, full_name, role, team_id, avatar_url, language, allowed_screens, created_at, updated_at'

  const { data: profile } = await supabase
    .from('users')
    .select(profileSelect)
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    initialUser = profile as User
  } else {
    try {
      const admin = adminClient ?? createSupabaseAdminClient()
      const { data: adminProfile } = await admin
        .from('users')
        .select(profileSelect)
        .eq('id', user.id)
        .maybeSingle()
      if (adminProfile) {
        initialUser = adminProfile as User
      }
    } catch {
      // ignore, use client-side hydration fallback
    }
  }

  return <MainLayout initialUser={initialUser}>{children}</MainLayout>
}
