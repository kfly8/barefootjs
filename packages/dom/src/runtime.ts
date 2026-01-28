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
  const parentEl = parent as HTMLElement

  // Check if parent is the scope element itself
  // This handles two cases:
  // 1. Scope ID starts with component name (e.g., "AddTodoForm_abc123")
  // 2. Scope ID is from parent component via initChild (e.g., "TodoApp_xyz_slot_5")
  //    In this case, initChild already found the correct element, so trust it
  if (parentEl?.dataset?.bfScope) {
    const scopeId = parentEl.dataset.bfScope
    // Accept if it matches the name prefix OR if it's a child slot pattern
    // (when initChild passes the scope element directly)
    if (
      scopeId.startsWith(`${name}_`) ||
      (scopeId.includes('_slot_') && parent !== document)
    ) {
      // Mark as initialized if not already
      if (!parentEl.hasAttribute('data-bf-init')) {
        parentEl.setAttribute('data-bf-init', 'true')
      }
      return parent as Element
    }
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
 * Check if an element belongs directly to a scope (not in a nested scope).
 * Returns true only if the element's nearest scope is exactly the given scope.
 * Elements inside nested child scopes (which have their own data-bf-scope) return false.
 */
function belongsToScope(
  element: Element,
  scope: Element,
  isLookingForScope = false
): boolean {
  // If element has its own scope, it's a component root
  const elementScope = (element as HTMLElement).dataset?.bfScope
  if (elementScope) {
    // When looking for child scope elements (data-bf-scope selectors),
    // include them if they are within the scope (at any depth)
    if (isLookingForScope) {
      return scope.contains(element)
    }
    // When looking for slot elements (data-bf selectors),
    // exclude component roots to prevent slot ID collision
    return false
  }

  // Element doesn't have its own scope - check if nearest scope matches
  const nearestScope = element.closest('[data-bf-scope]')
  return nearestScope === scope
}

/**
 * Find the first matching element in a NodeList that belongs to the given scope.
 */
function findFirstInScope(
  matches: NodeListOf<Element>,
  scope: Element,
  isLookingForScope = false
): Element | null {
  for (const element of matches) {
    if (belongsToScope(element, scope, isLookingForScope)) {
      return element
    }
  }
  return null
}

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

  // Detect if we're looking for scope elements (child components)
  // vs slot elements (internal structure)
  const isLookingForScope = selector.includes('data-bf-scope')

  // For non-scope selectors, check if scope itself matches first
  if (!isLookingForScope && scope.matches?.(selector)) return scope

  // Search descendants, excluding nested scopes for slot searches
  // For scope selectors, prioritize finding child scope elements
  const found = findFirstInScope(
    scope.querySelectorAll(selector),
    scope,
    isLookingForScope
  )
  if (found) return found

  // For scope selectors, if no descendant found, check if scope itself matches
  // This handles cases where the component root IS the slot element (e.g., ButtonDemo)
  // Only falls back to self-match when no child was found (child priority)
  if (isLookingForScope && scope.matches?.(selector)) return scope

  // For fragment roots, elements may be in sibling scope elements
  // Search siblings that share the EXACT SAME scope ID
  const scopeId = (scope as HTMLElement).dataset?.bfScope
  if (scopeId) {
    const parent = scope.parentElement
    if (parent) {
      const siblings = parent.querySelectorAll(`[data-bf-scope="${scopeId}"]`)
      for (const sibling of siblings) {
        if (sibling === scope) continue
        if (sibling.matches?.(selector)) return sibling
        const siblingFound = findFirstInScope(
          sibling.querySelectorAll(selector),
          sibling,
          isLookingForScope
        )
        if (siblingFound) return siblingFound
      }
    }
  }

  return null
}

// --- hydrate ---

/**
 * Auto-hydrate all instances of a component on the page.
 * Finds scope elements and their corresponding props, then initializes each instance.
 * Supports Suspense streaming by using requestAnimationFrame for delayed re-hydration.
 *
 * @param name - Component name
 * @param init - Init function for the component
 */
