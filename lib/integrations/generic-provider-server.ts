import { maskPresence } from '@/lib/integrations/security-utils'
import {
  getGenericIntegrationConfig,
  type GenericIntegrationProvider,
} from '@/lib/integrations/provider-config'

type JsonRecord = Record<string, unknown>

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const resolveStringValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const buildGenericCredentials = (
  provider: GenericIntegrationProvider,
  payload: JsonRecord,
  existing: Record<string, string> = {}
) => {
  const config = getGenericIntegrationConfig(provider)
  const credentials: Record<string, string> = {}

  for (const field of config.fields) {
    const payloadHasField = Object.prototype.hasOwnProperty.call(payload, field.key)
    const incoming = resolveStringValue(payload[field.key])
    const existingValue = resolveStringValue(existing[field.key])

    let nextValue = existingValue
    if (payloadHasField) {
      if (incoming) {
        nextValue = incoming
      } else if (field.required || (field.sensitive && existingValue)) {
        nextValue = existingValue
      } else {
        nextValue = ''
      }
    }

    if (field.required && !nextValue) {
      return { ok: false as const, error: field.labelKey }
    }

    if (nextValue && field.type === 'url' && !isValidUrl(nextValue)) {
      return { ok: false as const, error: field.labelKey }
    }

    if (nextValue && field.type === 'email' && !isValidEmail(nextValue)) {
      return { ok: false as const, error: field.labelKey }
    }

    if (nextValue && field.type === 'select' && field.options) {
      const valid = field.options.some((option) => option.value === nextValue)
      if (!valid) {
        return { ok: false as const, error: field.labelKey }
      }
    }

    if (nextValue) {
      credentials[field.key] = nextValue
    }
  }

  return { ok: true as const, credentials }
}

export const validateGenericCredentials = (
  provider: GenericIntegrationProvider,
  credentials: Record<string, string>
) => {
  const config = getGenericIntegrationConfig(provider)

  for (const field of config.fields) {
    const value = resolveStringValue(credentials[field.key])

    if (field.required && !value) {
      return { ok: false as const, error: field.labelKey }
    }

    if (value && field.type === 'url' && !isValidUrl(value)) {
      return { ok: false as const, error: field.labelKey }
    }

    if (value && field.type === 'email' && !isValidEmail(value)) {
      return { ok: false as const, error: field.labelKey }
    }

    if (value && field.type === 'select' && field.options) {
      const valid = field.options.some((option) => option.value === value)
      if (!valid) {
        return { ok: false as const, error: field.labelKey }
      }
    }
  }

  return { ok: true as const }
}

export const maskGenericCredentials = (
  provider: GenericIntegrationProvider,
  credentials: Record<string, string>
) => {
  const config = getGenericIntegrationConfig(provider)
  const result: Record<string, string> = {}

  for (const field of config.fields) {
    const value = resolveStringValue(credentials[field.key])
    if (!value) continue

    result[field.key] = field.sensitive ? maskPresence(value) : value
  }

  return result
}
