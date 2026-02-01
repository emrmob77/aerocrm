'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useUser } from '@/hooks'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'

type TemplateRow = {
  id: string
  name: string
  description: string | null
  category: string | null
  is_public: boolean
  usage_count: number
  updated_at: string
  created_at: string
  user_id: string
  team_id: string
  blocks: unknown
}

type ScopeType = 'team' | 'public' | 'all'

const getBlockCount = (blocks: unknown) => (Array.isArray(blocks) ? blocks.length : 0)

export default function TemplatesPage() {
  const { authUser } = useUser()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scope, setScope] = useState<ScopeType>('team')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetchTemplates = async (selectedScope: ScopeType) => {
    setIsLoading(true)
    const response = await fetch(`/api/templates?scope=${selectedScope}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Şablonlar getirilemedi.')
      setIsLoading(false)
      return
    }
    setTemplates((payload?.templates ?? []) as TemplateRow[])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTemplates(scope)
  }, [scope])

  const categories = useMemo(() => {
    const set = new Set<string>()
    templates.forEach((template) => {
      if (template.category) {
        set.add(template.category)
      }
    })
    return Array.from(set.values())
  }, [templates])

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return templates.filter((template) => {
      if (categoryFilter !== 'all' && template.category !== categoryFilter) {
        return false
      }
      if (!query) return true
      return (
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.category?.toLowerCase().includes(query)
      )
    })
  }, [templates, searchQuery, categoryFilter])

  const handleUseTemplate = (template: TemplateRow) => {
    window.location.href = `/proposals/new?templateId=${template.id}`
  }

  const handleDelete = async (template: TemplateRow) => {
    if (!confirm(`${template.name} şablonunu silmek istiyor musunuz?`)) return
    const response = await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Şablon silinemedi.')
      return
    }
    setTemplates((prev) => prev.filter((item) => item.id !== template.id))
    toast.success('Şablon silindi.')
  }

  return (
    <div className="-m-8">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Template Studio</span>
            </div>
            <h1 className="text-3xl font-black text-[#0f172a] dark:text-white">Şablon Galerisi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Takım şablonlarını yönetin, paylaşın ve tekliflerde kullanın.
            </p>
          </div>
          <Link
            href="/templates/new"
            className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Yeni Şablon
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Toplam Şablon</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{templates.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Popüler Şablon</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {templates.reduce((max, item) => Math.max(max, item.usage_count ?? 0), 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">En yüksek kullanım</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Kategoriler</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</p>
            <p className="text-xs text-slate-400 mt-1">Tanımlı kategori</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 mb-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'team', label: 'Takım Şablonları' },
              { id: 'public', label: 'Genel Şablonlar' },
              { id: 'all', label: 'Tümü' },
            ] as { id: ScopeType; label: string }[]).map((item) => (
              <button
                key={item.id}
                onClick={() => setScope(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  scope === item.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Şablon adı veya kategori"
              className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
            >
              <option value="all">Tüm kategoriler</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-6 text-sm text-slate-500">
            Şablonlar yükleniyor...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-6 text-sm text-slate-500">
            Şablon bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const isOwner = authUser?.id === template.user_id
              return (
                <div
                  key={template.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 p-5 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#0f172a] dark:text-white">{template.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {template.description || 'Açıklama eklenmedi.'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        template.is_public
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {template.is_public ? 'Genel' : 'Takım'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">layers</span>
                      {getBlockCount(template.blocks)} blok
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">bolt</span>
                      {template.usage_count ?? 0} kullanım
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{template.category || 'Genel'}</span>
                    <span>{formatRelativeTime(template.updated_at)}</span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
                    >
                      Kullan
                    </button>
                    {isOwner && (
                      <Link
                        href={`/templates/${template.id}`}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-slate-600 hover:text-primary hover:border-primary/40 text-center"
                      >
                        Düzenle
                      </Link>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(template)}
                        className="px-3 py-2 rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
