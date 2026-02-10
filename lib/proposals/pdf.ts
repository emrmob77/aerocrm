type ProposalLineItem = {
  name: string
  qty: number
  unit?: string | null
  price: number
  currency: string
  total: number
}

type ProposalContentBlock = {
  id?: string
  type: string
  data?: Record<string, unknown>
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
  blocks?: ProposalContentBlock[]
  accentColor?: string
  textColor?: string
  backgroundColor?: string
}

type PdfLine = {
  text: string
  size?: number
  bold?: boolean
  color?: string
  gapBefore?: number
  gapAfter?: number
  indent?: number
}

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 42
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const DEFAULT_ACCENT = '#377DF6'
const DEFAULT_TEXT = '#0D121C'
const DEFAULT_BACKGROUND = '#FFFFFF'
const DEFAULT_MUTED = '#48679D'

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

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const normalizeColor = (value: string | undefined | null, fallback: string) => {
  if (!value) return fallback
  const trimmed = value.trim()
  return HEX_COLOR.test(trimmed) ? trimmed : fallback
}

const hexToRgb = (hex: string) => {
  const normalized = normalizeColor(hex, '#000000').slice(1)
  const fullHex = normalized.length === 3
    ? normalized
      .split('')
      .map((char) => char + char)
      .join('')
    : normalized
  const red = parseInt(fullHex.slice(0, 2), 16) / 255
  const green = parseInt(fullHex.slice(2, 4), 16) / 255
  const blue = parseInt(fullHex.slice(4, 6), 16) / 255
  return `${red.toFixed(4)} ${green.toFixed(4)} ${blue.toFixed(4)}`
}

const drawText = (
  commands: string[],
  text: string,
  x: number,
  y: number,
  options?: { size?: number; bold?: boolean; color?: string }
) => {
  const size = options?.size ?? 11
  const font = options?.bold ? '/F2' : '/F1'
  const color = hexToRgb(options?.color ?? DEFAULT_TEXT)
  commands.push('BT')
  commands.push(`${font} ${size} Tf`)
  commands.push(`${color} rg`)
  commands.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${toPdfText(text)}) Tj`)
  commands.push('ET')
}

const drawRect = (
  commands: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) => {
  commands.push('q')
  commands.push(`${hexToRgb(color)} rg`)
  commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`)
  commands.push('Q')
}

const drawRule = (
  commands: string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1
) => {
  commands.push('q')
  commands.push(`${hexToRgb(color)} RG`)
  commands.push(`${width.toFixed(2)} w`)
  commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`)
  commands.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`)
  commands.push('S')
  commands.push('Q')
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

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const asNumber = (value: unknown, fallback = 0) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const asBoolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const formatIsoDate = (value: string | null | undefined) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toISOString()
}

const getWrapLimit = (size: number, width = CONTENT_WIDTH) =>
  Math.max(24, Math.floor(width / Math.max(5.6, size * 0.52)))

const pushBlockTitle = (lines: PdfLine[], value: string) => {
  if (!value.trim()) return
  lines.push({
    text: value.trim(),
    size: 13,
    bold: true,
    color: DEFAULT_TEXT,
    gapBefore: 12,
    gapAfter: 6,
  })
}

