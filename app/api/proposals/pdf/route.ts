import { NextResponse } from 'next/server'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildProposalPdf, toPdfFileName } from '@/lib/proposals/pdf'
import {
  buildProposalSmartVariableMap,
  getProposalPricingSummary,
  resolveSmartVariablesInJson,
  resolveSmartVariablesInText,
} from '@/lib/proposals/smart-variables'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import { resolveRequestOrigin } from '@/lib/url/request-origin'

type ProposalBlock = {
  id?: string
  type: string
  data?: Record<string, unknown>
}

const toNumber = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const getPlaywrightExecutablePath = () => {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim()
  if (envPath) {
    return envPath
  }

  const home = os.homedir()
  const cacheRoots = [
    path.join(home, 'Library', 'Caches', 'ms-playwright'),
    path.join(home, '.cache', 'ms-playwright'),
    path.join(home, 'AppData', 'Local', 'ms-playwright'),
  ].filter((root, index, all) => all.indexOf(root) === index)

  const candidates = [
    path.join('chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
    path.join('chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
    path.join('chrome-linux', 'chrome'),
    path.join('chrome-win', 'chrome.exe'),
    path.join('chrome-win64', 'chrome.exe'),
  ]

  for (const cacheRoot of cacheRoots) {
    if (!fs.existsSync(cacheRoot)) {
      continue
    }
    const entries = fs
      .readdirSync(cacheRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('chromium-'))
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a))

    for (const entry of entries) {
      for (const relativeCandidate of candidates) {
        const candidate = path.join(cacheRoot, entry, relativeCandidate)
        if (fs.existsSync(candidate)) {
          return candidate
        }
      }
    }
  }

  return null
}

const renderVisualProposalPdf = async (renderUrl: string) => {
  const { chromium } = await import('@playwright/test')
  const executablePath = getPlaywrightExecutablePath() || undefined
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1810 },
      deviceScaleFactor: 1,
    })
    await page.emulateMedia({ media: 'print' })
    await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null)
    await page.evaluate(async () => {
      const imageElements = Array.from(document.images)
      await Promise.all(
        imageElements.map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) {
                resolve()
                return
              }
              const done = () => resolve()
              image.addEventListener('load', done, { once: true })
              image.addEventListener('error', done, { once: true })
            })
        )
      )

      const documentFonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
      if (documentFonts?.ready) {
        await documentFonts.ready
      }
    })
    await page.waitForTimeout(200)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: 1,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: true,
    })
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const locale = getServerLocale()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim()

  if (!slug) {
    return NextResponse.json({ error: t('api.proposals.slugRequired') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, status, public_url, signed_at, signature_data, design_settings, blocks, contact:contacts(full_name)')
    .like('public_url', `%/p/${slug}`)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  if (proposal.status !== 'signed') {
    return NextResponse.json({ error: t('api.proposals.signatureMissing') }, { status: 400 })
  }

  const rawBlocks = (Array.isArray(proposal.blocks) ? proposal.blocks : []) as ProposalBlock[]
  const contactName = (proposal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback')
  const formattedDate = new Intl.DateTimeFormat(localeCode, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
  const preSummary = getProposalPricingSummary(rawBlocks, locale === 'en' ? 'USD' : 'TRY')
  const formattedTotal = new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: preSummary.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(preSummary.total)
  const smartVariableMap = buildProposalSmartVariableMap({
    clientName: contactName,
    proposalNumber: proposal.id,
    formattedDate,
    totalFormatted: formattedTotal,
  })
  const blocks = resolveSmartVariablesInJson(rawBlocks, smartVariableMap) as ProposalBlock[]
  const pricingSummary = getProposalPricingSummary(blocks, locale === 'en' ? 'USD' : 'TRY')

  const pricingItems = blocks
    .filter((block) => block.type === 'pricing')
    .flatMap((block) => {
      const items = block.data?.items
      return Array.isArray(items) ? items : []
    })
  const normalizedItems = pricingItems.map((item, index) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const qty = toNumber(row.qty)
    const price = toNumber(row.price)
    const currencyValue = typeof row.currency === 'string' && row.currency.trim() ? row.currency.trim() : 'TRY'
    const rawName = typeof row.name === 'string' ? row.name : ''
    const rawUnit = typeof row.unit === 'string' ? row.unit : ''
    return {
      name: resolveSmartVariablesInText(
        rawName.trim() || `${t('proposalPreview.pricing.columns.description')} ${index + 1}`,
        smartVariableMap
      ),
      qty,
      unit: resolveSmartVariablesInText(rawUnit.trim(), smartVariableMap) || null,
      price,
      currency: currencyValue,
      total: qty * price,
    }
  })
  const signatureData = (proposal.signature_data ?? {}) as { name?: string; signed_at?: string }
  const designSettings = sanitizeProposalDesignSettings((proposal as { design_settings?: unknown }).design_settings)
  const resolvedTitle = resolveSmartVariablesInText(proposal.title || t('api.proposals.fallbackTitle'), smartVariableMap)
  const requestOrigin = resolveRequestOrigin(request)
  const visualRenderUrl = `${requestOrigin}/p/${encodeURIComponent(slug)}?print=1`
  const fileName = toPdfFileName(resolvedTitle, slug)
  const legacyFallbackEnabled = process.env.AEROCRM_PDF_LEGACY_FALLBACK === '1'

  try {
    const visualPdfBytes = await renderVisualProposalPdf(visualRenderUrl)
    return new NextResponse(visualPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(visualPdfBytes.byteLength),
        'Content-Transfer-Encoding': 'binary',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    })
  } catch (visualPdfError) {
    console.error('Visual proposal PDF rendering failed:', {
      slug,
      proposalId: proposal.id,
      error: visualPdfError,
    })
    if (!legacyFallbackEnabled) {
      return NextResponse.json(
        { error: 'Visual PDF renderer unavailable. Run: npx playwright install chromium' },
        { status: 500 }
      )
    }
  }

  const pdfBytes = buildProposalPdf({
    title: resolvedTitle,
    clientName: contactName,
    publicUrl: proposal.public_url || '',
    status: proposal.status || 'signed',
    signedAt: signatureData.signed_at || proposal.signed_at,
    signerName: signatureData.name || null,
    total: pricingSummary.total,
    currency: pricingSummary.currency,
    lineItems: normalizedItems,
    blocks,
    accentColor: designSettings.accent,
    textColor: designSettings.text,
    backgroundColor: designSettings.background,
  })

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(pdfBytes.byteLength),
      'Content-Transfer-Encoding': 'binary',
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
})
