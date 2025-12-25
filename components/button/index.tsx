/**
 * Button Component
 *
 * A modern button component inspired by shadcn/ui.
 * Supports multiple variants and sizes.
 */

import { createSignal } from '@barefootjs/dom'

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  children?: any
  onClick?: () => void
}

export function Button({
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  onClick
}: ButtonProps) {
  return (
    <button
      class={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 ${
        variant === 'destructive' ? 'bg-red-500 text-zinc-50 shadow-sm hover:bg-red-500/90' :
        variant === 'outline' ? 'border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 hover:text-zinc-900' :
        variant === 'secondary' ? 'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-100/80' :
        variant === 'ghost' ? 'hover:bg-zinc-100 hover:text-zinc-900' :
        variant === 'link' ? 'text-zinc-900 underline-offset-4 hover:underline' :
        'bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90'
      } ${
        size === 'sm' ? 'h-8 rounded-md px-3 text-xs' :
        size === 'lg' ? 'h-10 rounded-md px-8' :
        size === 'icon' ? 'h-9 w-9' :
        'h-9 px-4 py-2'
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
