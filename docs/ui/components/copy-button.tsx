"use client"
/**
 * Copy Button Component
 *
 * A button that copies text to clipboard with visual feedback.
 * Uses createSignal for reactive state management.
 */

import { createSignal } from '@barefootjs/dom'
import { CheckIcon, CopyIcon } from '@ui/components/ui/icon'

export interface CopyButtonProps {
  code: string
}

export function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      class="absolute top-2 right-2 p-2 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Copy code"
      onClick={handleCopy}
    >
      {copied() ? (
        <CheckIcon size="sm" />
      ) : (
        <CopyIcon size="sm" />
      )}
    </button>
  )
}
