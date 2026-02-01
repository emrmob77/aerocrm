'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type RevenuePoint = {
  label: string
  value: number
}

type RevenueChartProps = {
  data: RevenuePoint[]
  currency: string
}

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export default function RevenueChart({ data, currency }: RevenueChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(value) => formatMoney(value, currency)}
          />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: 'none',
              borderRadius: 12,
              color: '#f8fafc',
              fontSize: 12,
            }}
            formatter={(value: number) => formatMoney(value, currency)}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
