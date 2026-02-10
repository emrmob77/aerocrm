'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSupabase } from '@/hooks/use-supabase'
import type { Json } from '@/types/database'
import { useUser } from '@/hooks'
import { useI18n } from '@/lib/i18n'
import { getCustomFields, normalizeTagInput, parseContactTags } from '@/components/contacts/contact-utils'

type ContactFormData = {
  full_name: string
  email: string
  phone: string
  company: string
  position: string
  address: string
  tags: string
}

type ContactFormProps = {
  mode: 'create' | 'edit'
  contactId?: string
  initialData?: Partial<ContactFormData>
  initialCustomFields?: unknown
}

export function ContactForm({ mode, contactId, initialData, initialCustomFields }: ContactFormProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const { t } = useI18n()
  const { user: profile, authUser, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    full_name: initialData?.full_name ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    company: initialData?.company ?? '',
    position: initialData?.position ?? '',
    address: initialData?.address ?? '',
    tags: initialData?.tags ?? parseContactTags(initialCustomFields).join(', '),
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (userLoading) {
      toast.error(t('contacts.form.loadingUser'))
      return
    }

    if (!authUser?.id) {
      toast.error(t('contacts.form.noSession'))
      return
    }

    if (!formData.full_name.trim()) {
      toast.error(t('contacts.form.nameRequired'))
      return
    }

    setLoading(true)
    try {
      const contactsTable = supabase.from('contacts')
      const tagValues = normalizeTagInput(formData.tags)
      const baseCustomFields = getCustomFields(initialCustomFields) ?? {}
      const nextCustomFields: Record<string, unknown> = { ...baseCustomFields }
      if (tagValues.length > 0) {
        nextCustomFields.tags = tagValues
      } else {
        delete nextCustomFields.tags
      }
      const customFieldsPayload: Json | null =
        Object.keys(nextCustomFields).length > 0 ? (nextCustomFields as Json) : null
      if (mode === 'create') {
        if (!profile?.team_id) {
          toast.error(t('contacts.form.teamMissing'))
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
            custom_fields: customFieldsPayload,
          })
          .select('id')
          .single()

        if (error || !data) {
          console.error('Create contact error:', error)
          toast.error(error?.message || t('contacts.form.createError'))
          return
        }

        toast.success(t('contacts.form.created'))
        router.push(`/contacts/${data.id}`)
        return
      }

      if (!contactId) {
        toast.error(t('contacts.form.contactMissing'))
        return
      }

      let updateQuery = contactsTable
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          position: formData.position.trim() || null,
          address: formData.address.trim() || null,
          custom_fields: customFieldsPayload,
        })
        .eq('id', contactId)

      if (profile?.team_id) {
        updateQuery = updateQuery.eq('team_id', profile.team_id)
      } else {
        updateQuery = updateQuery.eq('user_id', authUser.id)
      }

      const { data: updatedContact, error } = await updateQuery.select('id').maybeSingle()

      if (error || !updatedContact?.id) {
        console.error('Update contact error:', error)
        toast.error(error?.message || t('contacts.form.updateError'))
        return
      }

      toast.success(t('contacts.form.updated'))
      router.push(`/contacts/${updatedContact.id}`)
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
            {t('contacts.form.back')}
          </Link>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          {mode === 'create' ? t('contacts.form.createTitle') : t('contacts.form.editTitle')}
        </h1>
        <p className="text-[#48679d] dark:text-gray-400 mt-1">
          {mode === 'create' ? t('contacts.form.createSubtitle') : t('contacts.form.editSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              {t('contacts.form.sections.basics')}
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                {t('contacts.form.fields.fullName')} <span className="text-red-500">*</span>
              </label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder={t('contacts.form.placeholders.fullName')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">{t('contacts.form.fields.company')}</label>
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder={t('contacts.form.placeholders.company')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">{t('contacts.form.fields.position')}</label>
              <input
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder={t('contacts.form.placeholders.position')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">{t('contacts.form.fields.tags')}</label>
              <input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder={t('contacts.form.placeholders.tags')}
              />
              <p className="text-xs text-[#48679d] dark:text-gray-400 mt-2">{t('contacts.form.helpers.tags')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contact_mail</span>
              {t('contacts.form.sections.contact')}
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">{t('contacts.form.fields.email')}</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder={t('contacts.form.placeholders.email')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">{t('contacts.form.fields.phone')}</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                placeholder={t('contacts.form.placeholders.phone')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">{t('contacts.form.fields.address')}</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white min-h-[100px]"
                placeholder={t('contacts.form.placeholders.address')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/contacts" className="px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg text-sm font-semibold text-[#48679d] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading || userLoading}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-70"
          >
            {loading || userLoading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
