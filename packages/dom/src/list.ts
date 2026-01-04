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

      // Update children content
      el.innerHTML = newEl.innerHTML
    } else {
      // Use newly created element
      el = newEl
    }
    fragment.appendChild(el)
  }

  // Clear and append - unused elements are automatically removed
  container.innerHTML = ''
  container.appendChild(fragment)
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
