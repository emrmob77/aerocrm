'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f6f8] dark:bg-[#101722]">
        <Header />
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default MainLayout
