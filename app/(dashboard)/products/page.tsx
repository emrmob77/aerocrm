'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSupabase, useUser } from '@/hooks'
import { useI18n } from '@/lib/i18n'
import { buildCatalogStats, filterCatalogProducts } from '@/lib/products/catalog-utils'

type Product = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type CategoryOption = {
  id: string
  name: string
  icon: string
}

const buildBaseCategories = (t: (key: string) => string): CategoryOption[] => [
  { id: 'software', name: t('products.categories.software'), icon: 'code' },
  { id: 'service', name: t('products.categories.service'), icon: 'support_agent' },
  { id: 'consulting', name: t('products.categories.consulting'), icon: 'psychology' },
  { id: 'marketing', name: t('products.categories.marketing'), icon: 'campaign' },
  { id: 'design', name: t('products.categories.design'), icon: 'palette' },
  { id: 'training', name: t('products.categories.training'), icon: 'school' },
]

const currencyOptions = [
  { code: 'TRY', label: '₺ TRY' },
  { code: 'USD', label: '$ USD' },
  { code: 'EUR', label: '€ EUR' },
  { code: 'GBP', label: '£ GBP' },
]

const formatCategoryLabel = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

const getCategoryMeta = (
  value: string | null | undefined,
  categoryMap: Record<string, CategoryOption>,
  t: (key: string) => string
): CategoryOption => {
  if (!value) {
    return { id: 'uncategorized', name: t('products.category.none'), icon: 'sell' }
  }
  if (categoryMap[value]) {
    return categoryMap[value]
  }
  return { id: value, name: formatCategoryLabel(value), icon: 'sell' }
}

