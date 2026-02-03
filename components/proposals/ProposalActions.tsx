'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'

type ProposalActionsProps = {
  id: string
  publicUrl?: string | null
}

export function ProposalActions({ id, publicUrl }: ProposalActionsProps) {
  const { t } = useI18n()

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
        disabled={!publicUrl}
      >
        <span className="material-symbols-outlined text-xl">content_copy</span>
      </button>
    </div>
  )
}
