'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSupabase, useUser } from '@/hooks'
import { useI18n } from '@/lib/i18n'
import { appendSmartVariableToBlock, insertBlockAt } from '@/lib/proposals/editor-utils'
import {
  defaultProposalDesignSettings,
  sanitizeProposalDesignSettings,
  type ProposalDesignSettings,
} from '@/lib/proposals/design-utils'
import { sectorTemplatePresets } from '@/lib/proposals/sector-templates'

type BlockType =
  | 'hero'
  | 'heading'
  | 'text'
  | 'pricing'
  | 'video'
  | 'gallery'
  | 'testimonial'
  | 'timeline'
  | 'countdown'
  | 'cta'
  | 'signature'

type BlockFrameStyle = {
  blockBg?: string
  borderColor?: string
  borderWidth?: number
  radius?: number
  paddingX?: number
  paddingY?: number
  shadowLevel?: 0 | 1 | 2 | 3
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  fontSize?: number
  fontWeight?: 400 | 500 | 600 | 700 | 800
  italic?: boolean
  lineHeight?: number
}

type HeroData = {
  title: string
  subtitle: string
  backgroundUrl: string
  style?: {
    overlayOpacity?: number
    textColor?: string
    contentAlign?: 'left' | 'center' | 'right'
    height?: number
  } & BlockFrameStyle
}

type TextData = {
  content: string
  style?: {
    textColor?: string
    fontSize?: number
    lineHeight?: number
    align?: 'left' | 'center' | 'right'
    verticalAlign?: 'top' | 'center' | 'bottom'
    fontWeight?: 400 | 500 | 600 | 700 | 800
    italic?: boolean
  } & BlockFrameStyle
}

type HeadingData = {
  text: string
  level: 'h1' | 'h2' | 'h3'
  align: 'left' | 'center' | 'right'
  style?: {
    textColor?: string
    letterSpacing?: number
    fontWeight?: 500 | 600 | 700 | 800
    italic?: boolean
    fontSize?: number
  } & BlockFrameStyle
}

type PricingItem = {
  id: string
  name: string
  qty: number
  unit?: string
  price: number
  currency?: string
  productId?: string
}

type PricingData = {
  source: 'crm' | 'manual'
  columns: {
    description: boolean
    quantity: boolean
    unit: boolean
    unitPrice: boolean
    total: boolean
  }
  items: PricingItem[]
  style?: {
    surfaceColor?: string
    headerColor?: string
    headerTextColor?: string
  } & BlockFrameStyle
}

type ProductOption = {
  id: string
  name: string
  price: number
  currency: string
  category: string | null
  active: boolean
}

type ContactOption = {
  id: string
  full_name: string | null
  company: string | null
  email: string | null
  phone: string | null
}

type SignatureData = {
  label: string
  required: boolean
  style?: {
    borderColor?: string
    iconColor?: string
    backgroundColor?: string
  } & BlockFrameStyle
}

type VideoData = {
  url: string
  title: string
  style?: {
    borderColor?: string
    borderRadius?: number
  } & BlockFrameStyle
}

type GalleryImage = {
  id: string
  url: string
  caption: string
}

type GalleryData = {
  columns: 2 | 3
  images: GalleryImage[]
  style?: {
    gap?: number
    imageRadius?: number
  } & BlockFrameStyle
}

type TestimonialData = {
  quote: string
  author: string
  role: string
  avatarUrl: string
  style?: {
    quoteColor?: string
    accentColor?: string
    backgroundColor?: string
  } & BlockFrameStyle
}

type TimelineItem = {
  id: string
  title: string
  description: string
  date: string
}

type TimelineData = {
  items: TimelineItem[]
  style?: {
    lineColor?: string
    dotColor?: string
    dateColor?: string
  } & BlockFrameStyle
}

type CountdownData = {
  label: string
  days: number
  hours: number
  minutes: number
  style?: {
    cardColor?: string
    numberColor?: string
  } & BlockFrameStyle
}

type CtaData = {
  label: string
  url: string
  variant: 'primary' | 'secondary' | 'outline'
  style?: {
    bgColor?: string
    textColor?: string
    borderColor?: string
    borderRadius?: number
  } & BlockFrameStyle
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

type PaletteItem = {
  id: BlockType
  label: string
  icon: string
  group: 'basic' | 'content' | 'action'
}

type TemplatePreset = {
  id: string
  name: string
  description: string
  title: string
  design: ProposalDesignSettings
  build: () => ProposalBlock[]
}

type TemplateScope = 'team' | 'public' | 'all'

type SavedTemplate = {
  id: string
  name: string
  description: string | null
  category: string | null
  is_public: boolean
  usage_count: number
  blocks: unknown
}

const defaultPricingColumns: PricingData['columns'] = {
  description: true,
  quantity: true,
  unit: true,
  unitPrice: true,
  total: true,
}

const defaultBlockFrameStyle: Pick<BlockFrameStyle, 'radius' | 'shadowLevel' | 'paddingX' | 'paddingY'> = {
  radius: 12,
  shadowLevel: 0,
  paddingX: 32,
  paddingY: 32,
}

const normalizePricingItem = (item: Partial<PricingItem> | null | undefined): PricingItem => ({
  id: item?.id ?? crypto.randomUUID(),
  name: item?.name ?? '',
  qty: Number.isFinite(item?.qty) ? (item?.qty as number) : 1,
  unit: typeof item?.unit === 'string' ? item.unit : '',
  price: Number.isFinite(item?.price) ? (item?.price as number) : 0,
  currency: item?.currency,
  productId: item?.productId,
})

const normalizePricingData = (data: Partial<PricingData> | null | undefined): PricingData => {
  const items = Array.isArray(data?.items) ? data?.items.map((item) => normalizePricingItem(item)) : []
  const columns = { ...defaultPricingColumns, ...(data?.columns ?? {}) }
  const source = data?.source === 'crm' ? 'crm' : 'manual'
  return { source, columns, items }
}

const normalizeGalleryImage = (image: Partial<GalleryImage> | null | undefined): GalleryImage => ({
  id: image?.id ?? crypto.randomUUID(),
  url: image?.url ?? '',
  caption: image?.caption ?? '',
})

const normalizeGalleryData = (data: Partial<GalleryData> | null | undefined): GalleryData => ({
  columns: data?.columns === 3 ? 3 : 2,
  images: Array.isArray(data?.images) ? data?.images.map((image) => normalizeGalleryImage(image)) : [],
})

const normalizeTimelineItem = (item: Partial<TimelineItem> | null | undefined): TimelineItem => ({
  id: item?.id ?? crypto.randomUUID(),
  title: item?.title ?? '',
  description: item?.description ?? '',
  date: item?.date ?? '',
})

const normalizeTimelineData = (data: Partial<TimelineData> | null | undefined): TimelineData => ({
  items: Array.isArray(data?.items) ? data?.items.map((item) => normalizeTimelineItem(item)) : [],
})

const normalizeBlocks = (items: ProposalBlock[]): ProposalBlock[] =>
  items.map((block) => {
    if (block.type === 'pricing') {
      return {
        ...block,
        data: {
          ...normalizePricingData(block.data),
          style: { ...defaultBlockFrameStyle, ...(block.data.style ?? {}) },
        },
      }
    }
    if (block.type === 'gallery') {
      return {
        ...block,
        data: {
          ...normalizeGalleryData(block.data),
          style: { ...defaultBlockFrameStyle, ...(block.data.style ?? {}) },
        },
      }
    }
    if (block.type === 'timeline') {
      return {
        ...block,
        data: {
          ...normalizeTimelineData(block.data),
          style: { ...defaultBlockFrameStyle, ...(block.data.style ?? {}) },
        },
      }
    }

    return {
      ...block,
      data: {
        ...block.data,
        style: { ...defaultBlockFrameStyle, ...(block.data.style ?? {}) },
      },
    } as ProposalBlock
  })

const updateBlock = <T extends ProposalBlock>(block: T, data: Partial<T['data']>): T => ({
  ...block,
  data: { ...block.data, ...data },
})

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

const legacyClientNames = new Set(['abc şirketi', 'abc company'])

const normalizeClientNameValue = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.trim() ?? ''
  if (!normalized) return fallback
  if (legacyClientNames.has(normalized.toLocaleLowerCase('tr-TR'))) {
    return fallback
  }
  return normalized
}

const createTemporaryProposalNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase()
  return `TRF-${year}${month}${day}-${suffix}`
}

