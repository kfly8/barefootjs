/**
 * BarefootJS - List Reconciliation
 *
 * Key-based DOM reconciliation for efficient list updates.
 * Delegates to reconcileElements (component mode) or reconcileTemplates (template mode).
 */

import { reconcileElements } from './reconcile-elements'
import { reconcileTemplates } from './reconcile-templates'

/**
 * Render function type for list items.
 * Can return either an HTML string (template mode) or HTMLElement (component mode).
 */
export type RenderItemFn<T> =
  | ((item: T, index: number) => string)
  | ((item: T, index: number) => HTMLElement)

/**
 * Reconcile a list container with new items using key-based matching.
 *
 * Supports two modes:
 * - Template mode: renderItem returns HTML string
 * - Element mode: renderItem returns HTMLElement (for createComponent)
 *
 * @param container - The parent element containing list items
 * @param items - Array of items to render
 * @param getKey - Function to extract a unique key from each item (or null to use index)
 * @param renderItem - Function to render an item as HTML string or HTMLElement
 */
export function reconcileList<T>(
  container: HTMLElement | null,
  items: T[],
  getKey: ((item: T, index: number) => string) | null,
  renderItem: RenderItemFn<T>
): void {
  if (!container || !items) return

  if (items.length === 0) {
    container.innerHTML = ''
    return
  }

  // Test the render function with first item to detect mode
  const testResult = renderItem(items[0], 0)

  if (testResult instanceof HTMLElement) {
    reconcileElements(
      container,
      items,
      getKey,
      renderItem as (item: T, index: number) => HTMLElement,
      testResult
    )
  } else {
    reconcileTemplates(
      container,
      items,
      getKey,
      renderItem as (item: T, index: number) => string
    )
  }
}
