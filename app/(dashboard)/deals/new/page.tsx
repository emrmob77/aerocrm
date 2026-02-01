'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getSupabaseClient } from '@/lib/supabase/client'

// Stage options
const stageOptions = [
  { id: 'lead', label: 'Aday' },
  { id: 'proposal', label: 'Teklif Gönderildi' },
  { id: 'negotiation', label: 'Görüşme' },
  { id: 'won', label: 'Kazanıldı' },
  { id: 'lost', label: 'Kaybedildi' },
]

type ContactOption = {
  id: string
  name: string
  company: string | null
  email: string | null
}

type TeamMemberOption = {
  id: string
  name: string
  avatar: string | null
}

export default function NewDealPage() {
  const router = useRouter()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('team_id, full_name')
        .eq('id', user.id)
        .maybeSingle()

      const teamId = profile?.team_id ?? null

      if (teamId) {
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('id, full_name, company, email')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })

        setContacts(
          (contactsData ?? []).map((contact) => ({
            id: contact.id,
            name: contact.full_name,
            company: contact.company,
            email: contact.email,
          }))
        )

        const { data: membersData } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('team_id', teamId)
          .order('full_name', { ascending: true })

        const mappedMembers = (membersData ?? []).map((member) => ({
          id: member.id,
          name: member.full_name,
          avatar: member.avatar_url,
        }))
        setTeamMembers(mappedMembers)
      } else {
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('id, full_name, company, email')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        setContacts(
          (contactsData ?? []).map((contact) => ({
            id: contact.id,
            name: contact.full_name,
            company: contact.company,
            email: contact.email,
          }))
        )

        setTeamMembers([
          {
            id: user.id,
            name: profile?.full_name ?? user.email ?? 'Kullanıcı',
            avatar: null,
          },
        ])
      }

      setFormData((prev) => ({
        ...prev,
        ownerId: user.id,
      }))
      setIsLoading(false)
    }

    load()
  }, [supabase])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!formData.contactId) {
      toast.error('İlgili kişi seçilmelidir.')
      return
    }

    const totalValue = calculateTotal()
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          value: totalValue,
          stage: formData.stage,
          contactId: formData.contactId,
          ownerId: formData.ownerId,
          expectedCloseDate: formData.closeDate || null,
          notes: formData.description || null,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error(payload?.error || 'Anlaşma oluşturulamadı.')
        setIsSubmitting(false)
        return
      }

      toast.success('Anlaşma oluşturuldu.')
      router.push('/deals')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Anlaşma oluşturulamadı.')
    } finally {
      setIsSubmitting(false)
    }
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
                  İlgili Kişi <span className="text-red-500">*</span>
                </label>
                <select
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading || contacts.length === 0}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white disabled:opacity-60"
                >
                  <option value="">{isLoading ? 'Yükleniyor...' : 'Kişi seçin...'}</option>
                  {!isLoading && contacts.length === 0 && (
                    <option value="" disabled>
                      Henüz kişi yok
                    </option>
                  )}
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} - {contact.company ?? 'Şirket yok'}
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
                  disabled={isLoading || teamMembers.length === 0}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white disabled:opacity-60"
                >
                  {isLoading && <option value="">Yükleniyor...</option>}
                  {!isLoading && teamMembers.length === 0 && <option value="">Kullanıcı bulunamadı</option>}
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
              disabled={isSubmitting || isLoading || contacts.length === 0}
              className="px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {isSubmitting ? 'Kaydediliyor' : 'Anlaşma Oluştur'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
