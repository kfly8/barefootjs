"use client"

import type { HTMLBaseAttributes } from '@barefootjs/jsx'
import { createSignal, createMemo } from '@barefootjs/dom'

/**
 * Progress Component
 *
 * Displays an indicator showing the completion progress of a task.
 * Supports controlled mode where the parent updates the value reactively.
 *
 * @example Basic usage
 * ```tsx
 * <Progress value={50} />
 * ```
 *
 * @example Custom max
 * ```tsx
 * <Progress value={3} max={10} />
 * ```
 */

// Root classes (matching shadcn/ui)
const rootBaseClasses = 'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full'

// Indicator classes
const indicatorBaseClasses = 'bg-primary h-full w-full flex-1 transition-all'

/**
 * Props for the Progress component.
 */
interface ProgressProps extends HTMLBaseAttributes {
  /**
   * The current progress value.
   * @default 0
   */
  value?: number
  /**
   * The maximum value.
   * @default 100
   */
  max?: number
  /**
   * Additional classes for the indicator element.
   */
  indicatorClassName?: string
}

/**
 * Progress component for displaying task completion.
 */
function Progress(props: ProgressProps) {
  const max = props.max ?? 100

  // Track the value reactively
  const [currentValue, setCurrentValue] = createSignal(props.value ?? 0)

  // Compute percentage clamped to [0, 100]
  const percentage = createMemo(() => {
    if (max <= 0) return 0
    return Math.max(0, Math.min(100, (currentValue() / max) * 100))
  })

  // Compute data-state: "complete" when value >= max, otherwise "loading"
  const dataState = createMemo(() => currentValue() >= max ? 'complete' : 'loading')

  const rootClasses = `${rootBaseClasses} ${props.className ?? ''}`
  const indicatorClasses = `${indicatorBaseClasses} ${props.indicatorClassName ?? ''}`

  return (
    <div
      data-slot="progress"
      id={props.id}
      role="progressbar"
      aria-valuenow={currentValue()}
      aria-valuemin={0}
      aria-valuemax={max}
      data-state={dataState()}
      className={rootClasses}
    >
      <div
        data-slot="progress-indicator"
        data-state={dataState()}
        className={indicatorClasses}
        style={`transform: translateX(-${100 - percentage()}%)`}
      />
    </div>
  )
}

export { Progress }
export type { ProgressProps }
