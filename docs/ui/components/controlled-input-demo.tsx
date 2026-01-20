"use client"
/**
 * ControlledInputDemo Components
 *
 * Interactive demos for controlled input pattern.
 * Demonstrates Signal ↔ input value synchronization.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@ui/components/ui/input'

/**
 * Basic controlled input - simple two-way binding
 */
export function BasicControlledDemo() {
  const [text, setText] = createSignal('')
  return (
    <div className="space-y-2">
      <Input
        inputValue={text()}
        onInput={(e) => setText(e.target.value)}
        inputPlaceholder="Type something..."
      />
      <p className="text-sm text-muted-foreground">
        Current value: <span className="current-value font-medium text-foreground">{text()}</span>
      </p>
    </div>
  )
}

/**
 * Character count demo - real-time character counting
 */
export function CharacterCountDemo() {
  const [text, setText] = createSignal('')
  const charCount = createMemo(() => text().length)
  const remaining = createMemo(() => 100 - text().length)

  return (
    <div className="space-y-2">
      <Input
        inputValue={text()}
        onInput={(e) => setText(e.target.value)}
        inputPlaceholder="Type to see character count..."
      />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Characters: <span className="char-count font-medium text-foreground">{charCount()}</span>
        </span>
        <span className="text-muted-foreground">
          <span className="remaining-count font-medium">{remaining()}</span> remaining
        </span>
      </div>
    </div>
  )
}

/**
 * Live preview demo - text transformation preview
 */
export function LivePreviewDemo() {
  const [text, setText] = createSignal('')
  const uppercase = createMemo(() => text().toUpperCase())
  const wordCount = createMemo(() => text().trim() === '' ? 0 : text().trim().split(/\s+/).length)

  return (
    <div className="space-y-4">
      <Input
        inputValue={text()}
        onInput={(e) => setText(e.target.value)}
        inputPlaceholder="Type to see live preview..."
      />
      <div className="p-3 bg-muted rounded-md space-y-2">
        <p className="text-sm text-muted-foreground">
          Uppercase: <span className="uppercase-preview font-medium text-foreground">{uppercase()}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Word count: <span className="word-count font-medium text-foreground">{wordCount()}</span>
        </p>
      </div>
    </div>
  )
}

/**
 * Multi-input sync demo - sync between multiple inputs
 */
export function MultiInputSyncDemo() {
  const [text, setText] = createSignal('')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Input A</label>
        <Input
          inputValue={text()}
          onInput={(e) => setText(e.target.value)}
          inputPlaceholder="Type here..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Input B (synced)</label>
        <Input
          inputValue={text()}
          onInput={(e) => setText(e.target.value)}
          inputPlaceholder="Or type here..."
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Shared value: <span className="shared-value font-medium text-foreground">{text()}</span>
      </p>
    </div>
  )
}
