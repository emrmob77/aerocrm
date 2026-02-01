'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword, loading: authLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const getPasswordStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: '' }
    if (password.length < 6) return { level: 1, text: 'Zayıf', color: 'bg-aero-red-500' }
    if (password.length < 10) return { level: 2, text: 'Orta', color: 'bg-aero-amber-500' }
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: 'Güçlü', color: 'bg-aero-green-500' }
    }
    return { level: 3, text: 'İyi', color: 'bg-aero-blue-500' }
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

    const { error } = await updatePassword(password)

    if (error) {
      setError('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
      setIsLoading(false)
    } else {
      setSuccess(true)
      toast.success('Şifreniz başarıyla güncellendi!')
      setTimeout(() => {
        router.push('/login?message=password_reset')
      }, 2000)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-aero-slate-50 dark:bg-aero-slate-900">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-aero-green-100 dark:bg-aero-green-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-aero-green-500">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-4">
            Şifreniz Güncellendi!
          </h2>
          <p className="text-aero-slate-600 dark:text-aero-slate-400 mb-8">
            Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-aero-slate-50 dark:bg-aero-slate-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="ml-3 font-bold text-2xl text-aero-slate-900 dark:text-white">AERO</span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-aero-slate-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-aero-blue-500">password</span>
            </div>
            <h2 className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-2">
              Yeni Şifre Belirleyin
            </h2>
            <p className="text-aero-slate-500 dark:text-aero-slate-400 text-sm">
              Güçlü bir şifre seçin. En az 6 karakter kullanın.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-aero-red-50 dark:bg-aero-red-900/20 border border-aero-red-200 dark:border-aero-red-800 rounded-lg">
              <p className="text-sm text-aero-red-600 dark:text-aero-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 mb-1.5">
                Yeni Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-aero-slate-400">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-12 pr-12"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-aero-slate-400 hover:text-aero-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
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
                          level <= passwordStrength.level ? passwordStrength.color : 'bg-aero-slate-200 dark:bg-aero-slate-700'
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    'text-xs',
                    passwordStrength.level <= 1 ? 'text-aero-red-500' :
                    passwordStrength.level === 2 ? 'text-aero-amber-500' :
                    passwordStrength.level === 3 ? 'text-aero-blue-500' :
                    'text-aero-green-500'
                  )}>
                    {passwordStrength.text}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 mb-1.5">
                Şifreyi Tekrar Girin
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-aero-slate-400">
                  lock
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-12"
                  required
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-aero-red-500">Şifreler eşleşmiyor</p>
              )}
              {confirmPassword && password === confirmPassword && password.length > 0 && (
                <p className="mt-1 text-xs text-aero-green-500">Şifreler eşleşiyor</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword}
              className="w-full btn-primary btn-lg disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
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

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-aero-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