const buildDocumentLines = (input: ProposalPdfInput) => {
  const lines: PdfLine[] = []
  let renderedPricing = false
  let renderedSignature = false

  const blocks = Array.isArray(input.blocks) ? input.blocks : []

  for (const block of blocks) {
    const data = asRecord(block.data) ?? {}

    if (block.type === 'hero') {
      const title = asString(data.title)
      const subtitle = asString(data.subtitle)
      pushBlockTitle(lines, title || input.title)
      if (subtitle) {
        lines.push({ text: subtitle, color: DEFAULT_MUTED, gapAfter: 4 })
      }
      continue
    }

    if (block.type === 'heading') {
      const text = asString(data.text)
      if (text) {
        pushBlockTitle(lines, text)
      }
      continue
    }

    if (block.type === 'text') {
      const content = asString(data.content)
      if (!content) continue
      const paragraphs = content
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean)
      for (const paragraph of paragraphs) {
        lines.push({ text: paragraph, gapAfter: 4 })
      }
      continue
    }

    if (block.type === 'pricing') {
      const rawItems = asArray(data.items)
      if (rawItems.length === 0) continue

      renderedPricing = true
      pushBlockTitle(lines, 'Pricing')
      for (const item of rawItems) {
        const row = asRecord(item) ?? {}
        const qty = asNumber(row.qty, 1)
        const price = asNumber(row.price, 0)
        const currency = asString(row.currency, input.currency)
        const unit = asString(row.unit)
        const total = qty * price
        const unitSuffix = unit ? ` ${unit}` : ''
        const description = asString(row.name, 'Line item')
        lines.push({
          text: `${description} | ${qty}${unitSuffix} x ${toMoney(price, currency)} = ${toMoney(total, currency)}`,
          gapAfter: 2,
        })
      }
      lines.push({
        text: `Subtotal: ${toMoney(input.total, input.currency)}`,
        bold: true,
        color: DEFAULT_TEXT,
        gapAfter: 4,
      })
      continue
    }

    if (block.type === 'video') {
      const title = asString(data.title)
      const url = asString(data.url)
      if (!title && !url) continue
      pushBlockTitle(lines, title || 'Video')
      if (url) {
        lines.push({ text: url, color: DEFAULT_MUTED, gapAfter: 2 })
      }
      continue
    }

    if (block.type === 'gallery') {
      const images = asArray(data.images)
      if (images.length === 0) continue
      pushBlockTitle(lines, 'Gallery')
      lines.push({ text: `${images.length} image(s) attached`, color: DEFAULT_MUTED, gapAfter: 2 })
      for (const image of images.slice(0, 6)) {
        const imageRecord = asRecord(image) ?? {}
        const caption = asString(imageRecord.caption)
        const url = asString(imageRecord.url)
        if (caption) {
          lines.push({ text: `- ${caption}`, gapAfter: 1 })
        } else if (url) {
          lines.push({ text: `- ${url}`, color: DEFAULT_MUTED, gapAfter: 1 })
        }
      }
      continue
    }

    if (block.type === 'testimonial') {
      const quote = asString(data.quote)
      const author = asString(data.author)
      const role = asString(data.role)
      if (!quote && !author) continue
      pushBlockTitle(lines, 'Reference')
      if (quote) {
        lines.push({ text: `"${quote}"`, gapAfter: 2 })
      }
      if (author || role) {
        lines.push({
          text: `${author}${author && role ? ' - ' : ''}${role}`,
          color: DEFAULT_MUTED,
          gapAfter: 2,
        })
      }
      continue
    }

    if (block.type === 'timeline') {
      const items = asArray(data.items)
      if (items.length === 0) continue
      pushBlockTitle(lines, 'Timeline')
      for (const item of items) {
        const row = asRecord(item) ?? {}
        const date = asString(row.date)
        const title = asString(row.title)
        const description = asString(row.description)
        const headline = [date, title].filter(Boolean).join(' - ')
        if (headline) {
          lines.push({ text: headline, bold: true, size: 11, gapAfter: 1 })
        }
        if (description) {
          lines.push({ text: description, color: DEFAULT_MUTED, gapAfter: 2, indent: 10 })
        }
      }
      continue
    }

    if (block.type === 'countdown') {
      const label = asString(data.label, 'Countdown')
      const days = asNumber(data.days, 0)
      const hours = asNumber(data.hours, 0)
      const minutes = asNumber(data.minutes, 0)
      pushBlockTitle(lines, label)
      lines.push({ text: `${days}d ${hours}h ${minutes}m`, color: DEFAULT_MUTED, gapAfter: 2 })
      continue
    }

    if (block.type === 'cta') {
      const label = asString(data.label)
      const url = asString(data.url)
      if (!label && !url) continue
      pushBlockTitle(lines, label || 'Action')
      if (url) {
        lines.push({ text: url, color: DEFAULT_MUTED, gapAfter: 2 })
      }
      continue
    }

    if (block.type === 'signature') {
      renderedSignature = true
      pushBlockTitle(lines, asString(data.label, 'Signature'))
      const required = asBoolean(data.required, true)
      lines.push({ text: `Required: ${required ? 'Yes' : 'No'}`, color: DEFAULT_MUTED, gapAfter: 2 })
      lines.push({ text: `Signed by: ${input.signerName || '-'}`, color: DEFAULT_MUTED, gapAfter: 1 })
      lines.push({ text: `Signed at: ${formatIsoDate(input.signedAt)}`, color: DEFAULT_MUTED, gapAfter: 2 })
      continue
    }
  }

  if (!renderedPricing && Array.isArray(input.lineItems) && input.lineItems.length > 0) {
    pushBlockTitle(lines, 'Pricing')
    for (let index = 0; index < input.lineItems.length; index += 1) {
      const item = input.lineItems[index]
      const qty = toSafeNumber(item.qty, 0)
      const price = toSafeNumber(item.price, 0)
      const total = toSafeNumber(item.total, qty * price)
      const unit = item.unit?.trim() ? ` ${item.unit.trim()}` : ''
      lines.push({
        text: `${index + 1}. ${item.name} | ${qty}${unit} x ${toMoney(price, item.currency)} = ${toMoney(total, item.currency)}`,
        gapAfter: 2,
      })
    }
    lines.push({
      text: `Subtotal: ${toMoney(input.total, input.currency)}`,
      bold: true,
      color: DEFAULT_TEXT,
      gapAfter: 4,
    })
  }

  if (!renderedSignature) {
    pushBlockTitle(lines, 'Signature')
    lines.push({ text: `Signed by: ${input.signerName || '-'}`, color: DEFAULT_MUTED, gapAfter: 1 })
    lines.push({ text: `Signed at: ${formatIsoDate(input.signedAt)}`, color: DEFAULT_MUTED, gapAfter: 2 })
  }

  pushBlockTitle(lines, 'Summary')
  lines.push({ text: `Prepared for: ${input.clientName || 'Customer'}`, color: DEFAULT_MUTED, gapAfter: 1 })
  lines.push({ text: `Status: ${input.status || 'signed'}`, color: DEFAULT_MUTED, gapAfter: 1 })
  lines.push({ text: `Grand total: ${toMoney(input.total, input.currency)}`, bold: true, gapAfter: 1 })
  lines.push({ text: `Proposal link: ${input.publicUrl || '-'}`, color: DEFAULT_MUTED, gapAfter: 1 })

  return lines
}

