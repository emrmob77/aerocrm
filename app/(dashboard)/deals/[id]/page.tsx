'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSupabase, useUser } from '@/hooks'
import type { Database } from '@/types/database'
import { formatRelativeTime, getDbStage, normalizeStage, stageConfigs } from '@/components/deals/stage-utils'

const tabs = [
  { id: 'products', label: 'Ürünler' },
  { id: 'proposals', label: 'Teklifler' },
  { id: 'notes', label: 'Notlar' },
  { id: 'activity', label: 'Aktivite' },
  { id: 'files', label: 'Dosyalar' },
] as const

type TabType = (typeof tabs)[number]['id']

type DealRow = Database['public']['Tables']['deals']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type DealProductRow = Database['public']['Tables']['deal_products']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']
type ProposalRow = Database['public']['Tables']['proposals']['Row']
type ActivityRow = Database['public']['Tables']['activities']['Row']

type DealProductItem = DealProductRow & {
  product?: ProductRow | null
}

type DealFileRow = {
  id: string
  deal_id: string
  file_name: string | null
  file_url: string | null
  file_size: number | null
  user_id: string | null
  created_at: string
}

const formatCurrency = (value: number, currency = 'TRY') => {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DealDetailsPage() {
  const params = useParams()
  const dealId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const supabase = useSupabase()
  const { user, authUser, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deal, setDeal] = useState<DealRow | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [owner, setOwner] = useState<UserRow | null>(null)
  const [dealProducts, setDealProducts] = useState<DealProductItem[]>([])
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [files, setFiles] = useState<DealFileRow[]>([])
  const [filesError, setFilesError] = useState<string | null>(null)

  const [teamMembers, setTeamMembers] = useState<UserRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({
    title: '',
    value: 0,
    stage: 'lead',
    expectedCloseDate: '',
    probability: 0,
    contactId: '',
    ownerId: '',
    notes: '',
  })

  const [notesValue, setNotesValue] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const [newProductId, setNewProductId] = useState('')
  const [newProductQty, setNewProductQty] = useState(1)
  const [newProductPrice, setNewProductPrice] = useState<number | ''>('')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState<string | null>(null)

  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [isSavingFile, setIsSavingFile] = useState(false)

  const [averageDays, setAverageDays] = useState<number | null>(null)

  const selectedContact = useMemo(() => {
    if (!isEditing) return contact
    return contacts.find((item) => item.id === draft.contactId) ?? contact
  }, [contact, contacts, draft.contactId, isEditing])

  const selectedOwner = useMemo(() => {
    if (!isEditing) return owner
    return teamMembers.find((item) => item.id === draft.ownerId) ?? owner
  }, [owner, teamMembers, draft.ownerId, isEditing])

  const stageLabel = useMemo(() => {
    const stage = stageConfigs.find((item) => item.id === draft.stage)
    return stage?.label ?? 'Aday'
  }, [draft.stage])

  const pipelineDays = useMemo(() => {
    if (!deal?.created_at) return 0
    const diffMs = Date.now() - new Date(deal.created_at).getTime()
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  }, [deal?.created_at])

  const totalProductsValue = useMemo(() => {
    return dealProducts.reduce((sum, item) => sum + (item.total_price ?? 0), 0)
  }, [dealProducts])

  const currentCurrency = deal?.currency ?? 'TRY'

  useEffect(() => {
    if (!userLoading && !authUser) {
      setError('Oturum bulunamadı.')
      setIsLoading(false)
    }
  }, [authUser, userLoading])

  useEffect(() => {
    const loadLists = async () => {
      if (!authUser) return
      const teamId = user?.team_id

      const contactsQuery = supabase
        .from('contacts')
        .select('id, full_name, email, phone, company, position, address, user_id, team_id, created_at, updated_at')
        .order('created_at', { ascending: false })

      const membersQuery = supabase
        .from('users')
        .select('id, full_name, avatar_url, email, role, team_id, created_at, updated_at')
        .order('full_name', { ascending: true })

      const productsQuery = supabase
        .from('products')
        .select('id, name, price, currency, category, active, team_id, created_at, updated_at')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (teamId) {
        contactsQuery.eq('team_id', teamId)
        membersQuery.eq('team_id', teamId)
        productsQuery.eq('team_id', teamId)
      } else {
        contactsQuery.eq('user_id', authUser.id)
        membersQuery.eq('id', authUser.id)
        productsQuery.eq('team_id', authUser.id)
      }

      const [contactsRes, membersRes, productsRes] = await Promise.all([
        contactsQuery,
        membersQuery,
        productsQuery,
      ])

      setContacts((contactsRes.data ?? []) as ContactRow[])
      setTeamMembers((membersRes.data ?? []) as UserRow[])
      setProducts((productsRes.data ?? []) as ProductRow[])
    }

    loadLists()
  }, [authUser, supabase, user?.team_id])

  useEffect(() => {
    const loadAverage = async () => {
      const teamId = user?.team_id
      if (!teamId) return
      const { data } = await supabase
        .from('deals')
        .select('created_at, stage')
        .eq('team_id', teamId)

      const rows = data ?? []
      const openDeals = rows.filter((row) => {
        const stage = normalizeStage(row.stage)
        return stage !== 'won' && stage !== 'lost'
      })

      if (openDeals.length === 0) {
        setAverageDays(null)
        return
      }

      const now = Date.now()
      const totalDays = openDeals.reduce((sum, row) => {
        const created = new Date(row.created_at).getTime()
        const diff = now - created
        return sum + Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
      }, 0)

      setAverageDays(Math.round(totalDays / openDeals.length))
    }

    loadAverage()
  }, [supabase, user?.team_id])

  useEffect(() => {
    const loadDeal = async () => {
      if (!dealId || !authUser) return
      setIsLoading(true)
      setError(null)

      const { data: dealRow, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()

      if (dealError || !dealRow) {
        setError('Fırsat bulunamadı.')
        setIsLoading(false)
        return
      }

      setDeal(dealRow)
      setDraft({
        title: dealRow.title ?? '',
        value: dealRow.value ?? 0,
        stage: normalizeStage(dealRow.stage),
        expectedCloseDate: dealRow.expected_close_date ? dealRow.expected_close_date.slice(0, 10) : '',
        probability: dealRow.probability ?? 0,
        contactId: dealRow.contact_id ?? '',
        ownerId: dealRow.user_id ?? authUser.id,
        notes: dealRow.notes ?? '',
      })
      setNotesValue(dealRow.notes ?? '')

      if (dealRow.contact_id) {
        const { data: contactRow } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', dealRow.contact_id)
          .maybeSingle()
        setContact(contactRow ?? null)
      }

      if (dealRow.user_id) {
        const { data: ownerRow } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, email, role, team_id, created_at, updated_at')
          .eq('id', dealRow.user_id)
          .maybeSingle()
        setOwner(ownerRow ?? null)
      }

      const { data: dealProductRows } = await supabase
        .from('deal_products')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })

      const productIds = (dealProductRows ?? []).map((item) => item.product_id)
      let productMap = new Map<string, ProductRow>()
      if (productIds.length > 0) {
        const { data: productRows } = await supabase
          .from('products')
          .select('id, name, price, currency, category, active, team_id, created_at, updated_at')
          .in('id', productIds)
        productMap = new Map((productRows ?? []).map((item) => [item.id, item]))
      }

      setDealProducts(
        (dealProductRows ?? []).map((item) => ({
          ...item,
          product: productMap.get(item.product_id) ?? null,
        }))
      )

      const { data: proposalRows } = await supabase
        .from('proposals')
        .select('id, title, status, created_at, updated_at, public_url, deal_id, contact_id, user_id, team_id, blocks, expires_at, signed_at, signature_data')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
      setProposals((proposalRows ?? []) as ProposalRow[])

      const { data: activityRows } = await supabase
        .from('activities')
        .select('id, type, title, description, user_id, team_id, entity_type, entity_id, metadata, created_at')
        .eq('entity_type', 'deal')
        .eq('entity_id', dealId)
        .order('created_at', { ascending: false })
      setActivities((activityRows ?? []) as ActivityRow[])

      const supabaseAny = supabase as unknown as { from: (table: string) => any }
      const { data: fileRows, error: fileError } = await supabaseAny
        .from('deal_files')
        .select('id, deal_id, file_name, file_url, file_size, user_id, created_at')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })

      if (fileError) {
        setFilesError('Dosya kayıtları yüklenemedi.')
      } else {
        setFiles((fileRows ?? []) as DealFileRow[])
        setFilesError(null)
      }

      setIsLoading(false)
    }

    loadDeal()
  }, [authUser, dealId, supabase])

  const handleEditToggle = () => {
    if (!deal) return
    if (isEditing) {
      setDraft({
        title: deal.title ?? '',
        value: deal.value ?? 0,
        stage: normalizeStage(deal.stage),
        expectedCloseDate: deal.expected_close_date ? deal.expected_close_date.slice(0, 10) : '',
        probability: deal.probability ?? 0,
        contactId: deal.contact_id ?? '',
        ownerId: deal.user_id ?? authUser?.id ?? '',
        notes: deal.notes ?? '',
      })
      setIsEditing(false)
      return
    }
    setIsEditing(true)
  }

  const handleSaveDeal = async () => {
    if (!deal) return
    if (!draft.title.trim()) {
      toast.error('Başlık zorunludur.')
      return
    }
    if (!draft.contactId) {
      toast.error('İlgili kişi seçilmelidir.')
      return
    }

    const stageChanged = normalizeStage(deal.stage) !== draft.stage
    const ownerChanged = deal.user_id !== draft.ownerId

    if (stageChanged) {
      const response = await fetch('/api/deals/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, stage: draft.stage }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Aşama güncellenemedi.')
        return
      }
    }

    if (ownerChanged) {
      const response = await fetch('/api/deals/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, ownerId: draft.ownerId }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Sorumlu güncellenemedi.')
        return
      }
    }

    const updates: Partial<DealRow> = {
      title: draft.title.trim(),
      value: Number.isFinite(draft.value) ? draft.value : deal.value,
      contact_id: draft.contactId,
      expected_close_date: draft.expectedCloseDate ? new Date(draft.expectedCloseDate).toISOString() : null,
      probability: Number.isFinite(draft.probability) ? draft.probability : null,
      notes: draft.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error: updateError } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', deal.id)
      .select('*')
      .single()

    if (updateError || !updated) {
      toast.error('Anlaşma güncellenemedi.')
      return
    }

    setDeal(updated)
    setNotesValue(updated.notes ?? '')
    setContact(contacts.find((item) => item.id === updated.contact_id) ?? contact)
    setOwner(teamMembers.find((item) => item.id === updated.user_id) ?? owner)
    toast.success('Fırsat güncellendi.')
    setIsEditing(false)
  }

  const handleCloseDeal = async (nextStage: 'lost' | 'won') => {
    if (!deal) return
    const response = await fetch('/api/deals/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: deal.id, stage: nextStage }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Aşama güncellenemedi.')
      return
    }
    const updatedStage = payload?.deal?.stage ?? getDbStage(nextStage)
    setDeal((prev) => (prev ? { ...prev, stage: updatedStage } : prev))
    setDraft((prev) => ({ ...prev, stage: nextStage }))
    toast.success(nextStage === 'won' ? 'Fırsat kazanıldı.' : 'Fırsat kaybedildi.')
  }

  const handleSaveNotes = async () => {
    if (!deal || isSavingNotes) return
    setIsSavingNotes(true)
    const { data: updated, error: updateError } = await supabase
      .from('deals')
      .update({ notes: notesValue.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', deal.id)
      .select('*')
      .single()

    if (updateError || !updated) {
      toast.error('Not kaydedilemedi.')
      setIsSavingNotes(false)
      return
    }
    setDeal(updated)
    toast.success('Not kaydedildi.')
    setIsSavingNotes(false)
  }

  const handleAddProduct = async () => {
    if (!dealId) return
    if (!newProductId) {
      toast.error('Ürün seçmelisiniz.')
      return
    }
    const product = products.find((item) => item.id === newProductId)
    if (!product) {
      toast.error('Ürün bulunamadı.')
      return
    }
    const quantity = Math.max(1, Number(newProductQty))
    const unitPrice = Number(newProductPrice || product.price || 0)
    const total = unitPrice * quantity
    setIsAddingProduct(true)

    const { data: inserted, error: insertError } = await supabase
      .from('deal_products')
      .insert({
        deal_id: dealId,
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        total_price: total,
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      toast.error('Ürün eklenemedi.')
      setIsAddingProduct(false)
      return
    }

    setDealProducts((prev) => [{ ...inserted, product }, ...prev])
    setNewProductId('')
    setNewProductQty(1)
    setNewProductPrice('')
    setIsAddingProduct(false)
    toast.success('Ürün eklendi.')
  }

  const handleUpdateProduct = async (item: DealProductItem) => {
    setIsSavingProduct(item.id)
    const quantity = Math.max(1, Number(item.quantity))
    const unitPrice = Number(item.unit_price)
    const total = quantity * unitPrice

    const { error: updateError, data: updated } = await supabase
      .from('deal_products')
      .update({ quantity, unit_price: unitPrice, total_price: total })
      .eq('id', item.id)
      .select('*')
      .single()

    if (updateError || !updated) {
      toast.error('Ürün güncellenemedi.')
      setIsSavingProduct(null)
      return
    }

    setDealProducts((prev) =>
      prev.map((row) => (row.id === item.id ? { ...updated, product: row.product } : row))
    )
    setIsSavingProduct(null)
    toast.success('Ürün güncellendi.')
  }

  const handleRemoveProduct = async (id: string) => {
    const { error: deleteError } = await supabase.from('deal_products').delete().eq('id', id)
    if (deleteError) {
      toast.error('Ürün silinemedi.')
      return
    }
    setDealProducts((prev) => prev.filter((row) => row.id !== id))
    toast.success('Ürün silindi.')
  }

  const handleAddFile = async () => {
    if (!dealId) return
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error('Dosya adı ve linki zorunludur.')
      return
    }
    setIsSavingFile(true)
    const supabaseAny = supabase as unknown as { from: (table: string) => any }
    const payload = {
      deal_id: dealId,
      file_name: fileName.trim(),
      file_url: fileUrl.trim(),
      file_size: fileSize ? Number(fileSize) : null,
      user_id: authUser?.id ?? null,
    }
    const { data, error: insertError } = await supabaseAny
      .from('deal_files')
      .insert(payload)
      .select('id, deal_id, file_name, file_url, file_size, user_id, created_at')
      .single()

    if (insertError || !data) {
      toast.error('Dosya eklenemedi.')
      setIsSavingFile(false)
      return
    }

    setFiles((prev) => [data as DealFileRow, ...prev])
    setFileName('')
    setFileUrl('')
    setFileSize('')
    setIsSavingFile(false)
    toast.success('Dosya eklendi.')
  }

  const handleRemoveFile = async (id: string) => {
    const supabaseAny = supabase as unknown as { from: (table: string) => any }
    const { error: deleteError } = await supabaseAny.from('deal_files').delete().eq('id', id)
    if (deleteError) {
      toast.error('Dosya silinemedi.')
      return
    }
    setFiles((prev) => prev.filter((row) => row.id !== id))
    toast.success('Dosya silindi.')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">Yükleniyor...</div>
    )
  }

  if (error || !deal) {
    return (
      <div className="p-8 text-sm text-gray-500">
        {error || 'Fırsat bulunamadı.'}
      </div>
    )
  }

  return (
    <div className="-m-8">
      <main className="flex-1 overflow-y-auto px-4 md:px-16 lg:px-24 py-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumbs & Heading */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/deals" className="flex items-center text-primary text-sm font-semibold group">
                <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
                Fırsatlara Dön
              </Link>
              <span className="text-gray-400 text-sm">/</span>
              <span className="text-gray-500 text-sm">{selectedContact?.company || 'Fırsat'}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                {isEditing ? (
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="text-2xl md:text-3xl font-extrabold text-[#0d121c] dark:text-white bg-transparent border-b border-primary/40 focus:outline-none"
                  />
                ) : (
                  <h1 className="text-[#0d121c] dark:text-white text-3xl font-extrabold tracking-tight">
                    {deal.title}
                  </h1>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <select
                      value={draft.stage}
                      onChange={(event) => setDraft((prev) => ({ ...prev, stage: event.target.value }))}
                      className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/30 text-primary bg-primary/10"
                    >
                      {stageConfigs.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                      {stageLabel}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">Son güncelleme: {formatRelativeTime(deal.updated_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveDeal}
                      className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-colors"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50"
                    >
                      Vazgeç
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-colors"
                  >
                    Düzenle
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-2 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Fırsat Değeri</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={draft.value}
                      onChange={(event) => setDraft((prev) => ({ ...prev, value: Number(event.target.value) }))}
                      className="text-2xl font-extrabold text-[#0d121c] dark:text-white bg-transparent border-b border-primary/30 focus:outline-none"
                    />
                  ) : (
                    <p className="text-[#0d121c] dark:text-white text-2xl font-extrabold">
                      {formatCurrency(deal.value ?? 0, currentCurrency)}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">Ürün toplamı: {formatCurrency(totalProductsValue, currentCurrency)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-2 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Kapanış Tarihi</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={draft.expectedCloseDate}
                      onChange={(event) => setDraft((prev) => ({ ...prev, expectedCloseDate: event.target.value }))}
                      className="text-sm font-bold text-[#0d121c] dark:text-white bg-transparent border-b border-primary/30 focus:outline-none"
                    />
                  ) : (
                    <p className="text-[#0d121c] dark:text-white text-2xl font-extrabold">
                      {formatDate(deal.expected_close_date)}
                    </p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-2 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Sorumlu</p>
                  {isEditing ? (
                    <select
                      value={draft.ownerId}
                      onChange={(event) => setDraft((prev) => ({ ...prev, ownerId: event.target.value }))}
                      className="text-sm font-bold text-[#0d121c] dark:text-white bg-transparent border-b border-primary/30 focus:outline-none"
                    >
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        {(selectedOwner?.full_name || '??')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join('')}
                      </div>
                      <p className="text-[#0d121c] dark:text-white text-lg font-bold">
                        {selectedOwner?.full_name || 'Sorumlu'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">İlgili Kişi</label>
                      <select
                        value={draft.contactId}
                        onChange={(event) => setDraft((prev) => ({ ...prev, contactId: event.target.value }))}
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                      >
                        {contacts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.full_name} {item.company ? `• ${item.company}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kazanma Olasılığı</label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={draft.probability}
                          onChange={(event) => setDraft((prev) => ({ ...prev, probability: Number(event.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold text-gray-600">%{draft.probability}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Özet Not</label>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm min-h-[90px]"
                    />
                  </div>
                </div>
              )}

              {/* Tabs & Content */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="border-b border-[#e7ebf4] dark:border-gray-800 bg-[#fbfcfd] dark:bg-gray-900/50">
                  <nav className="flex px-4 overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center border-b-2 px-4 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-0">
                  {activeTab === 'products' && (
                    <div>
                      <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800">
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">Ürün Ekle</h3>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <select
                            value={newProductId}
                            onChange={(event) => {
                              const value = event.target.value
                              setNewProductId(value)
                              const product = products.find((item) => item.id === value)
                              if (product) {
                                setNewProductPrice(product.price)
                              }
                            }}
                            className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                          >
                            <option value="">Ürün seçin</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} • {formatCurrency(product.price ?? 0, product.currency ?? currentCurrency)}
                              </option>
                            ))}
                          </select>
                          {products.length === 0 && (
                            <p className="text-xs text-gray-400 md:col-span-4">
                              Ürün bulunamadı. Ürün kataloğuna ürün ekleyin.
                            </p>
                          )}
                          <input
                            type="number"
                            min={1}
                            value={newProductQty}
                            onChange={(event) => setNewProductQty(Number(event.target.value))}
                            className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                            placeholder="Adet"
                          />
                          <input
                            type="number"
                            value={newProductPrice}
                            onChange={(event) => setNewProductPrice(Number(event.target.value))}
                            className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                            placeholder="Birim fiyat"
                          />
                          <button
                            onClick={handleAddProduct}
                            disabled={isAddingProduct}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-70"
                          >
                            {isAddingProduct ? 'Ekleniyor' : 'Ekle'}
                          </button>
                        </div>
                      </div>
                      {dealProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Henüz ürün eklenmedi.</div>
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                              <th className="px-6 py-4">Ürün Adı</th>
                              <th className="px-6 py-4 text-center">Adet</th>
                              <th className="px-6 py-4 text-right">Birim Fiyat</th>
                              <th className="px-6 py-4 text-right">Toplam</th>
                              <th className="px-6 py-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {dealProducts.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-[#0d121c] dark:text-white">
                                  {product.product?.name || `Ürün (${product.product_id.slice(0, 6)})`}
                                </td>
                                <td className="px-6 py-4 text-sm text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={product.quantity}
                                    onChange={(event) =>
                                      setDealProducts((prev) =>
                                        prev.map((row) =>
                                          row.id === product.id
                                            ? { ...row, quantity: Number(event.target.value) }
                                            : row
                                        )
                                      )
                                    }
                                    className="w-20 px-2 py-1 rounded border border-gray-200 text-center"
                                  />
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                  <input
                                    type="number"
                                    value={product.unit_price}
                                    onChange={(event) =>
                                      setDealProducts((prev) =>
                                        prev.map((row) =>
                                          row.id === product.id
                                            ? { ...row, unit_price: Number(event.target.value) }
                                            : row
                                        )
                                      )
                                    }
                                    className="w-28 px-2 py-1 rounded border border-gray-200 text-right"
                                  />
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-bold">
                                  {formatCurrency(product.total_price ?? product.quantity * product.unit_price, currentCurrency)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleUpdateProduct(product)}
                                      disabled={isSavingProduct === product.id}
                                      className="px-3 py-1.5 rounded-lg border border-[#e7ebf4] text-xs font-semibold text-gray-600 hover:text-primary"
                                    >
                                      {isSavingProduct === product.id ? 'Kaydediliyor' : 'Kaydet'}
                                    </button>
                                    <button
                                      onClick={() => handleRemoveProduct(product.id)}
                                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600"
                                    >
                                      Sil
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                              <td
                                className="px-6 py-4 text-sm font-bold text-right text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                                colSpan={3}
                              >
                                Genel Toplam
                              </td>
                              <td className="px-6 py-4 text-lg font-extrabold text-right text-primary">
                                {formatCurrency(totalProductsValue, currentCurrency)}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'proposals' && (
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">Teklifler</h3>
                        <Link
                          href={`/proposals/new?dealId=${deal.id}`}
                          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold"
                        >
                          Yeni Teklif
                        </Link>
                      </div>
                      {proposals.length === 0 ? (
                        <div className="text-sm text-gray-500">Henüz teklif oluşturulmadı.</div>
                      ) : (
                        <div className="space-y-3">
                          {proposals.map((proposal) => (
                            <div
                              key={proposal.id}
                              className="flex items-center justify-between gap-3 border border-[#e7ebf4] dark:border-gray-800 rounded-xl px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                  {proposal.title || 'Teklif'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(proposal.created_at)} • {proposal.status}
                                </p>
                              </div>
                              <Link
                                href={`/proposals/${proposal.id}`}
                                className="text-xs font-bold text-primary hover:underline"
                              >
                                Aç
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">Notlar</h3>
                        <p className="text-xs text-gray-500">Bu alana fırsatla ilgili notlarınızı kaydedin.</p>
                      </div>
                      <textarea
                        value={notesValue}
                        onChange={(event) => setNotesValue(event.target.value)}
                        className="w-full min-h-[160px] px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                      />
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-70"
                      >
                        {isSavingNotes ? 'Kaydediliyor' : 'Notu Kaydet'}
                      </button>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="p-6">
                      {activities.length === 0 ? (
                        <div className="text-sm text-gray-500">Henüz aktivite yok.</div>
                      ) : (
                        <div className="space-y-3">
                          {activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="border border-[#e7ebf4] dark:border-gray-800 rounded-xl px-4 py-3"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                  {activity.title}
                                </p>
                                <span className="text-xs text-gray-400">{formatRelativeTime(activity.created_at)}</span>
                              </div>
                              {activity.description && (
                                <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'files' && (
                    <div className="p-6 space-y-4">
                      {filesError ? (
                        <div className="text-sm text-gray-500">{filesError}</div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">Dosya Ekle</h3>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input
                                value={fileName}
                                onChange={(event) => setFileName(event.target.value)}
                                placeholder="Dosya adı"
                                className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                              />
                              <input
                                value={fileUrl}
                                onChange={(event) => setFileUrl(event.target.value)}
                                placeholder="Dosya linki"
                                className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                              />
                              <div className="flex gap-2">
                                <input
                                  value={fileSize}
                                  onChange={(event) => setFileSize(event.target.value)}
                                  placeholder="Boyut (KB)"
                                  className="flex-1 px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                                />
                                <button
                                  onClick={handleAddFile}
                                  disabled={isSavingFile}
                                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
                                >
                                  {isSavingFile ? 'Ekleniyor' : 'Ekle'}
                                </button>
                              </div>
                            </div>
                          </div>
                          {files.length === 0 ? (
                            <div className="text-sm text-gray-500">Henüz dosya eklenmedi.</div>
                          ) : (
                            <div className="space-y-2">
                              {files.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between border border-[#e7ebf4] dark:border-gray-800 rounded-xl px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                      {file.file_name || 'Dosya'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {file.file_size ? `${file.file_size} KB` : 'Boyut yok'} • {formatDate(file.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {file.file_url && (
                                      <a
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-primary hover:underline"
                                      >
                                        Aç
                                      </a>
                                    )}
                                    <button
                                      onClick={() => handleRemoveFile(file.id)}
                                      className="text-xs font-semibold text-rose-500"
                                    >
                                      Sil
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Contact Card */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {(selectedContact?.full_name || '??')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">
                      {selectedContact?.full_name || 'Kişi'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedContact?.position || 'Pozisyon yok'}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">{selectedContact?.company || 'Şirket yok'}</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">mail</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{selectedContact?.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">call</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{selectedContact?.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">location_on</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{selectedContact?.address || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={selectedContact?.phone ? `tel:${selectedContact.phone}` : undefined}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">call</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">ARA</span>
                  </a>
                  <a
                    href={selectedContact?.email ? `mailto:${selectedContact.email}` : undefined}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">mail</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">E-POSTA</span>
                  </a>
                  <a
                    href={selectedContact?.phone ? `sms:${selectedContact.phone}` : undefined}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">chat</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">SMS</span>
                  </a>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#0d121c] dark:text-white uppercase tracking-wider px-1">Performans Metrikleri</h4>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pipeline Süresi</p>
                    <span className="text-primary font-bold">{pipelineDays} Gün</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${averageDays ? Math.min(100, (pipelineDays / averageDays) * 100) : 60}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Ortalama süre {averageDays ?? '—'} gün.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kazanma Olasılığı</p>
                    <span className="text-green-500 font-bold">%{draft.probability}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${draft.probability}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Manuel güncellenebilir.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('activity')}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-800 rounded-lg text-sm font-bold text-[#0d121c] dark:text-white flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  Geçmişi Görüntüle
                </button>
                <button
                  onClick={() => handleCloseDeal('won')}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-bold text-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Fırsatı Kapat (Kazanıldı)
                </button>
                <button
                  onClick={() => handleCloseDeal('lost')}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-800 rounded-lg text-sm font-bold text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                  Fırsatı Kapat (Kaybedildi)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
