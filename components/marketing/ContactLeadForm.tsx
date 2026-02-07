'use client'

import { FormEvent, useMemo, useState } from 'react'
import { trackMarketingEvent } from '@/lib/analytics/marketing-events'

type Props = {
  locale: 'tr' | 'en'
}

type FormState = {
  fullName: string
  email: string
  company: string
  message: string
  website: string
}

const initialState: FormState = {
  fullName: '',
  email: '',
  company: '',
  message: '',
  website: '',
}

export function ContactLeadForm({ locale }: Props) {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const copy = useMemo(
    () =>
      locale === 'tr'
        ? {
            title: 'Kısa form',
            subtitle: 'Formu gönderin, satış ekibimiz kısa sürede dönüş yapsın.',
            fullName: 'Ad Soyad',
            email: 'Şirket e-postası',
            company: 'Şirket adı',
            message: 'Kısaca ihtiyacınızı yazın',
            submit: 'Mesajı Gönder',
            submitting: 'Gönderiliyor...',
            success: 'Mesajınız alındı. Ekibimiz sizinle kısa sürede iletişime geçecek.',
            genericError: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
            validationError: 'Lütfen zorunlu alanları doldurun.',
          }
        : {
            title: 'Quick form',
            subtitle: 'Submit the form and our sales team will follow up shortly.',
            fullName: 'Full name',
            email: 'Work email',
            company: 'Company name',
            message: 'Tell us briefly what you need',
            submit: 'Send Message',
            submitting: 'Sending...',
            success: 'Your message has been received. Our team will contact you soon.',
            genericError: 'Could not send your message. Please try again.',
            validationError: 'Please complete required fields.',
          },
    [locale]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setError(copy.validationError)
      return
    }

    setSubmitting(true)
    trackMarketingEvent({ path: '/funnel/flow/contact_submit_start', method: 'FUNNEL_FLOW' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || copy.genericError)
      }

      setSuccess(copy.success)
      setForm(initialState)
      trackMarketingEvent({ path: '/funnel/flow/contact_submit_success', method: 'FUNNEL_FLOW' })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : copy.genericError
      setError(message)
      trackMarketingEvent({ path: '/funnel/flow/contact_submit_error', method: 'FUNNEL_FLOW' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-aero-slate-200 bg-white p-6">
      <h2 className="text-xl font-black text-aero-slate-900">{copy.title}</h2>
      <p className="mt-2 text-sm text-aero-slate-600">{copy.subtitle}</p>

      <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder={copy.fullName}
          value={form.fullName}
          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          required
          maxLength={120}
        />
        <input
          className="input"
          placeholder={copy.email}
          value={form.email}
          type="email"
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
          maxLength={160}
        />
        <input
          className="input md:col-span-2"
          placeholder={copy.company}
          value={form.company}
          onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
          maxLength={160}
        />
        <textarea
          className="input md:col-span-2 min-h-[120px]"
          placeholder={copy.message}
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          required
          maxLength={2000}
        />

        <input
          aria-hidden
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          name="website"
          value={form.website}
          onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
        />

        {error ? <p className="md:col-span-2 text-sm text-aero-red-600">{error}</p> : null}
        {success ? <p className="md:col-span-2 text-sm text-aero-green-700">{success}</p> : null}

        <button
          type="submit"
          data-funnel-event="contact_form_submit"
          className="btn btn-primary btn-md md:col-span-2"
          disabled={submitting}
        >
          {submitting ? copy.submitting : copy.submit}
        </button>
      </form>
    </section>
  )
}
