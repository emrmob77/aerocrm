'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, getStageConfigs } from '@/components/deals'

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
  const { t, locale } = useI18n()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const currencyCode = locale === 'en' ? 'USD' : 'TRY'
  const currencySymbol = locale === 'en' ? '$' : '₺'
  const stageOptions = useMemo(() => getStageConfigs(t), [t])
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
        const [contactsResult, membersResult] = await Promise.all([
          supabase
            .from('contacts')
            .select('id, full_name, company, email')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false }),
          fetch('/api/team/members', { cache: 'no-store' })
            .then((response) => response.json().catch(() => null))
            .catch(() => null),
        ])

        setContacts(
          (contactsResult.data ?? []).map((contact) => ({
            id: contact.id,
            name: contact.full_name,
            company: contact.company,
            email: contact.email,
          }))
        )

        const apiMembers = (membersResult?.members ?? []) as Array<{
          id: string
          full_name: string
          avatar_url: string | null
        }>
        const mappedMembers = apiMembers.map((member) => ({
          id: member.id,
          name: member.full_name,
          avatar: member.avatar_url,
        }))
        if (mappedMembers.length > 0) {
          setTeamMembers(mappedMembers)
        } else {
          setTeamMembers([
            {
              id: user.id,
              name: profile?.full_name ?? user.email ?? t('header.userFallback'),
              avatar: null,
            },
          ])
        }
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
            name: profile?.full_name ?? user.email ?? t('header.userFallback'),
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
  }, [supabase, t])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!formData.contactId) {
      toast.error(t('deals.new.toasts.contactRequired'))
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
        toast.error(payload?.error || t('deals.new.toasts.createError'))
        setIsSubmitting(false)
        return
      }

      toast.success(t('deals.new.toasts.created'))
      router.push('/deals')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deals.new.toasts.createError'))
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
            {t('deals.new.back')}
          </Link>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('deals.new.title')}</h1>
        <p className="text-[#48679d] dark:text-gray-400 mt-1">{t('deals.new.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              {t('deals.new.sections.basic')}
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('deals.new.fields.title')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('deals.new.placeholders.title')}
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('deals.new.fields.company')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder={t('deals.new.placeholders.company')}
                  required
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('deals.new.fields.contact')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading || contacts.length === 0}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white disabled:opacity-60"
                >
                  <option value="">{isLoading ? t('common.loading') : t('deals.new.placeholders.contact')}</option>
                  {!isLoading && contacts.length === 0 && (
                    <option value="" disabled>
                      {t('deals.new.emptyContacts')}
                    </option>
                  )}
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} - {contact.company ?? t('deals.new.companyFallback')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('deals.new.fields.stage')} <span className="text-red-500">*</span>
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
                  {t('deals.new.fields.owner')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="ownerId"
                  value={formData.ownerId}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading || teamMembers.length === 0}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white disabled:opacity-60"
                >
                  {isLoading && <option value="">{t('common.loading')}</option>}
                  {!isLoading && teamMembers.length === 0 && <option value="">{t('deals.new.ownerEmpty')}</option>}
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Close Date */}
              <div>
                <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                  {t('deals.new.fields.closeDate')}
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
                  {t('deals.new.fields.source')}
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                >
                  <option value="">{t('deals.new.placeholders.source')}</option>
                  <option value="website">{t('deals.new.sources.website')}</option>
                  <option value="referral">{t('deals.new.sources.referral')}</option>
                  <option value="linkedin">{t('deals.new.sources.linkedin')}</option>
                  <option value="cold_call">{t('deals.new.sources.coldCall')}</option>
                  <option value="event">{t('deals.new.sources.event')}</option>
                  <option value="other">{t('deals.new.sources.other')}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                {t('deals.new.fields.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder={t('deals.new.placeholders.description')}
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
              {t('deals.new.products.title')}
            </h2>
            <button
              type="button"
              onClick={addProduct}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {t('deals.new.products.add')}
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-[#48679d] uppercase tracking-wider px-2">
                <div className="col-span-5">{t('deals.new.products.table.name')}</div>
                <div className="col-span-2 text-center">{t('deals.new.products.table.quantity')}</div>
                <div className="col-span-3 text-right">{t('deals.new.products.table.unitPrice')}</div>
                <div className="col-span-2 text-right">{t('deals.new.products.table.total')}</div>
              </div>

              {/* Product Rows */}
              {products.map((product, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="md:col-span-5">
                    <label className="md:hidden text-xs font-bold text-[#48679d] mb-1 block">{t('deals.new.products.table.name')}</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      placeholder={t('deals.new.products.placeholders.name')}
                      className="w-full px-3 py-2 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs font-bold text-[#48679d] mb-1 block">{t('deals.new.products.table.quantity')}</label>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="md:hidden text-xs font-bold text-[#48679d] mb-1 block">{t('deals.new.products.table.unitPrice')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
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
                      {formatCurrency((parseFloat(product.unitPrice) || 0) * product.quantity, formatLocale, currencyCode)}
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
                <p className="text-sm text-[#48679d] mb-1">{t('deals.new.products.totalLabel')}</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrency(calculateTotal(), formatLocale, currencyCode)}</p>
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
            {t('common.cancel')}
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-[#e7ebf4] dark:border-gray-700 text-[#0d121c] dark:text-white rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('deals.new.actions.saveDraft')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || contacts.length === 0}
              className="px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {isSubmitting ? t('common.saving') : t('deals.new.actions.create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
