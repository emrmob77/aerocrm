import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

type QuickAction = {
  label: string
  icon: string
  href: string
}

type QuickActionsProps = {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  const { t } = useI18n()
  return (
    <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800">
        <h3 className="font-bold text-lg text-[#0d121c] dark:text-white">{t('dashboard.quickActionsTitle')}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f6f8] dark:bg-[#101722] hover:bg-[#e7ebf4] dark:hover:bg-[#0f1623] transition-colors"
          >
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">{action.icon}</span>
            </div>
            <span className="font-semibold text-[#0d121c] dark:text-white">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
