export type ProposalDesignSettings = {
  background: string
  text: string
  accent: string
  radius: number
  fontScale: number
}

export const defaultProposalDesignSettings: ProposalDesignSettings = {
  background: '#ffffff',
  text: '#0d121c',
  accent: '#377DF6',
  radius: 12,
  fontScale: 100,
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const parseColor = (value: unknown, fallback: string) =>
  typeof value === 'string' && HEX_COLOR.test(value.trim()) ? value.trim() : fallback

const parseNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

export const sanitizeProposalDesignSettings = (value: unknown): ProposalDesignSettings => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    background: parseColor(source.background, defaultProposalDesignSettings.background),
    text: parseColor(source.text, defaultProposalDesignSettings.text),
    accent: parseColor(source.accent, defaultProposalDesignSettings.accent),
    radius: parseNumber(source.radius, defaultProposalDesignSettings.radius, 0, 40),
    fontScale: parseNumber(source.fontScale, defaultProposalDesignSettings.fontScale, 80, 140),
  }
}
