'use client'

import { useState } from 'react'
import Link from 'next/link'

// Team members data
const teamMembers = [
  { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@aerocrm.com', role: 'Yönetici', status: 'active', avatar: 'AY' },
  { id: 2, name: 'Caner Yılmaz', email: 'caner@aerocrm.com', role: 'Satış Müdürü', status: 'active', avatar: 'CY' },
  { id: 3, name: 'Elif Demir', email: 'elif@aerocrm.com', role: 'Satış Temsilcisi', status: 'active', avatar: 'ED' },
  { id: 4, name: 'Mert Kaya', email: 'mert@aerocrm.com', role: 'Satış Temsilcisi', status: 'pending', avatar: 'MK' },
]

const roles = ['Yönetici', 'Satış Müdürü', 'Satış Temsilcisi', 'Görüntüleyici']

export default function TeamSettingsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)

  return (
    <div className="-m-8">
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Link href="/settings" className="text-[#48679d] dark:text-gray-400 hover:text-primary">Ayarlar</Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-primary">Takım Yönetimi</span>
        </div>

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">Takım Yönetimi</h1>
            <p className="text-[#48679d] dark:text-gray-400">Ekip üyelerinizi ve rollerini buradan yönetin.</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Üye Davet Et
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">group</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">Toplam Üye</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{teamMembers.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">Aktif</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{teamMembers.filter(m => m.status === 'active').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <span className="material-symbols-outlined text-amber-600">pending</span>
              </div>
              <span className="text-sm font-medium text-[#48679d]">Bekleyen Davet</span>
            </div>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{teamMembers.filter(m => m.status === 'pending').length}</p>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-[#0d121c] dark:text-white">Ekip Üyeleri</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Üye ara..."
                  className="pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 w-64"
                />
              </div>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-[#48679d] dark:text-gray-400 border-b border-[#e7ebf4] dark:border-gray-700">
                <th className="px-6 py-4 font-semibold">Üye</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
                <th className="px-6 py-4 font-semibold text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-[#0d121c] dark:text-white">{member.name}</p>
                        <p className="text-sm text-[#48679d]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      defaultValue={member.role}
                      className="text-sm bg-gray-50 dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary/50"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {member.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Bekliyor
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {member.status === 'pending' && (
                        <button className="text-primary hover:underline text-sm font-bold">
                          Yeniden Gönder
                        </button>
                      )}
                      <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Yeni Üye Davet Et</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#0d121c] dark:text-white">E-posta Adresi</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    className="w-full px-4 py-2.5 border border-[#e7ebf4] dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#0d121c] dark:text-white">Rol</label>
                  <select className="w-full px-4 py-2.5 border border-[#e7ebf4] dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900">
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-[#48679d] hover:text-[#0d121c] text-sm font-bold transition-colors"
                >
                  İptal
                </button>
                <button className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                  Davet Gönder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
