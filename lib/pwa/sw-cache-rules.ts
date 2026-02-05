export type SwStrategy =
  | 'ignore'
  | 'network-first-navigation'
  | 'network-first-api'
  | 'stale-while-revalidate-static'

type ResolveStrategyParams = {
  method: string
  requestMode?: string | null
  requestUrl: string
  appOrigin: string
}

export const resolveSwStrategy = ({
  method,
  requestMode,
  requestUrl,
  appOrigin,
}: ResolveStrategyParams): SwStrategy => {
  if (method !== 'GET') return 'ignore'

  let url: URL
  try {
    url = new URL(requestUrl)
  } catch {
    return 'ignore'
  }

  if (url.origin !== appOrigin) return 'ignore'
  if (requestMode === 'navigate') return 'network-first-navigation'
  if (url.pathname.startsWith('/api/')) return 'network-first-api'
  return 'stale-while-revalidate-static'
}

export const selectCachesToDelete = (
  cacheKeys: string[],
  staticCache: string,
  apiCache: string
) => cacheKeys.filter((key) => key !== staticCache && key !== apiCache)
