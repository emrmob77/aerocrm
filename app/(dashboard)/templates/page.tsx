'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useUser } from '@/hooks'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'
import { useI18n } from '@/lib/i18n'

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
  const { t } = useI18n()
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
      toast.error(payload?.error || t('templatesPage.errors.fetch'))
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
    if (!confirm(t('templatesPage.confirmDelete', { name: template.name }))) return
    const response = await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || t('templatesPage.errors.delete'))
      return
    }
    setTemplates((prev) => prev.filter((item) => item.id !== template.id))
    toast.success(t('templatesPage.success.delete'))
  }

  return (
    <div className="-m-8">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="text-xs font-semibold uppercase tracking-wider">{t('templatesPage.kicker')}</span>
            </div>
            <h1 className="text-3xl font-black text-[#0f172a] dark:text-white">{t('templatesPage.title')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('templatesPage.subtitle')}</p>
          </div>
          <Link
            href="/templates/new"
            className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t('templatesPage.new')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{t('templatesPage.stats.total')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{templates.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{t('templatesPage.stats.popular')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {templates.reduce((max, item) => Math.max(max, item.usage_count ?? 0), 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{t('templatesPage.stats.popularHint')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{t('templatesPage.stats.categories')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</p>
            <p className="text-xs text-slate-400 mt-1">{t('templatesPage.stats.categoriesHint')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 mb-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'team', label: t('templatesPage.scopes.team') },
              { id: 'public', label: t('templatesPage.scopes.public') },
              { id: 'all', label: t('templatesPage.scopes.all') },
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
              placeholder={t('templatesPage.searchPlaceholder')}
              className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
            >
              <option value="all">{t('templatesPage.categoryAll')}</option>
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
            {t('templatesPage.loading')}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-6 text-sm text-slate-500">
            {t('templatesPage.empty')}
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
                        {template.description || t('templatesPage.descriptionEmpty')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        template.is_public
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {template.is_public ? t('templatesPage.public') : t('templatesPage.team')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">layers</span>
                      {getBlockCount(template.blocks)} {t('templatesPage.blocks')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">bolt</span>
                      {template.usage_count ?? 0} {t('templatesPage.usage')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{template.category || t('templatesPage.categoryDefault')}</span>
                    <span>{formatRelativeTime(template.updated_at, t)}</span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
                    >
                      {t('templatesPage.use')}
                    </button>
                    {isOwner && (
                      <Link
                        href={`/templates/${template.id}`}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-slate-600 hover:text-primary hover:border-primary/40 text-center"
                      >
                        {t('common.edit')}
                      </Link>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(template)}
                        className="px-3 py-2 rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        {t('common.delete')}
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
