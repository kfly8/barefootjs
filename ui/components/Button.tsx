"use client"
/**
 * Button Component
 *
 * A modern button component inspired by shadcn/ui.
 * Supports multiple variants, sizes, and polymorphic rendering via asChild.
 * Uses CSS variables for theming support.
 */

import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from '@barefootjs/jsx'
import { cn } from '../lib/utils'
import { Slot } from '../base/Slot'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends
  ButtonHTMLAttributes,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  class: className,
  variant = 'default',
  size = 'default',
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const buttonClass = cn(buttonVariants({ variant, size, className }))

  if (asChild) {
    // Type assertion for Hono JSX compatibility (onSubmit: SubmitEvent vs Event)
    return <Slot class={buttonClass} {...(props as any)}>{children}</Slot>
  }

  // Type assertion for Hono JSX compatibility (onSubmit: SubmitEvent vs Event)
  return <button class={buttonClass} {...(props as any)}>{children}</button>
}

export { buttonVariants }
