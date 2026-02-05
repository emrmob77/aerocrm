'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

type MonitoringChartsProps = {
  apiSeries: Array<{ date: string; count: number }>
  webhookSeries: Array<{ date: string; successRate: number }>
  noDataLabel: string
  apiTrendTitle: string
  webhookTrendTitle: string
  successLabel: string
}

export function MonitoringCharts({
  apiSeries,
  webhookSeries,
  noDataLabel,
  apiTrendTitle,
  webhookTrendTitle,
  successLabel,
}: MonitoringChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{apiTrendTitle}</h2>
        {apiSeries.length ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apiSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ebf4" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[#48679d]">{noDataLabel}</p>
        )}
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{webhookTrendTitle}</h2>
        {webhookSeries.length ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={webhookSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ebf4" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, successLabel]} />
                <Bar dataKey="successRate" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[#48679d]">{noDataLabel}</p>
        )}
      </div>
    </div>
  )
}
