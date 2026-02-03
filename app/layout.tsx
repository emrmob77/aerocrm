import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Providers } from './providers'
import { cookies } from 'next/headers'
import { getServerLocale } from '@/lib/i18n/server'
import { messages } from '@/lib/i18n/messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale()
  const meta = messages[locale].meta
  return {
    title: {
      default: meta.titleDefault,
      template: meta.titleTemplate,
    },
    description: meta.description,
    keywords: [...meta.keywords],
    authors: [{ name: 'AERO Team' }],
    creator: 'AERO CRM',
    openGraph: {
      type: 'website',
      locale: meta.openGraph.locale,
      url: meta.openGraph.url,
      siteName: meta.openGraph.siteName,
      title: meta.openGraph.title,
      description: meta.openGraph.description,
    },
    manifest: '/manifest.webmanifest',
    twitter: {
      card: 'summary_large_image',
      title: meta.twitter.title,
      description: meta.twitter.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const locale = cookieStore.get('aero_locale')?.value === 'en' ? 'en' : 'tr'
  return (
    <html lang={locale} suppressHydrationWarning>
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
