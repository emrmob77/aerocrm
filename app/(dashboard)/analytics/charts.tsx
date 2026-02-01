'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  Cell,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type LineSeries = {
  date: string
  views: number
  signed: number
  sent: number
}

type PieSlice = {
  name: string
  value: number
  color: string
}

const tooltipStyle = {
  background: '#0f172a',
  border: 'none',
  borderRadius: '10px',
  color: '#f8fafc',
  fontSize: 12,
}

export function AnalyticsLineChart({ data }: { data: LineSeries[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="sent"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Gönderim"
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#377DF6"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Görüntülenme"
          />
          <Line
            type="monotone"
            dataKey="signed"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="İmza"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusPieChart({ data }: { data: PieSlice[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Pie data={data} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
