/**
 * BarefootJS - Portal Utility
 *
 * Client-side utility to mount elements at arbitrary DOM positions.
 * Typically used for modals, tooltips, and other overlay UI.
 */

export type Portal = {
  /** Mount HTML string to the container, returns the mounted element */
  mount: (html: string) => HTMLElement
  /** Remove the mounted element from the DOM */
  unmount: () => void
}

/**
 * Create a portal to mount elements at a specific container
 *
 * @param container - Target container element (defaults to document.body)
 * @returns Portal object with mount and unmount methods
 *
 * @example
 * const portal = createPortal(document.body)
 *
 * // Mount modal HTML
 * const modalEl = portal.mount(`
 *   <div class="modal-overlay">
 *     <div class="modal" role="dialog" aria-modal="true">
 *       Modal content
 *     </div>
 *   </div>
 * `)
 *
 * // Later: unmount
 * portal.unmount()
 */
export function createPortal(
  container: HTMLElement = document.body
): Portal {
  let mountedElement: HTMLElement | null = null

  return {
    mount(html: string): HTMLElement {
      // Unmount previous element if exists
      if (mountedElement && mountedElement.parentNode) {
        mountedElement.parentNode.removeChild(mountedElement)
      }

      // Parse HTML and mount
      const temp = document.createElement('div')
      temp.innerHTML = html
      const element = temp.firstElementChild as HTMLElement

      if (!element) {
        throw new Error('createPortal: Invalid HTML provided')
      }

      container.appendChild(element)
      mountedElement = element

      return element
    },

    unmount(): void {
      if (mountedElement && mountedElement.parentNode) {
        mountedElement.parentNode.removeChild(mountedElement)
        mountedElement = null
      }
    }
  }
}
