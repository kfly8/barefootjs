/**
 * BarefootJS - List Reconciliation
 *
 * Key-based DOM reconciliation for efficient list updates.
 * Preserves existing DOM elements when their key hasn't changed,
 * preventing conflicts with in-flight events (e.g., blur).
 *
 * Supports two rendering modes:
 * 1. Template mode: renderItem returns HTML string
 * 2. Element mode: renderItem returns HTMLElement (for component-based rendering)
 */

import { getPropsUpdateFn, getComponentProps } from './component'
import { BF_SCOPE, BF_SLOT, BF_HYDRATED, BF_COND } from './attrs'


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
 *
 * @example Template mode:
 * reconcileList(
 *   ulElement,
 *   todos(),
 *   (todo) => String(todo.id),
 *   (todo) => `<li data-key="${todo.id}">${todo.text}</li>`
 * )
 *
 * @example Element mode (with createComponent):
 * reconcileList(
 *   ulElement,
 *   todos(),
 *   (todo) => String(todo.id),
 *   (todo) => createComponent('TodoItem', { todo }, todo.id)
 * )
 */
export function reconcileList<T>(
  container: HTMLElement | null,
  items: T[],
  getKey: ((item: T, index: number) => string) | null,
  renderItem: RenderItemFn<T>
): void {
  // Handle null container or items gracefully
  if (!container || !items) {
    return
  }

  // Detect rendering mode by testing first item (if available)
  // For empty arrays, we still need to clear the container
  if (items.length === 0) {
    container.innerHTML = ''
    return
  }

  // Test the render function with first item to detect mode
  const testResult = renderItem(items[0], 0)
  const isElementMode = testResult instanceof HTMLElement

  if (isElementMode) {
    reconcileListElements(
      container,
      items,
      getKey,
      renderItem as (item: T, index: number) => HTMLElement,
      testResult
    )
  } else {
    reconcileListTemplates(
      container,
      items,
      getKey,
      renderItem as (item: T, index: number) => string
    )
  }
}

/**
 * Reconcile list using HTMLElement mode (for createComponent).
 * Reuses existing elements by key, creates new elements as needed.
 * For SSR-rendered elements that haven't been initialized, this function
 * will initialize them using the component init function.
 */
function reconcileListElements<T>(
  container: HTMLElement,
  items: T[],
  getKey: ((item: T, index: number) => string) | null,
  renderItem: (item: T, index: number) => HTMLElement,
  firstElement?: HTMLElement
): void {
  // Build key -> element map from existing children
  const existingByKey = new Map<string, HTMLElement>()
  for (const child of Array.from(container.children)) {
    const el = child as HTMLElement
    const key = el.dataset.key
    if (key !== undefined) {
      existingByKey.set(key, el)
    }
  }

  const fragment = document.createDocumentFragment()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = getKey ? getKey(item, i) : String(i)

    // Reuse firstElement for index 0 to avoid duplicate component creation
    const createEl = () => (i === 0 && firstElement) ? firstElement : renderItem(item, i)

    if (existingByKey.has(key)) {
      // An element with this key already exists
      const existingEl = existingByKey.get(key)!
      existingByKey.delete(key)

      // Check if this is an uninitialized SSR element
      // SSR elements have bf-s but no bf-h
      if (existingEl.getAttribute(BF_SCOPE) && !existingEl.hasAttribute(BF_HYDRATED)) {
        // For SSR elements, create new element with proper initialization
        const newEl = createEl()
        if (!newEl.dataset.key) {
          newEl.setAttribute('data-key', key)
        }
        fragment.appendChild(newEl)
      } else {
        // Element is already initialized - decide whether to sync or replace

        // Check if the existing element has focus (user might be typing)
        const hasFocus = existingEl.contains(document.activeElement)

        if (hasFocus) {
          // Preserve existing element to maintain focus state
          // Create temp element to get new DOM state
          const tempEl = createEl()
          syncElementState(existingEl, tempEl)
          fragment.appendChild(existingEl)
        } else {
          // No focus to preserve - use the temp element directly
          // This ensures correct events are bound (via scheduled init)
          const tempEl = createEl()
          if (!tempEl.dataset.key) {
            tempEl.setAttribute('data-key', key)
          }
          fragment.appendChild(tempEl)
        }
      }
    } else {
      // Create new element via renderItem (which calls createComponent)
      const el = createEl()
      // Ensure key is set (createComponent should set it, but ensure)
      if (!el.dataset.key) {
        el.setAttribute('data-key', key)
      }
      fragment.appendChild(el)
    }
  }

  // Clear container and append - unused elements are removed
  container.innerHTML = ''
  container.appendChild(fragment)
}