const buildPdfFromPageStreams = (streams: string[]) => {
  const pageCount = streams.length
  const pageIds = Array.from({ length: pageCount }, (_, index) => 3 + index * 2)
  const contentIds = pageIds.map((pageId) => pageId + 1)
  const fontRegularId = 3 + pageCount * 2
  const fontBoldId = fontRegularId + 1

  const objects: string[] = []
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`)

  for (let index = 0; index < pageCount; index += 1) {
    const pageId = pageIds[index]
    const contentId = contentIds[index]
    const contentStream = streams[index]
    const contentLength = getByteLength(contentStream)

    objects[pageId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    objects[contentId - 1] = `<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream`
  }

  objects[fontRegularId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[fontBoldId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

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

export const buildProposalPdf = (input: ProposalPdfInput) => {
  const accentColor = normalizeColor(input.accentColor, DEFAULT_ACCENT)
  const textColor = normalizeColor(input.textColor, DEFAULT_TEXT)
  const backgroundColor = normalizeColor(input.backgroundColor, DEFAULT_BACKGROUND)
  const mutedColor = DEFAULT_MUTED
  const generatedAt = new Date().toISOString()
  const lines = buildDocumentLines(input)

  const pages: Array<{ commands: string[]; isFirst: boolean }> = []

  const createPage = (isFirst: boolean) => {
    const commands: string[] = []
    drawRect(commands, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, backgroundColor)

    if (isFirst) {
      const headerHeight = 82
      const headerBottom = PAGE_HEIGHT - MARGIN - headerHeight
      drawRect(commands, MARGIN, headerBottom, CONTENT_WIDTH, headerHeight, accentColor)
      drawText(commands, input.title || 'Proposal', MARGIN + 16, headerBottom + 50, {
        size: 20,
        bold: true,
        color: '#FFFFFF',
      })
      drawText(commands, `Prepared for: ${input.clientName || 'Customer'}`, MARGIN + 16, headerBottom + 28, {
        size: 11,
        color: '#FFFFFF',
      })
      drawText(commands, `Status: ${(input.status || 'signed').toUpperCase()}`, PAGE_WIDTH - MARGIN - 160, headerBottom + 28, {
        size: 10,
        bold: true,
        color: '#FFFFFF',
      })

      const metaBottom = headerBottom - 58
      drawRect(commands, MARGIN, metaBottom, CONTENT_WIDTH, 48, '#F4F7FC')
      drawText(commands, `Signer: ${input.signerName || '-'}`, MARGIN + 16, metaBottom + 29, {
        size: 10,
        color: mutedColor,
      })
      drawText(commands, `Signed at: ${formatIsoDate(input.signedAt)}`, MARGIN + 210, metaBottom + 29, {
        size: 10,
        color: mutedColor,
      })
      drawText(commands, `Total: ${toMoney(input.total, input.currency)}`, PAGE_WIDTH - MARGIN - 160, metaBottom + 29, {
        size: 10,
        bold: true,
        color: textColor,
      })

      return { commands, y: metaBottom - 18 }
    }

    drawText(commands, input.title || 'Proposal', MARGIN, PAGE_HEIGHT - MARGIN - 10, {
      size: 11,
      bold: true,
      color: textColor,
    })
    drawRule(commands, MARGIN, PAGE_HEIGHT - MARGIN - 16, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN - 16, '#D9E0EC', 1)

    return { commands, y: PAGE_HEIGHT - MARGIN - 34 }
  }

  let pageState = createPage(true)
  pages.push({ commands: pageState.commands, isFirst: true })

  const ensureSpace = (requiredHeight: number) => {
    if (pageState.y - requiredHeight >= MARGIN + 28) {
      return
    }
    pageState = createPage(false)
    pages.push({ commands: pageState.commands, isFirst: false })
  }

  for (const line of lines) {
    const size = line.size ?? 11
    const indent = line.indent ?? 0
    const color = normalizeColor(line.color, textColor)
    const maxChars = getWrapLimit(size, CONTENT_WIDTH - indent)
    const wrappedLines = wrapText(line.text, maxChars)
    const lineHeight = Math.max(13, size + 3)
    const beforeGap = line.gapBefore ?? 0
    const afterGap = line.gapAfter ?? 0

    if (beforeGap > 0) {
      ensureSpace(beforeGap)
      pageState.y -= beforeGap
    }

    for (const wrapped of wrappedLines) {
      ensureSpace(lineHeight)
      drawText(pageState.commands, wrapped, MARGIN + indent, pageState.y, {
        size,
        bold: line.bold,
        color,
      })
      pageState.y -= lineHeight
    }

    if (afterGap > 0) {
      ensureSpace(afterGap)
      pageState.y -= afterGap
    }
  }

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]
    const footerY = MARGIN - 10
    drawRule(page.commands, MARGIN, footerY + 12, PAGE_WIDTH - MARGIN, footerY + 12, '#E2E8F3', 1)
    drawText(page.commands, `Generated at: ${generatedAt}`, MARGIN, footerY, {
      size: 9,
      color: mutedColor,
    })
    drawText(page.commands, `Page ${index + 1}/${pages.length}`, PAGE_WIDTH - MARGIN - 56, footerY, {
      size: 9,
      color: mutedColor,
    })
  }

  const pageStreams = pages.map((page) => page.commands.join('\n'))
  return buildPdfFromPageStreams(pageStreams)
}
