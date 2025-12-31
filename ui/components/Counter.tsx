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

import type { Child } from '../types'

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
        class={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-medium shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
        {...(disabled ? { disabled: true } : {})}
        onClick={onDecrement}
        aria-label="Decrement"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
        </svg>
      </button>
      <span class="min-w-12 text-center text-lg font-medium tabular-nums">
        {value}
      </span>
      <button
        class={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-medium shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
        {...(disabled ? { disabled: true } : {})}
        onClick={onIncrement}
        aria-label="Increment"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
      </button>
    </div>
  )
}