/**
 * Sync reactive DOM state from a source element to a target element.
 * Copies class names, replaces conditional elements, and syncs text content.
 */
function syncElementState(target: HTMLElement, source: HTMLElement): void {
  // Sync class list (for reactive classes like 'done' on TodoItem)
  target.className = source.className

  // First, sync conditional elements by replacing them entirely
  // This must be done before syncing text slots, because conditional elements
  // may contain text slots that would be lost if we only update textContent
  const sourceCondSlots = Array.from(source.querySelectorAll(`[${BF_COND}]`))
  for (const sourceCondSlot of sourceCondSlots) {
    const condId = (sourceCondSlot as HTMLElement).getAttribute(BF_COND)
    if (condId) {
      const targetCondSlot = target.querySelector(`[${BF_COND}="${condId}"]`)
      if (targetCondSlot) {
        // Move the source element directly (not clone) to preserve event listeners
        // The source element comes from createComponent which has already bound events
        // Using cloneNode() would lose the event listeners since DOM cloning
        // doesn't copy event handlers attached via JavaScript
        targetCondSlot.replaceWith(sourceCondSlot)
      }
    }
  }

  // Then sync text content of bf slots that are NOT inside conditional elements
  // (conditional elements were already replaced above)
  const sourceSlots = source.querySelectorAll(`[${BF_SLOT}]`)
  for (const sourceSlot of sourceSlots) {
    const slotId = (sourceSlot as HTMLElement).getAttribute(BF_SLOT)
    if (slotId) {
      // Skip if this slot is inside a conditional element (already handled)
      if (sourceSlot.closest(`[${BF_COND}]`)) continue

      const targetSlot = target.querySelector(`[${BF_SLOT}="${slotId}"]`)
      if (targetSlot && sourceSlot.textContent !== null) {
        // Only update text content if no children (pure text node)
        if (sourceSlot.children.length === 0) {
          targetSlot.textContent = sourceSlot.textContent
        }
      }
    }
  }
}

/**
 * Reconcile list using template string mode (original implementation).
 * Re-renders HTML for each item, preserves focus state.
 *
 * On first run after SSR, detects server-rendered children (no data-key)
 * and preserves them by tagging with data-key instead of replacing.
 */
function reconcileListTemplates<T>(
  container: HTMLElement,
  items: T[],
  getKey: ((item: T, index: number) => string) | null,
  renderItem: (item: T, index: number) => string
): void {
  // HYDRATION: If container has children but none have data-key,
  // this is the first run after SSR. Tag existing elements and return
  // to preserve server-rendered content (which includes real component elements).
  const firstChild = container.firstElementChild as HTMLElement | null
  if (firstChild && firstChild.dataset.key === undefined) {
    for (let i = 0; i < items.length && i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement
      const key = getKey ? getKey(items[i], i) : String(i)
      child.setAttribute('data-key', key)
    }
    // Remove extra children (if SSR rendered more than current items)
    while (container.children.length > items.length) {
      container.lastElementChild?.remove()
    }
    return
  }

  // Save focus state before DOM manipulation
  const activeElement = document.activeElement as HTMLElement | null
  const focusedKey = activeElement?.closest('[data-key]')?.getAttribute('data-key')
  const focusedSelector = activeElement?.tagName?.toLowerCase()
  const focusedEventId = activeElement?.getAttribute('data-event-id')

  // Build key -> element map from existing children
  const existingByKey = new Map<string, HTMLElement>()
  for (const child of Array.from(container.children)) {
    const el = child as HTMLElement
    const key = el.dataset.key
    if (key !== undefined) {
      existingByKey.set(key, el)
    }
  }

  // Process new items and build new DOM structure
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = getKey ? getKey(item, i) : String(i)

    // Always render the new content
    const html = renderItem(item, i)
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    const newEl = template.content.firstChild as HTMLElement

    // Skip if renderItem returned empty HTML
    if (!newEl) continue

    let el: HTMLElement
    if (existingByKey.has(key)) {
      // Reuse existing element but update its content and attributes
      el = existingByKey.get(key)!
      existingByKey.delete(key) // Mark as used

      // Update attributes from new element
      updateAttributes(el, newEl)

      // Check if there's any focused input in the container
      // If so, use selective updates to avoid disrupting user input
      const hasFocusedInput = container.contains(activeElement) &&
        (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA')

      if (hasFocusedInput) {
        // Use selective update to preserve all input values
        updateChildrenSelectively(el, newEl)
      } else {
        el.innerHTML = newEl.innerHTML
      }
    } else {
      // Use newly created element
      el = newEl
    }
    fragment.appendChild(el)
  }

  // Clear and append - unused elements are automatically removed
  container.innerHTML = ''
  container.appendChild(fragment)

  // Restore focus if it was inside this container
  if (focusedKey && focusedSelector && container.contains(document.activeElement) === false) {
    const keyEl = container.querySelector(`[data-key="${focusedKey}"]`)
    if (keyEl) {
      // Find the element that had focus by tag name and event-id
      let targetEl: HTMLElement | null = null
      if (focusedEventId) {
        targetEl = keyEl.querySelector(`${focusedSelector}[data-event-id="${focusedEventId}"]`)
      }
      if (!targetEl) {
        targetEl = keyEl.querySelector(focusedSelector)
      }
      if (targetEl && typeof targetEl.focus === 'function') {
        targetEl.focus()
      }
    }
  }
}

