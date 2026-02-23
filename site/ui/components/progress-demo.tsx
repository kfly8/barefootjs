"use client"
/**
 * ProgressDemo Components
 *
 * Interactive demos for Progress component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal, createMemo, createEffect, onCleanup } from '@barefootjs/dom'
import { Progress } from '@ui/components/ui/progress'

/**
 * Simulated file upload (Preview)
 * Auto-incrementing progress with percentage text
 */
export function ProgressPreviewDemo() {
  const [progress, setProgress] = createSignal(0)

  createEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 2
      })
    }, 100)
    onCleanup(() => clearInterval(timer))
  })

  const label = createMemo(() =>
    progress() >= 100 ? 'Upload complete' : 'Uploading...'
  )

  return (
    <div className="space-y-3 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium leading-none">{label()}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{progress()}%</span>
      </div>
      <Progress value={progress()} />
    </div>
  )
}

/**
 * Static progress bars at different values
 * Shows data-state transitions
 */
export function ProgressBasicDemo() {
  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">Empty</span>
          <span className="text-sm text-muted-foreground tabular-nums">0%</span>
        </div>
        <Progress value={0} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">Half</span>
          <span className="text-sm text-muted-foreground tabular-nums">50%</span>
        </div>
        <Progress value={50} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">Complete</span>
          <span className="text-sm text-muted-foreground tabular-nums">100%</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  )
}

/**
 * Multi-step wizard with progress tracking
 * Back/Next buttons, data-state="complete" at final step
 */
export function ProgressFormDemo() {
  const totalSteps = 4
  const [step, setStep] = createSignal(1)

  const progressValue = createMemo(() =>
    Math.round(((step() - 1) / (totalSteps - 1)) * 100)
  )

  const stepLabels = ['Account', 'Profile', 'Preferences', 'Review']

  const goBack = () => setStep((s: number) => Math.max(1, s - 1))
  const goNext = () => setStep((s: number) => Math.min(totalSteps, s + 1))

  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Setup Wizard</h4>
        <p className="text-sm text-muted-foreground">
          Step {step()} of {totalSteps}: {stepLabels[step() - 1]}
        </p>
      </div>
      <Progress value={progressValue()} />
      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={step() <= 1}
          onClick={goBack}
        >
          Back
        </button>
        <span className="text-sm text-muted-foreground tabular-nums">{progressValue()}%</span>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={step() >= totalSteps}
          onClick={goNext}
        >
          Next
        </button>
      </div>
    </div>
  )
}
