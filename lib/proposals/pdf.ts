type ProposalLineItem = {
  name: string
  qty: number
  unit?: string | null
  price: number
  currency: string
  total: number
}

type ProposalPdfInput = {
  title: string
  clientName: string
  publicUrl: string
  status: string
  signedAt?: string | null
  signerName?: string | null
  total: number
  currency: string
  lineItems?: ProposalLineItem[]
}

const toPdfText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const toMoney = (value: number, currency: string) => {
  const safeValue = Number.isFinite(value) ? value : 0
  return `${safeValue.toFixed(2)} ${currency}`
}

const toSafeNumber = (value: number, fallback = 0) => (Number.isFinite(value) ? value : fallback)

const wrapText = (text: string, maxChars: number) => {
  const normalized = text.trim()
  if (!normalized) return ['']

  const words = normalized.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
      continue
    }
    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(word.slice(0, maxChars))
      current = word.slice(maxChars)
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines
}

const getByteLength = (value: string) => new TextEncoder().encode(value).length

export const toPdfFileName = (title: string, fallbackSlug: string) => {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const safeName = normalized || `proposal-${fallbackSlug}`
  return `${safeName}.pdf`
}

export const buildProposalPdf = (input: ProposalPdfInput) => {
  const lineItems = (input.lineItems ?? []).map((item, index) => {
    const qty = toSafeNumber(item.qty, 0)
    const price = toSafeNumber(item.price, 0)
    const total = toSafeNumber(item.total, qty * price)
    const unit = item.unit?.trim() ? ` ${item.unit.trim()}` : ''
    return `${index + 1}. ${item.name} | ${qty}${unit} x ${toMoney(price, item.currency)} = ${toMoney(total, item.currency)}`
  })

  const metaLines = [
    `Prepared for: ${input.clientName || 'Customer'}`,
    `Status: ${input.status}`,
    `Signer: ${input.signerName || '-'}`,
    `Signed at: ${input.signedAt || '-'}`,
    `Public link: ${input.publicUrl || '-'}`,
  ]

  const commands: string[] = ['BT']
  let y = 800

  commands.push('/F1 20 Tf')
  commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText(input.title)}) Tj`)
  y -= 30

  commands.push('/F1 11 Tf')
  for (const line of metaLines) {
    for (const wrapped of wrapText(line, 92)) {
      commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText(wrapped)}) Tj`)
      y -= 16
    }
  }

  y -= 8
  commands.push('/F1 13 Tf')
  commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText('Pricing Items')}) Tj`)
  y -= 18

  commands.push('/F1 10 Tf')
  if (lineItems.length === 0) {
    commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText('No pricing items found in this proposal.')}) Tj`)
    y -= 16
  } else {
    for (const itemLine of lineItems) {
      for (const wrapped of wrapText(itemLine, 94)) {
        commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText(wrapped)}) Tj`)
        y -= 14
        if (y < 120) {
          break
        }
      }
      if (y < 120) {
        break
      }
    }
  }

  y -= 10
  commands.push('/F1 14 Tf')
  commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText(`Grand total: ${toMoney(input.total, input.currency)}`)}) Tj`)
  y -= 22

  commands.push('/F1 9 Tf')
  commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText(`Generated at: ${new Date().toISOString()}`)}) Tj`)
  commands.push('ET')

  const contentStream = commands.join('\n')
  const contentLength = getByteLength(contentStream)
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  objects.forEach((object, index) => {
    offsets.push(getByteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const startXref = getByteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}
