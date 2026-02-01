'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useUser } from '@/hooks'

type TemplateRow = {
  id: string
  name: string
  description: string | null
  category: string | null
  is_public: boolean
  usage_count: number
  blocks: unknown
  user_id: string
  updated_at: string
}

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { authUser } = useUser()
  const [template, setTemplate] = useState<TemplateRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [blocksInput, setBlocksInput] = useState('[]')

  useEffect(() => {
    if (!params?.id) return
    const loadTemplate = async () => {
      setIsLoading(true)
      const response = await fetch(`/api/templates/${params.id}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Şablon yüklenemedi.')
        setIsLoading(false)
        return
      }
      const data = payload?.template as TemplateRow | undefined
      if (!data) {
        toast.error('Şablon bulunamadı.')
        setIsLoading(false)
        return
      }
      setTemplate(data)
      setName(data.name ?? '')
      setDescription(data.description ?? '')
      setCategory(data.category ?? '')
      setIsPublic(Boolean(data.is_public))
      setBlocksInput(JSON.stringify(data.blocks ?? [], null, 2))
      setIsLoading(false)
    }
    loadTemplate()
  }, [params?.id])

  const canEdit = !!template && !!authUser?.id && template.user_id === authUser.id

  const { parsedBlocks, parseError } = useMemo(() => {
    try {
      const parsed = JSON.parse(blocksInput)
      if (!Array.isArray(parsed)) {
        return { parsedBlocks: null, parseError: 'Bloklar JSON listesi olmalıdır.' }
      }
      return { parsedBlocks: parsed, parseError: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'JSON geçersiz.'
      return { parsedBlocks: null, parseError: message }
    }
  }, [blocksInput])

  const handleSave = async () => {
    if (!template) return
    if (!canEdit) {
      toast.error('Bu şablonu düzenleme yetkiniz yok.')
      return
    }
    if (!name.trim()) {
      toast.error('Şablon adı zorunludur.')
      return
    }
    if (parseError || !parsedBlocks) {
      toast.error('Bloklar JSON formatında olmalı.')
      return
    }
    setIsSaving(true)
    const response = await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        category,
        is_public: isPublic,
        blocks: parsedBlocks,
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Şablon güncellenemedi.')
      setIsSaving(false)
      return
    }
    setTemplate(payload?.template ?? template)
    toast.success('Şablon güncellendi.')
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!template) return
    if (!canEdit) {
      toast.error('Bu şablonu silme yetkiniz yok.')
      return
    }
    if (!confirm('Şablonu silmek istiyor musunuz?')) return
    const response = await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Şablon silinemedi.')
      return
    }
    toast.success('Şablon silindi.')
    router.push('/templates')
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <p className="text-sm text-[#48679d]">Şablon yükleniyor...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <p className="text-sm text-[#48679d]">Şablon bulunamadı.</p>
        <Link href="/templates" className="text-sm text-primary font-semibold mt-3 inline-flex">
          Şablonlara dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Şablon Detayı</p>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
            {template.name}
          </h1>
          <p className="text-sm text-[#48679d] mt-1">
            Son güncelleme: {new Date(template.updated_at).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/templates"
            className="px-4 h-10 flex items-center justify-center rounded-lg border border-[#e7ebf4] text-sm font-semibold text-[#48679d] hover:border-primary/40 hover:text-primary"
          >
            Geri Dön
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 h-10 flex items-center justify-center rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Sil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Şablon Adı</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Açıklama</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm min-h-[120px]"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Kategori</label>
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e7ebf4] dark:border-gray-800 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#0d121c] dark:text-white">Şablonu paylaş</p>
                <p className="text-xs text-[#48679d]">Şablon ekibiniz veya herkese açık olur.</p>
              </div>
              <button
                onClick={() => setIsPublic((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
                disabled={!canEdit}
              >
                {isPublic ? 'Genel' : 'Takım'}
              </button>
            </div>
            {!canEdit && (
              <p className="text-xs text-amber-600">
                Bu şablon size ait olmadığı için düzenleme kapalı.
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">Bloklar (JSON)</h3>
              <button
                onClick={() => setBlocksInput('[]')}
                className="text-xs font-semibold text-primary hover:underline"
                disabled={!canEdit}
              >
                Temizle
              </button>
            </div>
            <textarea
              value={blocksInput}
              onChange={(event) => setBlocksInput(event.target.value)}
              className="w-full min-h-[260px] font-mono text-xs px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800"
              disabled={!canEdit}
            />
            {parseError && <p className="text-xs text-rose-500">{parseError}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5 space-y-3">
            <div>
              <p className="text-xs text-[#48679d]">Paylaşım</p>
              <p className="text-sm font-semibold text-[#0d121c] dark:text-white mt-1">
                {template.is_public ? 'Genel şablon' : 'Takım şablonu'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#48679d]">Kullanım</p>
              <p className="text-sm font-semibold text-[#0d121c] dark:text-white mt-1">
                {template.usage_count ?? 0} kullanım
              </p>
            </div>
            <div>
              <p className="text-xs text-[#48679d]">Blok sayısı</p>
              <p className="text-sm font-semibold text-[#0d121c] dark:text-white mt-1">
                {parsedBlocks?.length ?? 0}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !canEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Kaydediliyor' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
