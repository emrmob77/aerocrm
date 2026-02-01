'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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

const smartVariables = ['{{Müşteri_Adı}}', '{{Teklif_No}}', '{{Tarih}}', '{{Toplam_Tutar}}']

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

const paletteItems: PaletteItem[] = [
  { id: 'hero', label: 'Hero', icon: 'image', group: 'basic' },
  { id: 'heading', label: 'Başlık', icon: 'title', group: 'basic' },
  { id: 'text', label: 'Metin', icon: 'notes', group: 'basic' },
  { id: 'pricing', label: 'Fiyat Tablosu', icon: 'payments', group: 'content' },
  { id: 'video', label: 'Video', icon: 'play_circle', group: 'content' },
  { id: 'gallery', label: 'Galeri', icon: 'photo_library', group: 'content' },
  { id: 'testimonial', label: 'Referans', icon: 'format_quote', group: 'content' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline', group: 'content' },
  { id: 'countdown', label: 'Geri Sayım', icon: 'timer', group: 'action' },
  { id: 'cta', label: 'CTA Butonu', icon: 'ads_click', group: 'action' },
  { id: 'signature', label: 'E-İmza', icon: 'draw', group: 'action' },
]

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

const updateBlock = <T extends ProposalBlock>(block: T, data: Partial<T['data']>): T => ({
  ...block,
  data: { ...block.data, ...data },
})

const templatePresets: TemplatePreset[] = [
  {
    id: 'web',
    name: 'Web Tasarım',
    description: 'Kurumsal web sitesi ve UX odaklı',
    title: 'Web Sitesi Tasarım Teklifi',
    design: {
      background: '#ffffff',
      text: '#0d121c',
      accent: '#2563eb',
      radius: 12,
      fontScale: 100,
    },
    build: () => [
      updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
        title: 'Yeni Nesil Web Deneyimi',
        subtitle: 'Markanız için ölçeklenebilir, hızlı ve modern tasarım.',
        backgroundUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
      }),
      updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
        text: 'Proje Kapsamı',
        level: 'h2',
        align: 'left',
      }),
      updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
        content:
          'Bu teklif; kurumsal kimliğinize uygun arayüz tasarımı, içerik mimarisi ve hızlı teslimat planını kapsar.',
      }),
      updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
        columns: 3,
      }),
      updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
        items: [
          { id: crypto.randomUUID(), name: 'UI/UX Tasarım', qty: 1, price: 38000 },
          { id: crypto.randomUUID(), name: 'Frontend Geliştirme', qty: 1, price: 52000 },
        ],
      }),
      updateBlock(createBlock('testimonial') as Extract<ProposalBlock, { type: 'testimonial' }>, {
        quote: 'Tasarım sürecinde beklentimizin çok üstünde bir iş çıktı.',
        author: 'Selin Aksoy',
        role: 'Marketing Lead, Orion',
      }),
      updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
        label: 'Demo Toplantısı Planla',
        url: 'https://cal.com/aero/demo',
        variant: 'primary',
      }),
      createBlock('signature'),
    ],
  },
  {
    id: 'seo',
    name: 'SEO Paketi',
    description: 'Organik büyüme ve teknik iyileştirme',
    title: 'SEO Hizmet Teklifi',
    design: {
      background: '#ffffff',
      text: '#0f172a',
      accent: '#10b981',
      radius: 12,
      fontScale: 100,
    },
    build: () => [
      updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
        title: 'Arama Motorlarında Zirve',
        subtitle: 'Teknik SEO + içerik stratejisi ile sürdürülebilir büyüme.',
        backgroundUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200',
      }),
      updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
        text: 'Hızlı Kazanımlar',
        level: 'h2',
        align: 'left',
      }),
      updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
        content: 'İlk 30 günde teknik iyileştirme + içerik denetimi planı uygulanacaktır.',
      }),
      updateBlock(createBlock('timeline') as Extract<ProposalBlock, { type: 'timeline' }>, {
        items: [
          { id: crypto.randomUUID(), title: 'Denetim', description: 'Teknik analiz', date: 'Hafta 1' },
          { id: crypto.randomUUID(), title: 'Optimizasyon', description: 'Hız + yapı', date: 'Hafta 2' },
          { id: crypto.randomUUID(), title: 'İçerik', description: 'Yeni içerik planı', date: 'Hafta 3-4' },
        ],
      }),
      updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
        items: [
          { id: crypto.randomUUID(), name: 'Teknik SEO', qty: 1, price: 18000 },
          { id: crypto.randomUUID(), name: 'İçerik Optimizasyonu', qty: 1, price: 12000 },
        ],
      }),
      updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
        label: 'SEO Yol Haritasını İndir',
        url: 'https://aero-crm.app/seo',
        variant: 'secondary',
      }),
      createBlock('signature'),
    ],
  },
  {
    id: 'social',
    name: 'Sosyal Medya',
    description: 'İçerik üretimi ve performans planı',
    title: 'Sosyal Medya Yönetim Teklifi',
    design: {
      background: '#ffffff',
      text: '#111827',
      accent: '#f97316',
      radius: 12,
      fontScale: 100,
    },
    build: () => [
      updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
        title: 'Markanızın Sosyal Gücü',
        subtitle: 'Planlı içerik üretimi + performans optimizasyonu.',
        backgroundUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
      }),
      updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
        content: 'Aylık içerik planı, üretim ve yayın takvimiyle sürekli etkileşim hedeflenir.',
      }),
      updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
        columns: 3,
      }),
      updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
        items: [
          { id: crypto.randomUUID(), name: 'İçerik Üretimi', qty: 1, price: 15000 },
          { id: crypto.randomUUID(), name: 'Reklam Yönetimi', qty: 1, price: 9000 },
        ],
      }),
      updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
        label: 'Örnek İçerikleri Gör',
        url: 'https://aero-crm.app/social',
        variant: 'primary',
      }),
      createBlock('signature'),
    ],
  },
  {
    id: 'real-estate',
    name: 'Emlakçı',
    description: 'Portföy sunumu ve satış planı',
    title: 'Emlak Portföy Teklifi',
    design: {
      background: '#ffffff',
      text: '#0f172a',
      accent: '#ef4444',
      radius: 12,
      fontScale: 100,
    },
    build: () => [
      updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
        title: 'Premium Portföy Sunumu',
        subtitle: 'Doğru alıcıya hızlı ulaşım ve satış planı.',
        backgroundUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200',
      }),
      updateBlock(createBlock('gallery') as Extract<ProposalBlock, { type: 'gallery' }>, {
        columns: 3,
      }),
      updateBlock(createBlock('text') as Extract<ProposalBlock, { type: 'text' }>, {
        content: 'Portföyünüz için hedef kitle analizi, ilan optimizasyonu ve saha desteği.',
      }),
      updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
        items: [
          { id: crypto.randomUUID(), name: 'Portföy Yönetimi', qty: 1, price: 14000 },
          { id: crypto.randomUUID(), name: 'Pazarlama Desteği', qty: 1, price: 8000 },
        ],
      }),
      updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
        label: 'Portföy Raporunu Paylaş',
        url: 'https://aero-crm.app/real-estate',
        variant: 'outline',
      }),
      createBlock('signature'),
    ],
  },
  {
    id: 'logistics',
    name: 'Lojistik',
    description: 'Operasyon ve teslimat planı',
    title: 'Lojistik Operasyon Teklifi',
    design: {
      background: '#ffffff',
      text: '#0f172a',
      accent: '#0ea5e9',
      radius: 12,
      fontScale: 100,
    },
    build: () => [
      updateBlock(createBlock('hero') as Extract<ProposalBlock, { type: 'hero' }>, {
        title: 'Hızlı ve Şeffaf Lojistik',
        subtitle: 'Maliyetleri düşüren operasyon modeli.',
        backgroundUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
      }),
      updateBlock(createBlock('heading') as Extract<ProposalBlock, { type: 'heading' }>, {
        text: 'Operasyon Akışı',
        level: 'h2',
        align: 'left',
      }),
      updateBlock(createBlock('timeline') as Extract<ProposalBlock, { type: 'timeline' }>, {
        items: [
          { id: crypto.randomUUID(), title: 'Analiz', description: 'Rota + depo', date: 'Hafta 1' },
          { id: crypto.randomUUID(), title: 'Pilot', description: 'Örnek sevkiyat', date: 'Hafta 2' },
          { id: crypto.randomUUID(), title: 'Yaygınlaştırma', description: 'Tam geçiş', date: 'Hafta 3' },
        ],
      }),
      updateBlock(createBlock('pricing') as Extract<ProposalBlock, { type: 'pricing' }>, {
        items: [
          { id: crypto.randomUUID(), name: 'Operasyon Yönetimi', qty: 1, price: 24000 },
          { id: crypto.randomUUID(), name: 'Sevkiyat Takibi', qty: 1, price: 11000 },
        ],
      }),
      updateBlock(createBlock('cta') as Extract<ProposalBlock, { type: 'cta' }>, {
        label: 'Operasyon Raporunu Gör',
        url: 'https://aero-crm.app/logistics',
        variant: 'primary',
      }),
      createBlock('signature'),
    ],
  },
]

