export type ProposalSmartVariableMap = Record<string, string>

type BuildProposalSmartVariableMapInput = {
  clientName: string
  proposalNumber: string
  formattedDate: string
  totalFormatted: string
}

type ProposalPricingSummary = {
  total: number
  currency: string
}

const toNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'

const hasVariableToken = (value: string) => value.includes('{{') || value.includes('ABC ')

export const buildProposalSmartVariableMap = ({
  clientName,
  proposalNumber,
  formattedDate,
  totalFormatted,
}: BuildProposalSmartVariableMapInput): ProposalSmartVariableMap => ({
  '{{Müşteri_Adı}}': clientName,
  '{{Musteri_Adi}}': clientName,
  '{{Client_Name}}': clientName,
  'ABC Şirketi': clientName,
  'ABC Company': clientName,
  '{{Teklif_No}}': proposalNumber,
  '{{Proposal_No}}': proposalNumber,
  '{{Tarih}}': formattedDate,
  '{{Date}}': formattedDate,
  '{{Toplam_Tutar}}': totalFormatted,
  '{{Total_Amount}}': totalFormatted,
})

export const resolveSmartVariablesInText = (value: string, variableMap: ProposalSmartVariableMap) => {
  if (!value || !hasVariableToken(value)) {
    return value
  }

  let resolved = Object.entries(variableMap).reduce((next, [token, replacement]) => next.split(token).join(replacement), value)

  const clientName =
    variableMap['{{Müşteri_Adı}}'] || variableMap['{{Musteri_Adi}}'] || variableMap['{{Client_Name}}'] || ''
  const proposalNo = variableMap['{{Teklif_No}}'] || variableMap['{{Proposal_No}}'] || ''
  const dateValue = variableMap['{{Tarih}}'] || variableMap['{{Date}}'] || ''
  const totalValue = variableMap['{{Toplam_Tutar}}'] || variableMap['{{Total_Amount}}'] || ''

  if (clientName) {
    resolved = resolved
      .replace(/\{\{\s*Müşteri_Adı\s*\}\}/gi, clientName)
      .replace(/\{\{\s*Musteri_Adi\s*\}\}/gi, clientName)
      .replace(/\{\{\s*Client_Name\s*\}\}/gi, clientName)
  }
  if (proposalNo) {
    resolved = resolved
      .replace(/\{\{\s*Teklif_No\s*\}\}/gi, proposalNo)
      .replace(/\{\{\s*Proposal_No\s*\}\}/gi, proposalNo)
  }
  if (dateValue) {
    resolved = resolved
      .replace(/\{\{\s*Tarih\s*\}\}/gi, dateValue)
      .replace(/\{\{\s*Date\s*\}\}/gi, dateValue)
  }
  if (totalValue) {
    resolved = resolved
      .replace(/\{\{\s*Toplam_Tutar\s*\}\}/gi, totalValue)
      .replace(/\{\{\s*Total_Amount\s*\}\}/gi, totalValue)
  }

  return resolved
}

export const resolveSmartVariablesInJson = <T>(value: T, variableMap: ProposalSmartVariableMap): T => {
  if (typeof value === 'string') {
    return resolveSmartVariablesInText(value, variableMap) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveSmartVariablesInJson(item, variableMap)) as T
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = resolveSmartVariablesInJson(nestedValue, variableMap)
    }
    return output as T
  }

  return value
}

export const getProposalPricingSummary = (blocks: unknown, fallbackCurrency = 'TRY'): ProposalPricingSummary => {
  if (!Array.isArray(blocks)) {
    return { total: 0, currency: fallbackCurrency }
  }

  let total = 0
  let detectedCurrency: string | null = null

  for (const block of blocks as Array<{ type?: unknown; data?: { items?: unknown } }>) {
    if (block?.type !== 'pricing') continue
    const items = Array.isArray(block.data?.items) ? block.data.items : []

    for (const item of items as Array<{ qty?: unknown; price?: unknown; currency?: unknown }>) {
      const qty = toNumber(item?.qty)
      const price = toNumber(item?.price)
      total += qty * price

      if (!detectedCurrency && typeof item?.currency === 'string' && item.currency.trim()) {
        detectedCurrency = item.currency.trim()
      }
    }
  }

  return {
    total,
    currency: detectedCurrency ?? fallbackCurrency,
  }
}
