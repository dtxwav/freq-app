import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--freq-ink)]/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--freq-ink)] text-[var(--freq-paper)] hover:bg-[var(--freq-ink-soft)]',
        soft: 'bg-white/70 text-[var(--freq-ink)] border border-[var(--freq-line)] hover:bg-white',
        ghost: 'bg-transparent text-[var(--freq-ink)] hover:bg-black/5',
        attract: 'bg-[var(--freq-green)] text-white hover:brightness-105',
        deter: 'bg-[var(--freq-red)] text-white hover:brightness-105',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3.5 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
