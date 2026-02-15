"use client"
/**
 * TextareaDemo Components
 *
 * Interactive demos for Textarea component.
 * Used in textarea documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Textarea } from '@ui/components/ui/textarea'

/**
 * Value binding example with character count
 */
export function TextareaBindingDemo() {
  const [value, setValue] = createSignal('')
  return (
    <div className="space-y-2">
      <Textarea
        textareaValue={value()}
        onInput={(e) => setValue(e.target.value)}
        textareaPlaceholder="Type your message here."
      />
      <p className="text-sm text-muted-foreground">
        <span className="char-count font-medium">{value().length}</span> characters
      </p>
    </div>
  )
}
