type ProposalPdfInput = {
  title: string
  clientName: string
  publicUrl: string
  status: string
  signedAt?: string | null
  signerName?: string | null
  total: number
  currency: string
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
  const lines = [
    `Prepared for: ${input.clientName || 'Customer'}`,
    `Status: ${input.status}`,
    `Total: ${toMoney(input.total, input.currency)}`,
    `Signer: ${input.signerName || '-'}`,
    `Signed at: ${input.signedAt || '-'}`,
    `Public link: ${input.publicUrl}`,
    `Generated at: ${new Date().toISOString()}`,
  ]

  let y = 780
  const commands: string[] = [
    'BT',
    '/F1 20 Tf',
    `1 0 0 1 50 ${y} Tm (${toPdfText(input.title)}) Tj`,
    '/F1 12 Tf',
  ]
  y -= 36

  for (const line of lines) {
    commands.push(`1 0 0 1 50 ${y} Tm (${toPdfText(line)}) Tj`)
    y -= 20
  }

  commands.push('ET')

  const contentStream = commands.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const startXref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}
