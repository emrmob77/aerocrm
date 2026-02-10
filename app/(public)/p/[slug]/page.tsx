import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { CountdownTimer, ProposalViewTracker, SignatureBlock } from './client'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import {
  buildProposalSmartVariableMap,
  getProposalPricingSummary,
  resolveSmartVariablesInJson,
  resolveSmartVariablesInText,
} from '@/lib/proposals/smart-variables'

export const revalidate = 0

type HeroData = {
  title: string
  subtitle: string
  backgroundUrl: string
}

type TextData = {
  content: string
}

type HeadingData = {
  text: string
  level: 'h1' | 'h2' | 'h3'
  align: 'left' | 'center' | 'right'
}

type PricingItem = {
  id: string
  name: string
  qty: number
  price: number
  currency?: string
}

type PricingData = {
  items: PricingItem[]
}

type VideoData = {
  url: string
  title: string
}

type GalleryImage = {
  id: string
  url: string
  caption?: string
}

type GalleryData = {
  columns: number
  images: GalleryImage[]
}

type TestimonialData = {
  quote: string
  author: string
  role: string
  avatarUrl: string
}

type TimelineItem = {
  id: string
  title: string
  description: string
  date: string
}

type TimelineData = {
  items: TimelineItem[]
}

type CountdownData = {
  label: string
  days: number
  hours: number
  minutes: number
}

type CtaData = {
  label: string
  url: string
  variant: 'primary' | 'secondary' | 'outline'
}

type SignatureData = {
  label: string
  required: boolean
  signatureImage?: string
  signedName?: string
  signedAt?: string
}

type ProposalBlock =
  | { id: string; type: 'hero'; data: HeroData }
  | { id: string; type: 'heading'; data: HeadingData }
  | { id: string; type: 'text'; data: TextData }
  | { id: string; type: 'pricing'; data: PricingData }
  | { id: string; type: 'video'; data: VideoData }
  | { id: string; type: 'gallery'; data: GalleryData }
  | { id: string; type: 'testimonial'; data: TestimonialData }
  | { id: string; type: 'timeline'; data: TimelineData }
  | { id: string; type: 'countdown'; data: CountdownData }
  | { id: string; type: 'cta'; data: CtaData }
  | { id: string; type: 'signature'; data: SignatureData }

const formatCurrency = (locale: string, value: number, currency?: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency?.trim() || (locale.startsWith('en') ? 'USD' : 'TRY'),
    maximumFractionDigits: 0,
  }).format(value)

const getEmbedUrl = (url: string) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`
    }
    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (host.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (id) return `https://player.vimeo.com/video/${id}`
    }
    if (host.includes('loom.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      if (id) return `https://www.loom.com/embed/${id}`
    }
  } catch {
    return ''
  }
  return url
}

const getBadge = (t: (key: string) => string, status: string, isExpired: boolean) => {
  if (isExpired) {
    return { label: t('publicProposal.badges.expired'), className: 'bg-red-100 text-red-600' }
  }
  switch (status) {
    case 'signed':
      return { label: t('publicProposal.badges.signed'), className: 'bg-green-100 text-green-700' }
    case 'viewed':
      return { label: t('publicProposal.badges.viewed'), className: 'bg-blue-100 text-blue-700' }
    case 'draft':
      return { label: t('publicProposal.badges.draft'), className: 'bg-gray-100 text-gray-600' }
    default:
      return { label: t('publicProposal.badges.sent'), className: 'bg-amber-100 text-amber-700' }
  }
}

