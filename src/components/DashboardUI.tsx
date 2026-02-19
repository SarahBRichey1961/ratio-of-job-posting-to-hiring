import React, { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 flex-wrap sm:flex-nowrap" role="toolbar" aria-label="Page actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  icon?: string
}

export function MetricCard({ label, value, subtitle, trend, trendValue, icon }: MetricCardProps) {
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '→'
  const trendColor =
    trend === 'up'
      ? 'text-green-400'
      : trend === 'down'
      ? 'text-red-400'
      : 'text-gray-400'

  return (
    <article 
      className="bg-gray-800 border border-gray-700 rounded-lg p-5 sm:p-6 hover:border-gray-600 transition-colors duration-200"
      aria-labelledby={`metric-${label}`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 id={`metric-${label}`} className="text-gray-400 text-xs sm:text-sm font-semibold uppercase tracking-wide">
          {label}
        </h3>
        {icon && <span className="text-xl sm:text-2xl" aria-hidden="true">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-2xl sm:text-3xl font-bold text-white">
          {value}
        </p>
        {trendValue && (
          <span className={`text-xs sm:text-sm font-semibold ${trendColor}`} aria-label={`trend ${trendValue}`}>
            {trendIcon} {trendValue}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-gray-500 text-xs sm:text-sm mt-3">
          {subtitle}
        </p>
      )}
    </article>
  )
}

interface StatsSectionProps {
  children: ReactNode
}

export function StatsSection({ children }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {children}
    </div>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <article className={`bg-gray-800 border border-gray-700 rounded-lg p-5 sm:p-6 hover:border-gray-600 transition-colors duration-200 ${className}`}>
      {children}
    </article>
  )
}

interface SectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
        {title}
      </h2>
      {children}
    </section>
  )
}

interface FilterBarProps {
  children: ReactNode
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <fieldset className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-end">
        {children}
      </div>
    </fieldset>
  )
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95'

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm',
    md: 'px-4 py-2 sm:py-2.5 text-sm sm:text-base',
    lg: 'px-6 py-3 sm:py-3.5 text-base sm:text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  )
}

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, ...props }: InputProps) {
  const id = `input-${label?.replace(/\s/g, '-').toLowerCase()}`
  
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={id} className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className="bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full"
        {...props}
      />
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, options, ...props }: SelectProps) {
  const id = `select-${label?.replace(/\s/g, '-').toLowerCase()}`
  
  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      {label && (
        <label htmlFor={id} className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={id}
        className="bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer"
        {...props}
      >
        <option value="">Select an option...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
