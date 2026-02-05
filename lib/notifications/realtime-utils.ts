export type RealtimeIdRow = {
  id: string
}

export type RealtimeReadableRow = RealtimeIdRow & {
  read: boolean
}

export const insertRealtimeNotification = <T extends RealtimeIdRow>(
  current: T[],
  incoming: T,
  limit: number
) => {
  const safeLimit = Math.max(1, limit)
  if (current.some((item) => item.id === incoming.id)) {
    return current.slice(0, safeLimit)
  }
  return [incoming, ...current].slice(0, safeLimit)
}

export const updateRealtimeNotificationRead = <T extends RealtimeReadableRow>(
  current: T[],
  id: string,
  read?: boolean
) =>
  current.map((item) =>
    item.id === id
      ? {
          ...item,
          read: read ?? item.read,
        }
      : item
  )
