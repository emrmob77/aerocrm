'use client'

import { useEffect } from 'react'

const shouldRegisterSw = () => {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  if (process.env.NODE_ENV !== 'production') return false
  return true
}

export function PwaBootstrap() {
  useEffect(() => {
    if (!shouldRegisterSw()) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js')
      } catch {
        // Ignore registration failures to avoid blocking app rendering
      }
    }

    register()
  }, [])

  return null
}
