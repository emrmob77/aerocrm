'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSupabase } from '@/hooks/use-supabase'
import { useI18n } from '@/lib/i18n'
import type { Json } from '@/types/database'
import { getCustomFields, normalizeTagInput, parseContactTags } from './contact-utils'

type ContactTagsEditorProps = {
  contactId: string
  initialCustomFields?: unknown
}

export function ContactTagsEditor({ contactId, initialCustomFields }: ContactTagsEditorProps) {
  const supabase = useSupabase()
  const { t } = useI18n()
  const [customFields, setCustomFields] = useState<Record<string, unknown> | null>(
    getCustomFields(initialCustomFields) ?? null
  )
  const [tags, setTags] = useState<string[]>(parseContactTags(customFields))
  const [isEditing, setIsEditing] = useState(false)
  const [input, setInput] = useState(tags.join(', '))
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = () => {
    setInput(tags.join(', '))
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setInput(tags.join(', '))
    setIsEditing(false)
  }

  const saveTags = async () => {
    const nextTags = normalizeTagInput(input)
    setIsSaving(true)
    try {
      const baseFields = getCustomFields(customFields) ?? {}
      const nextFields: Record<string, unknown> = { ...baseFields }
      if (nextTags.length > 0) {
        nextFields.tags = nextTags
      } else {
        delete nextFields.tags
      }
      const payload: Json | null = Object.keys(nextFields).length > 0 ? (nextFields as Json) : null
      const { error } = await supabase.from('contacts').update({ custom_fields: payload }).eq('id', contactId)
      if (error) {
        throw error
      }
      setCustomFields(nextFields)
      setTags(nextTags)
      setIsEditing(false)
      toast.success(t('contacts.tags.success'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('contacts.tags.errors.failed')
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#0d121c] dark:text-white">{t('contacts.tags.sectionTitle')}</h3>
        {!isEditing ? (
          <button
            onClick={startEdit}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('contacts.tags.edit')}
          </button>
        ) : null}
      </div>

      {!isEditing && (
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm text-[#48679d] dark:text-gray-400">{t('contacts.tags.emptyState')}</span>
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))
          )}
        </div>
      )}

      {isEditing && (
        <div className="space-y-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('contacts.tags.placeholder')}
            className="w-full rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-[#0d121c] dark:text-white"
          />
          <p className="text-xs text-[#48679d] dark:text-gray-400">{t('contacts.tags.helper')}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={saveTags}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {t('contacts.tags.save')}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[#48679d] hover:text-primary"
            >
              {t('contacts.tags.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
