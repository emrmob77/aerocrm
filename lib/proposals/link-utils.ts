const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '')

const toValidOrigin = (value: string | null | undefined) => {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return normalizeOrigin(new URL(candidate).origin)
  } catch {
    return null
  }
}

const isLocalOrigin = (origin: string) => {
  try {
    const host = new URL(origin).hostname.toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
  } catch {
    return false
  }
}

const resolveEnvOrigin = () =>
  toValidOrigin(process.env.PROPOSAL_PUBLIC_BASE_URL) ||
  toValidOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
  toValidOrigin(process.env.APP_URL) ||
  toValidOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

export const resolvePublicProposalOrigin = (requestOrigin?: string | null) => {
  const resolvedRequestOrigin = toValidOrigin(requestOrigin)
  const resolvedEnvOrigin = resolveEnvOrigin()

  if (resolvedRequestOrigin && !isLocalOrigin(resolvedRequestOrigin)) {
    return resolvedRequestOrigin
  }
  if (resolvedEnvOrigin && !isLocalOrigin(resolvedEnvOrigin)) {
    return resolvedEnvOrigin
  }

  return resolvedRequestOrigin || resolvedEnvOrigin || 'http://localhost:3000'
}

export const createProposalSlug = (idFactory: () => string = () => crypto.randomUUID()) =>
  idFactory().replace(/-/g, '')

export const buildPublicProposalUrl = (origin: string, slug: string = createProposalSlug()) =>
  `${normalizeOrigin(origin)}/p/${slug}`
