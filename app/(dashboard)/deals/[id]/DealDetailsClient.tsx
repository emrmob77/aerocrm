'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import DOMPurify from 'dompurify'
import { useSupabase } from '@/hooks'
import type { Database } from '@/types/database'
import { formatCurrency, formatRelativeTime, getDbStage, normalizeStage, getStageConfigs, type StageId } from '@/components/deals/stage-utils'
import { useI18n } from '@/lib/i18n'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const notesModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const notesFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link']

const tabs = [
  { id: 'products', labelKey: 'deals.detail.tabs.products' },
  { id: 'proposals', labelKey: 'deals.detail.tabs.proposals' },
  { id: 'notes', labelKey: 'deals.detail.tabs.notes' },
  { id: 'activity', labelKey: 'deals.detail.tabs.activity' },
  { id: 'files', labelKey: 'deals.detail.tabs.files' },
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
  name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

type DealDetailsClientProps = {
  dealId: string
  authUserId: string
  teamId: string | null
  initialDeal: DealRow | null
  initialContact: ContactRow | null
  initialOwner: UserRow | null
  initialDealProducts: DealProductItem[]
  initialProposals: ProposalRow[]
  initialActivities: ActivityRow[]
  initialFiles: DealFileRow[]
  initialContacts: ContactRow[]
  initialTeamMembers: UserRow[]
  initialProducts: ProductRow[]
  averageDays: number | null
  initialError?: string | null
}

const FILE_BUCKET = 'deal-files'

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatFileSize = (bytes: number | null | undefined, t: (key: string) => string) => {
  if (!bytes || bytes <= 0) return t('deals.detail.files.noSize')
  const kb = Math.round(bytes / 1024)
  if (kb < 1024) return `${kb} ${t('deals.detail.files.kb')}`
  const mb = Math.round((kb / 1024) * 10) / 10
  return `${mb} ${t('deals.detail.files.mb')}`
}

export default function DealDetailsClient({
  dealId,
  authUserId,
  teamId,
  initialDeal,
  initialContact,
  initialOwner,
  initialDealProducts,
  initialProposals,
  initialActivities,
  initialFiles,
  initialContacts,
  initialTeamMembers,
  initialProducts,
  averageDays,
  initialError,
}: DealDetailsClientProps) {
  const supabase = useSupabase()
  const { t, locale } = useI18n()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [isLoading] = useState(!initialDeal && !initialError)
  const [error, setError] = useState<string | null>(initialError ?? null)

  const [deal, setDeal] = useState<DealRow | null>(initialDeal)
  const [contact, setContact] = useState<ContactRow | null>(initialContact)
  const [owner, setOwner] = useState<UserRow | null>(initialOwner)
  const [dealProducts, setDealProducts] = useState<DealProductItem[]>(initialDealProducts)
  const [proposals, setProposals] = useState<ProposalRow[]>(initialProposals)
  const [activities, setActivities] = useState<ActivityRow[]>(initialActivities)
  const [files, setFiles] = useState<DealFileRow[]>(initialFiles)
  const [filesError, setFilesError] = useState<string | null>(null)

  const [teamMembers, setTeamMembers] = useState<UserRow[]>(initialTeamMembers)
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts)
  const [products, setProducts] = useState<ProductRow[]>(initialProducts)

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({
    title: initialDeal?.title ?? '',
    value: initialDeal?.value ?? 0,
    stage: initialDeal ? normalizeStage(initialDeal.stage) : 'lead',
    expectedCloseDate: initialDeal?.expected_close_date ? initialDeal.expected_close_date.slice(0, 10) : '',
    probability: initialDeal?.probability ?? 0,
    contactId: initialDeal?.contact_id ?? '',
    ownerId: initialDeal?.user_id ?? authUserId,
    notes: initialDeal?.notes ?? '',
  })

  const [notesValue, setNotesValue] = useState(initialDeal?.notes ?? '')
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
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const selectedContact = useMemo(() => {
    if (!isEditing) return contact
    return contacts.find((item) => item.id === draft.contactId) ?? contact
  }, [contact, contacts, draft.contactId, isEditing])

  const selectedOwner = useMemo(() => {
    if (!isEditing) return owner
    return teamMembers.find((item) => item.id === draft.ownerId) ?? owner
  }, [owner, teamMembers, draft.ownerId, isEditing])

  const stageConfigs = useMemo(() => getStageConfigs(t), [t])

  const stageLabel = useMemo(() => {
    const stage = stageConfigs.find((item) => item.id === draft.stage)
    return stage?.label ?? t('stages.lead')
  }, [draft.stage, stageConfigs, t])

  const pipelineDays = useMemo(() => {
    if (!deal?.created_at) return 0
    const diffMs = Date.now() - new Date(deal.created_at).getTime()
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  }, [deal?.created_at])

  const totalProductsValue = useMemo(() => {
    return dealProducts.reduce((sum, item) => sum + (item.total_price ?? 0), 0)
  }, [dealProducts])

  const currentCurrency = deal?.currency ?? 'TRY'
  const sanitizedNotes = useMemo(
    () => DOMPurify.sanitize(notesValue || '', { USE_PROFILES: { html: true } }),
    [notesValue]
  )
  const getFileUrl = (filePath: string) => {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
    return supabase.storage.from(FILE_BUCKET).getPublicUrl(filePath).data?.publicUrl ?? ''
  }

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
        ownerId: deal.user_id ?? authUserId,
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
      toast.error(t('deals.detail.toasts.titleRequired'))
      return
    }
    if (!draft.contactId) {
      toast.error(t('deals.detail.toasts.contactRequired'))
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
        toast.error(payload?.error || t('deals.detail.toasts.stageUpdateError'))
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
        toast.error(payload?.error || t('deals.detail.toasts.ownerUpdateError'))
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
      toast.error(t('deals.detail.toasts.updateError'))
      return
    }

    setDeal(updated)
    setNotesValue(updated.notes ?? '')
    setContact(contacts.find((item) => item.id === updated.contact_id) ?? contact)
    setOwner(teamMembers.find((item) => item.id === updated.user_id) ?? owner)
    toast.success(t('deals.detail.toasts.updated'))
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
      toast.error(payload?.error || t('deals.detail.toasts.stageUpdateError'))
      return
    }
    const updatedStage = payload?.deal?.stage ?? getDbStage(nextStage)
    setDeal((prev) => (prev ? { ...prev, stage: updatedStage } : prev))
    setDraft((prev) => ({ ...prev, stage: nextStage }))
    toast.success(nextStage === 'won' ? t('deals.detail.toasts.closeWon') : t('deals.detail.toasts.closeLost'))
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
      toast.error(t('deals.detail.toasts.notesSaveError'))
      setIsSavingNotes(false)
      return
    }
    setDeal(updated)
    toast.success(t('deals.detail.toasts.notesSaved'))
    setIsSavingNotes(false)
  }

  const handleAddProduct = async () => {
    if (!dealId) return
    if (!newProductId) {
      toast.error(t('deals.detail.toasts.productSelect'))
      return
    }
    const product = products.find((item) => item.id === newProductId)
    if (!product) {
      toast.error(t('deals.detail.toasts.productMissing'))
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
      toast.error(t('deals.detail.toasts.productAddError'))
      setIsAddingProduct(false)
      return
    }

    setDealProducts((prev) => [{ ...inserted, product }, ...prev])
    setNewProductId('')
    setNewProductQty(1)
    setNewProductPrice('')
    setIsAddingProduct(false)
    toast.success(t('deals.detail.toasts.productAdded'))
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
      toast.error(t('deals.detail.toasts.productUpdateError'))
      setIsSavingProduct(null)
      return
    }

    setDealProducts((prev) =>
      prev.map((row) => (row.id === item.id ? { ...updated, product: row.product } : row))
    )
    setIsSavingProduct(null)
    toast.success(t('deals.detail.toasts.productUpdated'))
  }

  const handleRemoveProduct = async (id: string) => {
    const { error: deleteError } = await supabase.from('deal_products').delete().eq('id', id)
    if (deleteError) {
      toast.error(t('deals.detail.toasts.productDeleteError'))
      return
    }
    setDealProducts((prev) => prev.filter((row) => row.id !== id))
    toast.success(t('deals.detail.toasts.productDeleted'))
  }

  const handleAddFile = async () => {
    if (!dealId) return
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error(t('deals.detail.toasts.fileFieldsRequired'))
      return
    }
    setIsSavingFile(true)
    const supabaseAny = supabase as unknown as { from: (table: string) => any }
    const payload = {
      deal_id: dealId,
      name: fileName.trim(),
      file_path: fileUrl.trim(),
      file_size: fileSize ? Math.round(Number(fileSize) * 1024) : null,
      mime_type: null,
      uploaded_by: authUserId ?? null,
    }
    const { data, error: insertError } = await supabaseAny
      .from('deal_files')
      .insert(payload)
      .select('id, deal_id, name, file_path, file_size, mime_type, uploaded_by, created_at')
      .single()

    if (insertError || !data) {
      toast.error(t('deals.detail.toasts.fileAddError'))
      setIsSavingFile(false)
      return
    }

    setFiles((prev) => [data as DealFileRow, ...prev])
    setFileName('')
    setFileUrl('')
    setFileSize('')
    setIsSavingFile(false)
    toast.success(t('deals.detail.toasts.fileAdded'))
  }

  const handleRemoveFile = async (id: string) => {
    const supabaseAny = supabase as unknown as { from: (table: string) => any }
    const { error: deleteError } = await supabaseAny.from('deal_files').delete().eq('id', id)
    if (deleteError) {
      toast.error(t('deals.detail.toasts.fileDeleteError'))
      return
    }
    setFiles((prev) => prev.filter((row) => row.id !== id))
    toast.success(t('deals.detail.toasts.fileDeleted'))
  }

  const handleDropFiles = async (acceptedFiles: File[]) => {
    if (!dealId || acceptedFiles.length === 0) return
    setIsUploadingFile(true)
    const supabaseAny = supabase as unknown as { from: (table: string) => any }

    try {
      for (const file of acceptedFiles) {
        const safeName = file.name.replace(/\s+/g, '-').toLowerCase()
        const path = `deals/${dealId}/${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from(FILE_BUCKET).upload(path, file, {
          upsert: false,
        })

        if (uploadError) {
          throw uploadError
        }

    const { data: urlData } = supabase.storage.from(FILE_BUCKET).getPublicUrl(path)
    const { data, error: insertError } = await supabaseAny
      .from('deal_files')
      .insert({
        deal_id: dealId,
        name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by: authUserId ?? null,
      })
      .select('id, deal_id, name, file_path, file_size, mime_type, uploaded_by, created_at')
      .single()

        if (insertError || !data) {
          throw insertError
        }

        setFiles((prev) => [data as DealFileRow, ...prev])
      }
      toast.success(t('deals.detail.toasts.uploadSuccess'))
      setFilesError(null)
    } catch (uploadError) {
      setFilesError(t('deals.detail.files.uploadErrorDetail'))
      toast.error(t('deals.detail.toasts.uploadError'))
    } finally {
      setIsUploadingFile(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDropFiles,
    multiple: true,
    maxSize: 15 * 1024 * 1024,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">{t('common.loading')}</div>
    )
  }

  if (error || !deal) {
    return (
      <div className="p-8 text-sm text-gray-500">
        {error || t('deals.detail.notFound')}
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
                {t('deals.detail.back')}
              </Link>
              <span className="text-gray-400 text-sm">/</span>
              <span className="text-gray-500 text-sm">{selectedContact?.company || t('deals.detail.breadcrumbFallback')}</span>
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
                      onChange={(event) => setDraft((prev) => ({ ...prev, stage: event.target.value as StageId }))}
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
                  <span className="text-xs text-gray-500">
                    {t('deals.detail.lastUpdated', {
                      value: formatRelativeTime(deal.updated_at ?? deal.created_at ?? new Date().toISOString(), t),
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveDeal}
                      className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-colors"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-colors"
                  >
                    {t('common.edit')}
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
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{t('deals.detail.stats.value')}</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={draft.value}
                      onChange={(event) => setDraft((prev) => ({ ...prev, value: Number(event.target.value) }))}
                      className="text-2xl font-extrabold text-[#0d121c] dark:text-white bg-transparent border-b border-primary/30 focus:outline-none"
                    />
                  ) : (
                    <p className="text-[#0d121c] dark:text-white text-2xl font-extrabold">
                      {formatCurrency(deal.value ?? 0, formatLocale, currentCurrency)}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {t('deals.detail.stats.productsTotal', {
                      value: formatCurrency(totalProductsValue, formatLocale, currentCurrency),
                    })}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-2 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{t('deals.detail.stats.closeDate')}</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={draft.expectedCloseDate}
                      onChange={(event) => setDraft((prev) => ({ ...prev, expectedCloseDate: event.target.value }))}
                      className="text-sm font-bold text-[#0d121c] dark:text-white bg-transparent border-b border-primary/30 focus:outline-none"
                    />
                  ) : (
                    <p className="text-[#0d121c] dark:text-white text-2xl font-extrabold">
                      {formatDate(deal.expected_close_date, formatLocale)}
                    </p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-2 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{t('deals.detail.stats.owner')}</p>
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
                        {selectedOwner?.full_name || t('deals.detail.stats.ownerFallback')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('deals.detail.edit.contact')}</label>
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
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('deals.detail.edit.winProbability')}</label>
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('deals.detail.edit.summaryNote')}</label>
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
                        {t(tab.labelKey)}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-0">
                  {activeTab === 'products' && (
                    <div>
                      <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800">
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('deals.detail.products.addTitle')}</h3>
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
                            <option value="">{t('deals.detail.products.selectPlaceholder')}</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} • {formatCurrency(product.price ?? 0, formatLocale, product.currency ?? currentCurrency)}
                              </option>
                            ))}
                          </select>
                          {products.length === 0 && (
                            <p className="text-xs text-gray-400 md:col-span-4">
                              {t('deals.detail.products.emptyCatalog')}
                            </p>
                          )}
                          <input
                            type="number"
                            min={1}
                            value={newProductQty}
                            onChange={(event) => setNewProductQty(Number(event.target.value))}
                            className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                            placeholder={t('deals.detail.products.quantity')}
                          />
                          <input
                            type="number"
                            value={newProductPrice}
                            onChange={(event) => setNewProductPrice(Number(event.target.value))}
                            className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                            placeholder={t('deals.detail.products.unitPrice')}
                          />
                          <button
                            onClick={handleAddProduct}
                            disabled={isAddingProduct}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-70"
                          >
                            {isAddingProduct ? t('common.adding') : t('common.add')}
                          </button>
                        </div>
                      </div>
                      {dealProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">{t('deals.detail.products.empty')}</div>
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                              <th className="px-6 py-4">{t('deals.detail.products.table.name')}</th>
                              <th className="px-6 py-4 text-center">{t('deals.detail.products.table.quantity')}</th>
                              <th className="px-6 py-4 text-right">{t('deals.detail.products.table.unitPrice')}</th>
                              <th className="px-6 py-4 text-right">{t('deals.detail.products.table.total')}</th>
                              <th className="px-6 py-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {dealProducts.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-[#0d121c] dark:text-white">
                                  {product.product?.name || t('deals.detail.products.fallbackName', { id: product.product_id.slice(0, 6) })}
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
                                  {formatCurrency(product.total_price ?? product.quantity * product.unit_price, formatLocale, currentCurrency)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleUpdateProduct(product)}
                                      disabled={isSavingProduct === product.id}
                                      className="px-3 py-1.5 rounded-lg border border-[#e7ebf4] text-xs font-semibold text-gray-600 hover:text-primary"
                                    >
                                      {isSavingProduct === product.id ? t('common.saving') : t('common.save')}
                                    </button>
                                    <button
                                      onClick={() => handleRemoveProduct(product.id)}
                                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600"
                                    >
                                      {t('common.delete')}
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
                                {t('deals.detail.products.table.grandTotal')}
                              </td>
                              <td className="px-6 py-4 text-lg font-extrabold text-right text-primary">
                                {formatCurrency(totalProductsValue, formatLocale, currentCurrency)}
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
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('deals.detail.proposals.title')}</h3>
                        <Link
                          href={`/proposals/new?dealId=${deal.id}`}
                          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold"
                        >
                          {t('deals.detail.proposals.new')}
                        </Link>
                      </div>
                      {proposals.length === 0 ? (
                        <div className="text-sm text-gray-500">{t('deals.detail.proposals.empty')}</div>
                      ) : (
                        <div className="space-y-3">
                          {proposals.map((proposal) => (
                            <div
                              key={proposal.id}
                              className="flex items-center justify-between gap-3 border border-[#e7ebf4] dark:border-gray-800 rounded-xl px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                  {proposal.title || t('deals.detail.proposals.fallbackTitle')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(proposal.created_at, formatLocale)} • {proposal.status}
                                </p>
                              </div>
                              <Link
                                href={`/proposals/${proposal.id}`}
                                className="text-xs font-bold text-primary hover:underline"
                              >
                                {t('common.open')}
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
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('deals.detail.notes.title')}</h3>
                        <p className="text-xs text-gray-500">{t('deals.detail.notes.hint')}</p>
                      </div>
                      {notesValue.trim().length > 0 && (
                        <div className="rounded-lg border border-[#e7ebf4] dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t('deals.detail.notes.preview')}</p>
                          <div
                            className="prose prose-sm max-w-none text-[#0d121c] dark:text-gray-200"
                            dangerouslySetInnerHTML={{ __html: sanitizedNotes }}
                          />
                        </div>
                      )}
                      <div className="border border-[#e7ebf4] dark:border-gray-800 rounded-lg overflow-hidden">
                        <ReactQuill
                          value={notesValue}
                          onChange={setNotesValue}
                          theme="snow"
                          modules={notesModules}
                          formats={notesFormats}
                          className="bg-white dark:bg-gray-900"
                        />
                      </div>
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-70"
                      >
                        {isSavingNotes ? t('common.saving') : t('deals.detail.notes.save')}
                      </button>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="p-6">
                      {activities.length === 0 ? (
                        <div className="text-sm text-gray-500">{t('deals.detail.activity.empty')}</div>
                      ) : (
                        <div className="space-y-6">
                          {activities.map((activity) => (
                            <div key={activity.id} className="relative pl-6">
                              <div className="absolute left-0 top-1.5 size-3 rounded-full bg-primary" />
                              <div className="absolute left-1.5 top-4 h-full w-px bg-primary/20" />
                              <div className="border border-[#e7ebf4] dark:border-gray-800 rounded-xl px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                    {activity.title}
                                  </p>
                                  <span className="text-xs text-gray-400">
                                    {formatRelativeTime(activity.created_at ?? new Date().toISOString(), t)}
                                  </span>
                                </div>
                                {activity.description && (
                                  <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                                )}
                              </div>
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
                            <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('deals.detail.files.title')}</h3>
                            <div
                              {...getRootProps()}
                              className={`mt-3 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                                isDragActive ? 'border-primary bg-primary/5' : 'border-[#e7ebf4] dark:border-gray-800'
                              }`}
                            >
                              <input {...getInputProps()} />
                              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                {isUploadingFile
                                  ? t('deals.detail.files.uploading')
                                  : isDragActive
                                    ? t('deals.detail.files.dropHere')
                                    : t('deals.detail.files.dropHint')}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{t('deals.detail.files.formats')}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('deals.detail.files.linkTitle')}</h4>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input
                                value={fileName}
                                onChange={(event) => setFileName(event.target.value)}
                                placeholder={t('deals.detail.files.fileName')}
                                className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                              />
                              <input
                                value={fileUrl}
                                onChange={(event) => setFileUrl(event.target.value)}
                                placeholder={t('deals.detail.files.fileUrl')}
                                className="px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                              />
                              <div className="flex gap-2">
                                <input
                                  value={fileSize}
                                  onChange={(event) => setFileSize(event.target.value)}
                                  placeholder={t('deals.detail.files.fileSize')}
                                  className="flex-1 px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                                />
                                <button
                                  onClick={handleAddFile}
                                  disabled={isSavingFile}
                                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
                                >
                                  {isSavingFile ? t('common.adding') : t('common.add')}
                                </button>
                              </div>
                            </div>
                          </div>
                          {files.length === 0 ? (
                            <div className="text-sm text-gray-500">{t('deals.detail.files.empty')}</div>
                          ) : (
                            <div className="space-y-2">
                              {files.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between border border-[#e7ebf4] dark:border-gray-800 rounded-xl px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                      {file.name || t('deals.detail.files.fallbackName')}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {formatFileSize(file.file_size, t)} • {formatDate(file.created_at, formatLocale)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {file.file_path && (
                                      <a
                                        href={getFileUrl(file.file_path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-primary hover:underline"
                                      >
                                        {t('common.open')}
                                      </a>
                                    )}
                                    <button
                                      onClick={() => handleRemoveFile(file.id)}
                                      className="text-xs font-semibold text-rose-500"
                                    >
                                      {t('common.delete')}
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
                      {selectedContact?.full_name || t('deals.detail.contact.fallbackName')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedContact?.position || t('deals.detail.contact.noPosition')}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">{selectedContact?.company || t('deals.detail.contact.noCompany')}</p>
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
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">{t('deals.detail.contact.call')}</span>
                  </a>
                  <a
                    href={selectedContact?.email ? `mailto:${selectedContact.email}` : undefined}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">mail</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">{t('deals.detail.contact.email')}</span>
                  </a>
                  <a
                    href={selectedContact?.phone ? `sms:${selectedContact.phone}` : undefined}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">chat</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">{t('deals.detail.contact.sms')}</span>
                  </a>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#0d121c] dark:text-white uppercase tracking-wider px-1">{t('deals.detail.metrics.title')}</h4>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('deals.detail.metrics.pipelineDuration')}</p>
                    <span className="text-primary font-bold">{t('deals.detail.metrics.days', { count: pipelineDays })}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${averageDays ? Math.min(100, (pipelineDays / averageDays) * 100) : 60}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {t('deals.detail.metrics.avgDuration', { value: averageDays ?? '—' })}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('deals.detail.metrics.winProbability')}</p>
                    <span className="text-green-500 font-bold">%{draft.probability}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${draft.probability}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">{t('deals.detail.metrics.manual')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('activity')}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-800 rounded-lg text-sm font-bold text-[#0d121c] dark:text-white flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  {t('deals.detail.actions.viewHistory')}
                </button>
                <button
                  onClick={() => handleCloseDeal('won')}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-bold text-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  {t('deals.detail.actions.closeWon')}
                </button>
                <button
                  onClick={() => handleCloseDeal('lost')}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-800 rounded-lg text-sm font-bold text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                  {t('deals.detail.actions.closeLost')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