export default function ProposalEditorPage() {
  const supabase = useSupabase()
  const { user, authUser, loading: userLoading } = useUser()
  const searchParams = useSearchParams()
  const isTemplateMode = searchParams.get('mode') === 'template'
  const templateId = searchParams.get('templateId')
  const presetId = searchParams.get('presetId')
  const contactId = searchParams.get('contactId')
  const dealId = searchParams.get('dealId')?.trim() || null
  const proposalId = searchParams.get('proposalId')
  const prefillClientNameParam = searchParams.get('clientName')?.trim() || ''
  const prefillContactEmailParam = searchParams.get('contactEmail')?.trim() || ''
  const prefillContactPhoneParam = searchParams.get('contactPhone')?.trim() || ''
  const prefillDealTitleParam = searchParams.get('dealTitle')?.trim() || ''
  const prefillDealCurrencyParam = searchParams.get('dealCurrency')?.trim() || ''
  const prefillDealValueRaw = searchParams.get('dealValue')?.trim()
  const prefillDealValueParam = prefillDealValueRaw ? Number(prefillDealValueRaw) : Number.NaN
  const { t, get, locale } = useI18n()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'

  const formatCurrency = useCallback(
    (value: number, currency = 'TRY') => {
      try {
        return new Intl.NumberFormat(localeCode, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
      } catch {
        return new Intl.NumberFormat(localeCode, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)
      }
    },
    [localeCode]
  )

  const smartVariables = useMemo(
    () => (get('proposalEditor.smartVariables.items') as string[]) ?? [],
    [get]
  )

  const paletteItems = useMemo<PaletteItem[]>(
    () => [
      { id: 'hero', label: t('proposalEditor.palette.hero'), icon: 'image', group: 'basic' },
      { id: 'heading', label: t('proposalEditor.palette.heading'), icon: 'title', group: 'basic' },
      { id: 'text', label: t('proposalEditor.palette.text'), icon: 'notes', group: 'basic' },
      { id: 'pricing', label: t('proposalEditor.palette.pricing'), icon: 'payments', group: 'content' },
      { id: 'video', label: t('proposalEditor.palette.video'), icon: 'play_circle', group: 'content' },
      { id: 'gallery', label: t('proposalEditor.palette.gallery'), icon: 'photo_library', group: 'content' },
      { id: 'testimonial', label: t('proposalEditor.palette.testimonial'), icon: 'format_quote', group: 'content' },
      { id: 'timeline', label: t('proposalEditor.palette.timeline'), icon: 'timeline', group: 'content' },
      { id: 'countdown', label: t('proposalEditor.palette.countdown'), icon: 'timer', group: 'action' },
      { id: 'cta', label: t('proposalEditor.palette.cta'), icon: 'ads_click', group: 'action' },
      { id: 'signature', label: t('proposalEditor.palette.signature'), icon: 'draw', group: 'action' },
    ],
    [t]
  )

  const createBlock = useCallback((type: BlockType): ProposalBlock => {
    const id = crypto.randomUUID()

    if (type === 'hero') {
      return {
        id,
        type,
        data: {
          title: t('proposalEditor.defaults.heroTitle'),
          subtitle: t('proposalEditor.defaults.heroSubtitle'),
          backgroundUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
          style: {
            ...defaultBlockFrameStyle,
            overlayOpacity: 65,
            textColor: '#ffffff',
            contentAlign: 'left',
            height: 320,
          },
        },
      }
    }

    if (type === 'heading') {
      return {
        id,
        type,
        data: {
          text: t('proposalEditor.defaults.headingText'),
          level: 'h2',
          align: 'left',
          style: {
            ...defaultBlockFrameStyle,
            textColor: '#0d121c',
            letterSpacing: 0,
            fontWeight: 700,
            italic: false,
          },
        },
      }
    }

    if (type === 'pricing') {
      return {
        id,
        type,
        data: {
          source: 'crm',
          columns: {
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            total: true,
          },
          items: [
            {
              id: crypto.randomUUID(),
              name: t('proposalEditor.defaults.pricing.primary'),
              qty: 25,
              unit: t('proposalEditor.defaults.pricing.defaultUnit'),
              price: 1200,
              currency: 'TRY',
            },
            {
              id: crypto.randomUUID(),
              name: t('proposalEditor.defaults.pricing.secondary'),
              qty: 1,
              unit: t('proposalEditor.defaults.pricing.defaultUnit'),
              price: 5000,
              currency: 'TRY',
            },
          ],
          style: {
            ...defaultBlockFrameStyle,
            surfaceColor: '#f8fafc',
            headerColor: '#e2e8f0',
            headerTextColor: '#475569',
          },
        },
      }
    }

    if (type === 'video') {
      return {
        id,
        type,
        data: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: t('proposalEditor.defaults.videoTitle'),
          style: {
            ...defaultBlockFrameStyle,
            borderColor: '#e2e8f0',
            borderRadius: 12,
          },
        },
      }
    }

    if (type === 'gallery') {
      return {
        id,
        type,
        data: {
          columns: 3,
          images: [
            {
              id: crypto.randomUUID(),
              url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800',
              caption: t('proposalEditor.defaults.galleryCaptions.team'),
            },
            {
              id: crypto.randomUUID(),
              url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
              caption: t('proposalEditor.defaults.galleryCaptions.insights'),
            },
            {
              id: crypto.randomUUID(),
              url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
              caption: t('proposalEditor.defaults.galleryCaptions.mobile'),
            },
          ],
          style: {
            ...defaultBlockFrameStyle,
            gap: 16,
            imageRadius: 12,
          },
        },
      }
    }

    if (type === 'testimonial') {
      return {
        id,
        type,
        data: {
          quote: t('proposalEditor.defaults.testimonial.quote'),
          author: t('proposalEditor.defaults.testimonial.author'),
          role: t('proposalEditor.defaults.testimonial.role'),
          avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200',
          style: {
            ...defaultBlockFrameStyle,
            quoteColor: '#0d121c',
            accentColor: '#377DF6',
            backgroundColor: '#f8fafc',
          },
        },
      }
    }

    if (type === 'timeline') {
      return {
        id,
        type,
        data: {
          items: [
            {
              id: crypto.randomUUID(),
              title: t('proposalEditor.defaults.timeline.items.0.title'),
              description: t('proposalEditor.defaults.timeline.items.0.description'),
              date: t('proposalEditor.defaults.timeline.items.0.date'),
            },
            {
              id: crypto.randomUUID(),
              title: t('proposalEditor.defaults.timeline.items.1.title'),
              description: t('proposalEditor.defaults.timeline.items.1.description'),
              date: t('proposalEditor.defaults.timeline.items.1.date'),
            },
            {
              id: crypto.randomUUID(),
              title: t('proposalEditor.defaults.timeline.items.2.title'),
              description: t('proposalEditor.defaults.timeline.items.2.description'),
              date: t('proposalEditor.defaults.timeline.items.2.date'),
            },
          ],
          style: {
            ...defaultBlockFrameStyle,
            lineColor: '#dbe2ee',
            dotColor: '#377DF6',
            dateColor: '#64748b',
          },
        },
      }
    }

    if (type === 'countdown') {
      return {
        id,
        type,
        data: {
          label: t('proposalEditor.defaults.countdownLabel'),
          days: 5,
          hours: 12,
          minutes: 30,
          style: {
            ...defaultBlockFrameStyle,
            cardColor: '#ffffff',
            numberColor: '#377DF6',
          },
        },
      }
    }

    if (type === 'cta') {
      return {
        id,
        type,
        data: {
          label: t('proposalEditor.defaults.ctaLabel'),
          url: 'https://cal.com/aero/demo',
          variant: 'primary',
          style: {
            ...defaultBlockFrameStyle,
            bgColor: '#377DF6',
            textColor: '#ffffff',
            borderColor: '#377DF6',
            borderRadius: 10,
          },
        },
      }
    }

    if (type === 'signature') {
      return {
        id,
        type,
        data: {
          label: t('proposalEditor.defaults.signatureLabel'),
          required: true,
          style: {
            ...defaultBlockFrameStyle,
            borderColor: '#cbd5e1',
            iconColor: '#377DF6',
            backgroundColor: '#ffffff',
          },
        },
      }
    }

    return {
      id,
      type,
      data: {
        content: t('proposalEditor.defaults.textContent'),
        style: {
          ...defaultBlockFrameStyle,
          textColor: '#334155',
          fontSize: 16,
          lineHeight: 1.7,
          align: 'left',
          verticalAlign: 'top',
          fontWeight: 400,
          italic: false,
        },
      },
    }
  }, [t])

  const templatePresets = useMemo<TemplatePreset[]>(
    () =>
      sectorTemplatePresets.map((sector) => ({
        id: sector.id,
        name: sector.name,
        description: sector.description,
        title: sector.title,
        design: {
          background: '#ffffff',
          text: '#0f172a',
          accent: sector.accent,
          radius: 12,
          fontScale: 100,
        },
        build: () => [
          updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
            title: sector.heroTitle,
            subtitle: sector.heroSubtitle,
            backgroundUrl: sector.heroImage,
            style: {
              ...defaultBlockFrameStyle,
              overlayOpacity: 62,
              textColor: '#ffffff',
              contentAlign: 'left',
              height: 340,
              shadowLevel: 2,
            },
          }),
          updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
            text: sector.scopeTitle,
            level: 'h2',
            align: 'left',
          }),
          updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
            content: sector.scopeBody,
            style: {
              ...defaultBlockFrameStyle,
              fontSize: 17,
              lineHeight: 1.8,
            },
          }),
          updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
            columns: 3,
            images: sector.gallery.map((image) => ({
              id: crypto.randomUUID(),
              url: image.url,
              caption: image.caption,
            })),
          }),
          updateBlock(createBlock('timeline') as Extract<ProposalBlock, { type: 'timeline' }>, {
            items: [
              { id: crypto.randomUUID(), title: 'Analiz & Keşif', description: 'Mevcut süreç analizi ve hedef KPI tanımı.', date: 'Hafta 1' },
              { id: crypto.randomUUID(), title: 'Kurulum & Uygulama', description: 'Sistem kurulumu, ekip eğitimi ve canlı test.', date: 'Hafta 2-3' },
              { id: crypto.randomUUID(), title: 'Optimizasyon', description: 'Performans takibi ve dönüşüm artırma iyileştirmeleri.', date: 'Hafta 4' },
            ],
          }),
          updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
            source: 'manual',
            items: sector.pricing.map((item) => ({
              id: crypto.randomUUID(),
              name: item.name,
              qty: 1,
              unit: 'paket',
              price: item.price,
              currency: 'TRY',
            })),
            style: {
              ...defaultBlockFrameStyle,
              surfaceColor: '#f8fafc',
              headerColor: '#e2e8f0',
              headerTextColor: '#334155',
              borderWidth: 1,
              borderColor: '#e2e8f0',
            },
          }),
          updateBlock(createBlock('testimonial') as Extract<ProposalBlock, { type: 'testimonial' }>, {
            quote: `${sector.name} alanında benzer projede 90 gün içinde ölçülebilir büyüme sağladık.`,
            author: 'Referans Müşteri',
            role: 'Operasyon Direktörü',
            avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200',
          }),
          updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
            label: 'Proje Toplantısı Planla',
            url: 'https://cal.com/aero/demo',
            variant: 'primary',
            style: {
              ...defaultBlockFrameStyle,
              bgColor: sector.accent,
              borderColor: sector.accent,
              textColor: '#ffffff',
              borderRadius: 12,
              shadowLevel: 1,
            },
          }),
          createBlock('signature'),
        ],
      })),
    [createBlock]
  )
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [contactOptions, setContactOptions] = useState<ContactOption[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false)
  const [documentTitle, setDocumentTitle] = useState(
    () => prefillDealTitleParam || t('proposalEditor.defaults.documentTitle')
  )
  const [activePanel, setActivePanel] = useState<'content' | 'design'>('design')
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canvasPageCount, setCanvasPageCount] = useState(1)
  const canvasMeasureRef = useRef<HTMLDivElement | null>(null)
  const [blocks, setBlocks] = useState<ProposalBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'send'>('edit')
  const [leftPanel, setLeftPanel] = useState<'blocks' | 'templates' | 'order'>('blocks')
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateScope, setTemplateScope] = useState<TemplateScope>('team')
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')
  const [templateIsPublic, setTemplateIsPublic] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [designSettings, setDesignSettings] = useState<ProposalDesignSettings>(defaultProposalDesignSettings)
  const [isStudioFullscreen, setIsStudioFullscreen] = useState(false)
  const hasAppliedPresetFromUrl = useRef(false)
  const [tempProposalNo, setTempProposalNo] = useState('')

  const [proposalMeta, setProposalMeta] = useState(() => {
    const fallbackClientName = t('proposalEditor.defaults.clientName')
    return {
      clientName: normalizeClientNameValue(prefillClientNameParam, fallbackClientName),
      contactEmail: prefillContactEmailParam,
      contactPhone: prefillContactPhoneParam,
    }
  })
  const [linkedDealId, setLinkedDealId] = useState<string | null>(dealId)
  const [linkedDealValue, setLinkedDealValue] = useState<{ value: number; currency: string } | null>(() => {
    if (!Number.isFinite(prefillDealValueParam)) {
      return null
    }
    return {
      value: prefillDealValueParam,
      currency: prefillDealCurrencyParam || (locale === 'en' ? 'USD' : 'TRY'),
    }
  })

  useEffect(() => {
    if (isTemplateMode && editorMode === 'send') {
      setEditorMode('edit')
    }
  }, [isTemplateMode, editorMode])

  useEffect(() => {
    if (!tempProposalNo) {
      setTempProposalNo(createTemporaryProposalNo())
    }
  }, [tempProposalNo])

  useEffect(() => {
    if (dealId) {
      setLinkedDealId(dealId)
    }
  }, [dealId])

  useEffect(() => {
    const fallbackClientName = t('proposalEditor.defaults.clientName')
    setProposalMeta((prev) => ({
      clientName:
        prefillClientNameParam && (!prev.clientName.trim() || prev.clientName === fallbackClientName)
          ? normalizeClientNameValue(prefillClientNameParam, fallbackClientName)
          : prev.clientName,
      contactEmail:
        prefillContactEmailParam && !prev.contactEmail.trim()
          ? prefillContactEmailParam
          : prev.contactEmail,
      contactPhone:
        prefillContactPhoneParam && !prev.contactPhone.trim()
          ? prefillContactPhoneParam
          : prev.contactPhone,
    }))
  }, [prefillClientNameParam, prefillContactEmailParam, prefillContactPhoneParam, t])

  useEffect(() => {
    if (!prefillDealTitleParam) return
    const defaultTitle = t('proposalEditor.defaults.documentTitle')
    setDocumentTitle((prev) => {
      if (!prev.trim() || prev === defaultTitle) {
        return prefillDealTitleParam
      }
      return prev
    })
  }, [prefillDealTitleParam, t])

  useEffect(() => {
    if (!Number.isFinite(prefillDealValueParam)) return
    setLinkedDealValue((prev) => {
      if (prev) return prev
      return {
        value: prefillDealValueParam,
        currency: prefillDealCurrencyParam || (locale === 'en' ? 'USD' : 'TRY'),
      }
    })
  }, [locale, prefillDealCurrencyParam, prefillDealValueParam])

  const loadProductOptions = useCallback(async () => {
    if (!authUser) {
      setProductOptions([])
      return
    }

    setProductsLoading(true)
    let teamId = user?.team_id ?? null

    if (!teamId) {
      const { data: profile } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', authUser.id)
        .maybeSingle()
      teamId = profile?.team_id ?? null
    }

    let query = supabase
      .from('products')
      .select('id, name, price, currency, category, active')
      .order('created_at', { ascending: false })

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query

    if (error) {
      toast.error(error.message || t('products.errors.fetch'))
      setProductOptions([])
      setProductsLoading(false)
      return
    }

    setProductOptions(
      (data ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price ?? 0,
        currency: product.currency ?? 'TRY',
        category: product.category ?? null,
        active: product.active ?? true,
      }))
    )
    setProductsLoading(false)
  }, [authUser, supabase, t, user?.team_id])

  const loadContactOptions = useCallback(async () => {
    if (!authUser) {
      setContactOptions([])
      return
    }

    setContactsLoading(true)
    let teamId = user?.team_id ?? null

    if (!teamId) {
      const { data: profile } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', authUser.id)
        .maybeSingle()
      teamId = profile?.team_id ?? null
    }

    let query = supabase
      .from('contacts')
      .select('id, full_name, company, email, phone')
      .order('updated_at', { ascending: false })
      .limit(300)

    if (teamId) {
      query = query.or(`team_id.eq.${teamId},user_id.eq.${authUser.id}`)
    } else {
      query = query.eq('user_id', authUser.id)
    }

    const { data, error } = await query

    if (error) {
      toast.error(error.message || t('common.tryAgain'))
      setContactOptions([])
      setContactsLoading(false)
      return
    }

    setContactOptions((data ?? []) as ContactOption[])
    setContactsLoading(false)
  }, [authUser, supabase, t, user?.team_id])

  useEffect(() => {
    if (userLoading) return
    loadProductOptions()
  }, [loadProductOptions, userLoading])

  useEffect(() => {
    if (userLoading) return
    loadContactOptions()
  }, [loadContactOptions, userLoading])

  useEffect(() => {
    if (userLoading) return
    if (!authUser || !contactId) return
    if (proposalId) return

    const loadContact = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('full_name, company, email, phone, team_id, user_id')
        .eq('id', contactId)
        .maybeSingle()
      if (error || !data) return

      const fallbackClientName = t('proposalEditor.defaults.clientName')
      const clientName = normalizeClientNameValue(
        data.full_name?.trim() || data.company?.trim(),
        fallbackClientName
      )

      setProposalMeta((prev) => ({
        ...prev,
        clientName,
        contactEmail: data.email ?? prev.contactEmail,
        contactPhone: data.phone ?? prev.contactPhone,
      }))
    }

    loadContact()
  }, [authUser, contactId, proposalId, supabase, t, userLoading])

  useEffect(() => {
    if (userLoading) return
    if (!authUser || !dealId) return
    if (proposalId) return

    const loadDealContext = async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('id, title, value, currency, contact_id')
        .eq('id', dealId)
        .maybeSingle()
      if (error || !data?.id) return

      setLinkedDealId(data.id)
      setLinkedDealValue({
        value: Number.isFinite(Number(data.value)) ? Number(data.value) : 0,
        currency: data.currency?.trim() || (locale === 'en' ? 'USD' : 'TRY'),
      })

      if (data.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('full_name, company, email, phone')
          .eq('id', data.contact_id)
          .maybeSingle()

        if (contact) {
          const fallbackClientName = t('proposalEditor.defaults.clientName')
          const clientName = normalizeClientNameValue(
            contact.full_name?.trim() || contact.company?.trim(),
            fallbackClientName
          )

          setProposalMeta((prev) => ({
            ...prev,
            clientName,
            contactEmail: contact.email ?? prev.contactEmail,
            contactPhone: contact.phone ?? prev.contactPhone,
          }))
        }
      }

      setDocumentTitle((prev) => {
        const nextTitle = (data.title ?? '').trim()
        if (!nextTitle) return prev
        if (!prev.trim() || prev === t('proposalEditor.defaults.documentTitle')) {
          return nextTitle
        }
        return prev
      })
    }

    loadDealContext()
  }, [authUser, dealId, locale, proposalId, supabase, t, userLoading])

  const fetchTemplates = useCallback(async (scope: TemplateScope) => {
    setTemplatesLoading(true)
    const response = await fetch(`/api/templates?scope=${scope}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || t('proposalEditor.toasts.templatesFetchFailed'))
      setTemplatesLoading(false)
      return
    }
    setSavedTemplates((payload?.templates ?? []) as SavedTemplate[])
    setTemplatesLoading(false)
  }, [t])

  useEffect(() => {
    if (userLoading) return
    if (!authUser) {
      setSavedTemplates([])
      return
    }

    fetchTemplates(templateScope)
  }, [authUser, userLoading, templateScope, fetchTemplates])

  const [proposalLink, setProposalLink] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [versionHistory, setVersionHistory] = useState<DraftVersion[]>([])
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)

  useEffect(() => {
    if (proposalLink) return
    if (proposalId) return
    if (typeof window === 'undefined') return
    const slug = crypto.randomUUID().split('-')[0]
    setProposalLink(`${window.location.origin}/p/${slug}`)
  }, [proposalId, proposalLink])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const blockMetaMap = useMemo(() => {
    const entries = paletteItems.map(
      (item): [BlockType, { label: string; icon: string }] => [item.id, { label: item.label, icon: item.icon }]
    )
    return new Map(entries)
  }, [paletteItems])

  const filteredProductOptions = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return productOptions
    return productOptions.filter((product) => {
      const category = product.category?.toLowerCase() ?? ''
      return product.name.toLowerCase().includes(query) || category.includes(query)
    })
  }, [productOptions, productSearch])

  const filteredContactOptions = useMemo(() => {
    const query = contactSearch.trim().toLowerCase()
    if (!query) return contactOptions
    return contactOptions.filter((contact) => {
      const fullName = contact.full_name?.toLowerCase() ?? ''
      const company = contact.company?.toLowerCase() ?? ''
      const email = contact.email?.toLowerCase() ?? ''
      const phone = contact.phone?.toLowerCase() ?? ''
      return fullName.includes(query) || company.includes(query) || email.includes(query) || phone.includes(query)
    })
  }, [contactOptions, contactSearch])

  useEffect(() => {
    const query = contactSearch.trim()
    if (!contactPickerOpen || query.length < 2 || !authUser) return

    let isCancelled = false
    const searchContacts = async () => {
      setContactsLoading(true)
      let teamId = user?.team_id ?? null

      if (!teamId) {
        const { data: profile } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', authUser.id)
          .maybeSingle()
        teamId = profile?.team_id ?? null
      }

      const like = `%${query}%`
      let searchQuery = supabase
        .from('contacts')
        .select('id, full_name, company, email, phone')
        .order('updated_at', { ascending: false })
        .limit(40)
        .or(`full_name.ilike.${like},company.ilike.${like},email.ilike.${like},phone.ilike.${like}`)

      if (teamId) {
        searchQuery = searchQuery.or(`team_id.eq.${teamId},user_id.eq.${authUser.id}`)
      } else {
        searchQuery = searchQuery.eq('user_id', authUser.id)
      }

      const { data, error } = await searchQuery
      if (!isCancelled) {
        if (!error && Array.isArray(data)) {
          setContactOptions((prev) => {
            const map = new Map<string, ContactOption>()
            prev.forEach((item) => map.set(item.id, item))
            data.forEach((item) => map.set(item.id, item as ContactOption))
            return Array.from(map.values())
          })
        }
        setContactsLoading(false)
      }
    }

    const timer = window.setTimeout(searchContacts, 220)
    return () => {
      isCancelled = true
      window.clearTimeout(timer)
    }
  }, [authUser, contactPickerOpen, contactSearch, supabase, user?.team_id])

  const handleSelectContact = useCallback((contact: ContactOption) => {
    const fallbackClientName = t('proposalEditor.defaults.clientName')
    const clientName = normalizeClientNameValue(contact.full_name?.trim() || contact.company?.trim(), fallbackClientName)
    setProposalMeta((prev) => ({
      ...prev,
      clientName,
      contactEmail: contact.email ?? prev.contactEmail,
      contactPhone: contact.phone ?? prev.contactPhone,
    }))
    setContactPickerOpen(false)
  }, [t])

  useEffect(() => {
    const element = canvasMeasureRef.current
    if (!element) return

    const pageHeight = 1120
    const measure = () => {
      const totalHeight = Math.max(element.scrollHeight, pageHeight)
      setCanvasPageCount(Math.max(1, Math.ceil(totalHeight / pageHeight)))
    }

    measure()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    }
  }, [blocks, designSettings.fontScale, viewMode, zoomLevel])

  const applyTemplate = (template: TemplatePreset) => {
    setBlocks(normalizeBlocks(template.build()))
    setDesignSettings(template.design)
    setDocumentTitle(template.title)
    setSelectedBlockId(null)
    setEditorMode('edit')
  }

  const applySavedTemplate = useCallback((template: SavedTemplate, trackUsage = true) => {
    let nextBlocks: ProposalBlock[] = []
    if (Array.isArray(template.blocks)) {
      nextBlocks = template.blocks as ProposalBlock[]
    } else if (typeof template.blocks === 'string') {
      try {
        const parsed = JSON.parse(template.blocks)
        if (Array.isArray(parsed)) {
          nextBlocks = parsed as ProposalBlock[]
        }
      } catch {
        nextBlocks = []
      }
    }
    if (nextBlocks.length === 0) {
      toast.error(t('proposalEditor.toasts.templateBlocksMissing'))
      return
    }
    if (trackUsage) {
      void fetch(`/api/templates/${template.id}/use`, { method: 'POST' })
    }
    setBlocks(normalizeBlocks(nextBlocks))
    setDocumentTitle((prev) => template.name || prev)
    setSelectedBlockId(null)
    setEditorMode('edit')
  }, [t])

  const openTemplateModal = () => {
    setTemplateName(documentTitle)
    setTemplateDescription('')
    setTemplateCategory('')
    setTemplateIsPublic(false)
    setTemplateModalOpen(true)
  }

  const loadVersionHistory = useCallback(async (proposalValue: string) => {
    const response = await fetch(`/api/proposals/draft/versions?proposalId=${proposalValue}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || t('proposalEditor.toasts.versionHistoryLoadFailed'))
      return
    }
    setVersionHistory((payload?.versions ?? []) as DraftVersion[])
  }, [t])

  const handleSaveTemplate = async () => {
    if (templateSaving) return
    if (!templateName.trim()) {
      toast.error(t('proposalEditor.toasts.templateNameRequired'))
      return
    }
    if (blocks.length === 0) {
      toast.error(t('proposalEditor.toasts.templateBlocksRequired'))
      return
    }

    setTemplateSaving(true)
    const trimmedDescription = templateDescription.trim()
    const trimmedCategory = templateCategory.trim()
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName.trim(),
        description: trimmedDescription || undefined,
        category: trimmedCategory || undefined,
        is_public: templateIsPublic,
        blocks,
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || t('proposalEditor.toasts.templateSaveFailed'))
      setTemplateSaving(false)
      return
    }

    toast.success(t('proposalEditor.toasts.templateSaved'))
    setTemplateSaving(false)
    setTemplateModalOpen(false)
    setLeftPanel('templates')
    fetchTemplates(templateScope)
  }

  useEffect(() => {
    if (hasAppliedPresetFromUrl.current) return
    if (!presetId || proposalId || templateId) return
    const preset = templatePresets.find((item) => item.id === presetId)
    if (!preset) return
    applyTemplate(preset)
    hasAppliedPresetFromUrl.current = true
  }, [presetId, proposalId, templateId, templatePresets])

  useEffect(() => {
    if (!templateId || proposalId) return
    const loadTemplate = async () => {
      const response = await fetch(`/api/templates/${templateId}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || t('proposalEditor.toasts.templateLoadFailed'))
        return
      }
      const template = payload?.template as SavedTemplate | undefined
      if (!template) {
        toast.error(t('proposalEditor.toasts.templateNotFound'))
        return
      }
      applySavedTemplate(template, true)
    }
    loadTemplate()
  }, [templateId, proposalId, applySavedTemplate, t])

  useEffect(() => {
    if (!proposalId) return
    if (userLoading) return
    if (!authUser) return

    const loadProposal = async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title, blocks, design_settings, public_url, deal_id, contact_id, contacts(full_name, company, email, phone)')
        .eq('id', proposalId)
        .is('deleted_at', null)
        .maybeSingle()

      if (error || !data) {
        toast.error(t('proposalEditor.toasts.proposalLoadFailed'))
        return
      }

      const parseBlocks = (value: unknown): ProposalBlock[] => {
        if (Array.isArray(value)) {
          return value as ProposalBlock[]
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
              return parsed as ProposalBlock[]
            }
          } catch {
            return []
          }
        }
        return []
      }

      const rawBlocks = data.blocks
      let nextBlocks = parseBlocks(rawBlocks)
      if (nextBlocks.length === 0) {
        const { data: latestVersion } = await supabase
          .from('proposal_versions')
          .select('blocks')
          .eq('proposal_id', data.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        nextBlocks = parseBlocks(latestVersion?.blocks)
      }

      if (nextBlocks.length > 0) {
        setBlocks(normalizeBlocks(nextBlocks))
      } else {
        setBlocks(normalizeBlocks([
          createBlock('hero'),
          createBlock('text'),
          createBlock('pricing'),
          createBlock('signature'),
        ]))
      }

      setDesignSettings(sanitizeProposalDesignSettings(data.design_settings))

      let contact = Array.isArray(data.contacts) ? data.contacts[0] : data.contacts
      if (!contact && data.contact_id) {
        const { data: fallbackContact } = await supabase
          .from('contacts')
          .select('full_name, company, email, phone')
          .eq('id', data.contact_id)
          .maybeSingle()
        if (fallbackContact) {
          contact = fallbackContact
        }
      }

      const fallbackClientName = t('proposalEditor.defaults.clientName')
      const contactName = normalizeClientNameValue(
        contact?.full_name?.trim() || contact?.company?.trim(),
        fallbackClientName
      )

      setProposalMeta({
        clientName: contactName,
        contactEmail: contact?.email ?? '',
        contactPhone: contact?.phone ?? '',
      })

      setDraftId(data.id)
      setDocumentTitle(data.title || t('proposalEditor.defaults.documentTitle'))
      setLinkedDealId(data.deal_id ?? null)
      if (data.public_url) {
        setProposalLink(data.public_url)
      }
    }

    loadProposal()
  }, [authUser, createBlock, proposalId, supabase, t, userLoading])

  const handleSaveDraft = useCallback(async (mode: 'manual' | 'auto' = 'manual') => {
    if (isSavingDraft) return
    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/proposals/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: draftId,
          dealId: linkedDealId,
          title: documentTitle,
          clientName: proposalMeta.clientName,
          contactEmail: proposalMeta.contactEmail,
          contactPhone: proposalMeta.contactPhone,
          blocks,
          designSettings,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || t('proposalEditor.toasts.draftSaveFailed'))
      }

      const payload = await response.json().catch(() => null)
      const savedAt = payload?.savedAt || new Date().toISOString()
      const versionId = payload?.versionId || crypto.randomUUID()

      if (payload?.proposalId) {
        setDraftId(payload.proposalId)
      }
      if (payload?.publicUrl) {
        setProposalLink(payload.publicUrl)
      }

      setVersionHistory((prev) => {
        const next = [{ id: versionId, savedAt, title: documentTitle }, ...prev]
        return next.slice(0, 8)
      })
      if (mode === 'manual') {
        toast.success(t('proposalEditor.toasts.draftSaved'))
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : t('proposalEditor.toasts.draftSaveFailed')
      if (mode === 'manual') {
        toast.error(messageText)
      }
    } finally {
      setIsSavingDraft(false)
    }
  }, [
    blocks,
    designSettings,
    documentTitle,
    draftId,
    isSavingDraft,
    linkedDealId,
    proposalMeta.clientName,
    proposalMeta.contactEmail,
    proposalMeta.contactPhone,
    t,
  ])

  useEffect(() => {
    if (!draftId) return
    loadVersionHistory(draftId)
  }, [draftId, loadVersionHistory])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSavingDraft) {
        void handleSaveDraft('auto')
      }
    }, 60_000)

    return () => clearInterval(timer)
  }, [handleSaveDraft, isSavingDraft])

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!versionId || restoringVersionId) return
    setRestoringVersionId(versionId)
    try {
      const response = await fetch('/api/proposals/draft/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || t('proposalEditor.toasts.versionRestoreFailed'))
      }

      const nextBlocks = Array.isArray(payload?.blocks) ? (payload.blocks as ProposalBlock[]) : []
      if (nextBlocks.length > 0) {
        setBlocks(normalizeBlocks(nextBlocks))
      } else {
        setBlocks([])
      }
      setDocumentTitle(payload?.title || t('proposalEditor.defaults.documentTitle'))
      setDesignSettings(sanitizeProposalDesignSettings(payload?.designSettings))
      if (payload?.proposalId) {
        setDraftId(payload.proposalId)
      }
      setSelectedBlockId(null)
      setHistoryOpen(false)
      toast.success(t('proposalEditor.toasts.versionRestored'))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : t('proposalEditor.toasts.versionRestoreFailed')
      toast.error(messageText)
    } finally {
      setRestoringVersionId(null)
    }
  }, [restoringVersionId, t])

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  )

  const updateSelectedBlockStyle = useCallback(
    (updates: Partial<BlockFrameStyle>) => {
      if (!selectedBlock) return
      const style = ((selectedBlock.data as { style?: BlockFrameStyle }).style ?? {}) as BlockFrameStyle
      updateBlockData(selectedBlock.id, { style: { ...style, ...updates } })
    },
    [selectedBlock]
  )

  const handleAddBlock = (type: BlockType, index?: number) => {
    const newBlock = createBlock(type)
    setBlocks((prev) => insertBlockAt(prev, newBlock, index))
    setSelectedBlockId(newBlock.id)
  }

  const handleRemoveBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id))
    if (selectedBlockId === id) {
      setSelectedBlockId(null)
    }
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const next = arrayMove(prev, fromIndex, toIndex)
      setSelectedBlockId(next[toIndex]?.id ?? null)
      return next
    })
  }

  const updateBlockData = (id: string, updates: Partial<ProposalBlock['data']>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? updateBlock(block, updates as Partial<typeof block.data>) : block
      )
    )
  }

  const updatePricingItem = (blockId: string, itemId: string, updates: Partial<PricingItem>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'pricing') return block
        const items = Array.isArray(block.data.items) ? block.data.items : []
        return {
          ...block,
          data: {
            ...block.data,
            items: items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
          },
        }
      })
    )
  }

  const addPricingItem = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'pricing') return block
        const items = Array.isArray(block.data.items) ? block.data.items : []
        return {
          ...block,
          data: {
            ...block.data,
            items: [
              ...items,
              {
                id: crypto.randomUUID(),
                name: t('proposalEditor.defaults.newLineItem'),
                qty: 1,
                unit: t('proposalEditor.defaults.pricing.defaultUnit'),
                price: 0,
                currency: 'TRY',
              },
            ],
          },
        }
      })
    )
  }

  const removePricingItem = (blockId: string, itemId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'pricing') return block
        const items = Array.isArray(block.data.items) ? block.data.items : []
        return {
          ...block,
          data: {
            ...block.data,
            items: items.filter((item) => item.id !== itemId),
          },
        }
      })
    )
  }

  const addProductToPricing = (blockId: string, product: ProductOption) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'pricing') return block

        const items = Array.isArray(block.data.items) ? block.data.items : []
        const existing = items.find(
          (item) => item.productId === product.id || item.name === product.name
        )

        if (existing) {
          return {
            ...block,
            data: {
              ...block.data,
              items: items.map((item) =>
                item.id === existing.id
                  ? {
                      ...item,
                      qty: Math.max(1, item.qty + 1),
                      unit: item.unit ?? t('proposalEditor.defaults.pricing.defaultUnit'),
                      price: product.price,
                      currency: product.currency,
                      productId: product.id,
                    }
                  : item
              ),
            },
          }
        }

        return {
          ...block,
          data: {
            ...block.data,
            items: [
              ...items,
              {
                id: crypto.randomUUID(),
                name: product.name,
                qty: 1,
                unit: t('proposalEditor.defaults.pricing.defaultUnit'),
                price: product.price,
                currency: product.currency,
                productId: product.id,
              },
            ],
          },
        }
      })
    )
  }

  const updateGalleryImage = (blockId: string, imageId: string, updates: Partial<GalleryImage>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'gallery') return block
        const images = Array.isArray(block.data.images) ? block.data.images : []
        return {
          ...block,
          data: {
            ...block.data,
            images: images.map((image) => (image.id === imageId ? { ...image, ...updates } : image)),
          },
        }
      })
    )
  }

  const addGalleryImage = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'gallery') return block
        const images = Array.isArray(block.data.images) ? block.data.images : []
        return {
          ...block,
          data: {
            ...block.data,
            images: [
              ...images,
              {
                id: crypto.randomUUID(),
                url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
                caption: t('proposalEditor.defaults.newImageCaption'),
              },
            ],
          },
        }
      })
    )
  }

  const removeGalleryImage = (blockId: string, imageId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'gallery') return block
        const images = Array.isArray(block.data.images) ? block.data.images : []
        return {
          ...block,
          data: {
            ...block.data,
            images: images.filter((image) => image.id !== imageId),
          },
        }
      })
    )
  }

  const updateTimelineItem = (blockId: string, itemId: string, updates: Partial<TimelineItem>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'timeline') return block
        const items = Array.isArray(block.data.items) ? block.data.items : []
        return {
          ...block,
          data: {
            ...block.data,
            items: items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
          },
        }
      })
    )
  }

  const addTimelineItem = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'timeline') return block
        const items = Array.isArray(block.data.items) ? block.data.items : []
        return {
          ...block,
          data: {
            ...block.data,
            items: [
              ...items,
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.defaults.newTimeline.title'),
                description: t('proposalEditor.defaults.newTimeline.description'),
                date: t('proposalEditor.defaults.newTimeline.date'),
              },
            ],
          },
        }
      })
    )
  }

  const removeTimelineItem = (blockId: string, itemId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'timeline') return block
        const items = Array.isArray(block.data.items) ? block.data.items : []
        return {
          ...block,
          data: {
            ...block.data,
            items: items.filter((item) => item.id !== itemId),
          },
        }
      })
    )
  }

  const insertSmartVariable = (value: string) => {
    if (!selectedBlock) {
      return
    }

    const updatedBlock = appendSmartVariableToBlock(selectedBlock, value)
    if (updatedBlock === selectedBlock) {
      return
    }

    updateBlockData(selectedBlock.id, updatedBlock.data as Partial<ProposalBlock['data']>)
  }

  useEffect(() => {
    if (blocks.length === 0) {
      if (selectedBlockId) setSelectedBlockId(null)
      return
    }
    const exists = selectedBlockId ? blocks.some((block) => block.id === selectedBlockId) : false
    if (!exists) {
      setSelectedBlockId(blocks[0].id)
    }
  }, [blocks, selectedBlockId])

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    if (id.startsWith('palette-')) {
      setActivePaletteId(id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActivePaletteId(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('palette-')) {
      const blockType = active.data.current?.blockType as BlockType | undefined
      if (!blockType) return

      if (overId === 'canvas-drop') {
        handleAddBlock(blockType)
        return
      }

      const overIndex = blocks.findIndex((block) => block.id === overId)
      handleAddBlock(blockType, overIndex >= 0 ? overIndex : undefined)
      return
    }

    if (activeId.startsWith('order-') && overId.startsWith('order-')) {
      const activeBlockId = activeId.replace('order-', '')
      const overBlockId = overId.replace('order-', '')
      if (activeBlockId === overBlockId) return
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((block) => block.id === activeBlockId)
        const newIndex = prev.findIndex((block) => block.id === overBlockId)
        if (oldIndex === -1 || newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
      return
    }
    if (activeId.startsWith('order-') && !overId.startsWith('order-')) {
      return
    }

    if (activeId === overId) return

    const oldIndex = blocks.findIndex((block) => block.id === activeId)
    const newIndex = blocks.findIndex((block) => block.id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    setBlocks((prev) => arrayMove(prev, oldIndex, newIndex))
  }

  const handleDragCancel = () => {
    setActivePaletteId(null)
  }

  const subtotal = blocks
    .filter((block): block is Extract<ProposalBlock, { type: 'pricing' }> => block.type === 'pricing')
    .flatMap((block) => (Array.isArray(block.data.items) ? block.data.items : []))
    .reduce((sum, item) => sum + (item?.qty ?? 0) * (item?.price ?? 0), 0)

  const totalCurrency = useMemo(() => {
    for (const block of blocks) {
      if (block.type !== 'pricing') continue
      const items = Array.isArray(block.data.items) ? block.data.items : []
      const found = items.find((item) => item.currency)
      if (found?.currency) return found.currency
    }
    return locale === 'en' ? 'USD' : 'TRY'
  }, [blocks, locale])

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(localeCode, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    [localeCode]
  )

  const proposalNumber = (draftId ?? proposalId ?? tempProposalNo) || '-'
  const hasPricingTotal = subtotal > 0
  const smartTotalValue = hasPricingTotal ? subtotal : (linkedDealValue?.value ?? 0)
  const smartTotalCurrency = hasPricingTotal
    ? totalCurrency
    : (linkedDealValue?.currency || totalCurrency)

  const smartVariableValues = useMemo(
    () => ({
      '{{Müşteri_Adı}}': proposalMeta.clientName,
      '{{Musteri_Adi}}': proposalMeta.clientName,
      '{{Client_Name}}': proposalMeta.clientName,
      'ABC Şirketi': proposalMeta.clientName,
      'ABC Company': proposalMeta.clientName,
      '{{Teklif_No}}': proposalNumber,
      '{{Proposal_No}}': proposalNumber,
      '{{Tarih}}': formattedDate,
      '{{Date}}': formattedDate,
      '{{Toplam_Tutar}}': formatCurrency(smartTotalValue, smartTotalCurrency),
      '{{Total_Amount}}': formatCurrency(smartTotalValue, smartTotalCurrency),
    }),
    [
      formattedDate,
      formatCurrency,
      proposalMeta.clientName,
      proposalNumber,
      smartTotalCurrency,
      smartTotalValue,
    ]
  )

  const resolveSmartVariables = useCallback(
    (value: string) => {
      if (!value) return value
      return Object.entries(smartVariableValues).reduce(
        (acc, [token, replacement]) => acc.split(token).join(String(replacement ?? '')),
        value
      )
    },
    [smartVariableValues]
  )

  useEffect(() => {
    if (!isStudioFullscreen) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isStudioFullscreen])

  useEffect(() => {
    if (!isStudioFullscreen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStudioFullscreen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isStudioFullscreen])

  const handleToggleStudioFullscreen = useCallback(() => {
    setIsStudioFullscreen((prev) => !prev)
  }, [])

  const designPresets = useMemo(
    () => [
      {
        id: 'executive-blue',
        name: 'Executive Blue',
        settings: {
          background: '#ffffff',
          text: '#0f172a',
          accent: '#2563eb',
          radius: 12,
          fontScale: 100,
        } satisfies ProposalDesignSettings,
      },
      {
        id: 'premium-charcoal',
        name: 'Premium Charcoal',
        settings: {
          background: '#0f172a',
          text: '#f8fafc',
          accent: '#38bdf8',
          radius: 14,
          fontScale: 102,
        } satisfies ProposalDesignSettings,
      },
      {
        id: 'conversion-green',
        name: 'Conversion Green',
        settings: {
          background: '#f8fffb',
          text: '#052e16',
          accent: '#16a34a',
          radius: 16,
          fontScale: 101,
        } satisfies ProposalDesignSettings,
      },
      {
        id: 'warm-contrast',
        name: 'Warm Contrast',
        settings: {
          background: '#fffaf0',
          text: '#3f2305',
          accent: '#f97316',
          radius: 18,
          fontScale: 100,
        } satisfies ProposalDesignSettings,
      },
    ],
    []
  )

  const designScore = useMemo(() => {
    const typeCount = new Set(blocks.map((block) => block.type)).size
    const hasHero = blocks.some((block) => block.type === 'hero')
    const hasPricing = blocks.some((block) => block.type === 'pricing')
    const hasSignature = blocks.some((block) => block.type === 'signature')
    const titleReady = documentTitle.trim().length > 0
    const readiness = [hasHero, hasPricing, hasSignature, titleReady].filter(Boolean).length
    return Math.min(100, Math.round(typeCount * 12 + readiness * 13))
  }, [blocks, documentTitle])

  if (editorMode === 'send') {
    return (
      <div className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8 flex min-h-screen flex-col bg-[#f5f6f8] dark:bg-[#1a212c]">
        <header className="flex h-16 items-center justify-between border-b border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditorMode('edit')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              {t('proposalEditor.actions.backToEdit')}
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <p className="text-xs text-gray-500">{t('proposalEditor.actions.sendTitle')}</p>
              <h2 className="text-sm font-semibold text-[#0d121c] dark:text-white">{documentTitle}</h2>
            </div>
          </div>
          <div className="hidden lg:flex flex-1 justify-center">
            <StepNav mode={editorMode} onChange={setEditorMode} hideSend={isTemplateMode} />
          </div>
          <button
            onClick={() => {
              setEditorMode('preview')
            }}
            className="flex h-10 px-4 items-center justify-center rounded-lg bg-[#e7ebf4] dark:bg-gray-800 text-[#0d121c] dark:text-white text-sm font-bold hover:bg-opacity-80"
          >
            {t('proposalEditor.actions.preview')}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <SendProposalModal
            proposalTitle={documentTitle}
            clientName={proposalMeta.clientName}
            defaultEmail={proposalMeta.contactEmail}
            defaultPhone={proposalMeta.contactPhone}
            proposalLink={proposalLink}
            proposalRecordId={draftId ?? proposalId}
            dealId={linkedDealId}
            resolveText={resolveSmartVariables}
            blocks={blocks}
            designSettings={designSettings}
            onLinkUpdate={setProposalLink}
            onPreview={() => {
              setEditorMode('preview')
            }}
            onClose={() => setEditorMode('edit')}
            layout="page"
          />
        </main>
      </div>
    )
  }

  if (editorMode === 'preview') {
    return (
      <div className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8 flex min-h-screen flex-col bg-[#f5f6f8] dark:bg-[#1a212c]">
        <header className="flex h-16 items-center justify-between border-b border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditorMode('edit')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              {t('proposalEditor.actions.backToEdit')}
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <p className="text-xs text-gray-500">{t('proposalEditor.actions.previewTitle')}</p>
              <h2 className="text-sm font-semibold text-[#0d121c] dark:text-white">{documentTitle}</h2>
            </div>
          </div>
          <div className="hidden lg:flex flex-1 justify-center">
            <StepNav mode={editorMode} onChange={setEditorMode} hideSend={isTemplateMode} />
          </div>
          {isTemplateMode ? (
            <button
              onClick={openTemplateModal}
              className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90"
            >
              {t('proposalEditor.actions.saveTemplate')}
            </button>
          ) : (
            <button
              onClick={() => {
                setEditorMode('send')
              }}
              className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90"
            >
              {t('proposalEditor.actions.send')}
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <div
            className="w-full max-w-[820px] mx-auto bg-[color:var(--proposal-bg)] text-[color:var(--proposal-text)] shadow-xl"
            style={{
              ['--proposal-bg' as never]: designSettings.background,
              ['--proposal-text' as never]: designSettings.text,
              ['--proposal-accent' as never]: designSettings.accent,
              borderRadius: `${designSettings.radius}px`,
              fontSize: `${designSettings.fontScale}%`,
            }}
          >
            <div className="flex flex-col gap-6 py-10 px-10">
              {blocks.map((block) => (
                <div key={block.id} className="rounded-lg overflow-hidden">
                  <BlockContent block={block} resolveText={resolveSmartVariables} />
                </div>
              ))}
            </div>
          </div>
        </main>

      </div>
    )
  }

  return (
    <div
      className={`flex min-h-screen flex-col bg-gradient-to-b from-[#edf4ff] via-[#f5f7fb] to-[#eef3ff] dark:from-[#0c1320] dark:via-[#101722] dark:to-[#0b1220] ${
        isStudioFullscreen
          ? 'fixed inset-0 z-[90] m-0 h-screen w-screen overflow-hidden'
          : '-mx-4 -mt-4 lg:-mx-8 lg:-mt-6 h-[calc(100dvh-1rem)] lg:h-[calc(100dvh-1.5rem)] overflow-hidden'
      }`}
    >
      <header className="relative z-10 border-b border-[#dbe5fa] dark:border-gray-800 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-lg px-6 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/proposals" className="flex size-8 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-primary/20 dark:bg-[#101722]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setContactPickerOpen(false)
                setContactDetailsOpen((prev) => !prev)
              }}
              className="inline-flex h-8 max-w-[220px] items-center gap-1 rounded-md border border-[#dbe5fa] bg-[#f8fbff] px-2 text-[11px] font-semibold text-[#48679d] hover:bg-white dark:border-gray-700 dark:bg-[#111b2d] dark:text-gray-300 dark:hover:bg-[#17243a]"
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span className="truncate">{proposalMeta.clientName || t('proposalEditor.summary.client')}</span>
            </button>
            {contactDetailsOpen && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[min(92vw,360px)] rounded-lg border border-[#dbe5fa] bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#111b2d]">
                <div className="grid grid-cols-1 gap-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6f83ad] dark:text-gray-400">
                      {t('proposalEditor.summary.client')}
                    </span>
                    <input
                      value={proposalMeta.clientName}
                      onChange={(event) =>
                        setProposalMeta((prev) => ({ ...prev, clientName: event.target.value }))
                      }
                      placeholder={t('proposalEditor.summary.client')}
                      className="h-8 w-full rounded-md border border-[#dbe5fa] bg-[#f8fbff] px-2 text-xs text-[#0d121c] outline-none focus:border-primary dark:border-gray-700 dark:bg-[#0f172a] dark:text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6f83ad] dark:text-gray-400">
                      {t('proposalEditor.summary.email')}
                    </span>
                    <input
                      value={proposalMeta.contactEmail}
                      onChange={(event) =>
                        setProposalMeta((prev) => ({ ...prev, contactEmail: event.target.value }))
                      }
                      placeholder="ornek@firma.com"
                      className="h-8 w-full rounded-md border border-[#dbe5fa] bg-[#f8fbff] px-2 text-xs text-[#0d121c] outline-none focus:border-primary dark:border-gray-700 dark:bg-[#0f172a] dark:text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6f83ad] dark:text-gray-400">
                      {t('proposalEditor.summary.phone')}
                    </span>
                    <input
                      value={proposalMeta.contactPhone}
                      onChange={(event) =>
                        setProposalMeta((prev) => ({ ...prev, contactPhone: event.target.value }))
                      }
                      placeholder="+90 5xx xxx xx xx"
                      className="h-8 w-full rounded-md border border-[#dbe5fa] bg-[#f8fbff] px-2 text-xs text-[#0d121c] outline-none focus:border-primary dark:border-gray-700 dark:bg-[#0f172a] dark:text-white"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setContactPickerOpen((prev) => !prev)}
                  className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-[#cfe0ff] bg-[#f3f7ff] text-[11px] font-semibold text-[#315ea7] hover:bg-[#eaf2ff] dark:border-gray-700 dark:bg-[#152237] dark:text-[#9fc2ff] dark:hover:bg-[#1a2c46]"
                >
                  <span className="material-symbols-outlined text-[16px]">contacts</span>
                  {t('proposalEditor.summary.pickClient')}
                </button>
                {contactPickerOpen && (
                  <div className="mt-2 rounded-lg border border-[#dbe5fa] bg-white p-2 dark:border-gray-700 dark:bg-[#111b2d]">
                    <div className="flex items-center gap-2 rounded-lg border border-[#dbe5fa] bg-[#f8fbff] px-2 dark:border-gray-700 dark:bg-[#0f172a]">
                      <span className="material-symbols-outlined text-[16px] text-[#6f83ad]">search</span>
                      <input
                        value={contactSearch}
                        onChange={(event) => setContactSearch(event.target.value)}
                        placeholder={t('proposalEditor.summary.searchClient')}
                        className="h-8 w-full bg-transparent text-xs text-[#0d121c] outline-none dark:text-white"
                      />
                    </div>
                    <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                      {contactsLoading ? (
                        <p className="px-2 py-2 text-xs text-[#6f83ad] dark:text-gray-400">{t('common.loading')}</p>
                      ) : filteredContactOptions.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-[#6f83ad] dark:text-gray-400">{t('proposalEditor.summary.noClient')}</p>
                      ) : (
                        filteredContactOptions.map((contact) => {
                          const displayName = contact.full_name || contact.company || t('proposalEditor.defaults.clientName')
                          return (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => handleSelectContact(contact)}
                              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[#f5f8ff] dark:hover:bg-[#18263d]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-[#0d121c] dark:text-white">{displayName}</span>
                                <span className="block truncate text-[11px] text-[#6f83ad] dark:text-gray-400">
                                  {contact.email || contact.phone || '-'}
                                </span>
                              </span>
                              <span className="material-symbols-outlined text-[16px] text-[#6f83ad]">arrow_outward</span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="min-w-[220px] flex-1 px-2">
            <input
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              className="w-full bg-transparent text-center text-base font-bold text-[#0d121c] dark:text-white outline-none"
            />
          </div>
          <span className="inline-flex h-8 items-center rounded-md border border-[#dbe5fa] bg-[#f8fbff] px-2 text-[10px] font-semibold text-[#48679d] dark:border-gray-700 dark:bg-[#111b2d] dark:text-gray-300">
            {proposalNumber}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span className="material-symbols-outlined text-[14px]">task_alt</span>
            {t('proposalEditor.studio.readiness', { score: designScore })}
          </span>
          <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleToggleStudioFullscreen}
            title={isStudioFullscreen ? t('proposalEditor.studio.fullscreenExit') : t('proposalEditor.studio.fullscreenEnter')}
            aria-label={isStudioFullscreen ? t('proposalEditor.studio.fullscreenExit') : t('proposalEditor.studio.fullscreenEnter')}
            className="flex size-10 items-center justify-center rounded-lg border border-[#e7ebf4] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isStudioFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
          {isTemplateMode ? (
            <>
              <button
                onClick={() => setEditorMode('preview')}
                className="flex h-10 px-4 items-center justify-center rounded-lg bg-[#e7ebf4] dark:bg-gray-800 text-[#0d121c] dark:text-white text-sm font-bold hover:bg-opacity-80"
              >
                {t('proposalEditor.actions.preview')}
              </button>
              <button
                onClick={openTemplateModal}
                className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90"
              >
                {t('proposalEditor.actions.saveTemplate')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">history</span>
                {t('proposalEditor.history.title')}
              </button>
              <button
                onClick={openTemplateModal}
                title={t('proposalEditor.actions.saveTemplate')}
                aria-label={t('proposalEditor.actions.saveTemplate')}
                className="flex size-10 items-center justify-center rounded-lg border border-[#e7ebf4] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
              </button>
              <button
                onClick={() => void handleSaveDraft('manual')}
                title={t('proposalEditor.actions.saveDraft')}
                aria-label={t('proposalEditor.actions.saveDraft')}
                disabled={isSavingDraft}
                className="flex size-10 items-center justify-center rounded-lg border border-[#e7ebf4] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${isSavingDraft ? 'animate-spin' : ''}`}
                >
                  {isSavingDraft ? 'progress_activity' : 'save'}
                </span>
              </button>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
              <button
                onClick={() => setEditorMode('preview')}
                className="flex h-10 px-4 items-center justify-center rounded-lg bg-[#e7ebf4] dark:bg-gray-800 text-[#0d121c] dark:text-white text-sm font-bold hover:bg-opacity-80"
              >
                {t('proposalEditor.actions.preview')}
              </button>
              <button
                onClick={() => setEditorMode('send')}
                className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90"
              >
                {t('proposalEditor.actions.send')}
              </button>
            </>
          )}
        </div>
        </div>
      </header>
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={versionHistory}
        onRestore={handleRestoreVersion}
        restoringVersionId={restoringVersionId}
      />
      <TemplateSaveModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        name={templateName}
        description={templateDescription}
        category={templateCategory}
        isPublic={templateIsPublic}
        onNameChange={setTemplateName}
        onDescriptionChange={setTemplateDescription}
        onCategoryChange={setTemplateCategory}
        onPublicToggle={() => setTemplateIsPublic((prev) => !prev)}
        isSaving={templateSaving}
        blockCount={blocks.length}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-hidden">
          <div className="flex min-h-0 min-w-[1180px] flex-1">
          <aside className="h-full w-72 min-h-0 shrink-0 flex flex-col border-r border-[#dbe5fa] dark:border-gray-800 bg-white/90 dark:bg-[#101722]/90 overflow-y-auto backdrop-blur-sm">
            <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800 space-y-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('proposalEditor.sidebar.blocks')}</h2>
                <p className="text-xs text-gray-500 mt-1">{t('proposalEditor.sidebar.dragHint')}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-[#e8f0ff] to-[#eefcf5] dark:from-[#1a263b] dark:to-[#112a24] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#48679d] dark:text-gray-300">
                  {t('proposalEditor.studio.focusTitle')}
                </p>
                <p className="mt-1 text-xs text-[#334155] dark:text-gray-300">{t('proposalEditor.studio.focusHint')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 px-4 py-3 border-b border-[#e7ebf4] dark:border-gray-800 bg-[#f8fbff] dark:bg-[#0f172a]">
              <button
                onClick={() => setLeftPanel('blocks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  leftPanel === 'blocks' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t('proposalEditor.tabs.blocks')}
              </button>
              <button
                onClick={() => setLeftPanel('templates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  leftPanel === 'templates' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t('proposalEditor.tabs.templates')}
              </button>
              <button
                onClick={() => setLeftPanel('order')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  leftPanel === 'order' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t('proposalEditor.tabs.order')}
              </button>
            </div>
            <div className="p-4 space-y-6">
              {leftPanel === 'templates' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400">{t('proposalEditor.templates.savedTitle')}</h3>
                      <Link href="/templates" className="text-xs font-semibold text-primary hover:underline">
                        {t('proposalEditor.templates.manage')}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { id: 'team', label: t('templatesPage.scopes.team') },
                        { id: 'public', label: t('templatesPage.scopes.public') },
                        { id: 'all', label: t('templatesPage.scopes.all') },
                      ] as { id: TemplateScope; label: string }[]).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setTemplateScope(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            templateScope === item.id
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {templatesLoading ? (
                      <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-3 text-xs text-gray-500">
                        {t('templatesPage.loading')}
                      </div>
                    ) : savedTemplates.length === 0 ? (
                      <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-3 text-xs text-gray-500">
                        {t('templatesPage.empty')}{' '}
                        <Link href="/templates/new" className="text-primary font-semibold hover:underline">
                          {t('proposalEditor.templates.createNew')}
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => applySavedTemplate(template)}
                            className="w-full rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{template.name}</p>
                                <p className="text-xs text-gray-500">
                                  {template.description || t('templatesPage.descriptionEmpty')}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  template.is_public
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {template.is_public ? t('templatesPage.public') : t('templatesPage.team')}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                              <span>{template.category || t('templatesPage.categoryDefault')}</span>
                              <span>•</span>
                              <span>{Array.isArray(template.blocks) ? template.blocks.length : 0} {t('templatesPage.blocks')}</span>
                              <span>•</span>
                              <span>{template.usage_count ?? 0} {t('templatesPage.usage')}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400">{t('proposalEditor.templates.readyTitle')}</h3>
                    <div className="space-y-2">
                      {templatePresets.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="w-full rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{template.name}</p>
                              <p className="text-xs text-gray-500">{template.description}</p>
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-gray-400">arrow_outward</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: template.design.accent }}
                            />
                            <span className="text-[10px] text-gray-400">{template.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {leftPanel === 'blocks' && (
                <div className="space-y-6">
                  <PaletteGroup
                    title={t('proposalEditor.paletteGroups.basic')}
                    items={paletteItems.filter((item) => item.group === 'basic')}
                    onAdd={handleAddBlock}
                  />
                  <PaletteGroup
                    title={t('proposalEditor.paletteGroups.content')}
                    items={paletteItems.filter((item) => item.group === 'content')}
                    onAdd={handleAddBlock}
                  />
                  <PaletteGroup
                    title={t('proposalEditor.paletteGroups.action')}
                    items={paletteItems.filter((item) => item.group === 'action')}
                    onAdd={handleAddBlock}
                  />

                  <div className="pt-4 mt-4 border-t border-[#e7ebf4] dark:border-gray-800">
                    <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400 mb-3">{t('proposalEditor.smartVariables.title')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {smartVariables.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => insertSmartVariable(variable)}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-mono text-primary cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {leftPanel === 'order' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400">{t('proposalEditor.order.title')}</h3>
                    <span className="text-[10px] text-gray-400">{t('proposalEditor.dragShort')}</span>
                  </div>
                  <SortableContext items={blocks.map((block) => `order-${block.id}`)}>
                    <div className="space-y-2">
                      {blocks.map((block, index) => (
                        <OrderListItem
                          key={block.id}
                          block={block}
                          index={index}
                          isSelected={selectedBlockId === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                          onMove={(direction) => moveBlock(index, direction === 'up' ? index - 1 : index + 1)}
                          meta={blockMetaMap.get(block.type)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 min-w-[520px] flex-1 overflow-x-hidden overflow-y-auto p-8 pb-24 lg:p-10 lg:pb-24 flex justify-center relative">
            <CanvasDropZone>
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full max-w-[820px] rounded-xl border border-[#d7e4ff] bg-white/80 px-4 py-3 text-xs text-[#48679d] shadow-sm dark:border-gray-700 dark:bg-[#101722]/80 dark:text-gray-300">
                  {t('proposalEditor.studio.canvasHint')}
                </div>
                <div
                  className="transition-transform"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    width: '100%',
                    maxWidth:
                      viewMode === 'tablet'
                        ? '640px'
                        : viewMode === 'mobile'
                          ? '420px'
                          : '820px',
                  }}
                >
                  <div
                    className="w-full bg-[color:var(--proposal-bg)] text-[color:var(--proposal-text)] min-h-[1120px] shadow-lg flex flex-col"
                    style={{
                      ['--proposal-bg' as never]: designSettings.background,
                      ['--proposal-text' as never]: designSettings.text,
                      ['--proposal-accent' as never]: designSettings.accent,
                      borderRadius: `${designSettings.radius}px`,
                      fontSize: `${designSettings.fontScale}%`,
                    }}
                  >
                    <SortableContext items={blocks.map((block) => block.id)}>
                      <div ref={canvasMeasureRef} className="flex flex-col gap-6 py-10 px-10">
                        {blocks.map((block, index) => (
                          <EditorBlock
                            key={block.id}
                            block={block}
                            index={index}
                            isSelected={block.id === selectedBlockId}
                            onSelect={() => setSelectedBlockId(block.id)}
                            onRemove={() => handleRemoveBlock(block.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>

                    <div className="mt-auto px-10 pb-10">
                      <button
                        onClick={() => handleAddBlock('text')}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 rounded-lg hover:border-primary hover:text-primary transition-all group"
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                        <span className="text-sm font-semibold">{t('proposalEditor.actions.addBlock')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CanvasDropZone>

            <div
              className={`fixed bottom-6 z-30 bg-white/90 dark:bg-[#101722]/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-6 ${
                isStudioFullscreen ? 'left-1/2 -translate-x-1/2' : 'left-[58%] -translate-x-1/2 lg:left-[56%]'
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-full ${viewMode === 'desktop' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
                </button>
                <button
                  onClick={() => setViewMode('tablet')}
                  className={`p-1.5 rounded-full ${viewMode === 'tablet' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">tablet_mac</span>
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-full ${viewMode === 'mobile' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">smartphone</span>
                </button>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
                    className="size-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                    title={t('proposalEditor.actions.zoomOut')}
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
                    title={t('proposalEditor.actions.resetZoom')}
                  >
                    <span className="material-symbols-outlined text-sm">zoom_in</span> {zoomLevel}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(200, prev + 10))}
                    className="size-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                    title={t('proposalEditor.actions.zoomIn')}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">pages</span>{' '}
                  {t('proposalEditor.canvas.pageCount', { current: 1, total: canvasPageCount })}
                </span>
              </div>
            </div>
          </main>

          <aside className="h-full w-80 min-h-0 min-w-[320px] shrink-0 border-l border-[#dbe5fa] dark:border-gray-800 bg-white/90 dark:bg-[#101722]/90 overflow-y-auto backdrop-blur-sm">
            <div className="flex border-b border-[#e7ebf4] dark:border-gray-800">
              <button
                onClick={() => setActivePanel('content')}
                className={`flex-1 py-4 text-sm font-bold ${activePanel === 'content' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {t('proposalEditor.panels.content')}
              </button>
              <button
                onClick={() => setActivePanel('design')}
                className={`flex-1 py-4 text-sm font-medium ${activePanel === 'design' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {t('proposalEditor.panels.design')}
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="rounded-xl border border-[#e0eafe] bg-[#f5f8ff] p-4 dark:border-gray-700 dark:bg-[#0f172a]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#48679d] dark:text-gray-400">
                    {t('proposalEditor.studio.designHealth')}
                  </p>
                  <span className="text-sm font-bold text-primary">{designScore}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white dark:bg-gray-800">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#10b981]" style={{ width: `${designScore}%` }} />
                </div>
              </div>

              {activePanel === 'content' && !selectedBlock && (
                <div className="text-sm text-gray-500">{t('proposalEditor.panels.empty')}</div>
              )}

              {activePanel === 'content' && selectedBlock && (
                <>
                  {selectedBlock.type === 'hero' && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                        {t('proposalEditor.blocks.heroSettings')}
                      </label>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.title')}</label>
                        <input
                          value={selectedBlock.data.title}
                          onChange={(event) => updateBlockData(selectedBlock.id, { title: event.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.subtitle')}</label>
                        <textarea
                          value={selectedBlock.data.subtitle}
                          onChange={(event) => updateBlockData(selectedBlock.id, { subtitle: event.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.backgroundUrl')}</label>
                        <input
                          value={selectedBlock.data.backgroundUrl}
                          onChange={(event) => updateBlockData(selectedBlock.id, { backgroundUrl: event.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                    </div>
                  )}

                {selectedBlock.type === 'heading' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.fields.title')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.headingText')}</label>
                      <input
                        value={selectedBlock.data.text}
                        onChange={(event) => updateBlockData(selectedBlock.id, { text: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.level')}</label>
                        <select
                          value={selectedBlock.data.level}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, { level: event.target.value as HeadingData['level'] })
                          }
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.align')}</label>
                        <select
                          value={selectedBlock.data.align}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, { align: event.target.value as HeadingData['align'] })
                          }
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        >
                          <option value="left">{t('proposalEditor.align.left')}</option>
                          <option value="center">{t('proposalEditor.align.center')}</option>
                          <option value="right">{t('proposalEditor.align.right')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#e7ebf4] dark:border-gray-800 p-3 space-y-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('proposalEditor.format.title')}</p>
                      <div className="flex items-center gap-2">
                        {([
                          { key: 'left', icon: 'format_align_left', label: t('proposalEditor.align.left') },
                          { key: 'center', icon: 'format_align_center', label: t('proposalEditor.align.center') },
                          { key: 'right', icon: 'format_align_right', label: t('proposalEditor.align.right') },
                        ] as const).map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => updateBlockData(selectedBlock.id, { align: option.key })}
                            className={`size-8 rounded-md border flex items-center justify-center ${
                              selectedBlock.data.align === option.key ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                            }`}
                            title={option.label}
                          >
                            <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                          </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateBlockData(selectedBlock.id, {
                                style: { ...(selectedBlock.data.style ?? {}), fontWeight: (selectedBlock.data.style?.fontWeight ?? 700) >= 700 ? 500 : 700 },
                              })
                            }
                            className={`size-8 rounded-md border flex items-center justify-center ${
                              (selectedBlock.data.style?.fontWeight ?? 700) >= 700 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                            }`}
                            title={t('proposalEditor.format.bold')}
                          >
                            <span className="material-symbols-outlined text-[18px]">format_bold</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlockData(selectedBlock.id, {
                                style: { ...(selectedBlock.data.style ?? {}), italic: !(selectedBlock.data.style?.italic ?? false) },
                              })
                            }
                            className={`size-8 rounded-md border flex items-center justify-center ${
                              selectedBlock.data.style?.italic ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                            }`}
                            title={t('proposalEditor.format.italic')}
                          >
                            <span className="material-symbols-outlined text-[18px]">format_italic</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.format.fontSize')}</label>
                        <input
                          type="number"
                          min={18}
                          max={96}
                          value={selectedBlock.data.style?.fontSize ?? (selectedBlock.data.level === 'h1' ? 36 : selectedBlock.data.level === 'h2' ? 30 : 24)}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, {
                              style: { ...(selectedBlock.data.style ?? {}), fontSize: Number(event.target.value) || 24 },
                            })
                          }
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'text' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.textContent')}
                    </label>
                    <textarea
                      value={selectedBlock.data.content}
                      onChange={(event) => updateBlockData(selectedBlock.id, { content: event.target.value })}
                      className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm min-h-[160px]"
                    />
                    <div className="rounded-lg border border-[#e7ebf4] dark:border-gray-800 p-3 space-y-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('proposalEditor.format.title')}</p>
                      <div className="flex items-center gap-2">
                        {([
                          { key: 'left', icon: 'format_align_left', label: t('proposalEditor.align.left') },
                          { key: 'center', icon: 'format_align_center', label: t('proposalEditor.align.center') },
                          { key: 'right', icon: 'format_align_right', label: t('proposalEditor.align.right') },
                        ] as const).map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() =>
                              updateBlockData(selectedBlock.id, {
                                style: { ...(selectedBlock.data.style ?? {}), align: option.key },
                              })
                            }
                            className={`size-8 rounded-md border flex items-center justify-center ${
                              (selectedBlock.data.style?.align ?? 'left') === option.key ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                            }`}
                            title={option.label}
                          >
                            <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                          </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateBlockData(selectedBlock.id, {
                                style: {
                                  ...(selectedBlock.data.style ?? {}),
                                  fontWeight: (selectedBlock.data.style?.fontWeight ?? 400) >= 700 ? 400 : 700,
                                },
                              })
                            }
                            className={`size-8 rounded-md border flex items-center justify-center ${
                              (selectedBlock.data.style?.fontWeight ?? 400) >= 700 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                            }`}
                            title={t('proposalEditor.format.bold')}
                          >
                            <span className="material-symbols-outlined text-[18px]">format_bold</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlockData(selectedBlock.id, {
                                style: { ...(selectedBlock.data.style ?? {}), italic: !(selectedBlock.data.style?.italic ?? false) },
                              })
                            }
                            className={`size-8 rounded-md border flex items-center justify-center ${
                              selectedBlock.data.style?.italic ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                            }`}
                            title={t('proposalEditor.format.italic')}
                          >
                            <span className="material-symbols-outlined text-[18px]">format_italic</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.format.verticalAlign')}</label>
                          <div className="flex items-center gap-2">
                            {([
                              { key: 'top', icon: 'vertical_align_top', label: t('proposalEditor.format.top') },
                              { key: 'center', icon: 'vertical_align_center', label: t('proposalEditor.align.center') },
                              { key: 'bottom', icon: 'vertical_align_bottom', label: t('proposalEditor.format.bottom') },
                            ] as const).map((option) => (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() =>
                                  updateBlockData(selectedBlock.id, {
                                    style: { ...(selectedBlock.data.style ?? {}), verticalAlign: option.key },
                                  })
                                }
                                className={`size-8 rounded-md border flex items-center justify-center ${
                                  (selectedBlock.data.style?.verticalAlign ?? 'top') === option.key ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'
                                }`}
                                title={option.label}
                              >
                                <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.format.fontSize')}</label>
                          <input
                            type="number"
                            min={12}
                            max={48}
                            value={selectedBlock.data.style?.fontSize ?? 16}
                            onChange={(event) =>
                              updateBlockData(selectedBlock.id, {
                                style: { ...(selectedBlock.data.style ?? {}), fontSize: Number(event.target.value) || 16 },
                              })
                            }
                            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'pricing' &&
                  (() => {
                    const pricingColumns = selectedBlock.data.columns ?? defaultPricingColumns
                    const pricingItems = Array.isArray(selectedBlock.data.items) ? selectedBlock.data.items : []
                    const pricingSource = selectedBlock.data.source ?? 'manual'
                    const pricingColumnLabelMap: Record<keyof PricingData['columns'], string> = {
                      description: t('proposalEditor.pricing.columns.description'),
                      quantity: t('proposalEditor.pricing.columns.quantity'),
                      unit: t('proposalEditor.pricing.columns.unit'),
                      unitPrice: t('proposalEditor.pricing.columns.unitPrice'),
                      total: t('proposalEditor.pricing.columns.total'),
                    }
                    const pricingColumnEntries = Object.entries(pricingColumns) as Array<
                      [keyof PricingData['columns'], boolean]
                    >
                    return (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                          {t('proposalEditor.blocks.pricingTable')}
                        </label>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.source')}</label>
                          <select
                            value={pricingSource}
                            onChange={(event) => {
                              const nextSource = event.target.value as PricingData['source']
                              updateBlockData(selectedBlock.id, { source: nextSource })
                              if (nextSource === 'manual') {
                                setProductSearch('')
                              }
                            }}
                            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                          >
                            <option value="crm">{t('proposalEditor.fields.productCatalog')}</option>
                            <option value="manual">{t('proposalEditor.fields.manual')}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] text-gray-500 block">{t('proposalEditor.fields.columns')}</label>
                          {pricingColumnEntries.map(([key, value]) => (
                            <label key={key} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={() =>
                                  updateBlockData(selectedBlock.id, {
                                    columns: { ...pricingColumns, [key]: !value },
                                  })
                                }
                                className="rounded text-primary focus:ring-primary size-4"
                              />
                              <span className="text-[#0d121c] dark:text-white">{pricingColumnLabelMap[key]}</span>
                            </label>
                          ))}
                        </div>
                        {pricingSource === 'crm' ? (
                          <div className="space-y-2">
                            <label className="text-[11px] text-gray-500 block">{t('proposalEditor.fields.productCatalog')}</label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
                                search
                              </span>
                              <input
                                value={productSearch}
                                onChange={(event) => setProductSearch(event.target.value)}
                                placeholder={t('proposalEditor.placeholders.productSearch')}
                                className="w-full pl-7 pr-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 rounded border border-dashed border-gray-200 dark:border-gray-700 p-2">
                              {productsLoading ? (
                                <p className="text-[11px] text-gray-400">{t('proposalEditor.loading.products')}</p>
                              ) : filteredProductOptions.length === 0 ? (
                                <p className="text-[11px] text-gray-400">{t('proposalEditor.empty.products')}</p>
                              ) : (
                                filteredProductOptions.map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addProductToPricing(selectedBlock.id, product)}
                                    disabled={!product.active}
                                    className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 text-left text-xs"
                                  >
                                    <div>
                                      <p className="font-semibold text-[#0d121c] dark:text-white">{product.name}</p>
                                      {product.category && (
                                        <p className="text-[10px] text-gray-400">{product.category}</p>
                                      )}
                                      {!product.active && (
                                        <p className="text-[10px] text-amber-600">{t('proposalEditor.status.inactiveProduct')}</p>
                                      )}
                                    </div>
                                    <span className="font-semibold text-primary">
                                      {formatCurrency(product.price, product.currency)}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => loadProductOptions()}
                              className="w-full py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:border-primary/40"
                            >
                              {t('proposalEditor.actions.refreshProducts')}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500">
                            {t('proposalEditor.hints.manualPricing')}
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-[11px] text-gray-500 block">{t('proposalEditor.fields.lineItems')}</label>
                          {pricingSource === 'crm' ? (
                            <div className="space-y-2">
                              {pricingItems.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500">
                                  {t('proposalEditor.empty.selectedProducts')}
                                </div>
                              ) : (
                                pricingItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/80 dark:bg-gray-900/50"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-[#0d121c] dark:text-white truncate">{item.name}</p>
                                        <p className="text-[11px] text-gray-500">
                                          {formatCurrency(item.price ?? 0, item.currency || 'TRY')} / {item.unit || t('proposalEditor.pricing.fallbackUnit')}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => removePricingItem(selectedBlock.id, item.id)}
                                        className="text-xs text-red-500 hover:text-red-600 shrink-0"
                                      >
                                        {t('proposalEditor.actions.removeItem')}
                                      </button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                          {t('proposalEditor.pricing.columns.quantity')}
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          value={item.qty}
                                          onChange={(event) => {
                                            const qtyValue = Number(event.target.value)
                                            updatePricingItem(selectedBlock.id, item.id, {
                                              qty: Number.isFinite(qtyValue) ? Math.max(1, qtyValue) : 1,
                                            })
                                          }}
                                          className="w-16 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-center"
                                        />
                                      </div>
                                      <p className="text-xs font-semibold text-[#0d121c] dark:text-white">
                                        {formatCurrency((item.qty ?? 0) * (item.price ?? 0), item.currency || 'TRY')}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {pricingItems.map((item) => (
                                  <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 bg-white/80 dark:bg-gray-900/50">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                          {t('proposalEditor.pricing.columns.description')}
                                        </label>
                                        <input
                                          value={item.name}
                                          onChange={(event) => updatePricingItem(selectedBlock.id, item.id, { name: event.target.value })}
                                          placeholder={t('proposalEditor.placeholders.lineItemName')}
                                          className="w-full px-2.5 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                          {t('proposalEditor.pricing.columns.quantity')}
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          value={item.qty}
                                          onChange={(event) => {
                                            const qtyValue = Number(event.target.value)
                                            updatePricingItem(selectedBlock.id, item.id, {
                                              qty: Number.isFinite(qtyValue) ? Math.max(1, qtyValue) : 1,
                                            })
                                          }}
                                          className="w-full px-2.5 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-center"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                          {t('proposalEditor.pricing.columns.unit')}
                                        </label>
                                        <input
                                          value={item.unit ?? ''}
                                          onChange={(event) =>
                                            updatePricingItem(selectedBlock.id, item.id, { unit: event.target.value.slice(0, 24) })
                                          }
                                          placeholder={t('proposalEditor.placeholders.unit')}
                                          className="w-full px-2.5 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                          {t('proposalEditor.pricing.columns.unitPrice')}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.price}
                                          onChange={(event) => {
                                            const priceValue = Number(event.target.value)
                                            updatePricingItem(selectedBlock.id, item.id, {
                                              price: Number.isFinite(priceValue) ? priceValue : 0,
                                            })
                                          }}
                                          className="w-full px-2.5 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-right"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                          {t('proposalEditor.fields.currency')}
                                        </label>
                                      <input
                                        value={item.currency ?? ''}
                                        onChange={(event) =>
                                          updatePricingItem(selectedBlock.id, item.id, {
                                            currency: event.target.value.toUpperCase().slice(0, 3),
                                          })
                                        }
                                        placeholder={t('proposalEditor.placeholders.currency')}
                                          className="w-full px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-center uppercase"
                                      />
                                      </div>
                                      <button
                                        onClick={() => removePricingItem(selectedBlock.id, item.id)}
                                        className="text-xs text-red-500 hover:text-red-600 justify-self-end self-end"
                                      >
                                        {t('proposalEditor.actions.removeItem')}
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-2">
                                      {t('proposalEditor.pricing.columns.total')}: {formatCurrency((item.qty ?? 0) * (item.price ?? 0), item.currency || 'TRY')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => addPricingItem(selectedBlock.id)}
                                className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary"
                              >
                                {t('proposalEditor.actions.addLineItem')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                {selectedBlock.type === 'video' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.video')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.title')}</label>
                      <input
                        value={selectedBlock.data.title}
                        onChange={(event) => updateBlockData(selectedBlock.id, { title: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.videoUrl')}</label>
                      <input
                        value={selectedBlock.data.url}
                        onChange={(event) => updateBlockData(selectedBlock.id, { url: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'gallery' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.gallery')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.columnCount')}</label>
                      <select
                        value={selectedBlock.data.columns ?? 2}
                        onChange={(event) =>
                          updateBlockData(selectedBlock.id, { columns: Number(event.target.value) as 2 | 3 })
                        }
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      >
                        <option value={2}>{t('proposalEditor.options.columns.2')}</option>
                        <option value={3}>{t('proposalEditor.options.columns.3')}</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      {(Array.isArray(selectedBlock.data.images) ? selectedBlock.data.images : []).map((image) => (
                        <div key={image.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                          <input
                            value={image.url}
                            onChange={(event) => updateGalleryImage(selectedBlock.id, image.id, { url: event.target.value })}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder={t('proposalEditor.placeholders.imageUrl')}
                          />
                          <input
                            value={image.caption}
                            onChange={(event) =>
                              updateGalleryImage(selectedBlock.id, image.id, { caption: event.target.value })
                            }
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder={t('proposalEditor.placeholders.caption')}
                          />
                          <button
                            onClick={() => removeGalleryImage(selectedBlock.id, image.id)}
                            className="text-xs text-red-500"
                          >
                            {t('proposalEditor.actions.removeImage')}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addGalleryImage(selectedBlock.id)}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary"
                    >
                      {t('proposalEditor.actions.addImage')}
                    </button>
                  </div>
                )}

                {selectedBlock.type === 'testimonial' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.testimonial')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.quote')}</label>
                      <textarea
                        value={selectedBlock.data.quote}
                        onChange={(event) => updateBlockData(selectedBlock.id, { quote: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.name')}</label>
                      <input
                        value={selectedBlock.data.author}
                        onChange={(event) => updateBlockData(selectedBlock.id, { author: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.role')}</label>
                      <input
                        value={selectedBlock.data.role}
                        onChange={(event) => updateBlockData(selectedBlock.id, { role: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.avatarUrl')}</label>
                      <input
                        value={selectedBlock.data.avatarUrl}
                        onChange={(event) => updateBlockData(selectedBlock.id, { avatarUrl: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'timeline' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.timeline')}
                    </label>
                    <div className="space-y-3">
                      {(Array.isArray(selectedBlock.data.items) ? selectedBlock.data.items : []).map((item) => (
                        <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                          <input
                            value={item.title}
                            onChange={(event) => updateTimelineItem(selectedBlock.id, item.id, { title: event.target.value })}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder={t('proposalEditor.placeholders.title')}
                          />
                          <input
                            value={item.date}
                            onChange={(event) => updateTimelineItem(selectedBlock.id, item.id, { date: event.target.value })}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder={t('proposalEditor.placeholders.date')}
                          />
                          <textarea
                            value={item.description}
                            onChange={(event) =>
                              updateTimelineItem(selectedBlock.id, item.id, { description: event.target.value })
                            }
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            rows={3}
                            placeholder={t('proposalEditor.placeholders.description')}
                          />
                          <button
                            onClick={() => removeTimelineItem(selectedBlock.id, item.id)}
                            className="text-xs text-red-500"
                          >
                            {t('proposalEditor.actions.removeStep')}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addTimelineItem(selectedBlock.id)}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary"
                    >
                      {t('proposalEditor.actions.addStep')}
                    </button>
                  </div>
                )}

                {selectedBlock.type === 'countdown' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.countdown')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.title')}</label>
                      <input
                        value={selectedBlock.data.label}
                        onChange={(event) => updateBlockData(selectedBlock.id, { label: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.days')}</label>
                        <input
                          type="number"
                          min={0}
                          value={selectedBlock.data.days}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, { days: Number(event.target.value) || 0 })
                          }
                          className="w-full px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.hours')}</label>
                        <input
                          type="number"
                          min={0}
                          value={selectedBlock.data.hours}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, { hours: Number(event.target.value) || 0 })
                          }
                          className="w-full px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.minutes')}</label>
                        <input
                          type="number"
                          min={0}
                          value={selectedBlock.data.minutes}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, { minutes: Number(event.target.value) || 0 })
                          }
                          className="w-full px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'cta' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.cta')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.buttonText')}</label>
                      <input
                        value={selectedBlock.data.label}
                        onChange={(event) => updateBlockData(selectedBlock.id, { label: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.link')}</label>
                      <input
                        value={selectedBlock.data.url}
                        onChange={(event) => updateBlockData(selectedBlock.id, { url: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.style')}</label>
                      <select
                        value={selectedBlock.data.variant}
                        onChange={(event) =>
                          updateBlockData(selectedBlock.id, { variant: event.target.value as CtaData['variant'] })
                        }
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      >
                        <option value="primary">{t('proposalEditor.ctaStyles.primary')}</option>
                        <option value="secondary">{t('proposalEditor.ctaStyles.secondary')}</option>
                        <option value="outline">{t('proposalEditor.ctaStyles.outline')}</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'signature' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.signatureSettings')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.label')}</label>
                      <input
                        value={selectedBlock.data.label}
                        onChange={(event) => updateBlockData(selectedBlock.id, { label: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedBlock.data.required}
                        onChange={() => updateBlockData(selectedBlock.id, { required: !selectedBlock.data.required })}
                        className="rounded text-primary focus:ring-primary size-4"
                      />
                      <span>{t('proposalEditor.fields.signatureRequired')}</span>
                    </label>
                  </div>
                )}

                <button
                  onClick={() => handleRemoveBlock(selectedBlock.id)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  {t('proposalEditor.actions.deleteBlock')}
                </button>
              </>
            )}

            {activePanel === 'design' && (
              <div className="pt-6 border-t border-[#e7ebf4] dark:border-gray-800">
                <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide mb-3">
                  {t('proposalEditor.design.title')}
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.selectBlock')}</label>
                    <select
                      value={selectedBlock?.id ?? ''}
                      onChange={(event) => setSelectedBlockId(event.target.value || null)}
                      className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                    >
                      {blocks.map((block, index) => (
                        <option key={block.id} value={block.id}>
                          {index + 1}. {blockMetaMap.get(block.type)?.label ?? block.type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBlock ? (
                    <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-3 space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#48679d] dark:text-gray-400">
                        {t('proposalEditor.design.blockSpecific')}
                      </p>

                      <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed border-[#dbe5fa] p-3">
                        <div className="col-span-2">
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.blockBg')}</label>
                          <input
                            type="color"
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.blockBg ?? '#ffffff')}
                            onChange={(event) => updateSelectedBlockStyle({ blockBg: event.target.value })}
                            className="h-8 w-full rounded border border-gray-200"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.borderColor')}</label>
                          <input
                            type="color"
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.borderColor ?? '#dbe2ee')}
                            onChange={(event) => updateSelectedBlockStyle({ borderColor: event.target.value })}
                            className="h-8 w-full rounded border border-gray-200"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.borderWidth')}</label>
                          <input
                            type="range"
                            min={0}
                            max={6}
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.borderWidth ?? 0)}
                            onChange={(event) => updateSelectedBlockStyle({ borderWidth: Number(event.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.cornerRadius')}</label>
                          <input
                            type="range"
                            min={0}
                            max={32}
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.radius ?? 12)}
                            onChange={(event) => updateSelectedBlockStyle({ radius: Number(event.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.shadow')}</label>
                          <input
                            type="range"
                            min={0}
                            max={3}
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.shadowLevel ?? 0)}
                            onChange={(event) =>
                              updateSelectedBlockStyle({
                                shadowLevel: Number(event.target.value) as 0 | 1 | 2 | 3,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.paddingX')}</label>
                          <input
                            type="range"
                            min={12}
                            max={72}
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.paddingX ?? 32)}
                            onChange={(event) => updateSelectedBlockStyle({ paddingX: Number(event.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.paddingY')}</label>
                          <input
                            type="range"
                            min={12}
                            max={72}
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.paddingY ?? 32)}
                            onChange={(event) => updateSelectedBlockStyle({ paddingY: Number(event.target.value) })}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-dashed border-[#dbe5fa] p-3 space-y-3">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('proposalEditor.format.title')}</p>
                        <div className="flex items-center gap-2">
                          {([
                            { key: 'left', icon: 'format_align_left', label: t('proposalEditor.align.left') },
                            { key: 'center', icon: 'format_align_center', label: t('proposalEditor.align.center') },
                            { key: 'right', icon: 'format_align_right', label: t('proposalEditor.align.right') },
                          ] as const).map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => updateSelectedBlockStyle({ textAlign: option.key })}
                              className={`size-8 rounded-md border flex items-center justify-center ${
                                (((selectedBlock.data as { style?: BlockFrameStyle }).style?.textAlign ?? 'left') === option.key)
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-gray-200 text-gray-500'
                              }`}
                              title={option.label}
                            >
                              <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                            </button>
                          ))}
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlockStyle({
                                  fontWeight:
                                    (((selectedBlock.data as { style?: BlockFrameStyle }).style?.fontWeight ?? 400) >= 700 ? 400 : 700) as
                                      | 400
                                      | 500
                                      | 600
                                      | 700
                                      | 800,
                                })
                              }
                              className={`size-8 rounded-md border flex items-center justify-center ${
                                (((selectedBlock.data as { style?: BlockFrameStyle }).style?.fontWeight ?? 400) >= 700)
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-gray-200 text-gray-500'
                              }`}
                              title={t('proposalEditor.format.bold')}
                            >
                              <span className="material-symbols-outlined text-[18px]">format_bold</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlockStyle({
                                  italic: !(((selectedBlock.data as { style?: BlockFrameStyle }).style?.italic) ?? false),
                                })
                              }
                              className={`size-8 rounded-md border flex items-center justify-center ${
                                (((selectedBlock.data as { style?: BlockFrameStyle }).style?.italic) ?? false)
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-gray-200 text-gray-500'
                              }`}
                              title={t('proposalEditor.format.italic')}
                            >
                              <span className="material-symbols-outlined text-[18px]">format_italic</span>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.format.verticalAlign')}</label>
                            <div className="flex items-center gap-2">
                              {([
                                { key: 'top', icon: 'vertical_align_top', label: t('proposalEditor.format.top') },
                                { key: 'center', icon: 'vertical_align_center', label: t('proposalEditor.align.center') },
                                { key: 'bottom', icon: 'vertical_align_bottom', label: t('proposalEditor.format.bottom') },
                              ] as const).map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => updateSelectedBlockStyle({ verticalAlign: option.key })}
                                  className={`size-8 rounded-md border flex items-center justify-center ${
                                    (((selectedBlock.data as { style?: BlockFrameStyle }).style?.verticalAlign ?? 'top') === option.key)
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-gray-200 text-gray-500'
                                  }`}
                                  title={option.label}
                                >
                                  <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.format.fontSize')}</label>
                            <input
                              type="number"
                              min={10}
                              max={72}
                              value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.fontSize ?? 16)}
                              onChange={(event) => updateSelectedBlockStyle({ fontSize: Number(event.target.value) || 16 })}
                              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.lineHeight')}</label>
                          <input
                            type="range"
                            min={1}
                            max={2.2}
                            step={0.1}
                            value={((selectedBlock.data as { style?: BlockFrameStyle }).style?.lineHeight ?? 1.5)}
                            onChange={(event) => updateSelectedBlockStyle({ lineHeight: Number(event.target.value) })}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {selectedBlock.type === 'hero' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.overlayOpacity')}</label>
                            <input
                              type="range"
                              min={10}
                              max={90}
                              value={selectedBlock.data.style?.overlayOpacity ?? 65}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), overlayOpacity: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.heroHeight')}</label>
                            <input
                              type="range"
                              min={220}
                              max={560}
                              value={selectedBlock.data.style?.height ?? 320}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), height: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.textColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.textColor ?? '#ffffff'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), textColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'heading' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.textColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.textColor ?? '#0d121c'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), textColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.letterSpacing')}</label>
                            <input
                              type="range"
                              min={-1}
                              max={4}
                              step={0.5}
                              value={selectedBlock.data.style?.letterSpacing ?? 0}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), letterSpacing: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'text' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.textColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.textColor ?? '#334155'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), textColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.fontSizePx')}</label>
                            <input
                              type="range"
                              min={12}
                              max={28}
                              value={selectedBlock.data.style?.fontSize ?? 16}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), fontSize: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.lineHeight')}</label>
                            <input
                              type="range"
                              min={1.2}
                              max={2.2}
                              step={0.1}
                              value={selectedBlock.data.style?.lineHeight ?? 1.7}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), lineHeight: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'pricing' && (
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.surfaceColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.surfaceColor ?? '#f8fafc'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), surfaceColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.headerColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.headerColor ?? '#e2e8f0'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), headerColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.headerTextColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.headerTextColor ?? '#475569'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), headerTextColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                        </div>
                      )}

                      {selectedBlock.type === 'video' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.borderColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.borderColor ?? '#e2e8f0'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), borderColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.cornerRadius')}</label>
                            <input
                              type="range"
                              min={0}
                              max={36}
                              value={selectedBlock.data.style?.borderRadius ?? 12}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), borderRadius: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'gallery' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.gap')}</label>
                            <input
                              type="range"
                              min={4}
                              max={28}
                              value={selectedBlock.data.style?.gap ?? 16}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), gap: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.imageRadius')}</label>
                            <input
                              type="range"
                              min={0}
                              max={28}
                              value={selectedBlock.data.style?.imageRadius ?? 12}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), imageRadius: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'testimonial' && (
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.backgroundColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.backgroundColor ?? '#f8fafc'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), backgroundColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.textColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.quoteColor ?? '#0d121c'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), quoteColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.accentColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.accentColor ?? '#377DF6'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), accentColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                        </div>
                      )}

                      {selectedBlock.type === 'timeline' && (
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.lineColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.lineColor ?? '#dbe2ee'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), lineColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.dotColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.dotColor ?? '#377DF6'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), dotColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.dateColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.dateColor ?? '#64748b'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), dateColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                        </div>
                      )}

                      {selectedBlock.type === 'countdown' && (
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.cardColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.cardColor ?? '#ffffff'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), cardColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.numberColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.numberColor ?? '#377DF6'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), numberColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                        </div>
                      )}

                      {selectedBlock.type === 'cta' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.backgroundColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.bgColor ?? '#377DF6'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), bgColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.textColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.textColor ?? '#ffffff'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), textColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.borderColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.borderColor ?? '#377DF6'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), borderColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.cornerRadius')}</label>
                            <input
                              type="range"
                              min={0}
                              max={28}
                              value={selectedBlock.data.style?.borderRadius ?? 10}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), borderRadius: Number(event.target.value) },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'signature' && (
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.backgroundColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.backgroundColor ?? '#ffffff'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), backgroundColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.borderColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.borderColor ?? '#cbd5e1'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), borderColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.iconColor')}</label>
                            <input
                              type="color"
                              value={selectedBlock.data.style?.iconColor ?? '#377DF6'}
                              onChange={(event) =>
                                updateBlockData(selectedBlock.id, {
                                  style: { ...(selectedBlock.data.style ?? {}), iconColor: event.target.value },
                                })
                              }
                              className="h-8 w-full rounded border border-gray-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-3 text-xs text-gray-500">
                      {t('proposalEditor.design.blockEmpty')}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-gray-500 block mb-2">{t('proposalEditor.studio.presetThemes')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {designPresets.map((preset) => {
                        const active =
                          designSettings.background === preset.settings.background &&
                          designSettings.text === preset.settings.text &&
                          designSettings.accent === preset.settings.accent
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setDesignSettings(preset.settings)}
                            className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                              active ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.settings.accent }} />
                              <span className="text-[11px] font-semibold text-[#0d121c] dark:text-white">{preset.name}</span>
                            </div>
                            <div className="mt-1 flex gap-1">
                              <span className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: preset.settings.background }} />
                              <span className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: preset.settings.text }} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.textColor')}</label>
                      <div className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                        <input
                          type="color"
                          value={designSettings.text}
                          onChange={(event) => setDesignSettings((prev) => ({ ...prev, text: event.target.value }))}
                          className="h-6 w-8 rounded"
                        />
                        <input
                          value={designSettings.text}
                          onChange={(event) => setDesignSettings((prev) => ({ ...prev, text: event.target.value }))}
                          className="flex-1 bg-transparent text-[10px] font-mono text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.accentColor')}</label>
                      <div className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                        <input
                          type="color"
                          value={designSettings.accent}
                          onChange={(event) => setDesignSettings((prev) => ({ ...prev, accent: event.target.value }))}
                          className="h-6 w-8 rounded"
                        />
                        <input
                          value={designSettings.accent}
                          onChange={(event) => setDesignSettings((prev) => ({ ...prev, accent: event.target.value }))}
                          className="flex-1 bg-transparent text-[10px] font-mono text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.backgroundColor')}</label>
                    <div className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                      <input
                        type="color"
                        value={designSettings.background}
                        onChange={(event) => setDesignSettings((prev) => ({ ...prev, background: event.target.value }))}
                        className="h-6 w-8 rounded"
                      />
                      <input
                        value={designSettings.background}
                        onChange={(event) => setDesignSettings((prev) => ({ ...prev, background: event.target.value }))}
                        className="flex-1 bg-transparent text-[10px] font-mono text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.cornerRadius')}</label>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={designSettings.radius}
                      onChange={(event) =>
                        setDesignSettings((prev) => ({ ...prev, radius: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.design.fontScale')}</label>
                    <input
                      type="range"
                      min={90}
                      max={115}
                      value={designSettings.fontScale}
                      onChange={(event) =>
                        setDesignSettings((prev) => ({ ...prev, fontScale: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-[#e7ebf4] dark:border-gray-800 text-xs text-gray-400">
              {t('proposalEditor.summary.total')}: <span className="font-bold text-[#0d121c] dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
          </div>
          </aside>
          </div>
        </div>
      <DragOverlay>
        {activePaletteId ? (
          <div className="bg-white dark:bg-gray-900 border border-primary/30 rounded-lg px-4 py-2 shadow-xl text-sm font-semibold text-primary">
            {t('proposalEditor.actions.addBlock')}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>

    </div>
  )
}

function PaletteGroup({ title, items, onAdd }: { title: string; items: PaletteItem[]; onAdd: (type: BlockType) => void }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 mb-2">{title}</h3>
      <div className="space-y-1">
        {items.map((item) => (
          <PaletteItem key={item.id} item={item} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}

function PaletteItem({ item, onAdd }: { item: PaletteItem; onAdd: (type: BlockType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { blockType: item.id },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging) {
          onAdd(item.id)
        }
      }}
      className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-grab transition-colors border ${
        isDragging ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-primary/10 hover:border-primary/20'
      }`}
    >
      <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">{item.icon}</span>
      <span className="text-sm font-medium text-[#0d121c] dark:text-white">{item.label}</span>
    </div>
  )
}

function OrderListItem({
  block,
  index,
  isSelected,
  onSelect,
  onMove,
  meta,
}: {
  block: ProposalBlock
  index: number
  isSelected: boolean
  onSelect: () => void
  onMove: (direction: 'up' | 'down') => void
  meta?: { label: string; icon: string }
}) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `order-${block.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
        isSelected
          ? 'border-primary/60 bg-primary/5 text-primary'
          : 'border-transparent bg-gray-50 dark:bg-gray-900/40 text-gray-500 hover:border-primary/30'
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <button onClick={onSelect} className="flex items-center gap-2 text-left">
        <span
          {...attributes}
          {...listeners}
          className="material-symbols-outlined text-[16px] cursor-grab text-gray-400"
        >
          drag_indicator
        </span>
        <span className="material-symbols-outlined text-[16px]">{meta?.icon ?? 'description'}</span>
        <span className="font-semibold text-[11px]">
          {index + 1}. {meta?.label ?? block.type}
        </span>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onMove('up')}
          className="size-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary"
          aria-label={t('proposalEditor.order.moveUp')}
        >
          <span className="material-symbols-outlined text-[16px]">expand_less</span>
        </button>
        <button
          onClick={() => onMove('down')}
          className="size-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary"
          aria-label={t('proposalEditor.order.moveDown')}
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      </div>
    </div>
  )
}

function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' })

  return (
    <div
      ref={setNodeRef}
      className={`relative flex justify-center w-full transition-shadow ${
        isOver ? 'ring-2 ring-primary/30 rounded-xl' : ''
      }`}
    >
      {children}
    </div>
  )
}

type DraftVersion = {
  id: string
  savedAt: string
  title: string
}

function StepNav({
  mode,
  onChange,
  hideSend = false,
}: {
  mode: 'edit' | 'preview' | 'send'
  onChange: (mode: 'edit' | 'preview' | 'send') => void
  hideSend?: boolean
}) {
  const { t } = useI18n()
  const steps: { id: 'edit' | 'preview' | 'send'; label: string }[] = [
    { id: 'edit', label: t('proposalEditor.steps.edit') },
    { id: 'preview', label: t('proposalEditor.steps.preview') },
    { id: 'send', label: t('proposalEditor.steps.send') },
  ]
  const visibleSteps = hideSend ? steps.filter((step) => step.id !== 'send') : steps
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-[#48679d]">
      {visibleSteps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <button
            onClick={() => onChange(step.id)}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              mode === step.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent hover:border-primary/30 hover:text-primary'
            }`}
          >
            {step.label}
          </button>
          {index < visibleSteps.length - 1 && (
            <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
          )}
        </div>
      ))}
    </div>
  )
}

function HistoryModal({
  isOpen,
  onClose,
  versions,
  onRestore,
  restoringVersionId,
}: {
  isOpen: boolean
  onClose: () => void
  versions: DraftVersion[]
  onRestore: (versionId: string) => void
  restoringVersionId: string | null
}) {
  const { t, locale } = useI18n()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 py-6 overflow-y-auto sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-white dark:bg-[#101722] rounded-2xl shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('proposalEditor.history.title')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400">{t('proposalEditor.history.subtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6">
          {versions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-500">
              {t('proposalEditor.history.empty')}
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const formatted =
                  version.savedAt && !Number.isNaN(Date.parse(version.savedAt))
                    ? new Date(version.savedAt).toLocaleString(localeCode, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : version.savedAt
                return (
                  <div
                    key={version.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#e7ebf4] dark:border-gray-800 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{version.title}</p>
                      <p className="text-xs text-gray-500">{formatted}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                          {t('proposalEditor.history.latest')}
                        </span>
                      )}
                      <button
                        onClick={() => onRestore(version.id)}
                        disabled={restoringVersionId === version.id}
                        className="px-2.5 py-1 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-[11px] font-semibold text-[#48679d] hover:bg-gray-50 disabled:opacity-60"
                      >
                        {restoringVersionId === version.id ? t('common.loading') : t('proposalEditor.history.restore')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type TemplateSaveModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  name: string
  description: string
  category: string
  isPublic: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPublicToggle: () => void
  isSaving: boolean
  blockCount: number
}

function TemplateSaveModal({
  isOpen,
  onClose,
  onSave,
  name,
  description,
  category,
  isPublic,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onPublicToggle,
  isSaving,
  blockCount,
}: TemplateSaveModalProps) {
  const { t } = useI18n()
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 py-6 overflow-y-auto sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-white dark:bg-[#101722] rounded-2xl shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('proposalEditor.saveTemplate.title')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400">
              {t('proposalEditor.saveTemplate.subtitle')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('templatesNew.fields.name')}</label>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={t('templatesNew.placeholders.name')}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('templatesNew.fields.description')}</label>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder={t('templatesNew.placeholders.description')}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm min-h-[110px]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('templatesNew.fields.category')}</label>
            <input
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              placeholder={t('templatesNew.placeholders.category')}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#e7ebf4] dark:border-gray-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{t('templatesNew.share.title')}</p>
              <p className="text-xs text-[#48679d]">{t('templatesNew.share.subtitle')}</p>
            </div>
            <button
              onClick={onPublicToggle}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isPublic ? t('templatesNew.share.public') : t('templatesNew.share.team')}
            </button>
          </div>
          <div className="rounded-lg border border-dashed border-[#e7ebf4] dark:border-gray-800 px-4 py-3 text-xs text-gray-500">
            {t('proposalEditor.saveTemplate.blockCount', { count: blockCount })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#e7ebf4] dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#e7ebf4] text-sm font-semibold text-[#48679d]"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-70"
          >
            {isSaving ? t('templatesNew.saving') : t('templatesNew.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function BlockContent({
  block,
  resolveText,
}: {
  block: ProposalBlock
  resolveText?: (value: string) => string
}) {
  const { t, locale } = useI18n()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  const resolve = resolveText ?? ((value: string) => value)
  const formatCurrency = (value: number, currency = 'TRY') => {
    try {
      return new Intl.NumberFormat(localeCode, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
    } catch {
      return new Intl.NumberFormat(localeCode, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)
    }
  }
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
  const verticalAlignMap: Record<'top' | 'center' | 'bottom', 'flex-start' | 'center' | 'flex-end'> = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
  }

  const getShadow = (level: number | undefined) => {
    if (level === 1) return '0 1px 3px rgba(15, 23, 42, 0.12)'
    if (level === 2) return '0 8px 18px rgba(15, 23, 42, 0.12)'
    if (level === 3) return '0 18px 34px rgba(15, 23, 42, 0.16)'
    return 'none'
  }

  const getFrameStyle = (style?: BlockFrameStyle, defaults?: { bg?: string; radius?: number }) => ({
    backgroundColor: style?.blockBg ?? defaults?.bg ?? 'transparent',
    border: `${style?.borderWidth ?? 0}px solid ${style?.borderColor ?? 'transparent'}`,
    borderRadius: `${style?.radius ?? defaults?.radius ?? 12}px`,
    padding: `${style?.paddingY ?? 32}px ${style?.paddingX ?? 32}px`,
    boxShadow: getShadow(style?.shadowLevel),
    textAlign: style?.textAlign ?? undefined,
    fontSize: style?.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style?.fontWeight ?? undefined,
    fontStyle: style?.italic ? 'italic' : undefined,
    lineHeight: style?.lineHeight ?? undefined,
  })

  return (
    <>
      {block.type === 'hero' && (
        (() => {
          const heroStyle = block.data.style ?? {}
          const overlayOpacity = Math.min(90, Math.max(10, heroStyle.overlayOpacity ?? 65))
          const contentAlign = heroStyle.contentAlign ?? 'left'
          const alignClass =
            contentAlign === 'center' ? 'items-center text-center' : contentAlign === 'right' ? 'items-end text-right' : 'items-start text-left'
          const heroHeight = Math.min(560, Math.max(220, heroStyle.height ?? 320))
          return (
        <div
          className={`bg-cover bg-center flex flex-col justify-end relative ${alignClass}`}
          style={{
            ...getFrameStyle(heroStyle, { radius: 14 }),
            color: heroStyle.textColor ?? '#ffffff',
            height: `${heroHeight}px`,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,${overlayOpacity / 100})), url(\"${block.data.backgroundUrl}\")`,
          }}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{resolve(block.data.title)}</h1>
            <p className="text-lg opacity-90">{resolve(block.data.subtitle)}</p>
          </div>
        </div>
          )
        })()
      )}

      {block.type === 'heading' && (
        <div
          className={headingAlignMap[block.data.align]}
          style={{ ...getFrameStyle(block.data.style), color: block.data.style?.textColor ?? 'var(--proposal-text)' }}
        >
          <p
            className={headingSizeMap[block.data.level]}
            style={{
              letterSpacing: `${block.data.style?.letterSpacing ?? 0}px`,
              fontWeight: block.data.style?.fontWeight ?? 700,
              fontStyle: block.data.style?.italic ? 'italic' : 'normal',
              fontSize: block.data.style?.fontSize ? `${block.data.style.fontSize}px` : undefined,
            }}
          >
            {resolve(block.data.text)}
          </p>
        </div>
      )}

      {block.type === 'text' && (
        <div
          className="leading-relaxed flex min-h-[120px]"
          style={{
            ...getFrameStyle(block.data.style),
            alignItems: verticalAlignMap[block.data.style?.verticalAlign ?? 'top'],
            justifyContent: 'stretch',
            color: block.data.style?.textColor ?? 'var(--proposal-text)',
            fontSize: `${block.data.style?.fontSize ?? 16}px`,
            lineHeight: block.data.style?.lineHeight ?? 1.7,
            textAlign: block.data.style?.align ?? 'left',
            fontWeight: block.data.style?.fontWeight ?? 400,
            fontStyle: block.data.style?.italic ? 'italic' : 'normal',
          }}
        >
          <p className="w-full">{resolve(block.data.content)}</p>
        </div>
      )}

      {block.type === 'pricing' && (
        <div
          style={{
            ...getFrameStyle(block.data.style, { bg: block.data.style?.surfaceColor ?? '#f8fafc' }),
            backgroundColor: block.data.style?.surfaceColor ?? '#f8fafc',
          }}
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[color:var(--proposal-text)]">
            <span className="material-symbols-outlined text-[color:var(--proposal-accent)]">shopping_cart</span>
            {t('proposalEditor.pricing.title')}
          </h3>
          {(() => {
            const items = Array.isArray(block.data.items) ? block.data.items : []
            const subtotalCurrency = items.find((item) => item.currency)?.currency ?? 'TRY'
            const columns = block.data.columns ?? defaultPricingColumns
            const visibleColumns = [
              columns.description,
              columns.quantity,
              columns.unit,
              columns.unitPrice,
              columns.total,
            ].filter(Boolean).length
            const canSplitSubtotal = visibleColumns > 1
            const subtotalLabelSpan = canSplitSubtotal ? Math.max(visibleColumns - 1, 1) : 1
            const subtotalValue = formatCurrency(
              items.reduce((sum, item) => sum + (item.qty ?? 0) * (item.price ?? 0), 0),
              subtotalCurrency
            )
            return (
          <table className="w-full text-sm text-left">
            <thead
              className="text-xs uppercase border-b"
              style={{
                color: block.data.style?.headerTextColor ?? '#475569',
                borderBottomColor: block.data.style?.headerColor ?? '#e2e8f0',
              }}
            >
              <tr>
                {columns.description && <th className="pb-3 font-semibold">{t('proposalEditor.pricing.columns.description')}</th>}
                {columns.quantity && <th className="pb-3 font-semibold text-center">{t('proposalEditor.pricing.columns.quantity')}</th>}
                {columns.unit && <th className="pb-3 font-semibold">{t('proposalEditor.pricing.columns.unit')}</th>}
                {columns.unitPrice && <th className="pb-3 font-semibold text-right">{t('proposalEditor.pricing.columns.unitPrice')}</th>}
                {columns.total && <th className="pb-3 font-semibold text-right">{t('proposalEditor.pricing.columns.total')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => {
                const total = (item.qty ?? 0) * (item.price ?? 0)
                return (
                  <tr key={item.id}>
                    {columns.description && (
                      <td className="py-4 font-medium text-[color:var(--proposal-text)]">{resolve(item.name)}</td>
                    )}
                    {columns.quantity && <td className="py-4 text-center">{item.qty}</td>}
                    {columns.unit && <td className="py-4">{resolve(item.unit || t('proposalEditor.pricing.fallbackUnit'))}</td>}
                    {columns.unitPrice && (
                      <td className="py-4 text-right">{formatCurrency(item.price, item.currency ?? subtotalCurrency)}</td>
                    )}
                    {columns.total && (
                      <td className="py-4 text-right font-semibold">{formatCurrency(total, item.currency ?? subtotalCurrency)}</td>
                    )}
                  </tr>
                )
              })}
              <tr className="bg-primary/5">
                {canSplitSubtotal ? (
                  <>
                    <td className="py-4 text-right font-bold text-gray-500" colSpan={subtotalLabelSpan}>
                      {t('proposalEditor.pricing.subtotal')}
                    </td>
                    <td className="py-4 text-right font-bold text-[color:var(--proposal-accent)] text-lg">
                      {subtotalValue}
                    </td>
                  </>
                ) : (
                  <td className="py-4 text-right font-bold text-[color:var(--proposal-accent)] text-lg">
                    {t('proposalEditor.pricing.subtotal')}: {subtotalValue}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
            )
          })()}
        </div>
      )}

      {block.type === 'video' && (
        <div className="space-y-4" style={getFrameStyle(block.data.style)}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('proposalEditor.blocks.video')}</h4>
            <span className="text-xs text-gray-400 truncate">{resolve(block.data.title)}</span>
          </div>
          {getEmbedUrl(block.data.url) ? (
            <div
              className="aspect-video w-full overflow-hidden bg-black"
              style={{
                borderRadius: `${block.data.style?.borderRadius ?? 12}px`,
                border: `1px solid ${block.data.style?.borderColor ?? '#e2e8f0'}`,
              }}
            >
              <iframe
                className="w-full h-full"
                src={getEmbedUrl(block.data.url)}
                title={block.data.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-sm text-gray-400">
              {t('proposalEditor.validation.invalidVideoUrl')}
            </div>
          )}
        </div>
      )}

      {block.type === 'gallery' && (
        <div className="space-y-4" style={getFrameStyle(block.data.style)}>
          <h4 className="text-sm font-semibold">{t('proposalEditor.blocks.gallery')}</h4>
          {(() => {
            const galleryImages = Array.isArray(block.data.images) ? block.data.images : []
            const columnCount = block.data.columns === 3 ? 3 : 2
            return (
              <div
                className={`grid ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
                style={{ gap: `${block.data.style?.gap ?? 16}px` }}
              >
                {galleryImages.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden border border-gray-200 dark:border-gray-800"
                style={{ borderRadius: `${block.data.style?.imageRadius ?? 12}px` }}
              >
                <div
                  className="h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url(\"${image.url}\")` }}
                />
                <div className="p-3 text-xs text-gray-500">{resolve(image.caption)}</div>
              </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {block.type === 'testimonial' && (
        <div
          className="space-y-4"
          style={{
            ...getFrameStyle(block.data.style, { bg: block.data.style?.backgroundColor ?? '#f8fafc' }),
            backgroundColor: block.data.style?.backgroundColor ?? '#f8fafc',
          }}
        >
          <span className="material-symbols-outlined text-3xl" style={{ color: block.data.style?.accentColor ?? 'var(--proposal-accent)' }}>format_quote</span>
          <p className="text-lg italic" style={{ color: block.data.style?.quoteColor ?? 'var(--proposal-text)' }}>"{resolve(block.data.quote)}"</p>
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-full bg-cover bg-center border border-gray-200"
              style={{ backgroundImage: `url(\"${block.data.avatarUrl}\")` }}
            />
            <div>
              <p className="text-sm font-semibold">{resolve(block.data.author)}</p>
              <p className="text-xs text-gray-500">{resolve(block.data.role)}</p>
            </div>
          </div>
        </div>
      )}

      {block.type === 'timeline' && (
        <div className="space-y-4" style={getFrameStyle(block.data.style)}>
          <h4 className="text-sm font-semibold">{t('proposalEditor.blocks.timeline')}</h4>
          <div className="space-y-4">
            {(Array.isArray(block.data.items) ? block.data.items : []).map((item, itemIndex, arr) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full" style={{ backgroundColor: block.data.style?.dotColor ?? 'var(--proposal-accent)' }}></div>
                  {itemIndex !== arr.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ backgroundColor: block.data.style?.lineColor ?? '#dbe2ee' }}></div>
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{resolve(item.title)}</p>
                    <span className="text-xs" style={{ color: block.data.style?.dateColor ?? '#64748b' }}>{resolve(item.date)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{resolve(item.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'countdown' && (
        <div className="space-y-4" style={getFrameStyle(block.data.style)}>
          <h4 className="text-sm font-semibold">{resolve(block.data.label)}</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t('proposalEditor.fields.days'), value: block.data.days },
              { label: t('proposalEditor.fields.hours'), value: block.data.hours },
              { label: t('proposalEditor.fields.minutes'), value: block.data.minutes },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center"
                style={{ backgroundColor: block.data.style?.cardColor ?? '#ffffff' }}
              >
                <p className="text-2xl font-bold" style={{ color: block.data.style?.numberColor ?? 'var(--proposal-accent)' }}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'cta' && (
        <div className="flex items-center justify-center" style={getFrameStyle(block.data.style)}>
          <div
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
              block.data.variant === 'primary'
                ? 'text-white'
                : block.data.variant === 'secondary'
                  ? 'bg-gray-100 text-[#0d121c]'
                  : 'border border-[color:var(--proposal-accent)] text-[color:var(--proposal-accent)]'
            }`}
            style={{
              borderRadius: `${block.data.style?.borderRadius ?? 10}px`,
              backgroundColor:
                block.data.variant === 'primary'
                  ? (block.data.style?.bgColor ?? 'var(--proposal-accent)')
                  : block.data.variant === 'secondary'
                    ? (block.data.style?.bgColor ?? '#f3f4f6')
                    : 'transparent',
              color:
                block.data.variant === 'outline'
                  ? (block.data.style?.borderColor ?? 'var(--proposal-accent)')
                  : (block.data.style?.textColor ?? undefined),
              borderColor: block.data.style?.borderColor ?? undefined,
            }}
          >
            {resolve(block.data.label)}
          </div>
        </div>
      )}

      {block.type === 'signature' && (
        <div style={getFrameStyle(block.data.style)}>
          <div
            className="border border-dashed rounded-lg p-6 text-center text-gray-500"
            style={{
              borderColor: block.data.style?.borderColor ?? '#cbd5e1',
              backgroundColor: block.data.style?.backgroundColor ?? '#ffffff',
            }}
          >
            <span className="material-symbols-outlined text-3xl mb-2" style={{ color: block.data.style?.iconColor ?? 'var(--proposal-accent)' }}>draw</span>
            <p className="text-sm font-semibold">{resolve(block.data.label)}</p>
            <p className="text-xs">
              {block.data.required ? t('proposalEditor.signature.required') : t('proposalEditor.signature.optional')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function EditorBlock({
  block,
  index,
  isSelected,
  onSelect,
  onRemove,
}: {
  block: ProposalBlock
  index: number
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const containerClasses = `w-full overflow-hidden rounded-lg border-2 transition-all ${
    isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-transparent'
  } ${isDragging ? 'opacity-70' : ''}`

  return (
    <div ref={setNodeRef} style={style} className={containerClasses} onClick={onSelect}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 rounded-t-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500" {...attributes} {...listeners}>
          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
          {t('proposalEditor.blockCard.title', { index: index + 1 })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      <BlockContent block={block} />
    </div>
  )
}

type SendMethod = 'email' | 'whatsapp' | 'sms' | 'link'

type SendProposalModalProps = {
  proposalTitle: string
  clientName: string
  defaultEmail: string
  defaultPhone: string
  proposalLink: string
  proposalRecordId?: string | null
  dealId?: string | null
  resolveText: (value: string) => string
  blocks: ProposalBlock[]
  designSettings: ProposalDesignSettings
  onLinkUpdate?: (nextLink: string) => void
  onPreview?: () => void
  onClose: () => void
  layout?: 'modal' | 'page'
}

function SendProposalModal({
  proposalTitle,
  clientName,
  defaultEmail,
  defaultPhone,
  proposalLink,
  proposalRecordId = null,
  dealId = null,
  resolveText,
  blocks,
  designSettings,
  onLinkUpdate,
  onPreview,
  onClose,
  layout = 'modal',
}: SendProposalModalProps) {
  const router = useRouter()
  const { t } = useI18n()
  const isModal = layout === 'modal'
  const sendMethods = useMemo<Array<{ id: SendMethod; label: string; description: string; icon: string }>>(
    () => [
      { id: 'email', label: t('proposalEditor.send.methods.email.label'), description: t('proposalEditor.send.methods.email.description'), icon: 'mail' },
      { id: 'whatsapp', label: t('proposalEditor.send.methods.whatsapp.label'), description: t('proposalEditor.send.methods.whatsapp.description'), icon: 'chat' },
      { id: 'sms', label: t('proposalEditor.send.methods.sms.label'), description: t('proposalEditor.send.methods.sms.description'), icon: 'sms' },
      { id: 'link', label: t('proposalEditor.send.methods.link.label'), description: t('proposalEditor.send.methods.link.description'), icon: 'link' },
    ],
    [t]
  )
  const expiryOptions = useMemo(
    () => [
      { value: '24h', label: t('proposalEditor.send.expiry.options.24h') },
      { value: '48h', label: t('proposalEditor.send.expiry.options.48h') },
      { value: '7d', label: t('proposalEditor.send.expiry.options.7d') },
      { value: '14d', label: t('proposalEditor.send.expiry.options.14d') },
      { value: '30d', label: t('proposalEditor.send.expiry.options.30d') },
      { value: 'unlimited', label: t('proposalEditor.send.expiry.options.unlimited') },
    ],
    [t]
  )
  const [method, setMethod] = useState<SendMethod>('email')
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail)
  const [recipientPhone, setRecipientPhone] = useState(defaultPhone)
  const [subject, setSubject] = useState(() =>
    resolveText(t('proposalEditor.send.defaults.subject', { client: clientName }))
  )
  const [message, setMessage] = useState(() => resolveText(t('proposalEditor.send.defaults.message')))
  const [subjectDirty, setSubjectDirty] = useState(false)
  const [messageDirty, setMessageDirty] = useState(false)
  const [emailDirty, setEmailDirty] = useState(false)
  const [phoneDirty, setPhoneDirty] = useState(false)
  const [includeLink, setIncludeLink] = useState(true)
  const [includePdf, setIncludePdf] = useState(true)
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [expiryDuration, setExpiryDuration] = useState('7d')
  const [showCountdown, setShowCountdown] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [view, setView] = useState<'form' | 'success'>('form')
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sentProposalId, setSentProposalId] = useState<string | null>(proposalRecordId)

  useEffect(() => {
    if (!isModal) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModal])

  useEffect(() => {
    if (view !== 'success') return

    if (!isModal) {
      return
    }

    const timer = setTimeout(() => {
      onClose()
    }, 2000)

    return () => clearTimeout(timer)
  }, [isModal, onClose, view])

  const openSentProposal = () => {
    if (!sentProposalId) {
      return
    }
    router.push(`/proposals/${sentProposalId}`)
  }

  const handleCloseAction = () => {
    if (!isModal) {
      return
    }
    onClose()
  }

  useEffect(() => {
    if (!emailDirty) {
      setRecipientEmail(defaultEmail)
    }
  }, [defaultEmail, emailDirty])

  useEffect(() => {
    if (!phoneDirty) {
      setRecipientPhone(defaultPhone)
    }
  }, [defaultPhone, phoneDirty])

  useEffect(() => {
    if (!subjectDirty) {
      setSubject(resolveText(t('proposalEditor.send.defaults.subject', { client: clientName })))
    }
  }, [clientName, resolveText, subjectDirty, t])

  useEffect(() => {
    if (!messageDirty) {
      setMessage(resolveText(t('proposalEditor.send.defaults.message')))
    }
  }, [messageDirty, resolveText, t])

  const resolvedSubject = resolveText(subject)
  const resolvedMessage = resolveText(message)

  const handleSend = async () => {
    setIsSending(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposalRecordId,
          title: proposalTitle,
          dealId,
          clientName,
          contactEmail: recipientEmail,
          contactPhone: recipientPhone,
          blocks,
          designSettings,
          method,
          subject: resolvedSubject,
          message: resolvedMessage,
          includeLink,
          includePdf,
          expiryEnabled,
          expiryDuration,
          showCountdown,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || t('proposalEditor.send.errors.failed'))
      }

      const payload = await response.json()
      if (payload?.publicUrl && typeof onLinkUpdate === 'function') {
        onLinkUpdate(payload.publicUrl)
      }
      if (payload?.proposalId && typeof payload.proposalId === 'string') {
        setSentProposalId(payload.proposalId)
      }
      setView('success')
    } catch (error) {
      const messageText = error instanceof Error ? error.message : t('proposalEditor.send.errors.failed')
      setErrorMessage(messageText)
    } finally {
      setIsSending(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposalLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const whatsappMessage = t('proposalEditor.send.templates.whatsapp', { client: clientName, link: proposalLink })
  const smsMessage = t('proposalEditor.send.templates.sms', { link: proposalLink })

  const linkAnchor = t('email.proposalAnchor')
  const finalEmailMessage = includeLink
    ? resolvedMessage.includes(linkAnchor)
      ? resolvedMessage.replace(linkAnchor, `${linkAnchor}\n${proposalLink}`)
      : `${resolvedMessage}\n\n${proposalLink}`
    : resolvedMessage

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-4 py-6 overflow-y-auto sm:items-center'
          : 'w-full'
      }
      onClick={isModal ? onClose : undefined}
    >
      <div
        className={
          isModal
            ? 'w-full max-w-[600px] bg-white dark:bg-[#101722] rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-3rem)] overflow-y-auto'
            : 'w-full max-w-[720px] mx-auto bg-white dark:bg-[#101722] rounded-2xl shadow-xl flex flex-col'
        }
        onClick={isModal ? (event) => event.stopPropagation() : undefined}
      >
        <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('proposalEditor.actions.sendTitle')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400">{clientName} - {proposalTitle}</p>
          </div>
          <button onClick={handleCloseAction} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {view === 'form' && (
          <div className="p-6 space-y-6">
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sendMethods.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMethod(option.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                    method === option.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-[#e7ebf4] dark:border-gray-800 text-[#48679d] hover:border-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-[11px] text-gray-400">{option.description}</span>
                </button>
              ))}
            </div>

            {method === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.recipient')}</label>
                  <input
                    value={recipientEmail}
                    onChange={(event) => {
                      setEmailDirty(true)
                      setRecipientEmail(event.target.value)
                    }}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.subject')}</label>
                  <input
                    value={subject}
                    onChange={(event) => {
                      setSubjectDirty(true)
                      setSubject(event.target.value)
                    }}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.message')}</label>
                  <textarea
                    value={message}
                    onChange={(event) => {
                      setMessageDirty(true)
                      setMessage(event.target.value)
                    }}
                    rows={6}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                  <div className="mt-2 text-xs text-gray-400 whitespace-pre-line bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-dashed border-gray-200 dark:border-gray-800">
                    {finalEmailMessage}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includeLink}
                      onChange={() => setIncludeLink((prev) => !prev)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    {t('proposalEditor.send.actions.includeLink')}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includePdf}
                      onChange={() => setIncludePdf((prev) => !prev)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    {t('proposalEditor.send.actions.includePdf')}
                  </label>
                </div>
                <p className="text-xs text-gray-400">{t('proposalEditor.send.hints.pdf')}</p>
              </div>
            )}

            {method === 'whatsapp' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.phone')}</label>
                  <input
                    value={recipientPhone}
                    onChange={(event) => {
                      setPhoneDirty(true)
                      setRecipientPhone(event.target.value)
                    }}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-[#48679d]">
                  {resolveText(whatsappMessage)}
                </div>
                <p className="text-xs text-gray-400">{t('proposalEditor.send.hints.whatsapp')}</p>
              </div>
            )}

            {method === 'sms' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.phone')}</label>
                  <input
                    value={recipientPhone}
                    onChange={(event) => {
                      setPhoneDirty(true)
                      setRecipientPhone(event.target.value)
                    }}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-[#48679d]">
                  {resolveText(smsMessage)}
                </div>
              </div>
            )}

            {method === 'link' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-[#0d121c] dark:text-white truncate">{proposalLink}</span>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <p className="text-xs text-gray-400">{t('proposalEditor.send.hints.link')}</p>
              </div>
            )}

            <div className="border-t border-[#e7ebf4] dark:border-gray-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('proposalEditor.send.expiry.add')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expiryEnabled}
                    onChange={() => setExpiryEnabled((prev) => !prev)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
              {expiryEnabled && (
                <div className="space-y-3">
                  <select
                    value={expiryDuration}
                    onChange={(event) => setExpiryDuration(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  >
                    {expiryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showCountdown}
                      onChange={() => setShowCountdown((prev) => !prev)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    {t('proposalEditor.send.expiry.showCountdown')}
                  </label>
                  <p className="text-xs text-amber-500">{t('proposalEditor.send.expiry.warning')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-green-600">
              {t('deals.badges.proposalSent')}
            </p>
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('proposalEditor.send.success.title')}</h3>
            <p className="text-sm text-[#48679d] dark:text-gray-400">{t('proposalEditor.send.success.subtitle')}</p>
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-[#0d121c] dark:text-white truncate">{proposalLink}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
              >
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <button
              onClick={openSentProposal}
              className="w-full mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
            >
              {t('proposalEditor.send.success.track')}
            </button>
            <button
              onClick={openSentProposal}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold"
            >
              {t('proposalEditor.send.success.done')}
            </button>
            <button onClick={() => setView('form')} className="text-sm text-primary underline">
              {t('proposalEditor.send.success.sendAnother')}
            </button>
          </div>
        )}

        {view === 'form' && (
          <div className="px-6 py-4 border-t border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (isModal) {
                  onPreview?.()
                  onClose()
                  return
                }
                onPreview?.()
              }}
              className="text-sm font-semibold text-[#48679d] hover:text-primary"
            >
              {t('proposalEditor.actions.preview')}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCloseAction}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-70"
              >
                {isSending ? (
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
                {t('proposalEditor.actions.send')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
