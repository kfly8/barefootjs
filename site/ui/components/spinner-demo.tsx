"use client"
/**
 * SpinnerDemo Components
 *
 * Interactive demos for the Spinner component:
 * - SpinnerPreviewDemo: Default spinner display
 * - SpinnerSizesDemo: Multiple size variations
 * - SpinnerButtonDemo: Button with loading state
 */

import { createSignal } from '@barefootjs/dom'
import { Spinner } from '@ui/components/ui/spinner'
import { Button } from '@ui/components/ui/button'

/**
 * Preview: Default spinner.
 */
export function SpinnerPreviewDemo() {
  return <Spinner />
}

/**
 * Sizes: Multiple spinner sizes.
 */
export function SpinnerSizesDemo() {
  return (
    <div className="flex items-center gap-4">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
      <Spinner className="size-12" />
    </div>
  )
}

/**
 * Button with loading state.
 */
export function SpinnerButtonDemo() {
  const [loading, setLoading] = createSignal(false)

  const handleClick = (e: Event) => {
    e.preventDefault()
    if (loading()) return
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <Button
      data-testid="spinner-button"
      disabled={loading()}
      onClick={handleClick}
    >
      {loading() ? <Spinner className="size-4" /> : null}
      <span data-testid="spinner-button-label">
        {loading() ? 'Processing...' : 'Submit'}
      </span>
    </Button>
  )
}
