'use client'

import { useState, useMemo } from 'react'

// Kategoriler
const categories = [
  { id: 'all', name: 'Tümü', icon: 'apps' },
  { id: 'software', name: 'Yazılım', icon: 'code' },
  { id: 'service', name: 'Hizmet', icon: 'support_agent' },
  { id: 'consulting', name: 'Danışmanlık', icon: 'psychology' },
  { id: 'marketing', name: 'Pazarlama', icon: 'campaign' },
  { id: 'design', name: 'Tasarım', icon: 'palette' },
  { id: 'training', name: 'Eğitim', icon: 'school' },
]

// Fiyat tipleri
type PriceType = 'one_time' | 'monthly' | 'yearly'

interface Product {
  id: string
  name: string
  description: string
  price: number
  priceType: PriceType
  category: string
  isActive: boolean
  isTemplate: boolean
  image?: string
  createdAt: string
  usageCount: number
}

// Örnek ürünler
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'CRM Pro Lisansı',
    description: 'Tam özellikli CRM yazılım lisansı. Sınırsız kullanıcı, bulut depolama ve API erişimi dahil.',
    price: 2500,
    priceType: 'monthly',
    category: 'software',
    isActive: true,
    isTemplate: true,
    createdAt: '2025-01-15',
    usageCount: 45,
  },
  {
    id: '2',
    name: 'Web Sitesi Geliştirme',
    description: 'Kurumsal web sitesi tasarımı ve geliştirmesi. Responsive tasarım, SEO optimizasyonu dahil.',
    price: 35000,
    priceType: 'one_time',
    category: 'software',
    isActive: true,
    isTemplate: true,
    createdAt: '2025-01-10',
    usageCount: 28,
  },
  {
    id: '3',
    name: 'SEO Danışmanlığı',
    description: 'Aylık SEO analizi, keyword araştırması ve optimizasyon önerileri.',
    price: 5000,
    priceType: 'monthly',
    category: 'marketing',
    isActive: true,
    isTemplate: true,
    createdAt: '2025-01-08',
    usageCount: 67,
  },
  {
    id: '4',
    name: 'Sosyal Medya Yönetimi',
    description: 'Haftalık içerik planlaması, gönderi tasarımı ve topluluk yönetimi.',
    price: 8000,
    priceType: 'monthly',
    category: 'marketing',
    isActive: true,
    isTemplate: false,
    createdAt: '2025-01-05',
    usageCount: 34,
  },
  {
    id: '5',
    name: 'UI/UX Tasarım Paketi',
    description: 'Kullanıcı arayüzü tasarımı, prototip oluşturma ve kullanıcı deneyimi analizi.',
    price: 25000,
    priceType: 'one_time',
    category: 'design',
    isActive: true,
    isTemplate: true,
    createdAt: '2025-01-03',
    usageCount: 19,
  },
  {
    id: '6',
    name: 'Kurumsal Eğitim Programı',
    description: 'Özelleştirilmiş kurumsal eğitim. Yazılım kullanımı, süreç optimizasyonu konularında.',
    price: 15000,
    priceType: 'one_time',
    category: 'training',
    isActive: true,
    isTemplate: true,
    createdAt: '2025-01-01',
    usageCount: 12,
  },
  {
    id: '7',
    name: 'İş Analizi ve Danışmanlık',
    description: 'Süreç analizi, iş modellemesi ve dijital dönüşüm danışmanlığı.',
    price: 12000,
    priceType: 'one_time',
    category: 'consulting',
    isActive: true,
    isTemplate: false,
    createdAt: '2024-12-28',
    usageCount: 8,
  },
  {
    id: '8',
    name: 'Teknik Destek Paketi',
    description: '7/24 teknik destek hizmeti. Öncelikli yanıt ve uzaktan erişim dahil.',
    price: 3500,
    priceType: 'monthly',
    category: 'service',
    isActive: false,
    isTemplate: false,
    createdAt: '2024-12-20',
    usageCount: 23,
  },
  {
    id: '9',
    name: 'API Entegrasyon Hizmeti',
    description: 'Özel API geliştirme ve mevcut sistemlerle entegrasyon.',
    price: 45000,
    priceType: 'one_time',
    category: 'software',
    isActive: true,
    isTemplate: true,
    createdAt: '2024-12-15',
    usageCount: 15,
  },
  {
    id: '10',
    name: 'Yıllık Bakım Sözleşmesi',
    description: 'Yazılım güncellemeleri, güvenlik yamaları ve performans optimizasyonu.',
    price: 24000,
    priceType: 'yearly',
    category: 'service',
    isActive: true,
    isTemplate: true,
    createdAt: '2024-12-10',
    usageCount: 31,
  },
]

const priceTypeLabels: Record<PriceType, string> = {
  one_time: 'Tek Seferlik',
  monthly: 'Aylık',
  yearly: 'Yıllık',
}