export default function ProductsPage() {
  const { t, formatNumber } = useI18n()
  const supabase = useSupabase()
  const { user, authUser, loading: authLoading } = useUser()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'TRY',
    category: '',
    isActive: true,
  })

  const loadProducts = useCallback(async () => {
    if (!user?.team_id) {
      setProducts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, currency, category, active, created_at, updated_at')
      .eq('team_id', user.team_id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(error.message || t('products.errors.fetch'))
      setIsLoading(false)
      return
    }

    const fallbackDate = new Date().toISOString()
    const mapped = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      price: row.price ?? 0,
      currency: row.currency ?? 'TRY',
      category: row.category ?? null,
      isActive: row.active ?? true,
      createdAt: row.created_at ?? fallbackDate,
      updatedAt: row.updated_at ?? fallbackDate,
    }))

    setProducts(mapped)
    setIsLoading(false)
  }, [supabase, t, user?.team_id])

  useEffect(() => {
    if (authLoading) return
    if (!authUser) {
      setProducts([])
      setIsLoading(false)
      return
    }

    loadProducts()
  }, [authLoading, authUser, loadProducts])

  const baseCategories = useMemo(() => buildBaseCategories(t), [t])
  const categoryMap = useMemo(
    () =>
      baseCategories.reduce<Record<string, CategoryOption>>((acc, category) => {
        acc[category.id] = category
        return acc
      }, {}),
    [baseCategories]
  )

  const categories = useMemo(() => {
    const unique = new Set<string>()
    products.forEach((product) => {
      unique.add(product.category ?? 'uncategorized')
    })

    const list = Array.from(unique).map((categoryId) =>
      categoryId === 'uncategorized'
        ? getCategoryMeta(null, categoryMap, t)
        : getCategoryMeta(categoryId, categoryMap, t)
    )

    list.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    return [{ id: 'all', name: t('products.filters.all'), icon: 'apps' }, ...list]
  }, [products, categoryMap, t])

  useEffect(() => {
    if (selectedCategory === 'all') return
    if (!categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory('all')
    }
  }, [categories, selectedCategory])

  const filteredProducts = useMemo(() => {
    return filterCatalogProducts(products, {
      selectedCategory,
      searchQuery,
      showOnlyActive,
    })
  }, [products, selectedCategory, searchQuery, showOnlyActive])

  const stats = useMemo(() => {
    return buildCatalogStats(products)
  }, [products])

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'TRY',
      category: '',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency ?? 'TRY',
      category: product.category ?? '',
      isActive: product.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSaving) return

    if (!user?.team_id) {
      toast.error(t('products.errors.noTeam'))
      return
    }

    const name = formData.name.trim()
    if (!name) {
      toast.error(t('products.errors.nameRequired'))
      return
    }

    const price = Number(formData.price)
    if (!Number.isFinite(price)) {
      toast.error(t('products.errors.priceInvalid'))
      return
    }

    setIsSaving(true)

    const payload = {
      name,
      description: formData.description.trim() || null,
      price,
      currency: formData.currency,
      category: formData.category.trim() || null,
      active: formData.isActive,
    }

    if (editingProduct) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id)
        .eq('team_id', user.team_id)
        .select('id, name, description, price, currency, category, active, created_at, updated_at')
        .single()

      if (error || !data) {
        toast.error(error?.message || t('products.errors.update'))
        setIsSaving(false)
        return
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === data.id
            ? {
                id: data.id,
                name: data.name,
                description: data.description ?? '',
                price: data.price ?? 0,
                currency: data.currency ?? 'TRY',
                category: data.category ?? null,
                isActive: data.active ?? true,
                createdAt: data.created_at ?? product.createdAt,
                updatedAt: data.updated_at ?? product.updatedAt,
              }
            : product
        )
      )
      toast.success(t('products.success.updated'))
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...payload,
          team_id: user.team_id,
        })
        .select('id, name, description, price, currency, category, active, created_at, updated_at')
        .single()

      if (error || !data) {
        toast.error(error?.message || t('products.errors.create'))
        setIsSaving(false)
        return
      }

      const fallbackDate = new Date().toISOString()
      setProducts((prev) => [
        {
          id: data.id,
          name: data.name,
          description: data.description ?? '',
          price: data.price ?? 0,
          currency: data.currency ?? 'TRY',
          category: data.category ?? null,
          isActive: data.active ?? true,
          createdAt: data.created_at ?? fallbackDate,
          updatedAt: data.updated_at ?? fallbackDate,
        },
        ...prev,
      ])
      toast.success(t('products.success.created'))
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  const toggleProductStatus = async (product: Product) => {
    if (!user?.team_id) return
    const nextActive = !product.isActive

    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, isActive: nextActive } : item))
    )

    const { error } = await supabase
      .from('products')
      .update({ active: nextActive })
      .eq('id', product.id)
      .eq('team_id', user.team_id)

    if (error) {
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, isActive: product.isActive } : item))
      )
      toast.error(error.message || t('products.errors.status'))
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!user?.team_id) return
    if (!confirm(t('products.confirmDelete'))) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('team_id', user.team_id)

    if (error) {
      toast.error(error.message || t('products.errors.delete'))
      return
    }

    setProducts((prev) => prev.filter((product) => product.id !== productId))
    toast.success(t('products.success.deleted'))
  }

  if (!authLoading && (!authUser || !user?.team_id)) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          {t('products.title')}
        </h1>
        <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b] p-6">
          <p className="text-sm text-[#48679d]">{t('products.errors.noTeam')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
            {t('products.title')}
          </h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">{t('products.subtitle')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t('products.actions.new')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">inventory_2</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.total}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">{t('products.stats.total')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.active}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">{t('products.stats.active')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">category</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.categories}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">{t('products.stats.categories')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">payments</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.currencies}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">{t('products.stats.currencies')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-[#48679d] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#e7ebf4] dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(event) => setShowOnlyActive(event.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-[#48679d] dark:text-gray-300">{t('products.filters.activeOnly')}</span>
          </label>

          <div className="flex-1" />

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              {t('products.view.grid')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">list</span>
              {t('products.view.list')}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">inventory_2</span>
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-2">{t('products.loadingTitle')}</h3>
          <p className="text-[#48679d] dark:text-gray-400">{t('products.loadingSubtitle')}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">inventory_2</span>
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-2">{t('products.emptyTitle')}</h3>
          <p className="text-[#48679d] dark:text-gray-400 mb-4">{t('products.emptySubtitle')}</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t('products.actions.add')}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const categoryInfo = getCategoryMeta(product.category, categoryMap, t)
            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all group ${
                  !product.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-lg">{categoryInfo.icon}</span>
                      </div>
                      <span className="text-xs font-medium text-[#48679d] dark:text-gray-400">{categoryInfo.name}</span>
                    </div>
                    {!product.isActive && (
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                        {t('products.status.inactive')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[#0d121c] dark:text-white mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-[#48679d] dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-extrabold text-primary">
                        {formatNumber(product.price, {
                          style: 'currency',
                          currency: product.currency ?? 'TRY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {product.currency}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#48679d] dark:text-gray-400">{t('products.updatedAt')}</p>
                      <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                        {new Date(product.updatedAt).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-[#48679d] dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product)}
                    className={`p-2 rounded-lg transition-colors ${
                      product.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={product.isActive ? t('products.actions.deactivate') : t('products.actions.activate')}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {product.isActive ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    title={t('common.delete')}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#e7ebf4] dark:border-gray-700">
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">
                  {t('products.table.name')}
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">
                  {t('products.table.category')}
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">
                  {t('products.table.price')}
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">
                  {t('products.table.currency')}
                </th>
                <th className="text-center px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">
                  {t('products.table.status')}
                </th>
                <th className="text-right px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">
                  {t('products.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
              {filteredProducts.map((product) => {
                const categoryInfo = getCategoryMeta(product.category, categoryMap, t)
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      !product.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary">{categoryInfo.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0d121c] dark:text-white truncate">{product.name}</p>
                          <p className="text-sm text-[#48679d] dark:text-gray-400 truncate max-w-xs">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#0d121c] dark:text-white">{categoryInfo.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">
                        {formatNumber(product.price, {
                          style: 'currency',
                          currency: product.currency ?? 'TRY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#48679d] dark:text-gray-300">{product.currency}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                        ></span>
                        {product.isActive ? t('products.status.active') : t('products.status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => toggleProductStatus(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isActive
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={product.isActive ? t('products.actions.deactivate') : t('products.actions.activate')}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {product.isActive ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">
                {editingProduct ? t('products.modal.editTitle') : t('products.modal.newTitle')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('products.form.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={t('products.form.namePlaceholder')}
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('products.form.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={t('products.form.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                    {t('products.form.price')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                    {t('products.form.currency')}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(event) => setFormData((prev) => ({ ...prev, currency: event.target.value }))}
                    className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('products.form.category')}
                </label>
                <input
                  list="category-options"
                  value={formData.category}
                  onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder={t('products.form.categoryPlaceholder')}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <datalist id="category-options">
                  {categories
                    .filter((category) => category.id !== 'all' && category.id !== 'uncategorized')
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </datalist>
                <p className="text-xs text-[#48679d] mt-2">{t('products.form.categoryHint')}</p>
              </div>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                  <div>
                    <p className="font-medium text-[#0d121c] dark:text-white">{t('products.status.active')}</p>
                    <p className="text-xs text-[#48679d] dark:text-gray-400">{t('products.form.activeHint')}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf4] dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[#48679d] hover:text-[#0d121c] dark:hover:text-white font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70"
                >
                  {isSaving
                    ? t('products.actions.saving')
                    : editingProduct
                      ? t('products.actions.update')
                      : t('products.actions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
