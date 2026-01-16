/**
 * BarefootJS - Runtime Helpers
 *
 * Internal helpers for compiler-generated ClientJS.
 * These are not part of the public API and should not be used directly by component authors.
 */

import { createEffect } from './reactive'

// --- unwrap ---

/**
 * Unwrap a prop value that may be a getter function.
 * When props are passed from parent to child components, reactive values
 * are wrapped as getter functions to maintain reactivity.
 * This helper unwraps them transparently.
 *
 * @param prop - The prop value (may be a value or a getter function)
 * @returns The unwrapped value
 */
export function unwrap<T>(prop: T | (() => T)): T {
  return typeof prop === 'function' ? (prop as () => T)() : prop
}

// --- findScope ---

/**
 * Find component scope element for hydration.
 * Supports unique instance IDs (e.g., ComponentName_abc123).
 *
 * @param name - Component name prefix to search for
 * @param idx - Instance index (for multiple instances)
 * @param parent - Parent element or scope element to search within
 * @returns The scope element or null if not found
 */
export function findScope(
  name: string,
  idx: number,
  parent: Element | Document | null
): Element | null {
  // Check if parent is the scope element itself
  if ((parent as HTMLElement)?.dataset?.bfScope?.startsWith(`${name}_`)) {
    return parent as Element
  }

  // Search for scope elements with prefix matching
  const searchRoot = parent || document
  const allScopes = Array.from(
    searchRoot.querySelectorAll(`[data-bf-scope^="${name}_"]`)
  )
  const uninitializedScopes = allScopes.filter(
    s => !s.hasAttribute('data-bf-init')
  )
  const scope = uninitializedScopes[idx] || null

  if (scope) {
    scope.setAttribute('data-bf-init', 'true')
  }

  return scope
}

// --- find ---

/**
 * Find an element within a scope.
 * Checks if the scope element itself matches first, then searches descendants.
 * Excludes elements that are inside nested scopes.
 *
 * @param scope - The scope element to search within
 * @param selector - CSS selector to match
 * @returns The matching element or null
 */
export function find(
  scope: Element | null,
  selector: string
): Element | null {
  if (!scope) return null

  // Check if scope itself matches
  if (scope.matches?.(selector)) return scope

  // Search descendants, excluding nested scopes
  const found = scope.querySelector(selector)
  if (found) {
    // Check if the found element is inside a nested scope
    const nearestScope = found.closest('[data-bf-scope]')
    // Only return if the element's nearest scope is our scope (or is the element itself)
    if (nearestScope === scope || nearestScope === found) {
      return found
    }
    // Element is in a nested scope, don't return it
  }

  // For fragment roots, elements may be in sibling scope elements
  // Search siblings that share the same scope prefix
  const scopeId = (scope as HTMLElement).dataset?.bfScope
  if (scopeId) {
    const scopePrefix = scopeId.split('_')[0] + '_'
    const parent = scope.parentElement
    if (parent) {
      // Find sibling elements with matching scope prefix
      const siblings = Array.from(parent.querySelectorAll(`[data-bf-scope^="${scopePrefix}"]`))
      for (const sibling of siblings) {
        if (sibling === scope) continue
        if (sibling.matches?.(selector)) return sibling
        const siblingFound = sibling.querySelector(selector)
        if (siblingFound) {
          // Check if the found element is inside a nested scope within the sibling
          const nearestScopeInSibling = siblingFound.closest('[data-bf-scope]')
          if (nearestScopeInSibling === sibling || nearestScopeInSibling === siblingFound) {
            return siblingFound
          }
        }
      }
    }
  }

  return null
}

// --- hydrate ---

/**
 * Auto-hydrate all instances of a component on the page.
 * Finds scope elements and their corresponding props, then initializes each instance.
 *
 * @param name - Component name
 * @param init - Init function for the component
 */
