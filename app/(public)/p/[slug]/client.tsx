'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import SignatureCanvas from 'react-signature-canvas'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'

type CountdownTimerProps = {
  days: number
  hours: number
  minutes: number
  label?: string
}

const pad = (value: number) => value.toString().padStart(2, '0')

export function CountdownTimer({ days, hours, minutes, label }: CountdownTimerProps) {
  const { t } = useI18n()
  const totalSeconds = Math.max(0, (days * 24 * 60 + hours * 60 + minutes) * 60)
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [remaining])

  const segments = useMemo(() => {
    const totalMinutes = Math.floor(remaining / 60)
    const daysLeft = Math.floor(totalMinutes / (24 * 60))
    const hoursLeft = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutesLeft = totalMinutes % 60
    const secondsLeft = remaining % 60
    return {
      days: daysLeft,
      hours: hoursLeft,
      minutes: minutesLeft,
      seconds: secondsLeft,
    }
  }, [remaining])

  return (
    <div className="rounded-2xl border border-[#e7ebf4] bg-white px-5 py-4 shadow-sm">
      {label && <p className="text-xs font-semibold text-[#48679d] mb-3">{label}</p>}
      <div className="grid grid-cols-4 gap-3 text-center">
        {[
          { label: t('publicProposal.countdown.days'), value: segments.days },
          { label: t('publicProposal.countdown.hours'), value: segments.hours },
          { label: t('publicProposal.countdown.minutes'), value: segments.minutes },
          { label: t('publicProposal.countdown.seconds'), value: segments.seconds },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-[#f6f7fb] px-3 py-2">
            <p className="text-xl font-extrabold text-[#0d121c]">{pad(item.value)}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type SignatureBlockProps = {
  slug: string
  pdfUrl: string
  label: string
  required: boolean
  existingSignature?: {
    image?: string
    name?: string
    signedAt?: string
  }
}

export function SignatureBlock({ slug, pdfUrl, label, required, existingSignature }: SignatureBlockProps) {
  const { t, formatDate } = useI18n()
  const signatureRef = useRef<SignatureCanvas | null>(null)
  const [signerName, setSignerName] = useState(existingSignature?.name ?? '')
  const [signatureImage, setSignatureImage] = useState(existingSignature?.image ?? '')
  const [signedAt, setSignedAt] = useState(existingSignature?.signedAt ?? '')
  const [isSigning, setIsSigning] = useState(false)

  const hasSignature = Boolean(signatureImage)

  const clearSignature = () => {
    signatureRef.current?.clear()
  }

  const handleSign = async () => {
    if (isSigning) return
    if (!signerName.trim()) {
      toast.error(t('publicProposal.signature.errors.nameRequired'))
      return
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error(t('publicProposal.signature.errors.signatureRequired'))
      return
    }

    setIsSigning(true)
    try {
      const dataUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png')
      const response = await fetch('/api/proposals/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          signature: dataUrl,
          name: signerName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(t('publicProposal.signature.errors.saveFailed'))
      }

      const payload = await response.json().catch(() => null)
      const signedStamp = payload?.signedAt || new Date().toISOString()
      setSignatureImage(dataUrl)
      setSignedAt(signedStamp)
      toast.success(t('publicProposal.signature.success'))
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : t('publicProposal.signature.errors.saveFailed')
      toast.error(messageText)
    } finally {
      setIsSigning(false)
    }
  }

  const signedLabel =
    signedAt && !Number.isNaN(Date.parse(signedAt))
      ? formatDate(new Date(signedAt), { dateStyle: 'medium', timeStyle: 'short' })
      : signedAt

  return (
    <div className="rounded-2xl border border-[#e7ebf4] bg-white px-6 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#0d121c]">{label}</h3>
          <p className="text-xs text-gray-500">
            {required ? t('publicProposal.signature.requiredHint') : t('publicProposal.signature.optionalHint')}
          </p>
        </div>
        {hasSignature && (
          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
            {t('publicProposal.signature.signed')}
          </span>
        )}
      </div>

      {hasSignature ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4">
            <Image
              src={signatureImage}
              alt={t('publicProposal.signature.imageAlt')}
              width={420}
              height={120}
              className="max-h-28 w-auto"
              unoptimized
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="font-semibold text-[#0d121c]">{signerName}</span>
            {signedLabel && <span>• {signedLabel}</span>}
          </div>
          <a
            href={pdfUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e7ebf4] bg-white px-3 py-2 text-xs font-semibold text-[#0d121c] hover:border-primary/40 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            {t('publicProposal.signature.downloadPdf')}
          </a>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block text-xs font-semibold text-[#48679d]">{t('publicProposal.signature.nameLabel')}</label>
          <input
            value={signerName}
            onChange={(event) => setSignerName(event.target.value)}
            placeholder={t('publicProposal.signature.namePlaceholder')}
            className="w-full rounded-lg border border-[#e7ebf4] px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="rounded-xl border border-dashed border-[#e7ebf4] bg-[#f8fafc] p-3">
            <SignatureCanvas
              ref={signatureRef}
              penColor="#111827"
              canvasProps={{ className: 'h-40 w-full rounded-lg bg-white' }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={clearSignature}
              className="px-4 py-2 rounded-lg border border-[#e7ebf4] text-xs font-semibold text-gray-500 hover:border-primary/40 hover:text-primary"
            >
              {t('publicProposal.signature.clear')}
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={isSigning}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-70"
            >
              {isSigning ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">draw</span>
              )}
              {t('publicProposal.signature.sign')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProposalViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return
    fetch('/api/proposals/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {})
  }, [slug])

  return null
}
