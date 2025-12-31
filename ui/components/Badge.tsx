/**
 * Badge Component
 *
 * A small status indicator component inspired by shadcn/ui.
 * Supports multiple variants for different semantic meanings.
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
      class={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${
        variant === 'secondary' ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80' :
        variant === 'destructive' ? 'bg-red-500 text-zinc-50 hover:bg-red-500/80' :
        variant === 'outline' ? 'border border-zinc-200 text-zinc-950' :
        'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80'
      }`}
    >
      {children}
    </span>
  )
}
