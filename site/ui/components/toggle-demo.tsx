"use client"
/**
 * ToggleDemo Components
 *
 * Interactive demos for Toggle component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Toggle } from '@ui/components/ui/toggle'

/**
 * Basic toggle example
 * Shows default, pressed, and disabled states with icons
 */
export function ToggleBasicDemo() {
  return (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Toggle bold">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </Toggle>
      <Toggle defaultPressed aria-label="Toggle italic">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 4h-9M14 20H5M15 4L9 20" />
        </svg>
      </Toggle>
      <Toggle disabled aria-label="Toggle underline">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 21h16" />
        </svg>
      </Toggle>
    </div>
  )
}

/**
 * Outline variant example
 * Shows outline variant toggles
 */
export function ToggleOutlineDemo() {
  return (
    <div className="flex items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle bold">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle italic">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 4h-9M14 20H5M15 4L9 20" />
        </svg>
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle underline">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 21h16" />
        </svg>
      </Toggle>
    </div>
  )
}

/**
 * Text editor toolbar example
 * Multiple toggles for formatting with active summary
 */
export function ToggleToolbarDemo() {
  const [bold, setBold] = createSignal(false)
  const [italic, setItalic] = createSignal(false)
  const [underline, setUnderline] = createSignal(false)

  const activeCount = createMemo(() =>
    [bold(), italic(), underline()].filter(Boolean).length
  )
  const activeNames = createMemo(() =>
    [bold() && 'Bold', italic() && 'Italic', underline() && 'Underline'].filter(Boolean).join(', ') || 'None'
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-md border border-input p-1">
        <Toggle
          pressed={bold()}
          onPressedChange={setBold}
          size="sm"
          aria-label="Toggle bold"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </Toggle>
        <Toggle
          pressed={italic()}
          onPressedChange={setItalic}
          size="sm"
          aria-label="Toggle italic"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 4h-9M14 20H5M15 4L9 20" />
          </svg>
        </Toggle>
        <Toggle
          pressed={underline()}
          onPressedChange={setUnderline}
          size="sm"
          aria-label="Toggle underline"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 21h16" />
          </svg>
        </Toggle>
      </div>
      <div className="text-sm text-muted-foreground">
        Active formatting: {activeNames()} ({activeCount()} selected)
      </div>
    </div>
  )
}
