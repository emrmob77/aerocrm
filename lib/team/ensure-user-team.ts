type AuthLikeUser = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

type UserProfileRow = {
  id: string
  full_name: string
  role: string
  team_id: string | null
}

export type EnsureUserTeamResult = {
  teamId: string
  fullName: string
  role: string
}

const toNonEmpty = (value: unknown) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : null)

const resolveDisplayName = (user: AuthLikeUser) => {
  const metadata = user.user_metadata ?? {}
  const fromMetadata = toNonEmpty(metadata.full_name) || toNonEmpty(metadata.name)
  if (fromMetadata) return fromMetadata
  if (user.email) {
    const prefix = user.email.split('@')[0]?.trim()
    if (prefix) return prefix
  }
  return 'User'
}

const normalizePlan = (value: unknown) => {
  const raw = toNonEmpty(value)?.toLowerCase()
  if (!raw) return 'starter'
  if (raw === 'starter' || raw === 'growth' || raw === 'scale') return raw
  if (raw === 'solo') return 'starter'
  if (raw === 'pro') return 'growth'
  if (raw === 'team') return 'scale'
  return 'starter'
}

const buildTeamName = (fullName: string) => `${fullName} Team`

export async function ensureUserProfileAndTeam(
  supabase: unknown,
  user: AuthLikeUser
): Promise<EnsureUserTeamResult | null> {
  const db = supabase as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (table: string) => any
  }
  const fallbackName = resolveDisplayName(user)

  const { data: existingProfile, error: profileReadError } = await db
    .from('users')
    .select('id, full_name, role, team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileReadError) {
    return null
  }

  let profile = existingProfile as UserProfileRow | null

  if (!profile) {
    const { data: createdProfile, error: createProfileError } = await db
      .from('users')
      .insert({
        id: user.id,
        email: user.email || `${user.id}@local.invalid`,
        full_name: fallbackName,
        role: 'owner',
      })
      .select('id, full_name, role, team_id')
      .single()

    if (createProfileError || !createdProfile) {
      return null
    }

    profile = createdProfile as UserProfileRow
  }

  if (!profile.team_id) {
    const { data: team, error: teamCreateError } = await db
      .from('teams')
      .insert({
        name: buildTeamName(profile.full_name || fallbackName),
        plan: normalizePlan(user.user_metadata?.plan),
      })
      .select('id')
      .single()

    if (teamCreateError || !team?.id) {
      return null
    }

    const { error: profileUpdateError } = await db
      .from('users')
      .update({
        team_id: team.id,
        role: profile.role || 'owner',
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      return null
    }

    profile = {
      ...profile,
      team_id: team.id,
    }
  }

  if (!profile.team_id) {
    return null
  }

  return {
    teamId: profile.team_id,
    fullName: profile.full_name || fallbackName,
    role: profile.role || 'owner',
  }
}