/**
 * Selectively update children, preserving input elements that may have focus.
 * Updates text content and attributes of non-input elements.
 * When element types differ, replaces the element entirely.
 */
function updateChildrenSelectively(existing: HTMLElement, newEl: HTMLElement): void {
  const existingChildren = Array.from(existing.children) as HTMLElement[]
  const newChildren = Array.from(newEl.children) as HTMLElement[]

  for (let i = 0; i < newChildren.length && i < existingChildren.length; i++) {
    const existingChild = existingChildren[i]
    const newChild = newChildren[i]

    // Element types can differ when a conditional expression switches branches.
    // Example: {editing ? <input .../> : <span>...</span>}
    // When user presses Enter in the input to finish editing, the state changes
    // from editing=true to editing=false while the input still has focus.
    // This causes the element to change from <input> to <span>.
    if (existingChild.tagName !== newChild.tagName) {
      existingChild.replaceWith(newChild.cloneNode(true))
      continue
    }

    // For input/textarea elements, only update non-value attributes
    if (existingChild.tagName === 'INPUT' || existingChild.tagName === 'TEXTAREA') {
      updateAttributesExcept(existingChild, newChild, ['value', 'checked'])
    } else {
      // Update attributes on non-input elements
      updateAttributes(existingChild, newChild)

      // Check if this element contains an input (don't replace innerHTML in that case)
      if (!existingChild.querySelector('input, textarea')) {
        existingChild.textContent = newChild.textContent
      } else {
        // Recursively update children
        updateChildrenSelectively(existingChild, newChild)
      }
    }
  }

  // Handle case where new element has more children
  if (newChildren.length > existingChildren.length) {
    for (let i = existingChildren.length; i < newChildren.length; i++) {
      existing.appendChild(newChildren[i].cloneNode(true))
    }
  }

  // Handle case where existing element has more children
  if (existingChildren.length > newChildren.length) {
    for (let i = existingChildren.length - 1; i >= newChildren.length; i--) {
      existingChildren[i].remove()
    }
  }
}

/**
 * Update attributes on an existing element, excluding specified attribute names.
 */
function updateAttributesExcept(existing: HTMLElement, newEl: HTMLElement, excludeAttrs: string[]): void {
  const excludeSet = new Set(excludeAttrs.map(a => a.toLowerCase()))

  // Remove attributes that don't exist in new element (except excluded ones)
  const existingAttrs = Array.from(existing.attributes)
  for (const attr of existingAttrs) {
    if (!excludeSet.has(attr.name.toLowerCase()) && !newEl.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name)
    }
  }

  // Add or update attributes from new element (except excluded ones)
  const newAttrs = Array.from(newEl.attributes)
  for (const attr of newAttrs) {
    if (!excludeSet.has(attr.name.toLowerCase()) && existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value)
    }
  }
}

/**
 * Update attributes on an existing element to match a new element.
 * Preserves the element reference while updating its attributes.
 */
function updateAttributes(existing: HTMLElement, newEl: HTMLElement): void {
  // Remove attributes that don't exist in new element
  const existingAttrs = Array.from(existing.attributes)
  for (const attr of existingAttrs) {
    if (!newEl.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name)
    }
  }

  // Add or update attributes from new element
  const newAttrs = Array.from(newEl.attributes)
  for (const attr of newAttrs) {
    if (existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value)
    }
  }
}
