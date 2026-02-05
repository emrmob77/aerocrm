'use client'

import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { I18nProvider } from '@/lib/i18n'
import { PwaBootstrap } from '@/components/pwa/PwaBootstrap'
import { WebVitalsReporter } from '@/components/monitoring/WebVitalsReporter'

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
)

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR için staleTime ayarı
            staleTime: 60 * 1000, // 1 dakika
            // Hata durumunda tekrar deneme
            retry: 1,
            // Pencere odaklandığında yeniden fetch
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <PwaBootstrap />
          <WebVitalsReporter />
          {children}
        </AuthProvider>
      </I18nProvider>
      {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}
