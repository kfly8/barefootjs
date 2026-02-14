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
    <span>
      <Tooltip content="This is a tooltip" id="tooltip-basic">
        <span className="underline decoration-dotted cursor-help">
          Hover me
        </span>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip with button (focus support)
 */
export function TooltipButtonDemo() {
  return (
    <span>
      <Tooltip content="Keyboard accessible tooltip" id="tooltip-button">
        <Button>Hover or Focus</Button>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip placement demo - Top
 */
export function TooltipTopDemo() {
  return (
    <span>
      <Tooltip content="Top placement" placement="top" id="tooltip-top">
        <Button variant="outline">Top</Button>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip placement demo - Right
 */
export function TooltipRightDemo() {
  return (
    <span>
      <Tooltip content="Right placement" placement="right" id="tooltip-right">
        <Button variant="outline">Right</Button>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip placement demo - Bottom
 */
export function TooltipBottomDemo() {
  return (
    <span>
      <Tooltip content="Bottom placement" placement="bottom" id="tooltip-bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip placement demo - Left
 */
export function TooltipLeftDemo() {
  return (
    <span>
      <Tooltip content="Left placement" placement="left" id="tooltip-left">
        <Button variant="outline">Left</Button>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip with delay demo (700ms)
 */
export function TooltipDelayDemo() {
  return (
    <span>
      <Tooltip content="This tooltip has a 700ms delay" delayDuration={700} id="tooltip-delay">
        <span className="underline decoration-dotted cursor-help">
          Hover me (700ms delay)
        </span>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip with no delay (immediate)
 */
export function TooltipNoDelayDemo() {
  return (
    <span>
      <Tooltip content="This tooltip appears immediately" delayDuration={0} id="tooltip-no-delay">
        <span className="underline decoration-dotted cursor-help">
          Hover me (no delay)
        </span>
      </Tooltip>
    </span>
  )
}

/**
 * Tooltip on icon buttons (practical UI pattern)
 */
export function TooltipIconDemo() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Bold" id="tooltip-icon-bold">
        <Button variant="outline" size="icon">
          <span className="font-bold">B</span>
        </Button>
      </Tooltip>
      <Tooltip content="Italic" id="tooltip-icon-italic">
        <Button variant="outline" size="icon">
          <span className="italic">I</span>
        </Button>
      </Tooltip>
      <Tooltip content="Underline" id="tooltip-icon-underline">
        <Button variant="outline" size="icon">
          <span className="underline">U</span>
        </Button>
      </Tooltip>
    </div>
  )
}
