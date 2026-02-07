'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'

type ProposalActionsProps = {
  id: string
  publicUrl?: string | null
  mode?: 'active' | 'trash'
}

export function ProposalActions({ id, publicUrl, mode = 'active' }: ProposalActionsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [isBusy, setIsBusy] = useState(false)

  const handleCopy = async () => {
    if (!publicUrl) {
      toast.error(t('common.copyFailed'))
      return
    }
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  const handleMoveToTrash = async () => {
    if (isBusy) return
    if (!confirm(t('proposals.confirm.trash'))) return
    setIsBusy(true)

    try {
      const response = await fetch(`/api/proposals/${id}/trash`, { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        toast.error(payload?.error || t('proposals.toasts.trashFailed'))
        return
      }
      toast.success(t('proposals.toasts.trashed'))
      router.refresh()
    } catch {
      toast.error(t('proposals.toasts.trashFailed'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleRestore = async () => {
    if (isBusy) return
    if (!confirm(t('proposals.confirm.restore'))) return
    setIsBusy(true)

    try {
      const response = await fetch(`/api/proposals/${id}/trash`, { method: 'PATCH' })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        toast.error(payload?.error || t('proposals.toasts.restoreFailed'))
        return
      }
      toast.success(t('proposals.toasts.restored'))
      router.refresh()
    } catch {
      toast.error(t('proposals.toasts.restoreFailed'))
    } finally {
      setIsBusy(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (isBusy) return
    if (!confirm(t('proposals.confirm.permanentDelete'))) return
    setIsBusy(true)

    try {
      const response = await fetch(`/api/proposals/${id}/trash`, { method: 'DELETE' })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        toast.error(payload?.error || t('proposals.toasts.permanentDeleteFailed'))
        return
      }
      toast.success(t('proposals.toasts.permanentlyDeleted'))
      router.refresh()
    } catch {
      toast.error(t('proposals.toasts.permanentDeleteFailed'))
    } finally {
      setIsBusy(false)
    }
  }

  if (mode === 'trash') {
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleRestore}
          className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title={t('proposals.actions.restore')}
          disabled={isBusy}
        >
          <span className="material-symbols-outlined text-xl">restore_from_trash</span>
        </button>
        <button
          type="button"
          onClick={handlePermanentDelete}
          className="p-1.5 text-[#48679d] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
          title={t('proposals.actions.deletePermanently')}
          disabled={isBusy}
        >
          <span className="material-symbols-outlined text-xl">delete_forever</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href={`/proposals/${id}`}
        className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        title={t('proposals.actions.view')}
      >
        <span className="material-symbols-outlined text-xl">visibility</span>
      </Link>
      <Link
        href={`/proposals/new?proposalId=${id}`}
        className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        title={t('common.edit')}
      >
        <span className="material-symbols-outlined text-xl">edit</span>
      </Link>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
        title={t('common.copy')}
        disabled={!publicUrl || isBusy}
      >
        <span className="material-symbols-outlined text-xl">content_copy</span>
      </button>
      <button
        type="button"
        onClick={handleMoveToTrash}
        className="p-1.5 text-[#48679d] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        title={t('proposals.actions.trash')}
        disabled={isBusy}
      >
        <span className="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  )
}
