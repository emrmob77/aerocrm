import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { ContactTagsEditor } from '@/components/contacts'
import { formatCurrency, formatRelativeTime, getInitials } from '@/components/contacts/contact-utils'
import { normalizeStage, getStageConfigs, type StageId } from '@/components/deals'
import { getServerLocale, getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

type ContactRow = Database['public']['Tables']['contacts']['Row']
type ContactCore = Pick<
  ContactRow,
  'id' | 'full_name' | 'email' | 'phone' | 'company' | 'position' | 'address' | 'created_at' | 'updated_at' | 'user_id' | 'team_id' | 'custom_fields'
>
type DealRow = Database['public']['Tables']['deals']['Row']

const closedStages = new Set<StageId>(['won', 'lost'])

const avatarPalette = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-200' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-200' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-200' },
]

const getAvatarStyle = (seed: string) => {
  const hash = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarPalette[hash % avatarPalette.length]
}

const getLastActivity = (contact: ContactCore, deals: DealRow[]) => {
  let latest = contact.updated_at ?? contact.created_at ?? new Date().toISOString()
  for (const deal of deals) {
    const updated = deal.updated_at ?? deal.created_at
    if (updated && new Date(updated) > new Date(latest)) {
      latest = updated
    }
  }
  return latest
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const t = getServerT()
  const locale = getServerLocale()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const currency = locale === 'en' ? 'USD' : 'TRY'
  const stageConfigs = getStageConfigs(t)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id ?? null

  let contactQuery = supabase
    .from('contacts')
    .select('id, full_name, email, phone, company, position, address, created_at, updated_at, user_id, team_id, custom_fields')
    .eq('id', params.id)

  if (teamId) {
    contactQuery = contactQuery.eq('team_id', teamId)
  } else {
    contactQuery = contactQuery.eq('user_id', user.id)
  }

  const { data: contact } = await contactQuery.single()

  if (!contact) {
    notFound()
  }

  let dealsQuery = supabase
    .from('deals')
    .select('id, title, value, stage, updated_at, created_at, team_id, user_id')
    .eq('contact_id', contact.id)
    .order('updated_at', { ascending: false })

  if (teamId) {
    dealsQuery = dealsQuery.eq('team_id', teamId)
  } else {
    dealsQuery = dealsQuery.eq('user_id', user.id)
  }

  const { data: dealsData } = await dealsQuery
  const deals = (dealsData ?? []) as DealRow[]

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
  const openDeals = deals.filter((deal) => !closedStages.has(normalizeStage(deal.stage))).length
  const lastActivityAt = getLastActivity(contact, deals)

  const initials = getInitials(contact.full_name)
  const avatarStyle = getAvatarStyle(contact.full_name)

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Link href="/contacts" className="flex items-center text-primary text-sm font-semibold hover:underline">
            <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
            {t('contacts.detail.back')}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`size-14 rounded-xl flex items-center justify-center font-bold ${avatarStyle.bg} ${avatarStyle.text}`}>
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{contact.full_name}</h1>
              <p className="text-[#48679d] dark:text-gray-400">
                {contact.company ?? '—'} {contact.position ? `• ${contact.position}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="px-4 py-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg text-sm font-semibold text-[#48679d] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('contacts.detail.edit')}
            </Link>
            <Link
              href={`/deals/new?contact=${contact.id}`}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors"
            >
              {t('contacts.detail.newDeal')}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('contacts.detail.totalValue')}</p>
              <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white">
                {formatCurrency(totalValue, formatLocale, currency)}
              </p>
            </div>
            <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('contacts.detail.openDeals')}</p>
              <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white">{openDeals}</p>
            </div>
            <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#48679d] dark:text-gray-400">{t('contacts.detail.lastActivity')}</p>
              <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white">{formatRelativeTime(lastActivityAt, t)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e7ebf4] dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50">
              <h2 className="font-bold text-[#0d121c] dark:text-white">{t('contacts.detail.dealsTitle')}</h2>
            </div>
            {deals.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3 block">assignment</span>
                <p className="text-[#48679d] dark:text-gray-400">{t('contacts.detail.noDeals')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/60 dark:bg-gray-900/50 text-xs uppercase tracking-widest font-bold text-[#48679d] dark:text-gray-400">
                      <th className="px-6 py-4">{t('contacts.detail.table.deal')}</th>
                      <th className="px-6 py-4">{t('contacts.detail.table.stage')}</th>
                      <th className="px-6 py-4 text-right">{t('contacts.detail.table.value')}</th>
                      <th className="px-6 py-4 text-right">{t('contacts.detail.table.updated')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-800">
                    {deals.map((deal) => {
                      const stage = stageConfigs.find((item) => item.id === normalizeStage(deal.stage))
                      return (
                        <tr key={deal.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-[#0d121c] dark:text-white">{deal.title}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {stage?.label ?? deal.stage}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-[#0d121c] dark:text-white">
                            {formatCurrency(deal.value ?? 0, formatLocale, currency)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-[#48679d] dark:text-gray-400">
                            {formatRelativeTime(deal.updated_at ?? deal.created_at ?? new Date().toISOString(), t)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
            <h3 className="font-bold text-[#0d121c] dark:text-white mb-4">{t('contacts.detail.contactTitle')}</h3>
            <div className="space-y-4 text-sm text-[#48679d] dark:text-gray-400">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                <span>{contact.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">call</span>
                <span>{contact.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
                <span>{contact.address ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
            <ContactTagsEditor contactId={contact.id} initialCustomFields={contact.custom_fields ?? null} />
          </div>

          <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
            <h3 className="font-bold text-[#0d121c] dark:text-white mb-4">{t('contacts.detail.summaryTitle')}</h3>
            <div className="space-y-3 text-sm text-[#48679d] dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>{t('contacts.detail.summary.deals')}</span>
                <span className="font-semibold text-[#0d121c] dark:text-white">{deals.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('contacts.detail.summary.value')}</span>
                <span className="font-semibold text-[#0d121c] dark:text-white">
                  {formatCurrency(totalValue, formatLocale, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('contacts.detail.summary.updated')}</span>
                <span className="font-semibold text-[#0d121c] dark:text-white">{formatRelativeTime(lastActivityAt, t)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
