import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = getSafeRedirectPath(searchParams.get('next')) ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is a password recovery, redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password?recovery=1`)
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const ensured = await ensureUserProfileAndTeam(supabase, user)
        if (!ensured?.teamId) {
          try {
            const admin = createSupabaseAdminClient()
            await ensureUserProfileAndTeam(admin, user)
          } catch {
            // If service-role is unavailable, continue with normal flow.
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

function getSafeRedirectPath(rawNext: string | null) {
  if (!rawNext) {
    return null
  }

  if (!rawNext.startsWith('/')) {
    return null
  }

  if (rawNext.startsWith('//')) {
    return null
  }

  if (rawNext.includes('\\')) {
    return null
  }

  return rawNext
}
