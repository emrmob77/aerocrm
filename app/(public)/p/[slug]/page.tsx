import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { CountdownTimer, ProposalViewTracker, SignatureBlock } from './client'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'

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

const formatCurrency = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: locale.startsWith('en') ? 'USD' : 'TRY',
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

export default async function PublicProposalPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale() === 'en' ? 'en-US' : 'tr-TR'
  const slug = params.slug

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, blocks, design_settings, status, public_url, expires_at, contact:contacts(full_name)')
    .like('public_url', `%/p/${slug}`)
    .maybeSingle()

  if (error || !proposal) {
    notFound()
  }

  const blocks = (proposal.blocks ?? []) as ProposalBlock[]
  const designSettings = sanitizeProposalDesignSettings((proposal as { design_settings?: unknown }).design_settings)
  const proposalPdfUrl = `/api/proposals/pdf?slug=${encodeURIComponent(slug)}`
  const expiresAt = proposal.expires_at ? new Date(proposal.expires_at) : null
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false
  const contactName = (proposal.contact as { full_name?: string } | null)?.full_name ?? t('header.customerFallback')
  const total = blocks
    .filter((block) => block.type === 'pricing')
    .flatMap((block) => block.data.items)
    .reduce((sum, item) => sum + item.qty * item.price, 0)

  const badge = getBadge(t, String(proposal.status ?? 'pending'), isExpired)

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#0d121c]">
      {!isExpired && <ProposalViewTracker slug={slug} />}
      <header className="px-4 sm:px-6 pt-8 pb-6">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#48679d]">{t('publicProposal.header.kicker')}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{proposal.title}</h1>
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

      <main className="px-4 sm:px-6 pb-16">
        <div className="mx-auto w-full max-w-5xl grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-3xl bg-white shadow-xl border border-[#e7ebf4] overflow-hidden">
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
                <div className="flex flex-col gap-6 py-10 px-6 sm:px-10">
                  {blocks.map((block) => (
                    <div key={block.id} className="overflow-hidden" style={{ borderRadius: `${designSettings.radius}px` }}>
                      <BlockContent
                        block={block}
                        slug={slug}
                        pdfUrl={proposalPdfUrl}
                        t={t}
                        formatCurrency={(value) => formatCurrency(locale, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#e7ebf4] bg-white p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#48679d]">{t('publicProposal.summary.title')}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-500">{t('publicProposal.summary.total')}</span>
                <span className="text-lg font-extrabold text-[#0d121c]">{formatCurrency(locale, total)}</span>
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
          </aside>
        </div>
      </main>
    </div>
  )
}

function BlockContent({
  block,
  slug,
  pdfUrl,
  t,
  formatCurrency,
}: {
  block: ProposalBlock
  slug: string
  pdfUrl: string
  t: (key: string, vars?: Record<string, string | number>) => string
  formatCurrency: (value: number) => string
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
                <tr key={item.id}>
                  <td className="py-4 px-4 font-medium text-[color:var(--proposal-text)]">{item.name}</td>
                  <td className="py-4 px-4 text-center">{item.qty}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {formatCurrency(item.qty * item.price)}
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
                  {formatCurrency(total)}
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
