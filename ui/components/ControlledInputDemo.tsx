"use client"
/**
 * ControlledInputDemo Components
 *
 * Interactive demos for controlled input pattern.
 * Demonstrates Signal ↔ input value synchronization.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from './Input'

/**
 * Basic controlled input - simple two-way binding
 */
export function BasicControlledDemo() {
  const [text, setText] = createSignal('')
  return (
    <div class="space-y-2">
      <Input
        inputValue={text()}
        onInput={(e) => setText(e.target.value)}
        inputPlaceholder="Type something..."
      />
      <p class="text-sm text-zinc-400">
        Current value: <span class="current-value font-medium text-zinc-200">{text()}</span>
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
    <div class="space-y-2">
      <Input
        inputValue={text()}
        onInput={(e) => setText(e.target.value)}
        inputPlaceholder="Type to see character count..."
      />
      <div class="flex justify-between text-sm">
        <span class="text-zinc-400">
          Characters: <span class="char-count font-medium text-zinc-200">{charCount()}</span>
        </span>
        <span class="text-zinc-400">
          <span class="remaining-count font-medium">{remaining()}</span> remaining
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
    <div class="space-y-4">
      <Input
        inputValue={text()}
        onInput={(e) => setText(e.target.value)}
        inputPlaceholder="Type to see live preview..."
      />
      <div class="p-3 bg-zinc-800 rounded-md space-y-2">
        <p class="text-sm text-zinc-400">
          Uppercase: <span class="uppercase-preview font-medium text-zinc-200">{uppercase()}</span>
        </p>
        <p class="text-sm text-zinc-400">
          Word count: <span class="word-count font-medium text-zinc-200">{wordCount()}</span>
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
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm text-zinc-400">Input A</label>
        <Input
          inputValue={text()}
          onInput={(e) => setText(e.target.value)}
          inputPlaceholder="Type here..."
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm text-zinc-400">Input B (synced)</label>
        <Input
          inputValue={text()}
          onInput={(e) => setText(e.target.value)}
          inputPlaceholder="Or type here..."
        />
      </div>
      <p class="text-sm text-zinc-400">
        Shared value: <span class="shared-value font-medium text-zinc-200">{text()}</span>
      </p>
    </div>
  )
}
