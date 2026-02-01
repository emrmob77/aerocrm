import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'AERO CRM',
    template: '%s | AERO CRM',
  },
  description: 'Modern satış ekipleri için kapsamlı CRM ve teklif hazırlama platformu',
  keywords: ['CRM', 'satış', 'teklif', 'pipeline', 'müşteri yönetimi'],
  authors: [{ name: 'AERO Team' }],
  creator: 'AERO CRM',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://aerocrm.com',
    siteName: 'AERO CRM',
    title: 'AERO CRM - Satış, Hızla Uçar',
    description: 'Modern satış ekipleri için kapsamlı CRM ve teklif hazırlama platformu',
  },
  manifest: '/manifest.webmanifest',
  twitter: {
    card: 'summary_large_image',
    title: 'AERO CRM - Satış, Hızla Uçar',
    description: 'Modern satış ekipleri için kapsamlı CRM ve teklif hazırlama platformu',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E293B',
                color: '#F8FAFC',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#F8FAFC',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#F8FAFC',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
