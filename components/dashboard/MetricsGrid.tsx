type DashboardMetric = {
  label: string
  value: string
  badge?: string | null
  badgeColor?: string
  badgeType?: string | null
  icon: string
  iconBg: string
  iconColor: string
}

type MetricsGridProps = {
  metrics: DashboardMetric[]
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div
          key={`${metric.label}-${index}`}
          className="bg-white dark:bg-[#161e2b] p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 ${metric.iconBg} ${metric.iconColor} rounded-lg`}>
              <span className="material-symbols-outlined">{metric.icon}</span>
            </div>
            {metric.badgeType && (
              <span className="text-xs font-semibold text-gray-400">{metric.badgeType}</span>
            )}
            {metric.badge && !metric.badgeType && (
              <span className={`text-xs font-semibold ${metric.badgeColor ?? ''}`}>{metric.badge}</span>
            )}
          </div>
          <h3 className="text-sm font-medium text-[#48679d] dark:text-gray-400">{metric.label}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{metric.value}</p>
            {metric.badge && (
              <span className={`text-xs ${metric.badgeColor ?? ''} font-bold`}>{metric.badge}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