export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams?: { print?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale() === 'en' ? 'en-US' : 'tr-TR'
  const slug = params.slug
  const isPrintMode = searchParams?.print === '1'

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, blocks, design_settings, status, public_url, expires_at, contact:contacts(full_name)')
    .like('public_url', `%/p/${slug}`)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !proposal) {
    notFound()
  }

  const rawBlocks = (Array.isArray(proposal.blocks) ? proposal.blocks : []) as ProposalBlock[]
  const designSettings = sanitizeProposalDesignSettings((proposal as { design_settings?: unknown }).design_settings)
  const proposalPdfUrl = `/api/proposals/pdf?slug=${encodeURIComponent(slug)}`
  const expiresAt = proposal.expires_at ? new Date(proposal.expires_at) : null
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false
  const contactName = (proposal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback')
  const pricingSummary = getProposalPricingSummary(rawBlocks, locale.startsWith('en') ? 'USD' : 'TRY')
  const formattedDate = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
  const smartVariableMap = buildProposalSmartVariableMap({
    clientName: contactName,
    proposalNumber: proposal.id,
    formattedDate,
    totalFormatted: formatCurrency(locale, pricingSummary.total, pricingSummary.currency),
  })
  const title = resolveSmartVariablesInText(proposal.title ?? t('api.proposals.fallbackTitle'), smartVariableMap)
  const blocks = resolveSmartVariablesInJson(rawBlocks, smartVariableMap) as ProposalBlock[]

  const badge = getBadge(t, String(proposal.status ?? 'pending'), isExpired)

  return (
    <div className={`min-h-screen bg-[#f4f6fb] text-[#0d121c] ${isPrintMode ? 'proposal-print-root' : ''}`}>
      {isPrintMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .proposal-print-root {
            min-height: auto !important;
            background: #ffffff !important;
          }

          .proposal-print-header {
            padding: 0 0 8mm 0 !important;
            page-break-inside: avoid;
            break-inside: avoid-page;
          }

          .proposal-print-main {
            padding: 0 !important;
          }

          .proposal-print-container {
            max-width: 190mm !important;
            margin: 0 auto !important;
            display: block !important;
          }

          .proposal-print-section {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .proposal-print-content {
            padding: 0 !important;
            gap: 5mm !important;
          }

          .proposal-print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid-page;
          }

          .proposal-print-pricing-row {
            page-break-inside: avoid;
            break-inside: avoid-page;
          }

          img {
            max-width: 100% !important;
            height: auto !important;
          }
        ` }} />
      )}
      {!isExpired && !isPrintMode && <ProposalViewTracker slug={slug} />}
      <header className={`px-4 sm:px-6 pt-8 pb-6 ${isPrintMode ? 'proposal-print-header' : ''}`}>
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#48679d]">{t('publicProposal.header.kicker')}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{title}</h1>
            <p className="text-sm text-gray-500">
              {t('publicProposal.header.preparedFor', { name: contactName })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>{badge.label}</span>
            {expiresAt && (
              <span className="text-xs text-gray-500">
                {t('publicProposal.header.expiresAt')}{' '}
                {new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(expiresAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className={`px-4 sm:px-6 pb-16 ${isPrintMode ? 'proposal-print-main' : ''}`}>
        <div className={`mx-auto w-full max-w-5xl grid gap-6 ${isPrintMode ? 'proposal-print-container' : 'lg:grid-cols-[minmax(0,1fr)_280px]'}`}>
          <section className={`rounded-3xl bg-white border border-[#e7ebf4] overflow-hidden ${isPrintMode ? 'proposal-print-section' : 'shadow-xl'}`}>
            {isExpired ? (
              <div className="p-10 text-center space-y-3">
                <div className="mx-auto size-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">schedule</span>
                </div>
                <h2 className="text-xl font-bold">{t('publicProposal.expired.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('publicProposal.expired.description')}
                </p>
              </div>
            ) : (
              <div
                className="bg-[color:var(--proposal-bg)] text-[color:var(--proposal-text)]"
                style={{
                  ['--proposal-bg' as never]: designSettings.background,
                  ['--proposal-text' as never]: designSettings.text,
                  ['--proposal-accent' as never]: designSettings.accent,
                  borderRadius: `${designSettings.radius}px`,
                  fontSize: `${designSettings.fontScale}%`,
                }}
              >
                <div className={`flex flex-col gap-6 px-6 sm:px-10 ${isPrintMode ? 'py-8 proposal-print-content' : 'py-10'}`}>
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className={`overflow-hidden ${
                        isPrintMode && block.type !== 'text' && block.type !== 'timeline' && block.type !== 'pricing'
                          ? 'proposal-print-avoid-break'
                          : ''
                      }`}
                      style={{ borderRadius: `${designSettings.radius}px` }}
                    >
                      <BlockContent
                        block={block}
                        slug={slug}
                        pdfUrl={proposalPdfUrl}
                        isPrintMode={isPrintMode}
                        t={t}
                        formatCurrency={(value, currency) => formatCurrency(locale, value, currency)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {!isPrintMode && <aside className="space-y-4">
            <div className="rounded-2xl border border-[#e7ebf4] bg-white p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#48679d]">{t('publicProposal.summary.title')}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-500">{t('publicProposal.summary.total')}</span>
                <span className="text-lg font-extrabold text-[#0d121c]">
                  {formatCurrency(locale, pricingSummary.total, pricingSummary.currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="material-symbols-outlined text-[16px]">person</span>
                {contactName}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7ebf4] bg-white p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#48679d]">{t('publicProposal.help.title')}</p>
              <p className="text-sm text-gray-500">
                {t('publicProposal.help.description')}
              </p>
              <button className="w-full rounded-xl bg-[#0d121c] text-white py-2 text-sm font-semibold">
                {t('publicProposal.help.cta')}
              </button>
            </div>
          </aside>}
        </div>
      </main>
    </div>
  )
}

function BlockContent({
  block,
  slug,
  pdfUrl,
  isPrintMode,
  t,
  formatCurrency,
}: {
  block: ProposalBlock
  slug: string
  pdfUrl: string
  isPrintMode: boolean
  t: (key: string, vars?: Record<string, string | number>) => string
  formatCurrency: (value: number, currency?: string) => string
}) {
  const headingSizeMap: Record<HeadingData['level'], string> = {
    h1: 'text-3xl',
    h2: 'text-2xl',
    h3: 'text-xl',
  }

  const headingAlignMap: Record<HeadingData['align'], string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  if (block.type === 'hero') {
    return (
      <div
        className="bg-cover bg-center h-80 flex items-end p-10 text-white relative rounded-2xl"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,0.2), rgba(15,23,42,0.7)), url(\"${block.data.backgroundUrl}\")`,
        }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{block.data.title}</h1>
          <p className="text-lg text-gray-200 opacity-90">{block.data.subtitle}</p>
        </div>
      </div>
    )
  }

  if (block.type === 'heading') {
    return (
      <div className={`p-8 ${headingAlignMap[block.data.align]}`}>
        <p className={`${headingSizeMap[block.data.level]} font-bold tracking-tight`}>
          {block.data.text}
        </p>
      </div>
    )
  }

  if (block.type === 'text') {
    return <div className="p-8 leading-relaxed text-[color:var(--proposal-text)]">{block.data.content}</div>
  }

  if (block.type === 'pricing') {
    const total = block.data.items.reduce((sum, item) => sum + item.qty * item.price, 0)
    const blockCurrency = block.data.items.find((item) => item.currency?.trim())?.currency
    return (
      <div className="p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[color:var(--proposal-text)]">
          <span className="material-symbols-outlined text-[color:var(--proposal-accent)]">shopping_cart</span>
          {t('publicProposal.pricing.title')}
        </h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('publicProposal.pricing.columns.product')}
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('publicProposal.pricing.columns.qty')}
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('publicProposal.pricing.columns.unit')}
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('publicProposal.pricing.columns.total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {block.data.items.map((item) => (
                <tr key={item.id} className={isPrintMode ? 'proposal-print-pricing-row' : undefined}>
                  <td className="py-4 px-4 font-medium text-[color:var(--proposal-text)]">{item.name}</td>
                  <td className="py-4 px-4 text-center">{item.qty}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(item.price, item.currency || blockCurrency)}</td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {formatCurrency(item.qty * item.price, item.currency || blockCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="py-4 px-4 text-right font-semibold">
                  {t('publicProposal.pricing.total')}
                </td>
                <td className="py-4 px-4 text-right font-bold text-[color:var(--proposal-accent)] text-lg">
                  {formatCurrency(total, blockCurrency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  if (block.type === 'video') {
    const embedUrl = getEmbedUrl(block.data.url)
    return (
      <div className="p-8 space-y-4">
        <h3 className="text-lg font-bold">{block.data.title}</h3>
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
              {t('publicProposal.videoUnavailable')}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'gallery') {
    const columns = Math.min(3, Math.max(1, block.data.columns))
    return (
      <div className="p-8 space-y-4">
        <h3 className="text-lg font-bold text-[color:var(--proposal-text)]">{t('publicProposal.gallery.title')}</h3>
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {block.data.images.map((image) => (
            <div key={image.id} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <Image
                src={image.url}
                alt={image.caption || t('publicProposal.gallery.imageAlt')}
                width={600}
                height={160}
                className="w-full h-40 object-cover"
                loading={isPrintMode ? 'eager' : undefined}
                unoptimized
              />
              {image.caption && (
                <div className="px-3 py-2 text-xs text-gray-500 bg-white">{image.caption}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'testimonial') {
    return (
      <div className="p-8 bg-[#f8fafc] rounded-2xl border border-[#e7ebf4]">
        <span className="material-symbols-outlined text-3xl text-[color:var(--proposal-accent)] mb-2">format_quote</span>
        <p className="text-lg italic text-[color:var(--proposal-text)]">"{block.data.quote}"</p>
        <div className="mt-4 flex items-center gap-3">
          <Image
            src={block.data.avatarUrl}
            alt={block.data.author}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
            loading={isPrintMode ? 'eager' : undefined}
            unoptimized
          />
          <div>
            <p className="text-sm font-semibold text-[color:var(--proposal-text)]">{block.data.author}</p>
            <p className="text-xs text-gray-500">{block.data.role}</p>
          </div>
        </div>
      </div>
    )
  }

  if (block.type === 'timeline') {
    return (
      <div className="p-8 space-y-4">
        <h3 className="text-lg font-bold text-[color:var(--proposal-text)]">{t('publicProposal.timeline.title')}</h3>
        <div className="space-y-3">
          {block.data.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="size-2 rounded-full bg-[color:var(--proposal-accent)]"></div>
                <div className="h-full w-px bg-gray-200"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--proposal-text)]">{item.title}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
                <p className="text-xs text-primary mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'countdown') {
    return (
      <div className="p-8">
        <CountdownTimer
          label={block.data.label}
          days={block.data.days}
          hours={block.data.hours}
          minutes={block.data.minutes}
        />
      </div>
    )
  }

  if (block.type === 'cta') {
    const styleMap = {
      primary: 'bg-[color:var(--proposal-accent)] text-white',
      secondary: 'bg-[#0f172a] text-white',
      outline: 'border border-[color:var(--proposal-accent)] text-[color:var(--proposal-accent)]',
    }
    return (
      <div className="p-8 text-center">
        <a
          href={block.data.url}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-sm ${styleMap[block.data.variant]}`}
        >
          {block.data.label}
        </a>
      </div>
    )
  }

  if (block.type === 'signature') {
    if (isPrintMode) {
      const signedAt = block.data.signedAt
      const signedAtText =
        signedAt && !Number.isNaN(Date.parse(signedAt))
          ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(signedAt))
          : (signedAt || '-')
      return (
        <div className="p-8 rounded-xl border border-[#d7ddea] bg-white space-y-3">
          <p className="text-sm font-semibold text-[#0d121c]">{block.data.label || t('publicProposal.signature.nameLabel')}</p>
          {block.data.signatureImage ? (
            <Image
              src={block.data.signatureImage}
              alt={t('publicProposal.signature.imageAlt')}
              width={360}
              height={120}
              className="h-20 w-auto object-contain"
              loading="eager"
              unoptimized
            />
          ) : (
            <p className="text-sm text-gray-500">{t('publicProposal.signature.requiredHint')}</p>
          )}
          <div className="text-xs text-gray-500 space-y-1">
            <p>{t('publicProposal.signature.nameLabel')}: {block.data.signedName || '-'}</p>
            <p>{t('proposalPreview.signature.dateLabel')}: {signedAtText}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-8">
        <SignatureBlock
          slug={slug}
          pdfUrl={pdfUrl}
          label={block.data.label}
          required={block.data.required}
          existingSignature={{
            image: block.data.signatureImage,
            name: block.data.signedName,
            signedAt: block.data.signedAt,
          }}
        />
      </div>
    )
  }

  return null
}
