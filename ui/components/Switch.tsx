/**
 * Switch Component
 *
 * A toggle switch component for boolean state.
 * Inspired by shadcn/ui Switch component.
 *
 * Note: This is a stateless component. State management should be handled
 * by the parent component using signals.
 */

export interface SwitchProps {
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({
  checked = false,
  disabled = false,
  onCheckedChange,
}: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      {...(disabled ? { disabled: true } : {})}
      class={`peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-zinc-900' : 'bg-zinc-200'
      }`}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span
        class={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
