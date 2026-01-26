'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Mock deal data
const dealData = {
  id: '1',
  title: 'ABC Şirketi - SEO Projesi',
  company: 'ABC Şirketi',
  stage: 'Teklif Gönderildi',
  value: 15000,
  closeDate: '30 Haz 2024',
  owner: { name: 'Caner Yılmaz', initials: 'CY' },
  contact: {
    name: 'Ahmet Yılmaz',
    title: 'Pazarlama Müdürü',
    company: 'ABC Şirketi',
    email: 'ahmet@abcsirketi.com',
    phone: '+90 (555) 123 45 67',
    location: 'Levent, İstanbul',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkQb3htJ1T9ZU4zNP4XQCH00DAfVgXfeBf4UGKMw8UfBk_0Fr1LMulOMxZJXwbCCsnOvtIwcMOdrP9Cw3ZX85w0Lsn3oD9toFm2H_sC9fXRLvKKNsqDhzmyENcysBUVMZaKcXNd2ulX2XjXZf3tJwhYeg_oyLe3JoE7V3UCorcSD5qVCuQLtyTtpibORzQfEYYIpObbFANjHgNkGjPSttxbkYuP3Zm79u9_8iqNnseqwL3wri4-0VuKsDDiAUyObczbuFpEXNsBg',
  },
  products: [
    { name: 'Aylık SEO Danışmanlığı', quantity: 6, unitPrice: 2000, total: 12000 },
    { name: 'Teknik Denetim & Setup', quantity: 1, unitPrice: 3000, total: 3000 },
  ],
  metrics: {
    pipelineDays: 12,
    averageDays: 20,
    winProbability: 75,
  },
}

type TabType = 'products' | 'proposals' | 'notes' | 'activity' | 'files'

const tabs: { id: TabType; label: string }[] = [
  { id: 'products', label: 'Ürünler' },
  { id: 'proposals', label: 'Teklifler' },
  { id: 'notes', label: 'Notlar' },
  { id: 'activity', label: 'Aktivite' },
  { id: 'files', label: 'Dosyalar' },
]

export default function DealDetailsPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState<TabType>('products')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value)
  }

  const totalValue = dealData.products.reduce((sum, p) => sum + p.total, 0)

  return (
    <div className="-m-8">
      <main className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-40 py-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumbs & Heading */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/deals" className="flex items-center text-primary text-sm font-semibold group">
                <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
                Fırsatlara Dön
              </Link>
              <span className="text-gray-400 text-sm">/</span>
              <span className="text-gray-500 text-sm">{dealData.company}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-[#0d121c] dark:text-white text-3xl font-extrabold tracking-tight">{dealData.title}</h1>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                  {dealData.stage}
                </span>
                <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-colors">
                  Düzenle
                </button>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Fırsat Değeri</p>
                  <p className="text-[#0d121c] dark:text-white text-2xl font-extrabold">{formatCurrency(dealData.value)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Kapanış Tarihi</p>
                  <p className="text-[#0d121c] dark:text-white text-2xl font-extrabold">{dealData.closeDate}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Sorumlu</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                      {dealData.owner.initials}
                    </div>
                    <p className="text-[#0d121c] dark:text-white text-lg font-bold">{dealData.owner.name}</p>
                  </div>
                </div>
              </div>

              {/* Tabs & Content */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="border-b border-[#e7ebf4] dark:border-gray-800 bg-[#fbfcfd] dark:bg-gray-900/50">
                  <nav className="flex px-4 overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center border-b-2 px-4 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-0">
                  {activeTab === 'products' && (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                          <th className="px-6 py-4">Ürün Adı</th>
                          <th className="px-6 py-4 text-center">Adet</th>
                          <th className="px-6 py-4 text-right">Birim Fiyat</th>
                          <th className="px-6 py-4 text-right">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {dealData.products.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-[#0d121c] dark:text-white">{product.name}</td>
                            <td className="px-6 py-4 text-sm text-center">{product.quantity}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(product.unitPrice)}</td>
                            <td className="px-6 py-4 text-sm text-right font-bold">{formatCurrency(product.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td className="px-6 py-4 text-sm font-bold text-right text-gray-500 dark:text-gray-400 uppercase tracking-widest" colSpan={3}>
                            Genel Toplam
                          </td>
                          <td className="px-6 py-4 text-lg font-extrabold text-right text-primary">{formatCurrency(totalValue)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                  {activeTab !== 'products' && (
                    <div className="p-8 text-center text-gray-500">
                      <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">construction</span>
                      <p>{tabs.find(t => t.id === activeTab)?.label} içeriği yakında eklenecek.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Contact Card */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="size-16 rounded-xl bg-cover bg-center border border-gray-100 dark:border-gray-800"
                    style={{ backgroundImage: `url("${dealData.contact.avatar}")` }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{dealData.contact.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{dealData.contact.title}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">{dealData.contact.company}</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">mail</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{dealData.contact.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">call</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{dealData.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">location_on</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{dealData.contact.location}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group">
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">call</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">ARA</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group">
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">mail</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">E-POSTA</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 transition-colors group">
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">chat</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary">SMS</span>
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#0d121c] dark:text-white uppercase tracking-wider px-1">Performans Metrikleri</h4>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pipeline Süresi</p>
                    <span className="text-primary font-bold">{dealData.metrics.pipelineDays} Gün</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${(dealData.metrics.pipelineDays / dealData.metrics.averageDays) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Ortalama süre {dealData.metrics.averageDays} gün.</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kazanma Olasılığı</p>
                    <span className="text-green-500 font-bold">%{dealData.metrics.winProbability}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${dealData.metrics.winProbability}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">AI tarafından hesaplanmıştır.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button className="w-full py-3 bg-white dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-800 rounded-lg text-sm font-bold text-[#0d121c] dark:text-white flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  Geçmişi Görüntüle
                </button>
                <button className="w-full py-3 bg-white dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-800 rounded-lg text-sm font-bold text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                  Fırsatı Kapat (Kaybedildi)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
