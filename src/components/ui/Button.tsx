import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cx } from '../../lib/cx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-contrast shadow-sm hover:bg-brand-strong active:translate-y-px',
  secondary:
    'bg-surface-card text-text-strong shadow-sm ring-1 ring-inset ring-border-base hover:bg-surface-hover hover:ring-border-strong active:translate-y-px',
  ghost: 'text-text-muted hover:bg-surface-hover hover:text-text-strong',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as a React Router link to this target. */
  to?: To
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  to,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = cx(base, variantClasses[variant], sizeClasses[size], className)

  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {leftIcon}
      {children}
      {rightIcon}
    </>
  )

  if (to !== undefined) {
    return (
      <Link to={to} className={classes} aria-busy={loading || undefined}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} disabled={disabled ?? loading} className={classes} {...rest}>
      {content}
    </button>
  )
}
