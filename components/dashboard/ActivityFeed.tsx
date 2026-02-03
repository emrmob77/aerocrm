'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { formatRelativeTime, getActivityPresentation, mapActivityRow, type DashboardActivity } from './activity-utils'

type ActivityFeedProps = {
  initialActivities: DashboardActivity[]
  teamId: string | null
}

export function ActivityFeed({ initialActivities, teamId }: ActivityFeedProps) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [activities, setActivities] = useState<DashboardActivity[]>(initialActivities)

  useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  useEffect(() => {
    if (!teamId) {
      return
    }

    const channel = supabase
      .channel('activities-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const newRow = payload.new as Database['public']['Tables']['activities']['Row']
          if (!newRow?.id) {
            return
          }

          setActivities(prev => {
            const next = [mapActivityRow(newRow), ...prev]
            return next.slice(0, 5)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, teamId])

  return (
    <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800 flex justify-between items-center">
        <h3 className="font-bold text-lg text-[#0d121c] dark:text-white">Son Aktivite</h3>
        <button className="text-sm text-primary font-semibold hover:underline">Tümünü Gör</button>
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-sm text-[#48679d] dark:text-gray-400">
            Henüz aktivite yok.
          </div>
        ) : (
          <ul className="space-y-6">
            {activities.map((activity, index) => {
              const presentation = getActivityPresentation(activity.type)
              const hasLine = index < activities.length - 1

              return (
                <li key={activity.id} className="flex gap-4">
                  <div className="relative">
                    <div className={`size-10 rounded-full ${presentation.iconBg} flex items-center justify-center ${presentation.iconColor} z-10 relative`}>
                      <span className="material-symbols-outlined text-sm">{presentation.icon}</span>
                    </div>
                    {hasLine && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-100 dark:bg-gray-800 -z-0"></div>
                    )}
                  </div>
                  <div className={`flex-1 ${hasLine ? 'pb-4' : ''}`}>
                    <div className="flex justify-between">
                      <p className="text-sm font-bold text-[#0d121c] dark:text-white">{activity.title}</p>
                      <span className="text-xs text-[#48679d] dark:text-gray-400">
                        {activity.createdAt ? formatRelativeTime(activity.createdAt) : ''}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">{activity.description}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
