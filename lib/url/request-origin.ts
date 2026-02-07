const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '')

const toValidOrigin = (value: string | null | undefined) => {
  if (!value) return null
  try {
    return normalizeOrigin(new URL(value).origin)
  } catch {
    return null
  }
}

const toValidOriginFromHost = (host: string | null | undefined, proto: string | null | undefined) => {
  if (!host) return null
  const safeProto = proto === 'http' || proto === 'https' ? proto : 'https'
  return toValidOrigin(`${safeProto}://${host}`)
}

export const resolveRequestOrigin = (request: Request) => {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const fromForwarded = toValidOriginFromHost(forwardedHost, forwardedProto)
  if (fromForwarded) return fromForwarded

  const fromEnv =
    toValidOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    toValidOrigin(process.env.APP_URL) ||
    toValidOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (fromEnv) return fromEnv

  const fromRequest = toValidOrigin(request.url)
  if (fromRequest) return fromRequest

  return 'http://localhost:3000'
}
