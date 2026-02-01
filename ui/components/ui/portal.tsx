"use client"

/**
 * Portal Component
 *
 * Renders children into a DOM node that exists outside the parent hierarchy.
 * Useful for modals, tooltips, and other overlay UI.
 *
 * @example Basic usage
 * ```tsx
 * <Portal>
 *   <div className="modal">Modal content</div>
 * </Portal>
 * ```
 *
 * @example With custom container
 * ```tsx
 * <Portal container={document.getElementById('modal-root')}>
 *   <div className="modal">Modal content</div>
 * </Portal>
 * ```
 */

import { onCleanup, onMount } from '@barefootjs/dom'
import type { Child } from '../../types'

/**
 * Props for Portal component.
 */
interface PortalProps {
  /** Content to render in the portal */
  children?: Child
  /** Target container element (defaults to document.body) */
  container?: HTMLElement | null
}

/**
 * Portal component that renders children into a separate DOM node.
 *
 * Uses BarefootJS's createPortal under the hood.
 * SSR-safe: only mounts when running in browser.
 *
 * @param props.children - Content to render
 * @param props.container - Target container (defaults to document.body)
 */
function Portal({ children, container }: PortalProps) {
  // SSR guard: don't render on server
  if (typeof document === 'undefined') {
    return null
  }

  // Create a wrapper element to hold the portal content
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-slot', 'portal')

  const targetContainer = container ?? document.body

  onMount(() => {
    targetContainer.appendChild(wrapper)
  })

  onCleanup(() => {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper)
    }
  })

  // Render children into the wrapper
  return (
    <div ref={(el: HTMLElement) => {
      // Move content to portal wrapper on mount
      onMount(() => {
        if (el && el.parentNode) {
          while (el.firstChild) {
            wrapper.appendChild(el.firstChild)
          }
          // Hide the original container
          el.style.display = 'none'
        }
      })
    }}>
      {children}
    </div>
  )
}

export { Portal }
export type { PortalProps }
