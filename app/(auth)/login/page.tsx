'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulated login - will be replaced with Supabase auth
    setTimeout(() => {
      if (email && password) {
        router.push('/dashboard')
      } else {
        setError('E-posta ve şifre gereklidir')
        setIsLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side: Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-gradient-to-br from-primary to-[#1e40af] overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-full max-w-lg">
          <div className="mb-12">
            <h1 className="text-white text-7xl font-extrabold tracking-tighter mb-4">AERO</h1>
            <p className="text-white/90 text-2xl font-medium">Satış, Hızla Uçar.</p>
          </div>

          {/* Floating Testimonial Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/50">
                AY
              </div>
              <div>
                <p className="text-white font-bold">Ahmet Y.</p>
                <p className="text-white/70 text-sm">Satış Müdürü</p>
              </div>
            </div>
            <p className="text-white text-lg italic leading-relaxed">
              &quot;Aero ile teklif hazırlama süremiz %50 azaldı. Artık sadece satışa odaklanabiliyoruz.&quot;
            </p>
          </div>

          {/* Graphic Element */}
          <div className="mt-16 opacity-40">
            <div className="h-1 w-32 bg-white rounded-full mb-2"></div>
            <div className="h-1 w-48 bg-white rounded-full opacity-60 mb-2"></div>
            <div className="h-1 w-24 bg-white rounded-full opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="w-full max-w-[440px]">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-primary text-4xl font-black tracking-tighter">AERO</h1>
          </div>

          {/* Header Content */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-[#0d121c] dark:text-white text-3xl font-bold leading-tight mb-2">
              Tekrar Hoş Geldiniz
            </h2>
            <p className="text-[#48679d] dark:text-gray-400">
              Devam etmek için lütfen giriş yapın.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#0d121c] dark:text-gray-200 text-base font-medium leading-normal">
                E-posta
              </label>
              <div className="flex w-full items-stretch rounded-lg shadow-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e-posta@adresiniz.com"
                  className="flex w-full min-w-0 flex-1 rounded-l-lg text-[#0d121c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] h-14 placeholder:text-[#48679d]/50 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal transition-colors"
                  required
                />
                <div className="text-[#48679d] flex border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                  <span className="material-symbols-outlined">mail</span>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#0d121c] dark:text-gray-200 text-base font-medium leading-normal">
                Şifre
              </label>
              <div className="flex w-full items-stretch rounded-lg shadow-sm">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex w-full min-w-0 flex-1 rounded-l-lg text-[#0d121c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] h-14 placeholder:text-[#48679d]/50 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal transition-colors"
                  required
                />
                <div className="text-[#48679d] flex border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                  <span className="material-symbols-outlined">lock</span>
                </div>
              </div>
            </div>

            {/* Form Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 rounded border-[#ced8e9] dark:border-gray-700 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                </div>
                <label htmlFor="remember" className="text-[#0d121c] dark:text-gray-300 text-sm font-medium cursor-pointer">
                  Beni Hatırla
                </label>
              </div>
              <Link 
                href="/forgot-password"
                className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
              >
                Şifremi Unuttum
              </Link>
            </div>

            {/* Primary Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex h-14 items-center justify-center rounded-lg bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                <span className="truncate">Giriş Yap</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-[#ced8e9] dark:border-gray-700"></div>
              <span className="flex-shrink mx-4 text-[#48679d] dark:text-gray-500 text-sm font-medium">veya</span>
              <div className="flex-grow border-t border-[#ced8e9] dark:border-gray-700"></div>
            </div>

            {/* Social Login */}
            <button
              type="button"
              className="w-full flex h-14 items-center justify-center gap-3 rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] text-[#0d121c] dark:text-white text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Google ile Devam Et</span>
            </button>
          </form>

          {/* Footer Registration */}
          <div className="mt-10 text-center">
            <p className="text-[#48679d] dark:text-gray-400 font-medium">
              Hesabınız yok mu?
              <Link href="/register" className="text-primary font-bold hover:underline ml-1">
                Kayıt Ol
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-20 flex justify-center gap-6 text-xs text-[#48679d]/60 dark:text-gray-500 font-medium">
            <Link href="/terms" className="hover:text-primary transition-colors">Kullanım Koşulları</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Gizlilik Politikası</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Yardım Merkezi</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
