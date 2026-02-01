import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

type UserInsert = Database['public']['Tables']['users']['Insert']

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

      // Check if user profile exists, if not create one
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create user profile for OAuth users
          const newUser: UserInsert = {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
            role: 'member',
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('users') as any).insert(newUser)
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