const createBlock = (type: BlockType): ProposalBlock => {
  const id = crypto.randomUUID()

  if (type === 'hero') {
    return {
      id,
      type,
      data: {
        title: 'Modern Çözümler ile {{Müşteri_Adı}}',
        subtitle: 'Dijital dönüşüm için özel hazırlanmış teklifiniz.',
        backgroundUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
      },
    }
  }

  if (type === 'heading') {
    return {
      id,
      type,
      data: {
        text: 'Stratejik Yol Haritası',
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
          { id: crypto.randomUUID(), name: 'Enterprise CRM Lisans', qty: 25, price: 1200 },
          { id: crypto.randomUUID(), name: 'Onboarding & Eğitim', qty: 1, price: 5000 },
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
        title: 'Platform demosu',
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
            caption: 'Takım işbirliği',
          },
          {
            id: crypto.randomUUID(),
            url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
            caption: 'Anlık raporlar',
          },
          {
            id: crypto.randomUUID(),
            url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
            caption: 'Mobil uyumlu',
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
        quote: 'AERO CRM sayesinde teklif süremiz %40 kısaldı ve ekip daha odaklı çalışıyor.',
        author: 'Zeynep Kaya',
        role: 'Satış Direktörü, NovaTech',
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
          { id: crypto.randomUUID(), title: 'Kickoff', description: 'Hedef ve kapsam netleştirme.', date: 'Hafta 1' },
          { id: crypto.randomUUID(), title: 'Kurulum', description: 'CRM + teklif şablonları.', date: 'Hafta 2' },
          { id: crypto.randomUUID(), title: 'Canlıya geçiş', description: 'Ekip eğitimi ve optimizasyon.', date: 'Hafta 3' },
        ],
      },
    }
  }

  if (type === 'countdown') {
    return {
      id,
      type,
      data: {
        label: 'Teklifin bitmesine kalan süre',
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
        label: 'Toplantı Planla',
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
        label: 'Yetkili İmza',
        required: true,
      },
    }
  }

  return {
    id,
    type,
    data: {
      content:
        'Merhaba {{Müşteri_Adı}}, bu teklif iş akışlarınızı hızlandırmak için hazırlandı. Detayları aşağıda bulabilirsiniz.',
    },
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)

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
  const [documentTitle, setDocumentTitle] = useState('ABC Şirketi Teklifi')
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
  const [leftPanel, setLeftPanel] = useState<'blocks' | 'order'>('blocks')
  const [designSettings, setDesignSettings] = useState({
    background: '#ffffff',
    text: '#0d121c',
    accent: '#377DF6',
    radius: 12,
    fontScale: 100,
  })

  const proposalMeta = useMemo(
    () => ({
      clientName: 'ABC Şirketi',
      contactEmail: 'info@abc.com',
      contactPhone: '+90 532 000 00 00',
    }),
    []
  )

  const [proposalLink, setProposalLink] = useState(() => {
    const slug = crypto.randomUUID().split('-')[0]
    return `https://aero-crm.app/p/${slug}`
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const blockMetaMap = useMemo(() => {
    const entries = paletteItems.map((item) => [item.id, { label: item.label, icon: item.icon }])
    return new Map(entries)
  }, [])

  const applyTemplate = (template: TemplatePreset) => {
    setBlocks(template.build())
    setDesignSettings(template.design)
    setDocumentTitle(template.title)
    setSelectedBlockId(null)
    setEditorMode('edit')
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

  const updateBlockData = (
    id: string,
    updates: Partial<
      HeroData &
        HeadingData &
        TextData &
        PricingData &
        VideoData &
        GalleryData &
        TestimonialData &
        TimelineData &
        CountdownData &
        CtaData &
        SignatureData
    >
  ) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              data: {
                ...block.data,
                ...updates,
              },
            }
          : block
      )
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
                caption: 'Yeni görsel',
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
                title: 'Yeni Adım',
                description: 'Aşamayı burada tanımlayın.',
                date: 'Hafta 4',
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
              Düzenlemeye dön
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <p className="text-xs text-gray-500">Teklifi Gönder</p>
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
            Önizle
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
              Düzenlemeye dön
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <p className="text-xs text-gray-500">Önizleme</p>
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
            Gönder
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
            <span className="text-xs text-[#48679d] dark:text-gray-400">Teklif Editörü</span>
            <div className="flex items-center gap-2">
              <input
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                className="text-sm font-bold text-[#0d121c] dark:text-white bg-transparent border-b border-transparent focus:border-primary outline-none"
              />
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] rounded uppercase font-bold">
                Taslak
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 justify-center">
          <StepNav mode={editorMode} onChange={setEditorMode} />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">history</span>
            Sürüm Geçmişi
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
          <button
            onClick={() => setEditorMode('preview')}
            className="flex h-10 px-4 items-center justify-center rounded-lg bg-[#e7ebf4] dark:bg-gray-800 text-[#0d121c] dark:text-white text-sm font-bold hover:bg-opacity-80"
          >
            Önizle
          </button>
          <button
            onClick={() => setEditorMode('send')}
            className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90"
          >
            Gönder
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 flex flex-col border-r border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] overflow-y-auto">
            <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#48679d] dark:text-gray-400">Bloklar</h2>
              <p className="text-xs text-gray-500 mt-1">Sürükle & bırak veya tıkla</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e7ebf4] dark:border-gray-800">
              <button
                onClick={() => setLeftPanel('blocks')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  leftPanel === 'blocks' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Bloklar
              </button>
              <button
                onClick={() => setLeftPanel('order')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  leftPanel === 'order' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Sıralama
              </button>
            </div>
            <div className="p-4 space-y-6">
              {leftPanel === 'blocks' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400 mb-3">HAZIR ŞABLONLAR</h3>
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

                  <PaletteGroup
                    title="Temel"
                    items={paletteItems.filter((item) => item.group === 'basic')}
                    onAdd={handleAddBlock}
                  />
                  <PaletteGroup
                    title="İçerik"
                    items={paletteItems.filter((item) => item.group === 'content')}
                    onAdd={handleAddBlock}
                  />
                  <PaletteGroup
                    title="Aksiyon"
                    items={paletteItems.filter((item) => item.group === 'action')}
                    onAdd={handleAddBlock}
                  />

                  <div className="pt-4 mt-4 border-t border-[#e7ebf4] dark:border-gray-800">
                    <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400 mb-3">AKILLI DEĞİŞKENLER</h3>
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
                    <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400">BLOK SIRALAMASI</h3>
                    <span className="text-[10px] text-gray-400">Sürükle & bırak</span>
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
                    <span className="text-sm font-semibold">Yeni Blok Ekle</span>
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
                  <span className="material-symbols-outlined text-sm">pages</span> Sayfa 1/1
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
                İçerik
              </button>
              <button
                onClick={() => setActivePanel('design')}
                className={`flex-1 py-4 text-sm font-medium ${activePanel === 'design' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Tasarım
              </button>
            </div>
            <div className="p-6 space-y-6">
              {activePanel === 'content' && !selectedBlock && (
                <div className="text-sm text-gray-500">Bir blok seçerek ayarlarını düzenleyin.</div>
              )}

              {activePanel === 'content' && selectedBlock && (
                <>
                  {selectedBlock.type === 'hero' && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                        Hero Ayarları
                      </label>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Başlık</label>
                        <input
                          value={selectedBlock.data.title}
                          onChange={(event) => updateBlockData(selectedBlock.id, { title: event.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Alt Başlık</label>
                        <textarea
                          value={selectedBlock.data.subtitle}
                          onChange={(event) => updateBlockData(selectedBlock.id, { subtitle: event.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Arka Plan URL</label>
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
                      Başlık
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Başlık Metni</label>
                      <input
                        value={selectedBlock.data.text}
                        onChange={(event) => updateBlockData(selectedBlock.id, { text: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Seviye</label>
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
                        <label className="text-[11px] text-gray-500 block mb-1">Hizalama</label>
                        <select
                          value={selectedBlock.data.align}
                          onChange={(event) =>
                            updateBlockData(selectedBlock.id, { align: event.target.value as HeadingData['align'] })
                          }
                          className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        >
                          <option value="left">Sol</option>
                          <option value="center">Orta</option>
                          <option value="right">Sağ</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'text' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      Metin İçeriği
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
                      Fiyat Tablosu
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Kaynak</label>
                      <select
                        value={selectedBlock.data.source}
                        onChange={(event) => updateBlockData(selectedBlock.id, { source: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      >
                        <option value="crm">CRM (Anlaşma)</option>
                        <option value="manual">Manuel</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-500 block">Kolonlar</label>
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
                  </div>
                )}

                {selectedBlock.type === 'video' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      Video
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Başlık</label>
                      <input
                        value={selectedBlock.data.title}
                        onChange={(event) => updateBlockData(selectedBlock.id, { title: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Video URL</label>
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
                      Galeri
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Kolon Sayısı</label>
                      <select
                        value={selectedBlock.data.columns}
                        onChange={(event) =>
                          updateBlockData(selectedBlock.id, { columns: Number(event.target.value) as 2 | 3 })
                        }
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      >
                        <option value={2}>2 Kolon</option>
                        <option value={3}>3 Kolon</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      {selectedBlock.data.images.map((image) => (
                        <div key={image.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                          <input
                            value={image.url}
                            onChange={(event) => updateGalleryImage(selectedBlock.id, image.id, { url: event.target.value })}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder="Görsel URL"
                          />
                          <input
                            value={image.caption}
                            onChange={(event) =>
                              updateGalleryImage(selectedBlock.id, image.id, { caption: event.target.value })
                            }
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder="Başlık"
                          />
                          <button
                            onClick={() => removeGalleryImage(selectedBlock.id, image.id)}
                            className="text-xs text-red-500"
                          >
                            Görseli kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addGalleryImage(selectedBlock.id)}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary"
                    >
                      Yeni görsel ekle
                    </button>
                  </div>
                )}

                {selectedBlock.type === 'testimonial' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      Referans
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Alıntı</label>
                      <textarea
                        value={selectedBlock.data.quote}
                        onChange={(event) => updateBlockData(selectedBlock.id, { quote: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">İsim</label>
                      <input
                        value={selectedBlock.data.author}
                        onChange={(event) => updateBlockData(selectedBlock.id, { author: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Ünvan</label>
                      <input
                        value={selectedBlock.data.role}
                        onChange={(event) => updateBlockData(selectedBlock.id, { role: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Avatar URL</label>
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
                      Timeline
                    </label>
                    <div className="space-y-3">
                      {selectedBlock.data.items.map((item) => (
                        <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                          <input
                            value={item.title}
                            onChange={(event) => updateTimelineItem(selectedBlock.id, item.id, { title: event.target.value })}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder="Başlık"
                          />
                          <input
                            value={item.date}
                            onChange={(event) => updateTimelineItem(selectedBlock.id, item.id, { date: event.target.value })}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            placeholder="Tarih"
                          />
                          <textarea
                            value={item.description}
                            onChange={(event) =>
                              updateTimelineItem(selectedBlock.id, item.id, { description: event.target.value })
                            }
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                            rows={3}
                            placeholder="Açıklama"
                          />
                          <button
                            onClick={() => removeTimelineItem(selectedBlock.id, item.id)}
                            className="text-xs text-red-500"
                          >
                            Adımı kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addTimelineItem(selectedBlock.id)}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary"
                    >
                      Yeni adım ekle
                    </button>
                  </div>
                )}

                {selectedBlock.type === 'countdown' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      Geri Sayım
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Başlık</label>
                      <input
                        value={selectedBlock.data.label}
                        onChange={(event) => updateBlockData(selectedBlock.id, { label: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Gün</label>
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
                        <label className="text-[11px] text-gray-500 block mb-1">Saat</label>
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
                        <label className="text-[11px] text-gray-500 block mb-1">Dakika</label>
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
                      CTA Butonu
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Buton Metni</label>
                      <input
                        value={selectedBlock.data.label}
                        onChange={(event) => updateBlockData(selectedBlock.id, { label: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Link</label>
                      <input
                        value={selectedBlock.data.url}
                        onChange={(event) => updateBlockData(selectedBlock.id, { url: event.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Stil</label>
                      <select
                        value={selectedBlock.data.variant}
                        onChange={(event) =>
                          updateBlockData(selectedBlock.id, { variant: event.target.value as CtaData['variant'] })
                        }
                        className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      >
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                        <option value="outline">Outline</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'signature' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide">
                      İmza Ayarları
                    </label>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Etiket</label>
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
                      <span>Zorunlu imza</span>
                    </label>
                  </div>
                )}

                <button
                  onClick={() => handleRemoveBlock(selectedBlock.id)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  Bloğu Sil
                </button>
              </>
            )}

            {activePanel === 'design' && (
              <div className="pt-6 border-t border-[#e7ebf4] dark:border-gray-800">
                <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide mb-3">
                  Tasarım
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Metin Rengi</label>
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
                      <label className="text-[11px] text-gray-500 block mb-1">Vurgu Rengi</label>
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
                    <label className="text-[11px] text-gray-500 block mb-1">Arka Plan</label>
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
                    <label className="text-[11px] text-gray-500 block mb-1">Köşe Yuvarlaklığı</label>
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
                    <label className="text-[11px] text-gray-500 block mb-1">Font Ölçeği (%)</label>
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
              Toplam: <span className="font-bold text-[#0d121c] dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
      <DragOverlay>
        {activePaletteId ? (
          <div className="bg-white dark:bg-gray-900 border border-primary/30 rounded-lg px-4 py-2 shadow-xl text-sm font-semibold text-primary">
            Blok ekle
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
          aria-label="Yukarı taşı"
        >
          <span className="material-symbols-outlined text-[16px]">expand_less</span>
        </button>
        <button
          onClick={() => onMove('down')}
          className="size-6 rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary"
          aria-label="Aşağı taşı"
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

const editorSteps: { id: 'edit' | 'preview' | 'send'; label: string }[] = [
  { id: 'edit', label: 'Düzenleme' },
  { id: 'preview', label: 'Önizleme' },
  { id: 'send', label: 'Gönder' },
]

function StepNav({
  mode,
  onChange,
}: {
  mode: 'edit' | 'preview' | 'send'
  onChange: (mode: 'edit' | 'preview' | 'send') => void
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-[#48679d]">
      {editorSteps.map((step, index) => (
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
          {index < editorSteps.length - 1 && (
            <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
          )}
        </div>
      ))}
    </div>
  )
}

function BlockContent({ block }: { block: ProposalBlock }) {
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
            Yatırım Özeti
          </h3>
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {block.data.columns.description && <th className="pb-3 font-semibold">Hizmet / Ürün</th>}
                {block.data.columns.quantity && <th className="pb-3 font-semibold text-center">Adet</th>}
                {block.data.columns.unitPrice && <th className="pb-3 font-semibold text-right">Birim</th>}
                {block.data.columns.total && <th className="pb-3 font-semibold text-right">Toplam</th>}
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
                      <td className="py-4 text-right">{formatCurrency(item.price)}</td>
                    )}
                    {block.data.columns.total && (
                      <td className="py-4 text-right font-semibold">{formatCurrency(total)}</td>
                    )}
                  </tr>
                )
              })}
              <tr className="bg-primary/5">
                <td className="py-4 text-right font-bold text-gray-500" colSpan={3}>
                  Ara Toplam
                </td>
                <td className="py-4 text-right font-bold text-[color:var(--proposal-accent)] text-lg">
                  {formatCurrency(block.data.items.reduce((sum, item) => sum + item.qty * item.price, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {block.type === 'video' && (
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Video</h4>
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
              Geçerli bir video URL girin
            </div>
          )}
        </div>
      )}

      {block.type === 'gallery' && (
        <div className="p-8 space-y-4">
          <h4 className="text-sm font-semibold">Galeri</h4>
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
          <h4 className="text-sm font-semibold">Zaman Çizelgesi</h4>
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
              { label: 'Gün', value: block.data.days },
              { label: 'Saat', value: block.data.hours },
              { label: 'Dakika', value: block.data.minutes },
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
            <p className="text-xs">{block.data.required ? 'Zorunlu' : 'Opsiyonel'}</p>
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
          Blok {index + 1}
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

const sendMethods: { id: SendMethod; label: string; description: string; icon: string }[] = [
  { id: 'email', label: 'E-posta', description: 'E-posta gönder', icon: 'mail' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'WhatsApp mesajı', icon: 'chat' },
  { id: 'sms', label: 'SMS', description: 'SMS gönder', icon: 'sms' },
  { id: 'link', label: 'Link', description: 'Sadece link kopyala', icon: 'link' },
]

const expiryOptions = [
  { value: '24h', label: '24 saat' },
  { value: '48h', label: '48 saat' },
  { value: '7d', label: '7 gün' },
  { value: '14d', label: '14 gün' },
  { value: '30d', label: '30 gün' },
  { value: 'unlimited', label: 'Sınırsız' },
]

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
  const isModal = layout === 'modal'
  const [method, setMethod] = useState<SendMethod>('email')
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail)
  const [recipientPhone, setRecipientPhone] = useState(defaultPhone)
  const [subject, setSubject] = useState(`${clientName} için Teklif`)
  const [message, setMessage] = useState(
    `Merhaba {{Müşteri_Adı}},\n\nGörüşmemiz doğrultusunda hazırladığım teklifi ekte bulabilirsiniz.\n\nTeklifi görüntülemek için:\n\nİyi çalışmalar,\nAERO CRM`
  )
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
        throw new Error(payload?.error || 'Teklif gönderimi başarısız oldu.')
      }

      const payload = await response.json()
      if (payload?.publicUrl && typeof onLinkUpdate === 'function') {
        onLinkUpdate(payload.publicUrl)
      }
      setView('success')
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Teklif gönderimi başarısız oldu.'
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

  const whatsappMessage = `Merhaba ${clientName}, teklifinizi paylaşmak istedim: ${proposalLink}`
  const smsMessage = `Teklif linkiniz: ${proposalLink}`

  const linkAnchor = 'Teklifi görüntülemek için:'
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
            <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">Teklifi Gönder</h2>
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
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Alıcı</label>
                  <input
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Konu</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Mesaj</label>
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
                    Linki e-postaya ekle
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includePdf}
                      onChange={() => setIncludePdf((prev) => !prev)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    PDF kopyasını ekle
                  </label>
                </div>
                <p className="text-xs text-gray-400">PDF eklendiğinde e-posta boyutu artacaktır.</p>
              </div>
            )}

            {method === 'whatsapp' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Telefon</label>
                  <input
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-[#48679d]">
                  {whatsappMessage}
                </div>
                <p className="text-xs text-gray-400">WhatsApp uygulaması açılacaktır.</p>
              </div>
            )}

            {method === 'sms' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Telefon</label>
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
                    {copied ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Linki kopyalayarak dilediğiniz kanaldan paylaşabilirsiniz.</p>
              </div>
            )}

            <div className="border-t border-[#e7ebf4] dark:border-gray-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Geçerlilik süresi ekle</span>
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
                    Geri sayım göster
                  </label>
                  <p className="text-xs text-amber-500">Süre dolduğunda teklif erişilemez olacak.</p>
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
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Teklif başarıyla gönderildi!</h3>
            <p className="text-sm text-[#48679d] dark:text-gray-400">Link iletildi ve Spyglass takibi başladı.</p>
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-[#0d121c] dark:text-white truncate">{proposalLink}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
              >
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <button className="w-full mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold">
              Spyglass'ta Takip Et
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold"
            >
              Tamam
            </button>
            <button onClick={() => setView('form')} className="text-sm text-primary underline">
              Başka Teklif Gönder
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
              Önizle
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold"
              >
                İptal
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
                Gönder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