const priceTypeColors: Record<PriceType, string> = {
  one_time: 'bg-blue-100 text-blue-700',
  monthly: 'bg-green-100 text-green-700',
  yearly: 'bg-purple-100 text-purple-700',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyTemplates, setShowOnlyTemplates] = useState(false)
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    priceType: 'one_time' as PriceType,
    category: 'software',
    isActive: true,
    isTemplate: false,
  })

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTemplate = !showOnlyTemplates || product.isTemplate
      const matchesActive = !showOnlyActive || product.isActive
      return matchesCategory && matchesSearch && matchesTemplate && matchesActive
    })
  }, [products, selectedCategory, searchQuery, showOnlyTemplates, showOnlyActive])

  // İstatistikler
  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      templates: products.filter(p => p.isTemplate).length,
      totalUsage: products.reduce((sum, p) => sum + p.usageCount, 0),
    }
  }, [products])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value)
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      priceType: 'one_time',
      category: 'software',
      isActive: true,
      isTemplate: false,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      priceType: product.priceType,
      category: product.category,
      isActive: product.isActive,
      isTemplate: product.isTemplate,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProduct) {
      // Güncelleme
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...formData, price: parseFloat(formData.price) || 0 }
          : p
      ))
    } else {
      // Yeni ürün
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        priceType: formData.priceType,
        category: formData.category,
        isActive: formData.isActive,
        isTemplate: formData.isTemplate,
        createdAt: new Date().toISOString().split('T')[0],
        usageCount: 0,
      }
      setProducts(prev => [newProduct, ...prev])
    }
    setIsModalOpen(false)
  }

  const toggleProductStatus = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isActive: !p.isActive } : p
    ))
  }

  const deleteProduct = (productId: string) => {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      setProducts(prev => prev.filter(p => p.id !== productId))
    }
  }

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Ürün & Hizmetler</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">Satılabilir ürün ve hizmetlerinizi yönetin</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Yeni Ürün/Hizmet
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">inventory_2</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.total}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">Toplam Ürün</p>
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
              <p className="text-xs text-[#48679d] dark:text-gray-400">Aktif Ürün</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">auto_awesome</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.templates}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">Şablon</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">bar_chart</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{stats.totalUsage}</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">Toplam Kullanım</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Ürün veya hizmet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
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

        {/* Additional Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#e7ebf4] dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyTemplates}
              onChange={(e) => setShowOnlyTemplates(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-[#48679d] dark:text-gray-300">Sadece Şablonlar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-[#48679d] dark:text-gray-300">Sadece Aktifler</span>
          </label>

          <div className="flex-1" />

          {/* View Toggle */}
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
              Kart
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
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">inventory_2</span>
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-2">Ürün Bulunamadı</h3>
          <p className="text-[#48679d] dark:text-gray-400 mb-4">Arama kriterlerinize uygun ürün bulunmuyor.</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Yeni Ürün Ekle
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const categoryInfo = getCategoryInfo(product.category)
            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all group ${
                  !product.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-lg">{categoryInfo.icon}</span>
                      </div>
                      <span className="text-xs font-medium text-[#48679d] dark:text-gray-400">{categoryInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {product.isTemplate && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                          Şablon
                        </span>
                      )}
                      {!product.isActive && (
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                          Pasif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="font-bold text-[#0d121c] dark:text-white mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-[#48679d] dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl font-extrabold text-primary">{formatCurrency(product.price)}</p>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${priceTypeColors[product.priceType]}`}>
                        {priceTypeLabels[product.priceType]}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0d121c] dark:text-white">{product.usageCount}</p>
                      <p className="text-xs text-[#48679d] dark:text-gray-400">kullanım</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-[#48679d] dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Düzenle
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      product.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={product.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {product.isActive ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    title="Sil"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#e7ebf4] dark:border-gray-700">
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">Ürün/Hizmet</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">Fiyat</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">Tip</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">Kullanım</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
              {filteredProducts.map(product => {
                const categoryInfo = getCategoryInfo(product.category)
                return (
                  <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!product.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary">{categoryInfo.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0d121c] dark:text-white truncate">{product.name}</p>
                          <p className="text-sm text-[#48679d] dark:text-gray-400 truncate max-w-xs">{product.description}</p>
                        </div>
                        {product.isTemplate && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full flex-shrink-0">
                            Şablon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#0d121c] dark:text-white">{categoryInfo.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${priceTypeColors[product.priceType]}`}>
                        {priceTypeLabels[product.priceType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-[#0d121c] dark:text-white">{product.usageCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isActive
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={product.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {product.isActive ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#161e2b] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">
                {editingProduct ? 'Ürün/Hizmet Düzenle' : 'Yeni Ürün/Hizmet'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Ürün/Hizmet Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: CRM Pro Lisansı"
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ürün veya hizmet açıklaması..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>

              {/* Price and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                    Fiyat (₺) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                    Fiyat Tipi
                  </label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value as PriceType }))}
                    className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    <option value="one_time">Tek Seferlik</option>
                    <option value="monthly">Aylık</option>
                    <option value="yearly">Yıllık</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {categories.filter(c => c.id !== 'all').map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <div>
                      <p className="font-medium text-[#0d121c] dark:text-white">Aktif</p>
                      <p className="text-xs text-[#48679d] dark:text-gray-400">Bu ürün/hizmet satışa açık</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-600">auto_awesome</span>
                    <div>
                      <p className="font-medium text-[#0d121c] dark:text-white">Şablon Olarak Kullan</p>
                      <p className="text-xs text-[#48679d] dark:text-gray-400">Tekliflerde hızlı seçim için şablon</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf4] dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[#48679d] hover:text-[#0d121c] dark:hover:text-white font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  {editingProduct ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
