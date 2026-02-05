import crypto from 'crypto'

type MaskOptions = {
  prefix?: number
  suffix?: number
  maskChar?: string
}

const DEFAULT_MASK_OPTIONS: Required<MaskOptions> = {
  prefix: 6,
  suffix: 4,
  maskChar: '*',
}

const toBase64Url = (value: string) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const fromBase64Url = (value: string) => {
  const base = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${base}${'='.repeat((4 - (base.length % 4)) % 4)}`
  return Buffer.from(padded, 'base64').toString('utf8')
}

export const maskSensitiveValue = (value?: string | null, options: MaskOptions = {}) => {
  if (!value) return ''
  const { prefix, suffix, maskChar } = {
    ...DEFAULT_MASK_OPTIONS,
    ...options,
  }

  const visiblePrefix = Math.max(0, Math.floor(prefix))
  const visibleSuffix = Math.max(0, Math.floor(suffix))
  const normalizedMask = maskChar.length > 0 ? maskChar[0] : '*'
  const minMaskedLength = Math.max(8, value.length)

  if (value.length <= visiblePrefix + visibleSuffix + 1) {
    return normalizedMask.repeat(minMaskedLength)
  }

  const maskedLength = value.length - visiblePrefix - visibleSuffix
  return `${value.slice(0, visiblePrefix)}${normalizedMask.repeat(maskedLength)}${value.slice(-visibleSuffix)}`
}

export const maskPresence = (value?: string | null, length = 16, maskChar = '•') => {
  if (!value) return ''
  const size = Number.isFinite(length) ? Math.max(1, Math.floor(length)) : 16
  const normalizedMask = maskChar.length > 0 ? maskChar[0] : '•'
  return normalizedMask.repeat(size)
}

export type OAuthStatePayload = {
  teamId: string
  provider: string
  nonce?: string
  issuedAt?: number
}

type ParsedOAuthState = {
  teamId: string
  provider: string
  nonce: string
  issuedAt: number
}

const signOAuthState = (payload: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex')

export const createOAuthState = (
  payload: OAuthStatePayload,
  secret: string,
  nowMs = Date.now()
) => {
  const statePayload: ParsedOAuthState = {
    teamId: payload.teamId,
    provider: payload.provider,
    nonce: payload.nonce || crypto.randomUUID(),
    issuedAt: payload.issuedAt ?? nowMs,
  }
  const serialized = JSON.stringify(statePayload)
  const encoded = toBase64Url(serialized)
  const signature = signOAuthState(encoded, secret)
  return `${encoded}.${signature}`
}

export const verifyOAuthState = (
  state: string,
  secret: string,
  maxAgeMs = 10 * 60 * 1000,
  nowMs = Date.now()
): ParsedOAuthState | null => {
  const [encoded, signature] = state.split('.')
  if (!encoded || !signature) return null

  const expected = signOAuthState(encoded, secret)
  if (expected.length !== signature.length) return null

  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return null
    }
  } catch {
    return null
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<ParsedOAuthState>
    if (
      typeof parsed?.teamId !== 'string' ||
      typeof parsed?.provider !== 'string' ||
      typeof parsed?.nonce !== 'string' ||
      typeof parsed?.issuedAt !== 'number'
    ) {
      return null
    }

    const age = nowMs - parsed.issuedAt
    if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) {
      return null
    }

    return {
      teamId: parsed.teamId,
      provider: parsed.provider,
      nonce: parsed.nonce,
      issuedAt: parsed.issuedAt,
    }
  } catch {
    return null
  }
}
