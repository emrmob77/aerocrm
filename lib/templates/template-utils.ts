export type TemplatePayload = {
  name?: string
  description?: string | null
  category?: string | null
  is_public?: boolean
  blocks?: unknown
}

export type NormalizedTemplatePayload = {
  name: string
  description: string | null
  category: string | null
  is_public: boolean
  blocks: unknown[]
}

const toTrimmedOrNull = (value?: string | null) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toBlocksArray = (value: unknown) => (Array.isArray(value) ? value : [])

export const normalizeTemplatePayload = (
  payload: TemplatePayload | null | undefined
): NormalizedTemplatePayload => ({
  name: typeof payload?.name === 'string' ? payload.name.trim() : '',
  description: toTrimmedOrNull(payload?.description),
  category: toTrimmedOrNull(payload?.category),
  is_public: payload?.is_public === true,
  blocks: toBlocksArray(payload?.blocks),
})
