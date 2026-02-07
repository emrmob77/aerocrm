export const teamRoleOrder = ['viewer', 'member', 'admin', 'owner'] as const

export const canManageTeam = (role?: string | null) => role === 'owner' || role === 'admin'

export const canManageTargetMember = (actorRole?: string | null, targetRole?: string | null) => {
  if (!canManageTeam(actorRole)) return false
  if (actorRole !== 'owner' && (targetRole === 'owner' || targetRole === 'admin')) {
    return false
  }
  return true
}

export const canAssignRole = (actorRole?: string | null, nextRole?: string | null) => {
  if (!nextRole || nextRole === 'owner') return false
  if (nextRole === 'admin' && actorRole !== 'owner') return false
  return actorRole === 'owner' || actorRole === 'admin'
}