export function hydrate(
  name: string,
  init: (props: Record<string, unknown>, idx: number, scope: Element) => void
): void {
  const scopeEls = document.querySelectorAll(`[data-bf-scope^="${name}_"]`)

  // Track initialized scope IDs to avoid duplicate initialization
  // (Fragment roots have multiple elements with the same scope ID)
  const initializedScopes = new Set<string>()

  for (const scopeEl of scopeEls) {
    // Skip nested instances (inside another component's scope)
    if (scopeEl.parentElement?.closest('[data-bf-scope]')) continue

    // Get unique instance ID from scope element
    const instanceId = (scopeEl as HTMLElement).dataset.bfScope
    if (!instanceId) continue

    // Skip if already initialized (for fragment roots)
    if (initializedScopes.has(instanceId)) continue
    initializedScopes.add(instanceId)

    // Find corresponding props script by instance ID
    const propsEl = document.querySelector(
      `script[data-bf-props="${instanceId}"]`
    )
    const props = propsEl ? JSON.parse(propsEl.textContent || '{}') : {}

    init(props, 0, scopeEl)
  }
}

// --- bind ---

const BOOLEAN_PROPS = [
  'disabled', 'checked', 'hidden', 'readOnly', 'required',
  'multiple', 'autofocus', 'autoplay', 'controls', 'loop',
  'muted', 'selected', 'open'
]

/**
 * Bind rest props (event listeners and reactive attributes) to an element.
 * Event listeners (on*) are attached, reactive props (functions) create effects.
 *
 * @param el - Target element
 * @param props - Props object with potential event listeners and reactive values
 */
export function bind(
  el: HTMLElement | null,
  props: Record<string, unknown>
): void {
  if (!el || !props) return

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && key.length > 2 && typeof value === 'function') {
      // Event listener: onClick -> click
      const eventName = key[2].toLowerCase() + key.slice(3)
      el.addEventListener(eventName, value as EventListener)
    } else if (typeof value === 'function') {
      // Reactive prop - create effect to update attribute
      const getter = value as () => unknown
      if (BOOLEAN_PROPS.includes(key)) {
        createEffect(() => {
          ;(el as unknown as Record<string, unknown>)[key] = !!getter()
        })
      } else {
        createEffect(() => {
          const v = getter()
          if (v != null) el.setAttribute(key, String(v))
          else el.removeAttribute(key)
        })
      }
    }
    // Static props are already rendered server-side
  }
}

// --- cond ---

/**
 * Child component initialization info for conditional re-initialization
 */
type ChildInitInfo = {
  name: string
  props: Record<string, unknown>
  init: (props: Record<string, unknown>, instanceIndex: number, parentScope: Element | null) => void
}

/**
 * Handle conditional DOM updates based on reactive condition.
 *
 * @param scope - Component scope element
 * @param id - Conditional element ID
 * @param conditionFn - Function that returns current condition value
 * @param templateFns - [whenTrueTemplateFn, whenFalseTemplateFn] Functions that return HTML strings
 * @param handlers - Optional event handlers to re-attach after DOM update
 * @param childInits - Optional child component init info for re-initialization after DOM swap
 */
export function cond(
  scope: Element | null,
  id: string,
  conditionFn: () => boolean,
  templateFns: [() => string, () => string],
  handlers?: Array<{
    selector: string
    event: string
    handler: EventListenerOrEventListenerObject
  }>,
  childInits?: {
    whenTrue: ChildInitInfo[]
    whenFalse: ChildInitInfo[]
  }
): void {
  if (!scope) return

  const [whenTrueTemplateFn, whenFalseTemplateFn] = templateFns

  // Check if this is a fragment conditional (uses comment markers)
  // We need to evaluate templates once to check for fragment markers
  const sampleTrue = whenTrueTemplateFn()
  const sampleFalse = whenFalseTemplateFn()
  const isFragmentCond = sampleTrue.includes(`<!--bf-cond-start:${id}-->`) ||
                         sampleFalse.includes(`<!--bf-cond-start:${id}-->`)

  // Track previous condition value to only replace DOM when condition changes
  let prevCond: boolean | undefined

  createEffect(() => {
    const currCond = Boolean(conditionFn())
    const isFirstRun = prevCond === undefined
    const prevVal = prevCond
    prevCond = currCond

    // On first run, skip DOM replacement but attach handlers
    if (isFirstRun) {
      if (!currCond) return
    } else if (currCond === prevVal) {
      return
    }

    if (!isFirstRun) {
      // Evaluate the template function to get the current HTML
      const html = currCond ? whenTrueTemplateFn() : whenFalseTemplateFn()

      if (isFragmentCond) {
        updateFragmentConditional(scope, id, html)
      } else {
        updateElementConditional(scope, id, html)
      }

      // Re-initialize child components after DOM swap
      if (childInits) {
        const inits = currCond ? childInits.whenTrue : childInits.whenFalse
        for (const { name, props, init } of inits) {
          // Find the scope for the newly inserted component
          // The component should be inside the conditional element
          const condEl = scope.querySelector(`[data-bf-cond="${id}"]`)
          if (condEl) {
            const componentScope = condEl.querySelector(`[data-bf-scope^="${name}"]`)
            if (componentScope && init) {
              init(props, 0, componentScope as Element)
            }
          }
        }
      }
    }

    // Re-attach event handlers
    if (handlers) {
      for (const { selector, event, handler } of handlers) {
        const el = find(scope, selector)
        if (el) {
          ;(el as unknown as Record<string, unknown>)[`on${event}`] = handler
        }
      }
    }
  })
}

