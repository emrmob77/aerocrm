import { MainLayout } from '@/components/layout'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
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

  // Self-heal profile/team relation for legacy or OAuth users.
  const ensured = await ensureUserProfileAndTeam(supabase, user)
  if (!ensured?.teamId) {
    try {
      const admin = createSupabaseAdminClient()
      await ensureUserProfileAndTeam(admin, user)
    } catch {
      // ignore: downstream routes still guard and show localized errors
    }
  }

  return <MainLayout>{children}</MainLayout>
}
