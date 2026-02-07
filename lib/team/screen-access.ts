export const TEAM_SCREEN_DEFINITIONS = [
  {
    key: 'dashboard',
    labelKey: 'teamSettings.permissions.items.dashboard',
    href: '/dashboard',
    pathPrefixes: ['/dashboard'],
  },
  {
    key: 'deals',
    labelKey: 'teamSettings.permissions.items.deals',
    href: '/deals',
    pathPrefixes: ['/deals'],
  },
  {
    key: 'contacts',
    labelKey: 'teamSettings.permissions.items.contacts',
    href: '/contacts',
    pathPrefixes: ['/contacts'],
  },
  {
    key: 'products',
    labelKey: 'teamSettings.permissions.items.products',
    href: '/products',
    pathPrefixes: ['/products'],
  },
  {
    key: 'proposals',
    labelKey: 'teamSettings.permissions.items.proposals',
    href: '/proposals',
    pathPrefixes: ['/proposals'],
  },
  {
    key: 'templates',
    labelKey: 'teamSettings.permissions.items.templates',
    href: '/templates',
    pathPrefixes: ['/templates'],
  },
  {
    key: 'sales',
    labelKey: 'teamSettings.permissions.items.sales',
    href: '/sales',
    pathPrefixes: ['/sales'],
  },
  {
    key: 'analytics',
    labelKey: 'teamSettings.permissions.items.analytics',
    href: '/analytics',
    pathPrefixes: ['/analytics'],
  },
  {
    key: 'notifications',
    labelKey: 'teamSettings.permissions.items.notifications',
    href: '/notifications',
    pathPrefixes: ['/notifications'],
  },
  {
    key: 'webhooks',
    labelKey: 'teamSettings.permissions.items.webhooks',
    href: '/webhooks',
    pathPrefixes: ['/webhooks'],
  },
  {
    key: 'integrations',
    labelKey: 'teamSettings.permissions.items.integrations',
    href: '/integrations',
    pathPrefixes: ['/integrations'],
  },
  {
    key: 'import_export',
    labelKey: 'teamSettings.permissions.items.importExport',
    href: '/reports/import-export',
    pathPrefixes: ['/reports/import-export'],
  },
  {
    key: 'reports',
    labelKey: 'teamSettings.permissions.items.reports',
    href: '/reports',
    pathPrefixes: ['/reports'],
  },
  {
    key: 'search',
    labelKey: 'teamSettings.permissions.items.search',
    href: '/search',
    pathPrefixes: ['/search'],
  },
  {
    key: 'settings',
    labelKey: 'teamSettings.permissions.items.settings',
    href: '/settings',
    pathPrefixes: ['/settings'],
  },
] as const

export type TeamScreenKey = (typeof TEAM_SCREEN_DEFINITIONS)[number]['key']

const teamScreenKeySet = new Set<TeamScreenKey>(TEAM_SCREEN_DEFINITIONS.map((item) => item.key))

export const ALL_TEAM_SCREEN_KEYS: TeamScreenKey[] = TEAM_SCREEN_DEFINITIONS.map((item) => item.key)

export const isValidTeamScreenKey = (value: string): value is TeamScreenKey =>
  teamScreenKeySet.has(value as TeamScreenKey)

export const sanitizeTeamScreenKeys = (value: readonly string[] | null | undefined): TeamScreenKey[] => {
  if (!Array.isArray(value)) return []
  const unique = new Set<TeamScreenKey>()
  value.forEach((item) => {
    if (typeof item !== 'string') return
    const normalized = item.trim()
    if (!normalized) return
    if (isValidTeamScreenKey(normalized)) {
      unique.add(normalized)
    }
  })
  return Array.from(unique)
}

export const resolveAllowedScreens = (value: readonly string[] | null | undefined): TeamScreenKey[] => {
  if (value === null || value === undefined) {
    return [...ALL_TEAM_SCREEN_KEYS]
  }
  return sanitizeTeamScreenKeys(value)
}

export const getScreenByPathname = (pathname: string) =>
  TEAM_SCREEN_DEFINITIONS.find((screen) =>
    screen.pathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  )

export const isPathAllowedForScreens = (pathname: string, allowedScreens: readonly string[] | null | undefined) => {
  const matched = getScreenByPathname(pathname)
  if (!matched) return true
  const allowed = resolveAllowedScreens(allowedScreens)
  return allowed.includes(matched.key)
}

export const getFirstAllowedPath = (allowedScreens: readonly string[] | null | undefined) => {
  const allowed = resolveAllowedScreens(allowedScreens)
  if (allowed.length === 0) return '/dashboard'
  const first = TEAM_SCREEN_DEFINITIONS.find((screen) => allowed.includes(screen.key))
  return first?.href ?? '/dashboard'
}