/**
 * Update fragment conditional (content between comment markers)
 */
function updateFragmentConditional(scope: Element, id: string, html: string): void {
  // Find start comment marker
  const startMarker = `bf-cond-start:${id}`
  let startComment: Comment | null = null
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_COMMENT)
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue === startMarker) {
      startComment = walker.currentNode as Comment
      break
    }
  }

  const condEl = scope.querySelector(`[data-bf-cond="${id}"]`)

  const endMarker = `bf-cond-end:${id}`

  if (startComment) {
    // Remove nodes between start and end markers
    const nodesToRemove: Node[] = []
    let node = startComment.nextSibling
    while (node && !(node.nodeType === 8 && node.nodeValue === endMarker)) {
      nodesToRemove.push(node)
      node = node.nextSibling
    }
    const endComment = node
    nodesToRemove.forEach(n => n.parentNode?.removeChild(n))

    // Insert new content
    const template = document.createElement('template')
    template.innerHTML = html
    const newNodes: Node[] = []
    let child = template.content.firstChild
    while (child) {
      if (!(child.nodeType === 8 && child.nodeValue?.startsWith('bf-cond-'))) {
        newNodes.push(child.cloneNode(true))
      }
      child = child.nextSibling
    }
    newNodes.forEach(n => startComment!.parentNode?.insertBefore(n, endComment))
  } else if (condEl) {
    // Single element: replace with new content
    const template = document.createElement('template')
    template.innerHTML = html
    const firstChild = template.content.firstChild

    if (firstChild?.nodeType === 8 && firstChild?.nodeValue === `bf-cond-start:${id}`) {
      // Switching from element to fragment
      const parent = condEl.parentNode
      const nodes = Array.from(template.content.childNodes).map(n => n.cloneNode(true))
      nodes.forEach(n => parent?.insertBefore(n, condEl))
      condEl.remove()
    } else if (firstChild) {
      condEl.replaceWith(firstChild.cloneNode(true))
    }
  }
}

/**
 * Update element conditional (single element with data-bf-cond)
 */
function updateElementConditional(scope: Element, id: string, html: string): void {
  const condEl = scope.querySelector(`[data-bf-cond="${id}"]`)
  if (!condEl) return

  const template = document.createElement('template')
  template.innerHTML = html
  const newEl = template.content.firstChild
  if (newEl) {
    condEl.replaceWith(newEl.cloneNode(true))
  }
}

// --- Component Registry ---

/**
 * Component init function type for registry
 */
type ComponentInitFn = (
  idx: number,
  scope: Element | null,
  props: Record<string, unknown>
) => void

/**
 * Component registry for parent-child communication.
 * Each component registers its init function so parents can initialize children with props.
 */
const componentRegistry = new Map<string, ComponentInitFn>()

/**
 * Register a component's init function for parent initialization.
 *
 * @param name - Component name (e.g., 'Counter', 'AddTodoForm')
 * @param init - Init function that takes (idx, scope, props)
 */
export function registerComponent(name: string, init: ComponentInitFn): void {
  componentRegistry.set(name, init)
}

/**
 * Initialize a child component with props from parent.
 * Used by parent components to pass function props (like onAdd) to children.
 *
 * @param name - Child component name
 * @param childScope - The child's scope element (found by parent)
 * @param props - Props to pass to the child (including function props)
 */
export function initChild(
  name: string,
  childScope: Element | null,
  props: Record<string, unknown> = {}
): void {
  const init = componentRegistry.get(name)
  if (!init || !childScope) return

  // Only initialize if not already initialized
  if (!childScope.hasAttribute('data-bf-init')) {
    init(0, childScope, props)
  }
}
