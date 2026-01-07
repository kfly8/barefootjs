"use client"
/**
 * Checkbox Component
 *
 * A styled checkbox component inspired by shadcn/ui.
 * Supports checked state binding and change events.
 * Uses CSS variables for theming support.
 */

export interface CheckboxProps {
  checked?: boolean
  disabled?: boolean
  error?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Checkbox({
  checked = false,
  disabled = false,
  error = false,
  onCheckedChange,
}: CheckboxProps) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-invalid={error}
      disabled={disabled}
      class={`peer h-4 w-4 shrink-0 rounded-sm border shadow focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        error
          ? 'border-destructive focus-visible:ring-destructive'
          : 'border-primary focus-visible:ring-ring'
      } ${
        checked ? 'bg-primary text-primary-foreground' : 'bg-background'
      }`}
      onClick={() => onCheckedChange?.(!checked)}
    >
      {checked && (
        <svg
          class="h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  )
}
