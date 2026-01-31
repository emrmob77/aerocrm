'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword, isAuthenticated, loading: authLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Check if user has access to this page (came from password reset email)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // If not authenticated, they shouldn't be on this page
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const getPasswordStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: '' }
    if (password.length < 6) return { level: 1, text: 'Zayıf', color: 'bg-red-500' }
    if (password.length < 10) return { level: 2, text: 'Orta', color: 'bg-amber-500' }
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: 'Güçlü', color: 'bg-green-500' }
    }
    return { level: 3, text: 'İyi', color: 'bg-blue-500' }
  }

  const passwordStrength = getPasswordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setIsLoading(true)

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#48679d] dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-3">
            Şifreniz Güncellendi!
          </h2>
          <p className="text-[#48679d] dark:text-gray-400 mb-6">
            Yeni şifreniz başarıyla kaydedildi. Artık giriş yapabilirsiniz.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Dashboard&apos;a Git
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-[#f5f6f8] dark:bg-[#101722]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-primary text-4xl font-black tracking-tighter">AERO</h1>
          </Link>
          <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-2">
            Yeni Şifre Belirleyin
          </h2>
          <p className="text-[#48679d] dark:text-gray-400">
            Hesabınız için güçlü bir şifre oluşturun.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#0d121c] dark:text-gray-200 text-base font-medium leading-normal">
              Yeni Şifre
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
            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  ))}
                </div>
                <p className={cn(
                  'text-xs',
                  passwordStrength.level <= 1 ? 'text-red-500' :
                  passwordStrength.level === 2 ? 'text-amber-500' :
                  passwordStrength.level === 3 ? 'text-blue-500' :
                  'text-green-500'
                )}>
                  {passwordStrength.text}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#0d121c] dark:text-gray-200 text-base font-medium leading-normal">
              Şifre Tekrar
            </label>
            <div className="flex w-full items-stretch rounded-lg shadow-sm">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="flex w-full min-w-0 flex-1 rounded-l-lg text-[#0d121c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] h-14 placeholder:text-[#48679d]/50 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal transition-colors"
                required
              />
              <div className="text-[#48679d] flex border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-[#1a2230] items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                <span className="material-symbols-outlined">lock</span>
              </div>
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
            )}
            {confirmPassword.length > 0 && password === confirmPassword && (
              <p className="text-xs text-green-500">Şifreler eşleşiyor</p>
            )}
          </div>

          {/* Submit Button */}
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
                Güncelleniyor...
              </span>
            ) : (
              'Şifreyi Güncelle'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
