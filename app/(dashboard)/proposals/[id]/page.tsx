'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

// Pricing items
const pricingItems = [
  { name: 'Özel Tasarım ve UI/UX Geliştirme', qty: 1, unitPrice: 24500, total: 24500 },
  { name: 'Front-end & Back-end Entegrasyonu', qty: 1, unitPrice: 35000, total: 35000 },
  { name: 'SEO ve İçerik Yönetim Paneli', qty: 1, unitPrice: 12000, total: 12000 },
]

// Timeline items
const timelineItems = [
  { icon: 'palette', title: 'Aşama 1: Tasarım', duration: '2 Hafta', description: 'UI/UX wireframe hazırlığı ve onay süreçleri.', active: true },
  { icon: 'code', title: 'Aşama 2: Geliştirme', duration: '4 Hafta', description: 'Yazılım kodlama ve CMS entegrasyonu.', active: false },
  { icon: 'rocket_launch', title: 'Aşama 3: Yayına Alım', duration: '1 Hafta', description: 'Testler, hata ayıklama ve domain yönlendirme.', active: false },
]

export default function ProposalViewPage() {
  const params = useParams()
  const [signerName, setSignerName] = useState('')

  const subtotal = pricingItems.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal * 1.2 // With VAT

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value)
  }

  return (
    <div className="-m-8 bg-[#f5f6f8] dark:bg-[#101722] min-h-screen">
      {/* Urgency Banner */}
      <div className="w-full bg-primary/10 dark:bg-primary/20 border-b border-primary/20 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[960px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">timer</span>
            <p className="text-sm font-medium text-primary">Bu teklif için özel indirim süresi doluyor:</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex flex-col items-center">
              <span className="text-primary font-bold text-sm">02</span>
              <span className="text-[10px] uppercase opacity-60">Saat</span>
            </div>
            <span className="text-primary font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-primary font-bold text-sm">45</span>
              <span className="text-[10px] uppercase opacity-60">Dak</span>
            </div>
            <span className="text-primary font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-primary font-bold text-sm">12</span>
              <span className="text-[10px] uppercase opacity-60">San</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1 px-4">
          {/* Hero Section */}
          <div className="mb-8">
            <div
              className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[320px] shadow-lg relative"
              style={{
                backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 50%), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200")`,
              }}
            >
              <div className="flex flex-col p-6 md:p-10">
                <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded w-fit mb-3">Resmi Teklif</span>
                <h1 className="text-white tracking-tight text-3xl md:text-4xl font-extrabold leading-tight">ABC Şirketi Web Sitesi Teklifi</h1>
                <p className="text-gray-300 mt-2 text-sm md:text-base">Proje Kodu: #PRP-2024-0892 | Hazırlayan: AERO CRM Proje Ekibi</p>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-10">
            <h2 className="text-primary text-sm font-bold uppercase tracking-widest mb-2">01. Proje Özeti</h2>
            <h1 className="text-[#0d121c] dark:text-white tracking-tight text-[32px] font-bold leading-tight pb-3">Hedefler ve Vizyon</h1>
            <p className="text-[#4e5a71] dark:text-gray-400 text-lg font-normal leading-relaxed">
              AERO CRM olarak, ABC Şirketi için modern, kullanıcı dostu ve dönüşüm odaklı bir web sitesi geliştirmeyi hedefliyoruz. Bu teklif, markanızın dijital dünyadaki görünürlüğünü artırmak, kullanıcı deneyimini optimize etmek ve satış kanallarınızı güçlendirmek amacıyla hazırlanmıştır.
            </p>
          </div>

          {/* Pricing Section */}
          <div className="mb-12">
            <div className="bg-white dark:bg-[#101722] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-[#0d121c] dark:text-white text-xl font-bold">Fiyatlandırma</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase">
                      <th className="px-6 py-4">Hizmet Açıklaması</th>
                      <th className="px-6 py-4 text-center">Adet/Birim</th>
                      <th className="px-6 py-4 text-right">Birim Fiyat</th>
                      <th className="px-6 py-4 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pricingItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-6 py-4 font-medium text-[#0d121c] dark:text-white">{item.name}</td>
                        <td className="px-6 py-4 text-center">{item.qty}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td className="px-6 py-6 text-right font-bold text-gray-500" colSpan={3}>Ara Toplam</td>
                      <td className="px-6 py-6 text-right font-bold text-[#0d121c] dark:text-white">{formatCurrency(subtotal)}</td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="px-6 py-6 text-right font-extrabold text-primary text-lg" colSpan={3}>Genel Toplam (KDV Dahil)</td>
                      <td className="px-6 py-6 text-right font-extrabold text-primary text-xl tracking-tight">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-16">
            <h2 className="text-[#0d121c] dark:text-white text-xl font-bold mb-6">Proje Takvimi</h2>
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              {timelineItems.map((item, index) => (
                <div key={index} className={`relative flex items-center justify-between md:justify-normal ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} group`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 ${index % 2 === 0 ? 'md:-translate-x-1/2' : 'md:translate-x-1/2'} ${item.active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                      <time className={`text-xs font-medium px-2 py-1 rounded ${item.active ? 'text-primary bg-primary/10' : 'text-gray-500 bg-gray-100 dark:bg-gray-800'}`}>
                        {item.duration}
                      </time>
                    </div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* E-Signature Section */}
          <div className="pb-24">
            <div className="bg-white dark:bg-gray-900 border-2 border-primary/20 rounded-2xl p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Onay ve İmza</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Bu teklifi kabul ederek yukarıda belirtilen kapsam, fiyatlandırma ve zaman çizelgesini onaylamış olursunuz. İmzanız dijital olarak kaydedilecek ve sözleşme sürecini başlatacaktır.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Ad Soyad</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Tam adınızı giriniz"
                        className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tarih</label>
                      <input
                        type="text"
                        disabled
                        value="24.05.2024"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2 flex justify-between">
                      <span>Dijital İmza Alanı</span>
                      <span className="text-primary hover:underline cursor-pointer normal-case">Temizle</span>
                    </label>
                    <div className="h-40 w-full rounded flex items-center justify-center relative cursor-crosshair bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="absolute bottom-10 left-10 right-10 h-px bg-gray-300"></div>
                      <p className="text-gray-300 text-xs italic z-0">Mousenuz ile buraya imza atın</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-8">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  <span>Güvenli bağlantı üzerinden IP adresiniz ile imzalanmaktadır.</span>
                </div>
                <button className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">draw</span>
                  Kabul Et ve İmzala
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 md:hidden flex items-center justify-between z-50">
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400">Toplam Teklif</p>
          <p className="text-lg font-extrabold text-[#0d121c] dark:text-white">{formatCurrency(total)}</p>
        </div>
        <button className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          İmzala
        </button>
      </div>
    </div>
  )
}
