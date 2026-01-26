'use client'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Raporlar</h1>
        <p className="text-[#48679d] dark:text-gray-400">Detaylı raporlar ve analizler.</p>
      </div>
      
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-12 text-center">
        <span className="material-symbols-outlined text-6xl text-[#e7ebf4] dark:text-gray-700 mb-4">bar_chart</span>
        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-2">Raporlar Sayfası</h3>
        <p className="text-[#48679d] dark:text-gray-400">Bu sayfa yakında eklenecek.</p>
      </div>
    </div>
  )
}