export function hydrate(
  name: string,
  init: (props: Record<string, unknown>, idx: number, scope: Element) => void
): void {
  const doHydrate = () => {
    // Only select uninitialized elements (skip already hydrated ones)
    const scopeEls = document.querySelectorAll(
      `[data-bf-scope^="${name}_"]:not([data-bf-init])`
    )

    // Track initialized scope IDs to avoid duplicate initialization
    // (Fragment roots have multiple elements with the same scope ID)
    const initializedScopes = new Set<string>()

    for (const scopeEl of scopeEls) {
      // Skip nested instances when parent is the same component type.
      // This prevents double initialization (parent's initChild handles it).
      //
      // Different parent types are allowed to hydrate independently:
      //   - ToggleItem inside Toggle → hydrate (different types)
      //   - Counter inside Counter → skip (same type, parent initializes)
      //
      // Note: This relies on scopeId format "ComponentName_xxxxx"
      const parentScope = scopeEl.parentElement?.closest('[data-bf-scope]')
      if (parentScope) {
        const parentScopeId = (parentScope as HTMLElement).dataset.bfScope
        if (parentScopeId?.startsWith(name + '_')) continue
      }

      // Get unique instance ID from scope element
      const instanceId = (scopeEl as HTMLElement).dataset.bfScope
      if (!instanceId) continue

      // Skip if already initialized in this batch (for fragment roots)
      if (initializedScopes.has(instanceId)) continue
      initializedScopes.add(instanceId)

      // Mark as initialized immediately to prevent duplicate init
      scopeEl.setAttribute('data-bf-init', 'true')

      // Find corresponding props script by instance ID
      const propsEl = document.querySelector(
        `script[data-bf-props="${instanceId}"]`
      )
      const props = propsEl ? JSON.parse(propsEl.textContent || '{}') : {}

      init(props, 0, scopeEl)
    }
  }

  // Immediately hydrate elements already in DOM
  doHydrate()

  // Re-hydrate after next frame (for Suspense streaming support)
  // Hono's streaming script moves template content into document after initial script execution
  requestAnimationFrame(doHydrate)
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

// --- insert ---

/**
 * Branch configuration for conditional rendering.
 * Contains template and event binding functions for each branch.
 */
export interface BranchConfig {
  /** HTML template function for this branch */
  template: () => string

  /**
   * Bind events to elements within the branch.
   * Called both during hydration (for SSR elements) and after DOM swaps.
   * @param scope - The scope element to search within for event targets
   */
  bindEvents: (scope: Element) => void
}


/**
 * Handle conditional DOM updates using branch configurations.
 * This is the SolidJS-inspired replacement for cond() that properly
 * handles event binding for both branches.
 *
 * Key behaviors:
 * - First run (hydration): Reuse SSR element, call branch.bindEvents() for current branch
 * - Condition change: Create new element from template, call branch.bindEvents()
 *
 * @param scope - Component scope element
 * @param id - Conditional slot ID (e.g., 'slot_0')
 * @param conditionFn - Function that returns current condition value
 * @param whenTrue - Branch config for when condition is true
 * @param whenFalse - Branch config for when condition is false
 */
export function insert(
  scope: Element | null,
  id: string,
  conditionFn: () => boolean,
  whenTrue: BranchConfig,
  whenFalse: BranchConfig
): void {
  if (!scope) return

  // Check if either branch uses fragment conditional (comment markers)
  // Both branches need to be checked because SSR may render either branch
  const sampleTrue = whenTrue.template()
  const sampleFalse = whenFalse.template()
  const isFragmentCond = sampleTrue.includes(`<!--bf-cond-start:${id}-->`) ||
                         sampleFalse.includes(`<!--bf-cond-start:${id}-->`)

  let prevCond: boolean | undefined

  createEffect(() => {
    const currCond = Boolean(conditionFn())
    const isFirstRun = prevCond === undefined
    const prevVal = prevCond
    prevCond = currCond

    // Select the appropriate branch
    const branch = currCond ? whenTrue : whenFalse

    if (isFirstRun) {
      // Hydration mode: check if existing DOM matches expected branch
      // If the existing element doesn't match the expected branch,
      // we need to swap the DOM first (e.g., SSR rendered whenFalse but now we need whenTrue)
      const existingEl = scope.querySelector(`[data-bf-cond="${id}"]`)
      if (existingEl) {
        // Check if the existing element type matches what we expect
        // For simple cases, compare tag names from templates
        const expectedTemplate = branch.template()
        const expectedTag = getFirstTagFromTemplate(expectedTemplate)
        const actualTag = existingEl.tagName.toLowerCase()

        if (expectedTag && actualTag !== expectedTag) {
          // DOM doesn't match expected branch - need to swap
          const html = branch.template()
          if (isFragmentCond) {
            updateFragmentConditional(scope, id, html)
          } else {
            updateElementConditional(scope, id, html)
          }
        }
      } else if (isFragmentCond) {
        // For @client fragment conditionals, SSR renders only comment markers.
        // We need to insert the actual content on first run.
        const html = branch.template()
        updateFragmentConditional(scope, id, html)
      }

      // Bind events to the (possibly updated) SSR element
      branch.bindEvents(scope)

      // Auto-focus on first run too (for components created via createComponent with editing=true)
      autoFocusConditionalElement(scope, id)
      return
    }

    if (currCond === prevVal) {
      return
    }

    // Condition changed: swap DOM and bind events
    const html = branch.template()

    if (isFragmentCond) {
      updateFragmentConditional(scope, id, html)
    } else {
      updateElementConditional(scope, id, html)
    }

    // Bind events to the newly inserted element
    branch.bindEvents(scope)

    // Auto-focus elements with autofocus attribute (for dynamically created elements)
    autoFocusConditionalElement(scope, id)
  })
}

/**
 * Auto-focus elements with autofocus attribute within a conditional slot.
 * Used by insert() to focus inputs when they become visible.
 * Uses requestAnimationFrame to ensure element is in DOM before focusing.
 */
function autoFocusConditionalElement(scope: Element, id: string): void {
  // Use requestAnimationFrame to defer focus until after DOM updates.
  // This is necessary because createComponent() may call insert() before
  // the element is added to the document by reconcileList().
  requestAnimationFrame(() => {
    const condEl = scope.querySelector(`[data-bf-cond="${id}"]`)
    if (condEl) {
      const autofocusEl = condEl.matches('[autofocus]')
        ? condEl
        : condEl.querySelector('[autofocus]')
      if (autofocusEl && typeof (autofocusEl as HTMLElement).focus === 'function') {
        ;(autofocusEl as HTMLElement).focus()
      }
    }
  })
}

/**
 * Extract the first tag name from an HTML template string.
 * Returns lowercase tag name or null if not found.
 */
function getFirstTagFromTemplate(template: string): string | null {
  const match = template.match(/^<(\w+)/)
  return match ? match[1].toLowerCase() : null
}

// --- Component Registry ---

/**
 * Component init function type for registry
 */
export type ComponentInitFn = (
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
 * Pending child initializations queue.
 * When initChild is called before the child component's script loads,
 * the initialization is queued here and processed when the component registers.
 */
const pendingChildInits = new Map<string, Array<{ scope: Element; props: Record<string, unknown> }>>()

/**
 * Register a component's init function for parent initialization.
 * Also processes any pending initChild calls that were queued before
 * this component's script loaded.
 *
 * @param name - Component name (e.g., 'Counter', 'AddTodoForm')
 * @param init - Init function that takes (idx, scope, props)
 */
export function registerComponent(name: string, init: ComponentInitFn): void {
  componentRegistry.set(name, init)

  // Process any pending initChild calls for this component
  const pending = pendingChildInits.get(name)
  if (pending) {
    pendingChildInits.delete(name)
    for (const { scope, props } of pending) {
      if (!scope.hasAttribute('data-bf-init')) {
        init(0, scope, props)
      }
    }
  }
}

/**
 * Get a component's init function from the registry.
 * Used by createComponent() to initialize dynamically created components.
 *
 * @param name - Component name
 * @returns Init function or undefined if not registered
 */
export function getComponentInit(name: string): ComponentInitFn | undefined {
  return componentRegistry.get(name)
}

/**
 * Initialize a child component with props from parent.
 * Used by parent components to pass function props (like onAdd) to children.
 *
 * If the child component's script hasn't loaded yet, the initialization is
 * queued and will be processed when the component registers via registerComponent().
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
  if (!childScope) return

  const init = componentRegistry.get(name)
  if (init) {
    // Component already registered - initialize immediately
    if (!childScope.hasAttribute('data-bf-init')) {
      init(0, childScope, props)
    }
  } else {
    // Component not yet registered - queue for later
    if (!pendingChildInits.has(name)) {
      pendingChildInits.set(name, [])
    }
    pendingChildInits.get(name)!.push({ scope: childScope, props })
  }
}

// --- updateClientMarker ---

/**
 * Update text content for a client marker.
 * Used for @client directive expressions that are evaluated only on the client side.
 *
 * Expects comment marker format: <!--bf-client:slot_X-->
 * Both GoTemplateAdapter and HonoAdapter output this format for @client directives.
 *
 * A zero-width space (\u200B) is used as a prefix to mark text nodes managed by @client.
 * This allows distinguishing managed text nodes from other content.
 *
 * @param scope - The component scope element to search within
 * @param id - The slot ID (e.g., 'slot_5')
 * @param value - The value to display (will be converted to string)
 */
export function updateClientMarker(scope: Element | null, id: string, value: unknown): void {
  if (!scope) return

  const marker = `bf-client:${id}`
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_COMMENT)

  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue === marker) {
      const comment = walker.currentNode
      let textNode = comment.nextSibling

      // Check if next sibling is our managed text node (prefixed with zero-width space)
      if (textNode?.nodeType !== Node.TEXT_NODE ||
          !textNode.nodeValue?.startsWith('\u200B')) {
        // Create new text node with zero-width space marker
        textNode = document.createTextNode('\u200B' + String(value ?? ''))
        // Insert after the comment node
        comment.parentNode?.insertBefore(textNode, comment.nextSibling)
      } else {
        // Update existing managed text node
        textNode.nodeValue = '\u200B' + String(value ?? '')
      }
      return
    }
  }
}
