"use client"
/**
 * Counter Component
 *
 * A numeric counter with increment/decrement buttons.
 * Inspired by shadcn/ui patterns.
 *
 * Note: This is a stateless component. State management should be handled
 * by the parent component using signals.
 *
 * Compiler limitation: Local variables are not preserved during compilation,
 * so we inline all expressions directly in the JSX.
 */

import type { Child } from '../../types'
import { MinusIcon, PlusIcon } from './icon'

export interface CounterProps {
  value?: number
  disabled?: boolean
  onIncrement?: () => void
  onDecrement?: () => void
  children?: Child
}

export function Counter({
  value = 0,
  disabled = false,
  onIncrement,
  onDecrement,
}: CounterProps) {
  return (
    <div class="inline-flex items-center gap-2">
      <button
        class={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-95 ${
          disabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''
        }`}
        {...(disabled ? { disabled: true } : {})}
        onClick={onDecrement}
        aria-label="Decrement"
      >
        <MinusIcon size="sm" />
      </button>
      <span class="min-w-12 text-center text-lg font-medium tabular-nums text-foreground">
        {value}
      </span>
      <button
        class={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-95 ${
          disabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''
        }`}
        {...(disabled ? { disabled: true } : {})}
        onClick={onIncrement}
        aria-label="Increment"
      >
        <PlusIcon size="sm" />
      </button>
    </div>
  )
}
