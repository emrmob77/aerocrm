'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSupabase } from '@/hooks/use-supabase'
import { useUser } from '@/hooks'

type ContactFormData = {
  full_name: string
  email: string
  phone: string
  company: string
  position: string
  address: string
}

type ContactFormProps = {
  mode: 'create' | 'edit'
  contactId?: string
  initialData?: Partial<ContactFormData>
}

export function ContactForm({ mode, contactId, initialData }: ContactFormProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const { user: profile, authUser, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    full_name: initialData?.full_name ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    company: initialData?.company ?? '',
    position: initialData?.position ?? '',
    address: initialData?.address ?? '',
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (userLoading) {
      toast.error('Kullanıcı bilgileri yükleniyor')
      return
    }

    if (!authUser?.id) {
      toast.error('Oturum bulunamadı')
      return
    }

    if (!formData.full_name.trim()) {
      toast.error('Ad soyad alanı zorunlu')
      return
    }

    setLoading(true)
    try {
      const contactsTable = supabase.from('contacts')
      if (mode === 'create') {
        if (!profile?.team_id) {
          toast.error('Takım bilgisi bulunamadı')
          return
        }

        const { data, error } = await contactsTable
          .insert({
            full_name: formData.full_name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            company: formData.company.trim() || null,
            position: formData.position.trim() || null,
            address: formData.address.trim() || null,
            team_id: profile.team_id,
            user_id: authUser.id,
          })
          .select('id')
          .single()

        if (error || !data) {
          console.error('Create contact error:', error)
          toast.error(error?.message || 'Kişi oluşturulamadı')
          return
        }

        toast.success('Kişi oluşturuldu')
        router.push(`/contacts/${data.id}`)
        return
      }

      if (!contactId) {
        toast.error('Kişi bulunamadı')
        return
      }

      const { error } = await contactsTable
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          position: formData.position.trim() || null,
          address: formData.address.trim() || null,
        })
        .eq('id', contactId)

      if (error) {
        console.error('Update contact error:', error)
        toast.error(error.message || 'Kişi güncellenemedi')
        return
      }

      toast.success('Kişi güncellendi')
      router.push(`/contacts/${contactId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/contacts" className="flex items-center text-primary text-sm font-semibold hover:underline">
            <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
            Kişilere Dön
          </Link>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          {mode === 'create' ? 'Yeni Kişi Oluştur' : 'Kişiyi Düzenle'}
        </h1>
        <p className="text-[#48679d] dark:text-gray-400 mt-1">
          {mode === 'create' ? 'Yeni bir kişi ekleyin.' : 'Kişi bilgilerini güncelleyin.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Temel Bilgiler
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder="Örn: Ayşe Yıldız"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Şirket</label>
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder="Örn: Aero CRM"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Pozisyon</label>
              <input
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder="Örn: Satış Müdürü"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contact_mail</span>
              İletişim Bilgileri
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">E-posta</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder="ayse@ornek.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Telefon</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder="+90 5xx xxx xx xx"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Adres</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white min-h-[100px]"
                placeholder="Örn: Ataşehir, İstanbul"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/contacts" className="px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg text-sm font-semibold text-[#48679d] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Vazgeç
          </Link>
          <button
            type="submit"
            disabled={loading || userLoading}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-70"
          >
            {loading || userLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
