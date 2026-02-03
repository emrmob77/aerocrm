'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'

const defaultBlocks = '[]'

export default function NewTemplatePage() {
  const { t } = useI18n()
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
        return { parsedBlocks: null, parseError: t('templatesNew.errors.blocksArray') }
      }
      return { parsedBlocks: parsed, parseError: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('templatesNew.errors.invalidJson')
      return { parsedBlocks: null, parseError: message }
    }
  }, [blocksInput, t])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('templatesNew.errors.nameRequired'))
      return
    }
    if (parseError || !parsedBlocks) {
      toast.error(t('templatesNew.errors.blocksJson'))
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
      toast.error(payload?.error || t('templatesNew.errors.create'))
      setIsSaving(false)
      return
    }
    toast.success(t('templatesNew.success'))
    router.push('/templates')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          {t('templatesNew.title')}
        </h1>
        <p className="text-[#48679d] dark:text-gray-400">{t('templatesNew.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">
                {t('templatesNew.fields.name')}
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('templatesNew.placeholders.name')}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">
                {t('templatesNew.fields.description')}
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('templatesNew.placeholders.description')}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm min-h-[120px]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#48679d] uppercase tracking-wider">
                {t('templatesNew.fields.category')}
              </label>
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder={t('templatesNew.placeholders.category')}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-[#e7ebf4] dark:border-gray-800 text-sm"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e7ebf4] dark:border-gray-800 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#0d121c] dark:text-white">
                  {t('templatesNew.share.title')}
                </p>
                <p className="text-xs text-[#48679d]">{t('templatesNew.share.subtitle')}</p>
              </div>
              <button
                onClick={() => setIsPublic((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isPublic ? t('templatesNew.share.public') : t('templatesNew.share.team')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0d121c] dark:text-white">
                {t('templatesNew.blocks.title')}
              </h3>
              <button
                onClick={() => setBlocksInput(defaultBlocks)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t('templatesNew.blocks.clear')}
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
            <p className="text-xs text-[#48679d]">{t('templatesNew.summary.title')}</p>
            <p className="text-lg font-bold text-[#0d121c] dark:text-white mt-2">
              {name || t('templatesNew.summary.nameFallback')}
            </p>
            <p className="text-xs text-[#48679d] mt-1">
              {category || t('templatesNew.summary.categoryFallback')}
            </p>
            <p className="text-xs text-[#48679d] mt-3">
              {t('templatesNew.summary.blocksLabel')}: {parsedBlocks?.length ?? 0}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? t('templatesNew.saving') : t('templatesNew.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
