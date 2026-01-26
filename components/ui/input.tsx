'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-aero-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'w-full rounded-lg border bg-white px-4 py-2.5 text-aero-slate-900',
            'placeholder:text-aero-slate-400',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            'dark:bg-aero-slate-800 dark:text-aero-slate-100 dark:border-aero-slate-600',
            error
              ? 'border-aero-red-500 focus:border-aero-red-500 focus:ring-aero-red-500/20'
              : 'border-aero-slate-300 focus:border-aero-blue-500 focus:ring-aero-blue-500/20',
            icon && 'pl-10',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
