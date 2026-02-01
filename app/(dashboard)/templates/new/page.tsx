'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const defaultBlocks = '[]'

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [blocksInput, setBlocksInput] = useState(defaultBlocks)
  const [isSaving, setIsSaving] = useState(false)
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
    if (!name.trim()) {
      toast.error('Şablon adı zorunludur.')
      return
    }
    if (parseError || !parsedBlocks) {
      toast.error('Bloklar JSON formatında olmalı.')
      return
    }
    setIsSaving(true)
    const response = await fetch('/api/templates', {
      method: 'POST',
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
      toast.error(payload?.error || 'Şablon oluşturulamadı.')
      setIsSaving(false)
      return
    }
    toast.success('Şablon oluşturuldu.')
    router.push('/templates')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Yeni Şablon</h1>
        <p className="text-[#48679d] dark:text-gray-400">Şablon meta bilgilerini ve bloklarını tanımlayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Şablon Adı</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Örn: SaaS Teklif Şablonu"
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Açıklama</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Şablonun kullanım amacını yazın."
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm min-h-[120px]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">Kategori</label>
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Örn: SaaS, Ajans, Emlak"
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
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
              >
                {isPublic ? 'Genel' : 'Takım'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">Bloklar (JSON)</h3>
              <button
                onClick={() => setBlocksInput(defaultBlocks)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Temizle
              </button>
            </div>
            <textarea
              value={blocksInput}
              onChange={(event) => setBlocksInput(event.target.value)}
              className="w-full min-h-[260px] font-mono text-xs px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800"
            />
            {parseError && <p className="text-xs text-rose-500">{parseError}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5">
            <p className="text-xs text-[#48679d]">Özet</p>
            <p className="text-lg font-bold text-[#0d121c] dark:text-white mt-2">
              {name || 'Şablon adı'}
            </p>
            <p className="text-xs text-[#48679d] mt-1">{category || 'Kategori yok'}</p>
            <p className="text-xs text-[#48679d] mt-3">
              Blok sayısı: {parsedBlocks?.length ?? 0}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Kaydediliyor' : 'Şablonu Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
