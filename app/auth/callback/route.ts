import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient<any>(
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
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is a new OAuth user and create profile if needed
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        // Create team for new OAuth user
        const fullName = data.user.user_metadata?.full_name ||
                        data.user.user_metadata?.name ||
                        data.user.email?.split('@')[0] ||
                        'Kullanıcı'

        const { data: team, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: `${fullName}'in Takımı`,
            plan: 'solo',
          })
          .select()
          .single()

        if (!teamError && team) {
          // Create user profile
          await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            role: 'owner',
            team_id: team.id,
          })
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return to login page with error if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
