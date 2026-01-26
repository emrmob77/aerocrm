'use client'

import { useState } from 'react'
import Link from 'next/link'

// Block types
const contentBlocks = [
  { icon: 'image', label: 'Hero Section' },
  { icon: 'notes', label: 'Text Content' },
  { icon: 'photo_library', label: 'Gallery' },
]

const salesBlocks = [
  { icon: 'payments', label: 'Pricing Table', active: true },
  { icon: 'draw', label: 'E-Signature' },
  { icon: 'format_quote', label: 'Customer Quote' },
]

const smartVariables = ['{{Müşteri_Adı}}', '{{Teklif_No}}', '{{Tarih}}', '{{Toplam_Tutar}}']

// Pricing data
const pricingItems = [
  { name: 'Enterprise CRM License (Annual)', qty: 25, price: 1200, total: 30000 },
  { name: 'Onboarding & Training', qty: 1, price: 5000, total: 5000 },
]

export default function ProposalEditorPage() {
  const [activePanel, setActivePanel] = useState<'content' | 'design'>('content')
  const [columns, setColumns] = useState({
    description: true,
    quantity: true,
    unitPrice: false,
    total: true,
  })

  return (
    <div className="-m-8 flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] px-6 z-10">
        <div className="flex items-center gap-4">
          <Link href="/proposals" className="size-8 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[#48679d] dark:text-gray-400 text-sm font-medium">Proposals</span>
            <span className="text-[#48679d] dark:text-gray-400">/</span>
            <span className="text-sm font-bold text-[#0d121c] dark:text-white">ABC Şirketi Proposal</span>
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] rounded uppercase font-bold">Saved</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
          <button className="flex h-10 px-4 items-center justify-center rounded-lg bg-[#e7ebf4] dark:bg-gray-800 text-[#0d121c] dark:text-white text-sm font-bold hover:bg-opacity-80">
            Preview
          </button>
          <button className="flex h-10 px-4 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90">
            Send Proposal
          </button>
          <div className="size-9 rounded-full bg-gray-200 dark:bg-gray-700 ml-2"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Block Palette */}
        <aside className="w-64 flex flex-col border-r border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] overflow-y-auto">
          <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#48679d] dark:text-gray-400">Block Palette</h2>
            <p className="text-xs text-gray-500 mt-1">Drag blocks to the canvas</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2">CONTENT</h3>
              <div className="space-y-1">
                {contentBlocks.map((block, i) => (
                  <div key={i} className="group flex items-center gap-3 p-2.5 rounded-lg cursor-grab hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20">
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">{block.icon}</span>
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">{block.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2">SALES TOOLS</h3>
              <div className="space-y-1">
                {salesBlocks.map((block, i) => (
                  <div
                    key={i}
                    className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-grab transition-colors border ${
                      block.active
                        ? 'bg-primary/5 border-primary/20'
                        : 'border-transparent hover:bg-primary/10 hover:border-primary/20'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${block.active ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}>{block.icon}</span>
                    <span className={`text-sm font-medium ${block.active ? 'text-primary' : 'text-[#0d121c] dark:text-white'}`}>{block.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#e7ebf4] dark:border-gray-800">
              <h3 className="text-xs font-bold text-[#48679d] dark:text-gray-400 mb-3">AKILLI DEĞİŞKENLER</h3>
              <div className="flex flex-wrap gap-2">
                {smartVariables.map((v, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-mono text-primary cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Panel: Canvas */}
        <main className="flex-1 bg-[#f5f6f8] dark:bg-[#1a212c] overflow-y-auto p-12 flex justify-center relative">
          <div className="w-full max-w-[800px] bg-white dark:bg-[#101722] min-h-[1120px] shadow-lg rounded-sm flex flex-col">
            {/* Hero Block */}
            <div
              className="bg-cover bg-center h-80 flex items-end p-12 text-white relative"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800")`,
              }}
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Modern Solutions for {'{{Müşteri_Adı}}'}</h1>
                <p className="text-lg text-gray-200 opacity-90">Transforming your digital infrastructure for the new era.</p>
              </div>
            </div>

            {/* Intro Text */}
            <div className="p-12 space-y-6">
              <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Executive Summary</h2>
              <p className="text-[#48679d] dark:text-gray-300 leading-relaxed">
                Dear {'{{Müşteri_Adı}}'}, following our recent discussion, we are pleased to present this comprehensive proposal tailored to ABC Şirketi&apos;s unique operational needs. Our CRM solutions are designed to scale with your growth, ensuring a seamless experience for your sales team.
              </p>
            </div>

            {/* Pricing Table Block */}
            <div className="mx-12 mb-12 p-1 rounded-lg border-2 border-primary ring-4 ring-primary/10 relative">
              <div className="absolute -top-3 left-4 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Selected Block</div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-lg">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#0d121c] dark:text-white">
                  <span className="material-symbols-outlined text-primary">shopping_cart</span>
                  Investment Summary
                </h3>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="pb-3 font-semibold">Service / Product</th>
                      <th className="pb-3 font-semibold text-center">Qty</th>
                      <th className="pb-3 font-semibold text-right">Price</th>
                      <th className="pb-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pricingItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-4 font-medium text-[#0d121c] dark:text-white">{item.name}</td>
                        <td className="py-4 text-center">{item.qty}</td>
                        <td className="py-4 text-right">${item.price.toLocaleString()}.00</td>
                        <td className="py-4 text-right font-semibold">${item.total.toLocaleString()}.00</td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5">
                      <td className="py-4 text-right font-bold text-gray-500" colSpan={3}>Subtotal</td>
                      <td className="py-4 text-right font-bold text-primary text-lg">$35,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Add Block */}
            <div className="mt-auto p-12 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 rounded-lg hover:border-primary hover:text-primary transition-all group">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-sm font-semibold">Add New Block</span>
              </button>
            </div>
          </div>

          {/* Bottom Floating Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#101722]/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-full bg-primary text-white">
                <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
              </button>
              <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <span className="material-symbols-outlined text-[20px]">smartphone</span>
              </button>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">zoom_in</span> 85%
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">pages</span> Page 1/1
              </span>
            </div>
          </div>
        </main>

        {/* Right Panel: Properties */}
        <aside className="w-80 border-l border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#101722] overflow-y-auto">
          <div className="flex border-b border-[#e7ebf4] dark:border-gray-800">
            <button
              onClick={() => setActivePanel('content')}
              className={`flex-1 py-4 text-sm font-bold ${activePanel === 'content' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Content
            </button>
            <button
              onClick={() => setActivePanel('design')}
              className={`flex-1 py-4 text-sm font-medium ${activePanel === 'design' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Design
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide mb-3">Pricing Settings</label>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Data Source</label>
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">ABC Şirketi Deal</span>
                    <span className="material-symbols-outlined text-sm text-gray-400">sync</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-500 block mb-1">Columns to Show</label>
                  {Object.entries(columns).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => setColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                        className="rounded text-primary focus:ring-primary size-4"
                      />
                      <span className="text-sm text-[#0d121c] dark:text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-[#e7ebf4] dark:border-gray-800">
              <label className="block text-xs font-bold text-[#48679d] dark:text-gray-400 uppercase tracking-wide mb-3">Styling</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Text Color</label>
                  <div className="flex items-center gap-2 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                    <div className="size-4 rounded-full bg-[#0d121c] border border-gray-200"></div>
                    <span className="text-[10px] font-mono">#0D121C</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Accent Color</label>
                  <div className="flex items-center gap-2 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                    <div className="size-4 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-mono">#377DF6</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Remove Block
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
