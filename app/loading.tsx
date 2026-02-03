import { getServerT } from '@/lib/i18n/server'

export default async function Loading() {
  const t = await getServerT()
  return (
    <div className="min-h-screen flex items-center justify-center bg-aero-slate-50 dark:bg-aero-slate-900">
      <div className="flex flex-col items-center gap-4">
        {/* Logo with pulse animation */}
        <div className="w-16 h-16 bg-aero-blue-500 rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-3xl font-bold text-white">A</span>
        </div>
        
        {/* Loading spinner */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-aero-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-aero-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-aero-blue-500 rounded-full animate-bounce" />
        </div>
        
        <p className="text-aero-slate-500 dark:text-aero-slate-400 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  )
}
