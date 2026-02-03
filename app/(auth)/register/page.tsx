'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'

type Plan = 'solo' | 'pro'

export default function RegisterPage() {
  const { signUp, signInWithGoogle, loading: authLoading } = useAuth()
  const { t, get } = useI18n()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const getPasswordStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: '' }
    if (password.length < 6) return { level: 1, text: t('auth.reset.strength.weak'), color: 'bg-aero-red-500' }
    if (password.length < 10) return { level: 2, text: t('auth.reset.strength.medium'), color: 'bg-aero-amber-500' }
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: t('auth.reset.strength.strong'), color: 'bg-aero-green-500' }
    }
    return { level: 3, text: t('auth.reset.strength.good'), color: 'bg-aero-blue-500' }
  }

  const passwordStrength = getPasswordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError(t('auth.register.termsError'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.register.passwordError'))
      return
    }

    setIsLoading(true)

    const { error } = await signUp(email, password, fullName, selectedPlan)

    if (error) {
      if (error.message.includes('already registered')) {
        setError(t('auth.register.emailExists'))
      } else {
        setError(error.message)
      }
      setIsLoading(false)
    } else {
      setEmailSent(true)
      toast.success(t('auth.register.success'))
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    const { error } = await signInWithGoogle()

    if (error) {
      setError(t('auth.register.googleError'))
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Email verification sent state
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-aero-slate-50 dark:bg-aero-slate-900">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-aero-green-100 dark:bg-aero-green-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-aero-green-500">mark_email_read</span>
          </div>
          <h2 className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-4">
            {t('auth.register.emailSentTitle')}
          </h2>
          <p className="text-aero-slate-600 dark:text-aero-slate-400 mb-8">
            {t('auth.register.emailSentBody', { email })} {t('auth.register.emailSentHelp')}
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('auth.register.goToLogin')}
            </Link>
            <p className="text-sm text-aero-slate-500">
              {t('auth.forgot.noEmail')}{' '}
              <button
                onClick={() => {
                  setEmailSent(false)
                  setIsLoading(false)
                }}
                className="text-primary hover:underline"
              >
                {t('auth.register.retry')}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <span className="text-white font-bold text-4xl">A</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">AERO</h1>
            <p className="text-2xl text-white/90 font-medium mb-2">{t('auth.heroTagline')}</p>
            <p className="text-white/70 max-w-md mx-auto">
              {t('auth.register.heroSubtitle')}
            </p>
          </div>

          {/* Features List */}
          <div className="mt-12 space-y-4 text-left">
            {[t('auth.register.heroFeatures.f1'), t('auth.register.heroFeatures.f2'), t('auth.register.heroFeatures.f3')].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/90">
                <span className="material-symbols-outlined text-aero-green-500">check_circle</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="ml-3 font-bold text-2xl text-aero-slate-900 dark:text-white">AERO</span>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-2">
              {t('auth.register.title')}
            </h2>
            <p className="text-aero-slate-500 dark:text-aero-slate-400">
              {t('auth.register.planSelectTitle')}
            </p>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              {
                id: 'solo' as Plan,
                name: t('auth.register.planSoloName'),
                price: '$29',
                period: t('auth.register.planPeriod'),
                features: (get('auth.register.planSoloFeatures') as string[]) ?? [],
                popular: false,
              },
              {
                id: 'pro' as Plan,
                name: t('auth.register.planProName'),
                price: '$49',
                period: t('auth.register.planPeriod'),
                features: (get('auth.register.planProFeatures') as string[]) ?? [],
                popular: true,
              },
            ].map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all text-left',
                  selectedPlan === plan.id
                    ? 'border-aero-blue-500 bg-aero-blue-50 dark:bg-aero-blue-900/20'
                    : 'border-aero-slate-200 dark:border-aero-slate-700 hover:border-aero-slate-300 dark:hover:border-aero-slate-600'
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-aero-amber-500 text-white text-xs font-medium rounded-full">
                    {t('auth.register.popular')}
                  </span>
                )}
                <h3 className="font-semibold text-aero-slate-900 dark:text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-aero-blue-500">{plan.price}</span>
                  <span className="text-sm text-aero-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-aero-slate-600 dark:text-aero-slate-400">
                      <span className="material-symbols-outlined text-sm text-aero-green-500">check</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-aero-red-50 dark:bg-aero-red-900/20 border border-aero-red-200 dark:border-aero-red-800 rounded-lg">
              <p className="text-sm text-aero-red-600 dark:text-aero-red-400">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 mb-1.5">
                {t('auth.register.fullName')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-aero-slate-400">
                  person
                </span>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.register.fullNamePlaceholder')}
                  className="input pl-12"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 mb-1.5">
                {t('auth.email')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-aero-slate-400">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.register.emailPlaceholder')}
                  className="input pl-12"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 mb-1.5">
                {t('auth.password')}
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
                  placeholder={t('auth.passwordPlaceholder')}
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

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-aero-slate-300 text-aero-blue-500 focus:ring-aero-blue-500"
              />
              <span className="text-sm text-aero-slate-600 dark:text-aero-slate-400">
                {t('auth.register.agreePrefix')}{' '}
                <Link href="/terms" className="text-aero-blue-500 hover:underline">{t('auth.terms')}</Link>{' '}
                {t('auth.register.agreeAnd')}{' '}
                <Link href="/privacy" className="text-aero-blue-500 hover:underline">{t('auth.privacy')}</Link>{' '}
                {t('auth.register.agreeSuffix')}
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary btn-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.register.submitting')}
                </span>
              ) : (
                t('auth.register.submit')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-aero-slate-200 dark:bg-aero-slate-700" />
            <span className="text-sm text-aero-slate-400">{t('auth.divider')}</span>
            <div className="flex-1 h-px bg-aero-slate-200 dark:bg-aero-slate-700" />
          </div>

          {/* Social Login */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-aero-slate-300 dark:border-aero-slate-600 rounded-lg text-aero-slate-700 dark:text-aero-slate-300 hover:bg-aero-slate-50 dark:hover:bg-aero-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('auth.register.google')}
          </button>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-aero-slate-500 dark:text-aero-slate-400">
            {t('auth.register.haveAccount')}{' '}
            <Link href="/login" className="text-aero-blue-500 hover:text-aero-blue-600 font-medium">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
