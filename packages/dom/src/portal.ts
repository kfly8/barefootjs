/**
 * BarefootJS - Portal Utility
 *
 * Client-side utility to mount elements at arbitrary DOM positions.
 * Typically used for modals, tooltips, and other overlay UI.
 *
 * API inspired by React's createPortal(children, domNode).
 */

export type Portal = {
  /** The mounted element */
  element: HTMLElement
  /** Remove the mounted element from the DOM */
  unmount: () => void
}

/** Anything that can be converted to HTML string via toString() */
export type Renderable = { toString(): string }

/** Valid children types for createPortal */
export type PortalChildren = HTMLElement | string | Renderable

/**
 * Create a portal to mount an element at a specific container
 *
 * Similar to React's createPortal(children, domNode), this function
 * mounts the given element/HTML to the specified container.
 *
 * @param children - Element to mount (HTMLElement, HTML string, or JSX.Element)
 * @param container - Target container element (defaults to document.body)
 * @returns Portal object with element reference and unmount method
 *
 * @example
 * // With HTML string
 * const portal = createPortal(`
 *   <div class="modal-overlay">
 *     <div class="modal" role="dialog" aria-modal="true">
 *       Modal content
 *     </div>
 *   </div>
 * `, document.body)
 *
 * // With HTMLElement
 * const modalEl = document.createElement('div')
 * modalEl.className = 'modal'
 * const portal = createPortal(modalEl, document.body)
 *
 * // With JSX.Element (Hono)
 * const portal = createPortal(<Modal />, document.body)
 *
 * // Access the mounted element
 * console.log(portal.element)
 *
 * // Later: unmount
 * portal.unmount()
 */
export function createPortal(
  children: PortalChildren,
  container: HTMLElement = document.body
): Portal {
  let element: HTMLElement

  if (children instanceof HTMLElement) {
    element = children
  } else {
    // Convert to string (handles both string and Renderable)
    const html = typeof children === 'string' ? children : children.toString()

    const temp = document.createElement('div')
    temp.innerHTML = html
    const parsed = temp.firstElementChild as HTMLElement

    if (!parsed) {
      throw new Error('createPortal: Invalid HTML provided')
    }

    element = parsed
  }

  container.appendChild(element)

  return {
    element,
    unmount(): void {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }
  }
}
