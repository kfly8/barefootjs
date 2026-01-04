"use client"
/**
 * Button Component
 *
 * A modern button component inspired by shadcn/ui.
 * Supports multiple variants and sizes.
 * Uses CSS variables for theming support.
 */

import { createSignal } from '@barefootjs/dom'
import type { Child } from '../types'

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  children?: Child
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
      class={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
        variant === 'destructive' ? 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90' :
        variant === 'outline' ? 'border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground' :
        variant === 'secondary' ? 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80' :
        variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' :
        variant === 'link' ? 'text-primary underline-offset-4 hover:underline' :
        'bg-primary text-primary-foreground shadow hover:bg-primary/90'
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
