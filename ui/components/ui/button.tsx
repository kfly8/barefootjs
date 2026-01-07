"use client"
/**
 * Button Component
 *
 * A versatile button component with multiple visual variants and sizes.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Button>Click me</Button>
 * ```
 *
 * @example With variant and size
 * ```tsx
 * <Button variant="destructive" size="lg">Delete</Button>
 * ```
 *
 * @example As a link (polymorphic rendering)
 * ```tsx
 * <Button asChild>
 *   <a href="/home">Go Home</a>
 * </Button>
 * ```
 */

import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from '@barefootjs/jsx'
import { Slot } from '../../base/slot'

/**
 * CVA variants for button styling.
 * Export this to use button styles on custom elements.
 */
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
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Props for the Button component.
 */
interface ButtonProps extends
  ButtonHTMLAttributes,
  VariantProps<typeof buttonVariants> {
  /**
   * When true, renders child element with button styling instead of `<button>`.
   * Useful for creating button-styled links or custom elements.
   * @default false
   */
  asChild?: boolean
}

/**
 * Button component with variants and sizes.
 *
 * @param props.variant - Visual style of the button
 *   - `'default'` - Primary action, solid background
 *   - `'destructive'` - Dangerous action (red)
 *   - `'outline'` - Bordered with transparent background
 *   - `'secondary'` - Muted styling for secondary actions
 *   - `'ghost'` - Minimal, visible only on hover
 *   - `'link'` - Text link appearance with underline on hover
 * @param props.size - Size of the button
 *   - `'default'` - Standard size (h-9)
 *   - `'sm'` - Small size (h-8)
 *   - `'lg'` - Large size (h-10)
 *   - `'icon'` - Square icon button (size-9)
 *   - `'icon-sm'` - Small icon button (size-8)
 *   - `'icon-lg'` - Large icon button (size-10)
 * @param props.asChild - Render child element instead of button
 */
function Button({
  class: className,
  variant = 'default',
  size = 'default',
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const buttonClass = buttonVariants({ variant, size, className })

  if (asChild) {
    return <Slot class={buttonClass} {...props}>{children}</Slot>
  }
  return <button class={buttonClass} {...props}>{children}</button>
}

export { Button, buttonVariants }
