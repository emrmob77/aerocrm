import { getServerT } from '@/lib/i18n/server'

const webhookActivities = [
  {
    endpoint: '/api/v1/deals',
    method: 'POST',
    status: '200 OK',
    statusColor: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-500',
    duration: '142ms',
    timeKey: 'time.justNow',
  },
  {
    endpoint: '/api/v1/invoices',
    method: 'POST',
    status: '201 Created',
    statusColor: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-500',
    duration: '210ms',
    timeKey: 'time.minutesAgo',
    timeVars: { count: 2 },
  },
  {
    endpoint: '/api/v1/auth',
    method: 'POST',
    status: '401 Unauth',
    statusColor: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500',
    duration: '45ms',
    timeKey: 'time.minutesAgo',
    timeVars: { count: 5 },
  },
]

export function WebhookActivity() {
  const t = getServerT()
  return (
    <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">webhook</span>
          <h3 className="font-bold text-lg text-[#0d121c] dark:text-white">{t('dashboard.webhookActivity.title')}</h3>
        </div>
        <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
          <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
          {t('dashboard.webhookActivity.live')}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#f5f6f8] dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">{t('dashboard.webhookActivity.table.endpoint')}</th>
              <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">{t('dashboard.webhookActivity.table.status')}</th>
              <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">{t('dashboard.webhookActivity.table.duration')}</th>
              <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">{t('dashboard.webhookActivity.table.time')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-800">
            {webhookActivities.map((activity, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[#0d121c] dark:text-gray-300">{activity.method}</span>
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">{activity.endpoint}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${activity.statusColor}`}>{activity.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-[#48679d] dark:text-gray-400">{activity.duration}</td>
                <td className="px-6 py-4 text-sm text-[#48679d] dark:text-gray-400">
                  {t(activity.timeKey, activity.timeVars)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
