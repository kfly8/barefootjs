/**
 * BarefootJS - List Reconciliation
 *
 * Key-based DOM reconciliation for efficient list updates.
 * Preserves existing DOM elements when their key hasn't changed,
 * preventing conflicts with in-flight events (e.g., blur).
 */

/**
 * Reconcile a list container with new items using key-based matching.
 *
 * @param container - The parent element containing list items
 * @param items - Array of items to render
 * @param getKey - Function to extract a unique key from each item
 * @param renderItem - Function to render an item as HTML string
 *
 * @example
 * reconcileList(
 *   ulElement,
 *   todos(),
 *   (todo) => String(todo.id),
 *   (todo) => `<li data-key="${todo.id}">${todo.text}</li>`
 * )
 */
export function reconcileList<T>(
  container: HTMLElement,
  items: T[],
  getKey: (item: T, index: number) => string,
  renderItem: (item: T, index: number) => string
): void {
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
    const key = getKey(item, i)

    // Always render the new content
    const html = renderItem(item, i)
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    const newEl = template.content.firstChild as HTMLElement

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
 */
function updateChildrenSelectively(existing: HTMLElement, newEl: HTMLElement): void {
  const existingChildren = Array.from(existing.children) as HTMLElement[]
  const newChildren = Array.from(newEl.children) as HTMLElement[]

  for (let i = 0; i < newChildren.length && i < existingChildren.length; i++) {
    const existingChild = existingChildren[i]
    const newChild = newChildren[i]

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
