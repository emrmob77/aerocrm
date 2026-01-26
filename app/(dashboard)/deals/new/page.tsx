'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Stage options
const stageOptions = [
  { id: 'lead', label: 'Aday' },
  { id: 'proposal', label: 'Teklif Gönderildi' },
  { id: 'negotiation', label: 'Görüşme' },
  { id: 'won', label: 'Kazanıldı' },
  { id: 'lost', label: 'Kaybedildi' },
]

// Sample contacts for dropdown
const contacts = [
  { id: '1', name: 'Ahmet Yılmaz', company: 'ABC Şirketi', email: 'ahmet@abc.com' },
  { id: '2', name: 'Mehmet Akın', company: 'Yıldız Holding', email: 'mehmet@yildiz.com' },
  { id: '3', name: 'Ayşe Kara', company: 'Global Lojistik', email: 'ayse@global.com' },
  { id: '4', name: 'Ali Öztürk', company: 'Mega İnşaat', email: 'ali@mega.com' },
]

// Sample team members
const teamMembers = [
  { id: '1', name: 'Ahmet Yılmaz', avatar: 'AY' },
  { id: '2', name: 'Caner Yılmaz', avatar: 'CY' },
  { id: '3', name: 'Elif Demir', avatar: 'ED' },
  { id: '4', name: 'Mert Kaya', avatar: 'MK' },
]

export default function NewDealPage() {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    value: '',
    stage: 'lead',
    contactId: '',
    ownerId: '1',
    closeDate: '',
    description: '',
    source: '',
  })

  const [products, setProducts] = useState([
    { name: '', quantity: 1, unitPrice: '' }
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProductChange = (index: number, field: string, value: string | number) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ))
  }

  const addProduct = () => {
    setProducts(prev => [...prev, { name: '', quantity: 1, unitPrice: '' }])
  }

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return products.reduce((sum, p) => {
      const price = parseFloat(p.unitPrice) || 0
      return sum + (price * p.quantity)
    }, 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send data to API
    console.log('Form submitted:', { ...formData, products })
    router.push('/deals')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/deals" className="flex items-center text-primary text-sm font-semibold hover:underline">
            <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
            Anlaşmalara Dön
          </Link>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Yeni Anlaşma Oluştur</h1>
        <p className="text-[#48679d] dark:text-gray-400 mt-1">Yeni bir satış fırsatı ekleyin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Temel Bilgiler
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Anlaşma Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Örn: Kurumsal CRM Lisansı"
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Şirket Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Şirket adı girin"
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  İlgili Kişi
                </label>
                <select
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                >
                  <option value="">Kişi seçin...</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} - {contact.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Aşama <span className="text-red-500">*</span>
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                >
                  {stageOptions.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Sorumlu <span className="text-red-500">*</span>
                </label>
                <select
                  name="ownerId"
                  value={formData.ownerId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                >
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Close Date */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Tahmini Kapanış Tarihi
                </label>
                <input
                  type="date"
                  name="closeDate"
                  value={formData.closeDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  Kaynak
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                >
                  <option value="">Kaynak seçin...</option>
                  <option value="website">Web Sitesi</option>
                  <option value="referral">Referans</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="cold_call">Soğuk Arama</option>
                  <option value="event">Etkinlik</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Anlaşma hakkında notlar..."
                className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_cart</span>
              Ürün / Hizmetler
            </h2>
            <button
              type="button"
              onClick={addProduct}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Ürün Ekle
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-[#48679d] uppercase tracking-wider px-2">
                <div className="col-span-5">Ürün / Hizmet Adı</div>
                <div className="col-span-2 text-center">Adet</div>
                <div className="col-span-3 text-right">Birim Fiyat</div>
                <div className="col-span-2 text-right">Toplam</div>
              </div>

              {/* Product Rows */}
              {products.map((product, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="md:col-span-5">
                    <label className="md:hidden text-xs font-bold text-[#48679d] mb-1 block">Ürün / Hizmet</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      placeholder="Ürün veya hizmet adı"
                      className="w-full px-3 py-2 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs font-bold text-[#48679d] mb-1 block">Adet</label>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="md:hidden text-xs font-bold text-[#48679d] mb-1 block">Birim Fiyat</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₺</span>
                      <input
                        type="number"
                        min="0"
                        value={product.unitPrice}
                        onChange={(e) => handleProductChange(index, 'unitPrice', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm text-right focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                    <span className="font-bold text-[#0d121c] dark:text-white">
                      {formatCurrency((parseFloat(product.unitPrice) || 0) * product.quantity)}
                    </span>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-[#e7ebf4] dark:border-gray-800 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-[#48679d] mb-1">Toplam Değer</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/deals"
            className="px-6 py-3 text-[#48679d] hover:text-[#0d121c] dark:hover:text-white font-bold transition-colors"
          >
            İptal
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-[#e7ebf4] dark:border-gray-700 text-[#0d121c] dark:text-white rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Taslak Olarak Kaydet
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Anlaşma Oluştur
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
