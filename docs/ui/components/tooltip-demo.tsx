"use client"
/**
 * TooltipDemo Components
 *
 * Interactive demos for Tooltip component.
 * Used in tooltip documentation page.
 */

import { Tooltip } from '@ui/components/ui/tooltip'
import { Button } from '@ui/components/ui/button'

/**
 * Basic tooltip demo
 */
export function TooltipBasicDemo() {
  return (
    <Tooltip content="This is a tooltip" id="tooltip-basic">
      <span class="underline decoration-dotted cursor-help">
        Hover me
      </span>
    </Tooltip>
  )
}

/**
 * Tooltip with button (focus support)
 */
export function TooltipButtonDemo() {
  return (
    <Tooltip content="Keyboard accessible tooltip" id="tooltip-button">
      <Button>Hover or Focus</Button>
    </Tooltip>
  )
}

/**
 * Tooltip placement demo - Top
 */
export function TooltipTopDemo() {
  return (
    <Tooltip content="Top placement" placement="top" id="tooltip-top">
      <Button variant="outline">Top</Button>
    </Tooltip>
  )
}

/**
 * Tooltip placement demo - Right
 */
export function TooltipRightDemo() {
  return (
    <Tooltip content="Right placement" placement="right" id="tooltip-right">
      <Button variant="outline">Right</Button>
    </Tooltip>
  )
}

/**
 * Tooltip placement demo - Bottom
 */
export function TooltipBottomDemo() {
  return (
    <Tooltip content="Bottom placement" placement="bottom" id="tooltip-bottom">
      <Button variant="outline">Bottom</Button>
    </Tooltip>
  )
}

/**
 * Tooltip placement demo - Left
 */
export function TooltipLeftDemo() {
  return (
    <Tooltip content="Left placement" placement="left" id="tooltip-left">
      <Button variant="outline">Left</Button>
    </Tooltip>
  )
}

/**
 * Tooltip with delay demo (700ms)
 */
export function TooltipDelayDemo() {
  return (
    <Tooltip content="This tooltip has a 700ms delay" delayDuration={700} id="tooltip-delay">
      <span class="underline decoration-dotted cursor-help">
        Hover me (700ms delay)
      </span>
    </Tooltip>
  )
}

/**
 * Tooltip with no delay (immediate)
 */
export function TooltipNoDelayDemo() {
  return (
    <Tooltip content="This tooltip appears immediately" delayDuration={0} id="tooltip-no-delay">
      <span class="underline decoration-dotted cursor-help">
        Hover me (no delay)
      </span>
    </Tooltip>
  )
}
