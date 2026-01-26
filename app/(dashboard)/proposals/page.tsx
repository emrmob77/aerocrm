'use client'

import Link from 'next/link'

export default function ProposalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Teklifler</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">Tekliflerinizi oluşturun ve yönetin.</p>
        </div>
        <Link
          href="/proposals/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Yeni Teklif
        </Link>
      </div>
      
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-12 text-center">
        <span className="material-symbols-outlined text-6xl text-[#e7ebf4] dark:text-gray-700 mb-4">description</span>
        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-2">Henüz Teklif Yok</h3>
        <p className="text-[#48679d] dark:text-gray-400 mb-6">İlk teklifinizi oluşturmaya başlayın.</p>
        <Link
          href="/proposals/new"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">note_add</span>
          Teklif Oluştur
        </Link>
      </div>
    </div>
  )
}
