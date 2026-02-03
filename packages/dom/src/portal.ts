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

/**
 * Options for createPortal
 */
export interface PortalOptions {
  /**
   * The scope element that owns this portal.
   * When provided, the portal element will have a data-bf-portal-owner attribute
   * set to the scope ID, allowing find() to locate elements inside the portal.
   */
  ownerScope?: Element
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
 * @param options - Optional configuration including ownerScope for scope-based find()
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
 * // With ownerScope for scope-based element detection
 * const portal = createPortal(modalEl, document.body, { ownerScope: scopeElement })
 *
 * // Access the mounted element
 * console.log(portal.element)
 *
 * // Later: unmount
 * portal.unmount()
 */
/**
 * Check if an element is inside an SSR-rendered portal.
 * SSR portals are marked with data-bf-portal-id attribute.
 *
 * @param element - Element to check
 * @returns true if element is inside an SSR portal
 */
export function isSSRPortal(element: HTMLElement): boolean {
  return element.closest('[data-bf-portal-id]') !== null
}

/**
 * Remove a portal placeholder element (used after hydration).
 * SSR Portal renders a <template data-bf-portal-placeholder="..."> as a marker.
 *
 * @param portalId - The portal ID to find and remove
 */
export function cleanupPortalPlaceholder(portalId: string): void {
  const placeholder = document.querySelector(
    `template[data-bf-portal-placeholder="${portalId}"]`
  )
  placeholder?.remove()
}

export function createPortal(
  children: PortalChildren,
  container: HTMLElement = document.body,
  options?: PortalOptions
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

  // Set portal owner for scope-based find()
  if (options?.ownerScope) {
    const scopeId = (options.ownerScope as HTMLElement).dataset?.bfScope
    if (scopeId) {
      element.setAttribute('data-bf-portal-owner', scopeId)
    }
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
