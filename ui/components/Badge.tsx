/**
 * Badge Component
 *
 * A small status indicator component inspired by shadcn/ui.
 * Supports multiple variants for different semantic meanings.
 * Uses CSS variables for theming support.
 */

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface BadgeProps {
  variant?: BadgeVariant
  children?: any
}

export function Badge({
  variant = 'default',
  children
}: BadgeProps) {
  return (
    <span
      class={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
        variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80' :
        variant === 'outline' ? 'border border-border text-foreground' :
        'bg-primary text-primary-foreground hover:bg-primary/80'
      }`}
    >
      {children}
    </span>
  )
}
