'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  productId?: string
}

type PricingData = {
  source: 'crm' | 'manual'
  columns: {
    description: boolean
    quantity: boolean
    unitPrice: boolean
    total: boolean
  }
  items: PricingItem[]
}

type ProductOption = {
  id: string
  name: string
  price: number
  currency: string
  category: string | null
}

type SignatureData = {
  label: string
  required: boolean
}

type VideoData = {
  url: string
  title: string
}

type GalleryImage = {
  id: string
  url: string
  caption: string
}

type GalleryData = {
  columns: 2 | 3
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
  design: {
    background: string
    text: string
    accent: string
    radius: number
    fontScale: number
  }
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

export default function ProposalEditorPage() {
  const supabase = useSupabase()
  const { user, authUser, loading: userLoading } = useUser()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')
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
            unitPrice: true,
            total: true,
          },
          items: [
            { id: crypto.randomUUID(), name: t('proposalEditor.defaults.pricing.primary'), qty: 25, price: 1200, currency: 'TRY' },
            { id: crypto.randomUUID(), name: t('proposalEditor.defaults.pricing.secondary'), qty: 1, price: 5000, currency: 'TRY' },
          ],
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
        },
      }
    }

    return {
      id,
      type,
      data: {
        content: t('proposalEditor.defaults.textContent'),
      },
    }
  }, [t])

  const templatePresets = useMemo<TemplatePreset[]>(
    () => [
      {
        id: 'web',
        name: t('proposalEditor.templates.web.name'),
        description: t('proposalEditor.templates.web.description'),
        title: t('proposalEditor.templates.web.title'),
        design: {
          background: '#ffffff',
          text: '#0d121c',
          accent: '#2563eb',
          radius: 12,
          fontScale: 100,
        },
        build: () => [
          updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
            title: t('proposalEditor.templates.web.heroTitle'),
            subtitle: t('proposalEditor.templates.web.heroSubtitle'),
            backgroundUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
          }),
          updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
            text: t('proposalEditor.templates.web.scopeTitle'),
            level: 'h2',
            align: 'left',
          }),
          updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
            content: t('proposalEditor.templates.web.scopeBody'),
          }),
          updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
            columns: 3,
          }),
          updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
            items: [
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.web.pricing.0'), qty: 1, price: 38000 },
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.web.pricing.1'), qty: 1, price: 52000 },
            ],
          }),
          updateBlock(createBlock('testimonial') as Extract<ProposalBlock, { type: 'testimonial' }>, {
            quote: t('proposalEditor.templates.web.testimonial.quote'),
            author: t('proposalEditor.templates.web.testimonial.author'),
            role: t('proposalEditor.templates.web.testimonial.role'),
          }),
          updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
            label: t('proposalEditor.templates.web.ctaLabel'),
            url: 'https://cal.com/aero/demo',
            variant: 'primary',
          }),
          createBlock('signature'),
        ],
      },
      {
        id: 'seo',
        name: t('proposalEditor.templates.seo.name'),
        description: t('proposalEditor.templates.seo.description'),
        title: t('proposalEditor.templates.seo.title'),
        design: {
          background: '#ffffff',
          text: '#0f172a',
          accent: '#10b981',
          radius: 12,
          fontScale: 100,
        },
        build: () => [
          updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
            title: t('proposalEditor.templates.seo.heroTitle'),
            subtitle: t('proposalEditor.templates.seo.heroSubtitle'),
            backgroundUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200',
          }),
          updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
            text: t('proposalEditor.templates.seo.quickWinsTitle'),
            level: 'h2',
            align: 'left',
          }),
          updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
            content: t('proposalEditor.templates.seo.quickWinsBody'),
          }),
          updateBlock(createBlock('timeline') as Extract<ProposalBlock, { type: 'timeline' }>, {
            items: [
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.templates.seo.timeline.0.title'),
                description: t('proposalEditor.templates.seo.timeline.0.description'),
                date: t('proposalEditor.templates.seo.timeline.0.date'),
              },
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.templates.seo.timeline.1.title'),
                description: t('proposalEditor.templates.seo.timeline.1.description'),
                date: t('proposalEditor.templates.seo.timeline.1.date'),
              },
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.templates.seo.timeline.2.title'),
                description: t('proposalEditor.templates.seo.timeline.2.description'),
                date: t('proposalEditor.templates.seo.timeline.2.date'),
              },
            ],
          }),
          updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
            items: [
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.seo.pricing.0'), qty: 1, price: 18000 },
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.seo.pricing.1'), qty: 1, price: 12000 },
            ],
          }),
          updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
            label: t('proposalEditor.templates.seo.ctaLabel'),
            url: 'https://aero-crm.app/seo',
            variant: 'secondary',
          }),
          createBlock('signature'),
        ],
      },
      {
        id: 'social',
        name: t('proposalEditor.templates.social.name'),
        description: t('proposalEditor.templates.social.description'),
        title: t('proposalEditor.templates.social.title'),
        design: {
          background: '#ffffff',
          text: '#111827',
          accent: '#f97316',
          radius: 12,
          fontScale: 100,
        },
        build: () => [
          updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
            title: t('proposalEditor.templates.social.heroTitle'),
            subtitle: t('proposalEditor.templates.social.heroSubtitle'),
            backgroundUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
          }),
          updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
            content: t('proposalEditor.templates.social.body'),
          }),
          updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
            columns: 3,
          }),
          updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
            items: [
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.social.pricing.0'), qty: 1, price: 15000 },
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.social.pricing.1'), qty: 1, price: 9000 },
            ],
          }),
          updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
            label: t('proposalEditor.templates.social.ctaLabel'),
            url: 'https://aero-crm.app/social',
            variant: 'primary',
          }),
          createBlock('signature'),
        ],
      },
      {
        id: 'real-estate',
        name: t('proposalEditor.templates.realEstate.name'),
        description: t('proposalEditor.templates.realEstate.description'),
        title: t('proposalEditor.templates.realEstate.title'),
        design: {
          background: '#ffffff',
          text: '#0f172a',
          accent: '#ef4444',
          radius: 12,
          fontScale: 100,
        },
        build: () => [
          updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
            title: t('proposalEditor.templates.realEstate.heroTitle'),
            subtitle: t('proposalEditor.templates.realEstate.heroSubtitle'),
            backgroundUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200',
          }),
          updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
            columns: 3,
          }),
          updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
            content: t('proposalEditor.templates.realEstate.body'),
          }),
          updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
            items: [
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.realEstate.pricing.0'), qty: 1, price: 14000 },
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.realEstate.pricing.1'), qty: 1, price: 8000 },
            ],
          }),
          updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
            label: t('proposalEditor.templates.realEstate.ctaLabel'),
            url: 'https://aero-crm.app/real-estate',
            variant: 'outline',
          }),
          createBlock('signature'),
        ],
      },
      {
        id: 'logistics',
        name: t('proposalEditor.templates.logistics.name'),
        description: t('proposalEditor.templates.logistics.description'),
        title: t('proposalEditor.templates.logistics.title'),
        design: {
          background: '#ffffff',
          text: '#0f172a',
          accent: '#0ea5e9',
          radius: 12,
          fontScale: 100,
        },
        build: () => [
          updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
            title: t('proposalEditor.templates.logistics.heroTitle'),
            subtitle: t('proposalEditor.templates.logistics.heroSubtitle'),
            backgroundUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
          }),
          updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
            text: t('proposalEditor.templates.logistics.flowTitle'),
            level: 'h2',
            align: 'left',
          }),
          updateBlock(createBlock('timeline') as Extract<ProposalBlock, { type: 'timeline' }>, {
            items: [
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.templates.logistics.timeline.0.title'),
                description: t('proposalEditor.templates.logistics.timeline.0.description'),
                date: t('proposalEditor.templates.logistics.timeline.0.date'),
              },
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.templates.logistics.timeline.1.title'),
                description: t('proposalEditor.templates.logistics.timeline.1.description'),
                date: t('proposalEditor.templates.logistics.timeline.1.date'),
              },
              {
                id: crypto.randomUUID(),
                title: t('proposalEditor.templates.logistics.timeline.2.title'),
                description: t('proposalEditor.templates.logistics.timeline.2.description'),
                date: t('proposalEditor.templates.logistics.timeline.2.date'),
              },
            ],
          }),
          updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
            items: [
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.logistics.pricing.0'), qty: 1, price: 24000 },
              { id: crypto.randomUUID(), name: t('proposalEditor.templates.logistics.pricing.1'), qty: 1, price: 11000 },
            ],
          }),
          updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
            label: t('proposalEditor.templates.logistics.ctaLabel'),
            url: 'https://aero-crm.app/logistics',
            variant: 'primary',
          }),
          createBlock('signature'),
        ],
      },
    ],
    [createBlock, t]
  )
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [documentTitle, setDocumentTitle] = useState(() => t('proposalEditor.defaults.documentTitle'))
  const [activePanel, setActivePanel] = useState<'content' | 'design'>('content')
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [blocks, setBlocks] = useState<ProposalBlock[]>(() => [
    createBlock('hero'),
    createBlock('text'),
    createBlock('pricing'),
    createBlock('signature'),
  ])
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
  const [designSettings, setDesignSettings] = useState({
    background: '#ffffff',
    text: '#0d121c',
    accent: '#377DF6',
    radius: 12,
    fontScale: 100,
  })

  const proposalMeta = useMemo(
    () => ({
      clientName: t('proposalEditor.defaults.clientName'),
      contactEmail: 'info@abc.com',
      contactPhone: '+90 532 000 00 00',
    }),
    [t]
  )

  useEffect(() => {
    if (userLoading) return
    if (!authUser || !user?.team_id) {
      setProductOptions([])
      return
    }

    const loadProducts = async () => {
      setProductsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, currency, category, active')
        .eq('team_id', user.team_id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProductOptions(
          data.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price ?? 0,
            currency: product.currency ?? 'TRY',
            category: product.category ?? null,
          }))
        )
      }
      setProductsLoading(false)
    }

    loadProducts()
  }, [authUser, user?.team_id, userLoading, supabase])

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
  }, [paletteItems])

  useEffect(() => {
    if (userLoading) return
    if (!authUser) {
      setSavedTemplates([])
      return
    }

    fetchTemplates(templateScope)
  }, [authUser, userLoading, templateScope, fetchTemplates])

  const [proposalLink, setProposalLink] = useState(() => {
    const slug = crypto.randomUUID().split('-')[0]
    return `https://aero-crm.app/p/${slug}`
  })
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [versionHistory, setVersionHistory] = useState<DraftVersion[]>([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const blockMetaMap = useMemo(() => {
    const entries = paletteItems.map(
      (item): [BlockType, { label: string; icon: string }] => [item.id, { label: item.label, icon: item.icon }]
    )
    return new Map(entries)
  }, [])

  const filteredProductOptions = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return productOptions
    return productOptions.filter((product) => {
      const category = product.category?.toLowerCase() ?? ''
      return product.name.toLowerCase().includes(query) || category.includes(query)
    })
  }, [productOptions, productSearch])

  const applyTemplate = (template: TemplatePreset) => {
    setBlocks(template.build())
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
    setBlocks(nextBlocks)
    setDocumentTitle((prev) => template.name || prev)
    setSelectedBlockId(null)
    setEditorMode('edit')
  }, [])

  const openTemplateModal = () => {
    setTemplateName(documentTitle)
    setTemplateDescription('')
    setTemplateCategory('')
    setTemplateIsPublic(false)
    setTemplateModalOpen(true)
  }

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
    if (!templateId) return
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
  }, [templateId, applySavedTemplate])

  const handleSaveDraft = async () => {
    if (isSavingDraft) return
    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/proposals/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: draftId,
          title: documentTitle,
          clientName: proposalMeta.clientName,
          contactEmail: proposalMeta.contactEmail,
          contactPhone: proposalMeta.contactPhone,
          blocks,
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
      toast.success(t('proposalEditor.toasts.draftSaved'))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : t('proposalEditor.toasts.draftSaveFailed')
      toast.error(messageText)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  )

  const handleAddBlock = (type: BlockType, index?: number) => {
    const newBlock = createBlock(type)
    setBlocks((prev) => {
      if (index === undefined || index < 0 || index > prev.length) {
        return [...prev, newBlock]
      }
      const next = [...prev]
      next.splice(index, 0, newBlock)
      return next
    })
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
        return {
          ...block,
          data: {
            ...block.data,
            items: block.data.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
          },
        }
      })
    )
  }

  const addPricingItem = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'pricing') return block
        return {
          ...block,
          data: {
            ...block.data,
            items: [
              ...block.data.items,
              { id: crypto.randomUUID(), name: 'Yeni Kalem', qty: 1, price: 0, currency: 'TRY' },
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
        return {
          ...block,
          data: {
            ...block.data,
            items: block.data.items.filter((item) => item.id !== itemId),
          },
        }
      })
    )
  }

  const addProductToPricing = (blockId: string, product: ProductOption) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'pricing') return block

        const existing = block.data.items.find(
          (item) => item.productId === product.id || item.name === product.name
        )

        if (existing) {
          return {
            ...block,
            data: {
              ...block.data,
              items: block.data.items.map((item) =>
                item.id === existing.id
                  ? {
                      ...item,
                      qty: Math.max(1, item.qty + 1),
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
              ...block.data.items,
              {
                id: crypto.randomUUID(),
                name: product.name,
                qty: 1,
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
        return {
          ...block,
          data: {
            ...block.data,
            images: block.data.images.map((image) => (image.id === imageId ? { ...image, ...updates } : image)),
          },
        }
      })
    )
  }

  const addGalleryImage = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'gallery') return block
        return {
          ...block,
          data: {
            ...block.data,
            images: [
              ...block.data.images,
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
        return {
          ...block,
          data: {
            ...block.data,
            images: block.data.images.filter((image) => image.id !== imageId),
          },
        }
      })
    )
  }

  const updateTimelineItem = (blockId: string, itemId: string, updates: Partial<TimelineItem>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'timeline') return block
        return {
          ...block,
          data: {
            ...block.data,
            items: block.data.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
          },
        }
      })
    )
  }

  const addTimelineItem = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== 'timeline') return block
        return {
          ...block,
          data: {
            ...block.data,
            items: [
              ...block.data.items,
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
        return {
          ...block,
          data: {
            ...block.data,
            items: block.data.items.filter((item) => item.id !== itemId),
          },
        }
      })
    )
  }

  const insertSmartVariable = (value: string) => {
    if (!selectedBlock) {
      return
    }

  if (selectedBlock.type === 'hero') {
    updateBlockData(selectedBlock.id, {
      title: `${selectedBlock.data.title ?? ''} ${value}`.trim(),
    })
    return
  }

  if (selectedBlock.type === 'heading') {
    updateBlockData(selectedBlock.id, {
      text: `${selectedBlock.data.text ?? ''} ${value}`.trim(),
    })
    return
  }

  if (selectedBlock.type === 'text') {
    updateBlockData(selectedBlock.id, {
      content: `${selectedBlock.data.content ?? ''} ${value}`.trim(),
    })
    return
  }

  if (selectedBlock.type === 'testimonial') {
    updateBlockData(selectedBlock.id, {
      quote: `${selectedBlock.data.quote ?? ''} ${value}`.trim(),
    })
  }
  }

  useEffect(() => {
    if (!selectedBlockId && blocks.length > 0) {
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
    .flatMap((block) => block.data.items)
    .reduce((sum, item) => sum + item.qty * item.price, 0)

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
            <StepNav mode={editorMode} onChange={setEditorMode} />
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
            blocks={blocks}
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
            <StepNav mode={editorMode} onChange={setEditorMode} />
          </div>
          <button
            onClick={() => {
              setEditorMode('send')
            }}
            className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90"
          >
            {t('proposalEditor.actions.send')}
          </button>
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
                  <BlockContent block={block} />
                </div>
              ))}
            </div>
          </div>
        </main>

      </div>
    )
  }

  return (
    <div className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8 flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] px-6 z-10">
        <div className="flex items-center gap-4">
          <Link href="/proposals" className="size-8 text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-[#48679d] dark:text-gray-400">{t('proposalEditor.header.title')}</span>
            <div className="flex items-center gap-2">
              <input
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                className="text-sm font-bold text-[#0d121c] dark:text-white bg-transparent border-b border-transparent focus:border-primary outline-none"
              />
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] rounded uppercase font-bold">
                {t('proposals.status.draft')}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 justify-center">
          <StepNav mode={editorMode} onChange={setEditorMode} />
        </div>
        <div className="flex items-center gap-3">
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
            onClick={handleSaveDraft}
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
        </div>
      </header>
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={versionHistory}
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
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 flex flex-col border-r border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] overflow-y-auto">
            <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('proposalEditor.sidebar.blocks')}</h2>
              <p className="text-xs text-gray-500 mt-1">{t('proposalEditor.sidebar.dragHint')}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e7ebf4] dark:border-gray-800">
              <button
                onClick={() => setLeftPanel('blocks')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  leftPanel === 'blocks' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t('proposalEditor.tabs.blocks')}
              </button>
              <button
                onClick={() => setLeftPanel('templates')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  leftPanel === 'templates' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t('proposalEditor.tabs.templates')}
              </button>
              <button
                onClick={() => setLeftPanel('order')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  leftPanel === 'order' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
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

          <main className="flex-1 bg-[#f5f6f8] dark:bg-[#1a212c] overflow-x-hidden p-10 pb-24 flex justify-center relative">
            <CanvasDropZone>
              <div
                className={`w-full max-w-[820px] bg-[color:var(--proposal-bg)] text-[color:var(--proposal-text)] min-h-[1120px] shadow-lg flex flex-col transition-all ${
                  viewMode === 'tablet'
                    ? 'max-w-[640px]'
                    : viewMode === 'mobile'
                      ? 'max-w-[420px]'
                      : ''
                }`}
                style={{
                  ['--proposal-bg' as never]: designSettings.background,
                  ['--proposal-text' as never]: designSettings.text,
                  ['--proposal-accent' as never]: designSettings.accent,
                  borderRadius: `${designSettings.radius}px`,
                  fontSize: `${designSettings.fontScale}%`,
                }}
              >
                <SortableContext items={blocks.map((block) => block.id)}>
                  <div className="flex flex-col gap-6 py-10 px-10">
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
            </CanvasDropZone>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#101722]/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-6">
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
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">zoom_in</span> 100%
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">pages</span> {t('proposalEditor.canvas.pageCount', { current: 1, total: 1 })}
                </span>
              </div>
            </div>
          </main>

          <aside className="w-80 border-l border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] overflow-y-auto">
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
                  </div>
                )}

                {selectedBlock.type === 'pricing' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      {t('proposalEditor.blocks.pricingTable')}
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">{t('proposalEditor.fields.source')}</label>
                      <select
                        value={selectedBlock.data.source}
                        onChange={(event) =>
                          updateBlockData(selectedBlock.id, { source: event.target.value as PricingData['source'] })
                        }
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      >
                        <option value="crm">{t('proposalEditor.fields.productCatalog')}</option>
                        <option value="manual">{t('proposalEditor.fields.manual')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-500 block">{t('proposalEditor.fields.columns')}</label>
                      {Object.entries(selectedBlock.data.columns).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() =>
                              updateBlockData(selectedBlock.id, {
                                columns: { ...selectedBlock.data.columns, [key]: !value },
                              })
                            }
                            className="rounded text-primary focus:ring-primary size-4"
                          />
                          <span className="capitalize text-[#0d121c] dark:text-white">{key}</span>
                        </label>
                      ))}
                    </div>
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
                              onClick={() => addProductToPricing(selectedBlock.id, product)}
                              className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 text-left text-xs"
                            >
                              <div>
                                <p className="font-semibold text-[#0d121c] dark:text-white">{product.name}</p>
                                {product.category && (
                                  <p className="text-[10px] text-gray-400">{product.category}</p>
                                )}
                              </div>
                              <span className="font-semibold text-primary">
                                {formatCurrency(product.price, product.currency)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-500 block">{t('proposalEditor.fields.lineItems')}</label>
                      <div className="space-y-2">
                        {selectedBlock.data.items.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_64px_90px_auto] gap-2 items-center">
                            <input
                              value={item.name}
                              onChange={(event) => updatePricingItem(selectedBlock.id, item.id, { name: event.target.value })}
                              className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            />
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
                              className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-center"
                            />
                            <div className="relative">
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
                                className="w-full pr-10 pl-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-right"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                                {item.currency ?? 'TRY'}
                              </span>
                            </div>
                            <button
                              onClick={() => removePricingItem(selectedBlock.id, item.id)}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              {t('proposalEditor.actions.removeItem')}
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addPricingItem(selectedBlock.id)}
                        className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary"
                      >
                        {t('proposalEditor.actions.addLineItem')}
                      </button>
                    </div>
                  </div>
                )}

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
                        value={selectedBlock.data.columns}
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
                      {selectedBlock.data.images.map((image) => (
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
                      {selectedBlock.data.items.map((item) => (
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
}: {
  mode: 'edit' | 'preview' | 'send'
  onChange: (mode: 'edit' | 'preview' | 'send') => void
}) {
  const { t } = useI18n()
  const steps: { id: 'edit' | 'preview' | 'send'; label: string }[] = [
    { id: 'edit', label: t('proposalEditor.steps.edit') },
    { id: 'preview', label: t('proposalEditor.steps.preview') },
    { id: 'send', label: t('proposalEditor.steps.send') },
  ]
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-[#48679d]">
      {steps.map((step, index) => (
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
          {index < steps.length - 1 && (
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
}: {
  isOpen: boolean
  onClose: () => void
  versions: DraftVersion[]
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
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        {t('proposalEditor.history.latest')}
                      </span>
                    )}
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

function BlockContent({ block }: { block: ProposalBlock }) {
  const { t, locale } = useI18n()
  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
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

  return (
    <>
      {block.type === 'hero' && (
        <div
          className="bg-cover bg-center h-80 flex items-end p-10 text-white relative rounded-b-lg"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.7)), url(\"${block.data.backgroundUrl}\")`,
          }}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{block.data.title}</h1>
            <p className="text-lg text-gray-200 opacity-90">{block.data.subtitle}</p>
          </div>
        </div>
      )}

      {block.type === 'heading' && (
        <div className={`p-8 ${headingAlignMap[block.data.align]}`}>
          <p className={`${headingSizeMap[block.data.level]} font-bold tracking-tight`}>
            {block.data.text}
          </p>
        </div>
      )}

      {block.type === 'text' && (
        <div className="p-8 text-[color:var(--proposal-text)] leading-relaxed">{block.data.content}</div>
      )}

      {block.type === 'pricing' && (
        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[color:var(--proposal-text)]">
            <span className="material-symbols-outlined text-[color:var(--proposal-accent)]">shopping_cart</span>
            {t('proposalEditor.pricing.title')}
          </h3>
          {(() => {
            const subtotalCurrency = block.data.items.find((item) => item.currency)?.currency ?? 'TRY'
            return (
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {block.data.columns.description && <th className="pb-3 font-semibold">{t('proposalEditor.pricing.columns.description')}</th>}
                {block.data.columns.quantity && <th className="pb-3 font-semibold text-center">{t('proposalEditor.pricing.columns.quantity')}</th>}
                {block.data.columns.unitPrice && <th className="pb-3 font-semibold text-right">{t('proposalEditor.pricing.columns.unitPrice')}</th>}
                {block.data.columns.total && <th className="pb-3 font-semibold text-right">{t('proposalEditor.pricing.columns.total')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {block.data.items.map((item) => {
                const total = item.qty * item.price
                return (
                  <tr key={item.id}>
                    {block.data.columns.description && (
                      <td className="py-4 font-medium text-[color:var(--proposal-text)]">{item.name}</td>
                    )}
                    {block.data.columns.quantity && <td className="py-4 text-center">{item.qty}</td>}
                    {block.data.columns.unitPrice && (
                      <td className="py-4 text-right">{formatCurrency(item.price, item.currency ?? subtotalCurrency)}</td>
                    )}
                    {block.data.columns.total && (
                      <td className="py-4 text-right font-semibold">{formatCurrency(total, item.currency ?? subtotalCurrency)}</td>
                    )}
                  </tr>
                )
              })}
              <tr className="bg-primary/5">
                <td className="py-4 text-right font-bold text-gray-500" colSpan={3}>
                  {t('proposalEditor.pricing.subtotal')}
                </td>
                <td className="py-4 text-right font-bold text-[color:var(--proposal-accent)] text-lg">
                  {formatCurrency(block.data.items.reduce((sum, item) => sum + item.qty * item.price, 0), subtotalCurrency)}
                </td>
              </tr>
            </tbody>
          </table>
            )
          })()}
        </div>
      )}

      {block.type === 'video' && (
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('proposalEditor.blocks.video')}</h4>
            <span className="text-xs text-gray-400 truncate">{block.data.title}</span>
          </div>
          {getEmbedUrl(block.data.url) ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
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
        <div className="p-8 space-y-4">
          <h4 className="text-sm font-semibold">{t('proposalEditor.blocks.gallery')}</h4>
          <div className={`grid gap-4 ${block.data.columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {block.data.images.map((image) => (
              <div key={image.id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                <div
                  className="h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url(\"${image.url}\")` }}
                />
                <div className="p-3 text-xs text-gray-500">{image.caption}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'testimonial' && (
        <div className="p-8 space-y-4">
          <span className="material-symbols-outlined text-3xl text-[color:var(--proposal-accent)]">format_quote</span>
          <p className="text-lg italic text-[color:var(--proposal-text)]">"{block.data.quote}"</p>
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-full bg-cover bg-center border border-gray-200"
              style={{ backgroundImage: `url(\"${block.data.avatarUrl}\")` }}
            />
            <div>
              <p className="text-sm font-semibold">{block.data.author}</p>
              <p className="text-xs text-gray-500">{block.data.role}</p>
            </div>
          </div>
        </div>
      )}

      {block.type === 'timeline' && (
        <div className="p-8 space-y-4">
          <h4 className="text-sm font-semibold">{t('proposalEditor.blocks.timeline')}</h4>
          <div className="space-y-4">
            {block.data.items.map((item, itemIndex) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-[color:var(--proposal-accent)]"></div>
                  {itemIndex !== block.data.items.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1"></div>
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'countdown' && (
        <div className="p-8 space-y-4">
          <h4 className="text-sm font-semibold">{block.data.label}</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t('proposalEditor.fields.days'), value: block.data.days },
              { label: t('proposalEditor.fields.hours'), value: block.data.hours },
              { label: t('proposalEditor.fields.minutes'), value: block.data.minutes },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center"
              >
                <p className="text-2xl font-bold text-[color:var(--proposal-accent)]">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'cta' && (
        <div className="p-8 flex items-center justify-center">
          <div
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
              block.data.variant === 'primary'
                ? 'text-white'
                : block.data.variant === 'secondary'
                  ? 'bg-gray-100 text-[#0d121c]'
                  : 'border border-[color:var(--proposal-accent)] text-[color:var(--proposal-accent)]'
            }`}
            style={
              block.data.variant === 'primary'
                ? { backgroundColor: 'var(--proposal-accent)' }
                : undefined
            }
          >
            {block.data.label}
          </div>
        </div>
      )}

      {block.type === 'signature' && (
        <div className="p-8 rounded-b-lg">
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center text-gray-500">
            <span className="material-symbols-outlined text-3xl text-[color:var(--proposal-accent)] mb-2">draw</span>
            <p className="text-sm font-semibold">{block.data.label}</p>
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
  blocks: ProposalBlock[]
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
  blocks,
  onLinkUpdate,
  onPreview,
  onClose,
  layout = 'modal',
}: SendProposalModalProps) {
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
  const [subject, setSubject] = useState(() => t('proposalEditor.send.defaults.subject', { client: clientName }))
  const [message, setMessage] = useState(() => t('proposalEditor.send.defaults.message'))
  const [includeLink, setIncludeLink] = useState(true)
  const [includePdf, setIncludePdf] = useState(true)
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [expiryDuration, setExpiryDuration] = useState('7d')
  const [showCountdown, setShowCountdown] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [view, setView] = useState<'form' | 'success'>('form')
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isModal) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModal])

  useEffect(() => {
    if (view !== 'success') return
    const timer = setTimeout(() => {
      onClose()
    }, 2000)
    return () => clearTimeout(timer)
  }, [view, onClose])

  const handleSend = async () => {
    setIsSending(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposalTitle,
          clientName,
          contactEmail: recipientEmail,
          contactPhone: recipientPhone,
          blocks,
          method,
          subject,
          message,
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
    ? message.includes(linkAnchor)
      ? message.replace(linkAnchor, `${linkAnchor}\n${proposalLink}`)
      : `${message}\n\n${proposalLink}`
    : message

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.subject')}</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">{t('proposalEditor.send.fields.message')}</label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
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
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-[#48679d]">
                  {whatsappMessage}
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
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-[#48679d]">
                  {smsMessage}
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
            <button className="w-full mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold">
              {t('proposalEditor.send.success.track')}
            </button>
            <button
              onClick={onClose}
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
                onClick={onClose}
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
