/**
 * BarefootJS - Runtime Helpers
 *
 * Internal helpers for compiler-generated ClientJS.
 * These are not part of the public API and should not be used directly by component authors.
 */

import { createEffect } from './reactive'
import { registerTemplate } from './template'
import { BF_SCOPE, BF_SLOT, BF_HYDRATED, BF_PROPS, BF_COND, BF_PORTAL_OWNER, BF_CHILD_PREFIX, BF_SCOPE_COMMENT_PREFIX, BF_PARENT_OWNED_PREFIX } from './attrs'

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

// --- Comment scope registry ---

/**
 * Registry for elements that serve as scope proxies for comment-based scopes.
 * Maps an element to its comment node and the sibling range boundary.
 */
interface CommentScopeInfo {
  commentNode: Comment
  scopeId: string
}
const commentScopeRegistry = new WeakMap<Element, CommentScopeInfo>()

/**
 * Get the scope ID for an element from the comment scope registry.
 * Used by createPortal to resolve scope IDs for comment-based scopes.
 */
export function getPortalScopeId(element: Element): string | null {
  const info = commentScopeRegistry.get(element)
  return info?.scopeId ?? null
}

/**
 * Find the end boundary for a comment-based scope.
 * The boundary is the next bf-scope: comment or the end of the parent's children.
 */
function getCommentScopeBoundary(commentNode: Comment): Node | null {
  let node: Node | null = commentNode.nextSibling
  while (node) {
    if (node.nodeType === Node.COMMENT_NODE &&
        (node as Comment).nodeValue?.startsWith(BF_SCOPE_COMMENT_PREFIX)) {
      return node
    }
    node = node.nextSibling
  }
  return null // End of parent's children
}

// --- findScope ---

/**
 * Find component scope element for hydration.
 * Supports unique instance IDs (e.g., ComponentName_abc123).
 *
 * @param name - Component name prefix to search for
 * @param idx - Instance index (for multiple instances)
 * @param parent - Parent element or scope element to search within
 * @param comment - When true, fall back to comment-based scope search (fragment roots only)
 * @returns The scope element or null if not found
 */
export function findScope(
  name: string,
  idx: number,
  parent: Element | Document | null,
  comment?: boolean
): Element | null {
  const parentEl = parent as HTMLElement

  // Check comment scope registry first.
  // For fragment root components, the scope is identified by a comment marker,
  // not by the bf-s attribute on the proxy element.
  // This must be checked before the bf-s check to prevent the proxy element
  // from being incorrectly accepted and marked as hydrated (bf-h),
  // which would block child component initialization via initChild.
  if (parentEl) {
    const commentInfo = commentScopeRegistry.get(parentEl)
    if (commentInfo && commentInfo.scopeId.startsWith(`${name}_`)) {
      return parentEl
    }
  }

  // Check if parent is the scope element itself
  // This handles two cases:
  // 1. Scope ID starts with component name (e.g., "AddTodoForm_abc123")
  // 2. Scope ID is from parent component via initChild (e.g., "TodoApp_xyz_s5")
  //    In this case, initChild already found the correct element, so trust it
  const rawScope = parentEl?.getAttribute(BF_SCOPE)
  if (rawScope) {
    // Strip child prefix for name matching
    const scopeId = rawScope.startsWith(BF_CHILD_PREFIX) ? rawScope.slice(1) : rawScope
    // Accept if it matches the name prefix OR if it's a child slot pattern
    // (when initChild passes the scope element directly)
    if (
      scopeId.startsWith(`${name}_`) ||
      (/_s\d/.test(scopeId) && parent !== document)
    ) {
      // Mark as initialized if not already
      if (!parentEl.hasAttribute(BF_HYDRATED)) {
        parentEl.setAttribute(BF_HYDRATED, 'true')
      }
      return parent as Element
    }
  }

  // Search for scope elements with prefix matching
  const searchRoot = parent || document
  const allScopes = Array.from(
    searchRoot.querySelectorAll(`[${BF_SCOPE}^="${name}_"]`)
  )
  const uninitializedScopes = allScopes.filter(
    s => !s.hasAttribute(BF_HYDRATED)
  )
  const scope = uninitializedScopes[idx] || null

  if (scope) {
    scope.setAttribute(BF_HYDRATED, 'true')
    return scope
  }

  // Only fall back to comment-based search when explicitly flagged (fragment roots)
  if (comment) {
    return findScopeByComment(name, idx, searchRoot)
  }
  return null
}

/**
 * Find a scope element by walking comment nodes for bf-scope: markers.
 * Returns the first element sibling after the comment (or parent element).
 */
function findScopeByComment(
  name: string,
  idx: number,
  searchRoot: Element | Document
): Element | null {
  const prefix = BF_SCOPE_COMMENT_PREFIX
  const walker = document.createTreeWalker(
    searchRoot,
    NodeFilter.SHOW_COMMENT
  )
  let matchIdx = 0

  while (walker.nextNode()) {
    const comment = walker.currentNode as Comment
    const value = comment.nodeValue
    if (!value?.startsWith(prefix)) continue

    // Extract scope ID from comment value: "bf-scope:Name_xxx" or "bf-scope:~Name_xxx|propsJson"
    let scopeId = value.slice(prefix.length)
    // Strip child prefix
    if (scopeId.startsWith(BF_CHILD_PREFIX)) {
      scopeId = scopeId.slice(1)
    }
    // Strip props JSON suffix
    const pipeIdx = scopeId.indexOf('|')
    if (pipeIdx >= 0) {
      scopeId = scopeId.slice(0, pipeIdx)
    }

    if (!scopeId.startsWith(`${name}_`)) continue

    // Check if already initialized
    if ((comment as unknown as Record<string, boolean>).__bfInitialized) continue

    if (matchIdx === idx) {
      // Mark as initialized
      ;(comment as unknown as Record<string, boolean>).__bfInitialized = true

      // Find the scope proxy element: first element sibling after the comment
      let proxyEl: Element | null = null
      let node: Node | null = comment.nextSibling
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          proxyEl = node as Element
          break
        }
        node = node.nextSibling
      }
      // If no element sibling, use parent element
      if (!proxyEl) {
        proxyEl = comment.parentElement
      }

      if (proxyEl) {
        commentScopeRegistry.set(proxyEl, {
          commentNode: comment,
          scopeId,
        })
      }

      return proxyEl
    }
    matchIdx++
  }

  return null
}

// --- find ---

/**
 * Check if an element belongs directly to a scope (not in a nested scope).
 * Returns true only if the element's nearest scope is exactly the given scope.
 * Elements inside nested child scopes (which have their own bf-s) return false.
 */
function belongsToScope(
  element: Element,
  scope: Element,
  isLookingForScope = false
): boolean {
  // If element has its own scope, it's a component root
  const rawElementScope = element.getAttribute(BF_SCOPE)
  if (rawElementScope) {
    // Strip child prefix for ID comparison
    const elementScope = rawElementScope.startsWith(BF_CHILD_PREFIX)
      ? rawElementScope.slice(1)
      : rawElementScope
    // When looking for child scope elements (bf-s selectors),
    // accept only scopes whose ID is parentScopeId + "_sN" (single slot suffix).
    // Reject nested scopes like parentScopeId + "_sM_sN" which belong to an intermediate scope.
    if (isLookingForScope) {
      const rawScopeId = scope.getAttribute(BF_SCOPE)
      const scopeId = rawScopeId?.startsWith(BF_CHILD_PREFIX)
        ? rawScopeId.slice(1)
        : rawScopeId
      if (scopeId && elementScope.startsWith(scopeId + '_')) {
        const remainder = elementScope.slice(scopeId.length + 1)
        return /^s\d+$/.test(remainder)
      }
      // For component name prefix matches (e.g., [bf-s^="Counter_"]),
      // element scope ID won't start with parent scope ID. Use containment check.
      return scope.contains(element)
    }
    // When looking for slot elements (bf selectors),
    // exclude component roots to prevent slot ID collision
    return false
  }

  // Element doesn't have its own scope - check if nearest scope matches
  const nearestScope = element.closest(`[${BF_SCOPE}]`)
  if (nearestScope === scope) return true

  // For comment-based scopes, the scope element has no bf-s attribute.
  // Check if element is within the comment scope range.
  const commentInfo = commentScopeRegistry.get(scope)
  if (commentInfo) {
    return isInCommentScopeRange(element, commentInfo.commentNode)
  }

  return false
}

/**
 * Check if an element is within the range of a comment-based scope.
 * The range is from the comment node to the next bf-scope: comment (or end of parent).
 */
function isInCommentScopeRange(element: Element, commentNode: Comment): boolean {
  const boundary = getCommentScopeBoundary(commentNode)
  let node: Node | null = commentNode.nextSibling
  while (node && node !== boundary) {
    if (node === element || (node.nodeType === Node.ELEMENT_NODE && (node as Element).contains(element))) {
      return true
    }
    node = node.nextSibling
  }
  return false
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
  const isLookingForScope = selector.includes(BF_SCOPE)

  // Check if scope was resolved via comment-based marker
  const commentInfo = commentScopeRegistry.get(scope)
  if (commentInfo) {
    // Search within the comment scope range (siblings between comment markers)
    const found = findInCommentScopeRange(commentInfo.commentNode, selector, isLookingForScope)
    if (found) return found

    // Also search portals owned by this scope
    return findInPortals(commentInfo.scopeId, selector)
  }

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
  const scopeId = scope.getAttribute(BF_SCOPE)
  if (scopeId) {
    const parent = scope.parentElement
    if (parent) {
      const siblings = parent.querySelectorAll(`[${BF_SCOPE}="${scopeId}"]`)
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

    // Search in portals owned by this scope
    return findInPortals(scopeId, selector)
  }

  return null
}

/**
 * Search for an element within a comment-based scope range.
 * Walks siblings from the comment node to the next bf-scope: comment.
 */
function findInCommentScopeRange(
  commentNode: Comment,
  selector: string,
  isLookingForScope: boolean
): Element | null {
  const boundary = getCommentScopeBoundary(commentNode)
  let node: Node | null = commentNode.nextSibling

  while (node && node !== boundary) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      // Check if this element matches
      if (el.matches?.(selector)) return el
      // Search within this element
      if (!isLookingForScope) {
        // For slot searches, find first match that's not in a nested scope
        const matches = el.querySelectorAll(selector)
        for (const match of matches) {
          const nearestScope = match.closest(`[${BF_SCOPE}]`)
          if (!nearestScope) return match
        }
      } else {
        // For scope searches, just find matching descendants
        const match = el.querySelector(selector)
        if (match) return match
      }
    }
    node = node.nextSibling
  }
  return null
}

/**
 * Search in portals owned by a scope.
 */
function findInPortals(scopeId: string, selector: string): Element | null {
  const portals = document.querySelectorAll(`[${BF_PORTAL_OWNER}="${scopeId}"]`)
  for (const portal of portals) {
    if (portal.matches?.(selector)) return portal
    // Search within portal, excluding elements inside nested component scopes
    const matches = portal.querySelectorAll(selector)
    for (const match of matches) {
      const nearestScope = match.closest(`[${BF_SCOPE}]`)
      if (!nearestScope) {
        return match
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
  init: (props: Record<string, unknown>, idx: number, scope: Element) => void,
  comment?: boolean
): void {
  const doHydrate = () => {
    if (comment) {
      // Comment-scope-only: skip attribute-based search
      hydrateCommentScopes(name, init, new Set())
      return
    }

    // Only select uninitialized elements (skip already hydrated ones)
    const scopeEls = document.querySelectorAll(
      `[${BF_SCOPE}^="${name}_"]:not([${BF_HYDRATED}])`
    )

    // Track initialized scope IDs to avoid duplicate initialization
    // (Fragment roots have multiple elements with the same scope ID)
    const initializedScopes = new Set<string>()

    for (const scopeEl of scopeEls) {
      // Skip child components (~ prefix) - they are initialized by parent via initChild
      if (scopeEl.getAttribute(BF_SCOPE)?.startsWith(BF_CHILD_PREFIX)) continue

      // Skip nested instances when parent is the same component type.
      // This prevents double initialization (parent's initChild handles it).
      //
      // Different parent types are allowed to hydrate independently:
      //   - ToggleItem inside Toggle → hydrate (different types)
      //   - Counter inside Counter → skip (same type, parent initializes)
      //
      // Note: This relies on scopeId format "ComponentName_xxxxx"
      const parentScope = scopeEl.parentElement?.closest(`[${BF_SCOPE}]`)
      if (parentScope) {
        const rawParentScopeId = parentScope.getAttribute(BF_SCOPE)
        const parentScopeId = rawParentScopeId?.startsWith(BF_CHILD_PREFIX)
          ? rawParentScopeId.slice(1)
          : rawParentScopeId
        if (parentScopeId?.startsWith(name + '_')) continue
      }

      // Get unique instance ID from scope element
      const instanceId = scopeEl.getAttribute(BF_SCOPE)
      if (!instanceId) continue

      // Skip if already initialized in this batch (for fragment roots)
      if (initializedScopes.has(instanceId)) continue
      initializedScopes.add(instanceId)

      // Mark as initialized immediately to prevent duplicate init
      scopeEl.setAttribute(BF_HYDRATED, 'true')

      // Read props from bf-p attribute (flat format: {"propName": value, ...})
      const propsJson = scopeEl.getAttribute(BF_PROPS)
      const props = propsJson ? JSON.parse(propsJson) : {}

      init(props, 0, scopeEl)
    }
  }

  // Immediately hydrate elements already in DOM
  doHydrate()

  // Re-hydrate after next frame (for Suspense streaming support)
  // Hono's streaming script moves template content into document after initial script execution
  requestAnimationFrame(doHydrate)
}

/**
 * Hydrate components using comment-based scope markers.
 * Walks all comments in the document looking for <!--bf-scope:Name_xxx--> markers.
 */
function hydrateCommentScopes(
  name: string,
  init: (props: Record<string, unknown>, idx: number, scope: Element) => void,
  alreadyInitialized: Set<string>
): void {
  const prefix = BF_SCOPE_COMMENT_PREFIX
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT)

  while (walker.nextNode()) {
    const comment = walker.currentNode as Comment
    const value = comment.nodeValue
    if (!value?.startsWith(prefix)) continue

    // Parse scope ID and props from comment value
    let rest = value.slice(prefix.length)

    // Skip child components (~ prefix)
    if (rest.startsWith(BF_CHILD_PREFIX)) continue

    // Split scope ID from props JSON
    let scopeId = rest
    let propsJson = ''
    const pipeIdx = rest.indexOf('|')
    if (pipeIdx >= 0) {
      scopeId = rest.slice(0, pipeIdx)
      propsJson = rest.slice(pipeIdx + 1)
    }

    if (!scopeId.startsWith(`${name}_`)) continue

    // Skip if already initialized
    if ((comment as unknown as Record<string, boolean>).__bfInitialized) continue
    if (alreadyInitialized.has(scopeId)) continue

    // Mark as initialized
    ;(comment as unknown as Record<string, boolean>).__bfInitialized = true
    alreadyInitialized.add(scopeId)

    // Find the scope proxy element: first element sibling after the comment
    let proxyEl: Element | null = null
    let node: Node | null = comment.nextSibling
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        proxyEl = node as Element
        break
      }
      node = node.nextSibling
    }
    if (!proxyEl) {
      proxyEl = comment.parentElement
    }

    if (proxyEl) {
      commentScopeRegistry.set(proxyEl, {
        commentNode: comment,
        scopeId,
      })

      // Parse props from comment
      const parsed = propsJson ? JSON.parse(propsJson) : {}
      const props = parsed[name] ?? {}

      init(props, 0, proxyEl)
    }
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
      // Use DOM property for value: setAttribute('value', x) only sets the
      // initial HTML attribute; after user interaction the property diverges.
      if (key === 'value') {
        createEffect(() => {
          const val = String(getter() ?? '')
          const input = el as HTMLInputElement
          if (input.value !== val) {
            const start = input.selectionStart
            const end = input.selectionEnd
            input.value = val
            if (document.activeElement === el && start !== null) {
              input.setSelectionRange(start, end)
            }
          }
        })
      } else if (BOOLEAN_PROPS.includes(key)) {
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
          const condEl = scope.querySelector(`[${BF_COND}="${id}"]`)
          if (condEl) {
            const componentScope = condEl.querySelector(`[${BF_SCOPE}^="${name}"]`)
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

  const condEl = scope.querySelector(`[${BF_COND}="${id}"]`)

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
 * Update element conditional (single element with bf-c)
 */
function updateElementConditional(scope: Element, id: string, html: string): void {
  const condEl = scope.querySelector(`[${BF_COND}="${id}"]`)
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
 * @param id - Conditional slot ID (e.g., 's0')
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
      const html = branch.template()
      const existingEl = scope.querySelector(`[${BF_COND}="${id}"]`)
      if (existingEl) {
        // Check if the existing element type matches what we expect
        // For simple cases, compare tag names from templates
        const expectedTag = getFirstTagFromTemplate(html)
        const actualTag = existingEl.tagName.toLowerCase()

        if (expectedTag && actualTag !== expectedTag) {
          // DOM doesn't match expected branch - need to swap
          if (isFragmentCond) {
            updateFragmentConditional(scope, id, html)
          } else {
            updateElementConditional(scope, id, html)
          }
        }
      } else if (isFragmentCond) {
        // For @client fragment conditionals, SSR renders only comment markers.
        // We need to insert the actual content on first run.
        updateFragmentConditional(scope, id, html)
      }

      // Bind events to the (possibly updated) SSR element
      branch.bindEvents(scope)

      // Auto-focus on first run too (for components created via createComponent with editing=true)
      autoFocusConditionalElement(scope, id)
      return
    }

    // Skip if condition hasn't changed.
    // Reactive updates within a branch are handled by the effect system,
    // not by DOM replacement. Only replace DOM when the branch switches.
    if (currCond === prevVal) {
      return
    }

    // Branch changed: swap DOM and bind events
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
    const condEl = scope.querySelector(`[${BF_COND}="${id}"]`)
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
 * Queue of pending child initializations waiting for components to register.
 * Key: component name, Value: array of pending init requests
 */
const pendingChildInits = new Map<string, Array<{ scope: Element; props: Record<string, unknown> }>>()

/**
 * Register a component's init function for parent initialization.
 * Also processes any pending child initializations for this component.
 *
 * @param name - Component name (e.g., 'Counter', 'AddTodoForm')
 * @param init - Init function that takes (idx, scope, props)
 */
export function registerComponent(name: string, init: ComponentInitFn): void {
  componentRegistry.set(name, init)

  // Process any pending child initializations for this component
  const pending = pendingChildInits.get(name)
  if (pending) {
    for (const { scope, props } of pending) {
      // Skip if already initialized as a child component.
      // When scope has no ~ prefix, it's a root component whose parent
      // marked it with bf-h during hydrate — still needs child init.
      if (scope.hasAttribute(BF_HYDRATED) && scope.getAttribute(BF_SCOPE)?.startsWith(BF_CHILD_PREFIX)) {
        continue
      }
      init(0, scope, props)
    }
    pendingChildInits.delete(name)
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
 * If the child component's script hasn't loaded yet (component not registered),
 * queues the initialization request. When the component registers via
 * registerComponent(), pending initializations are processed synchronously.
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
  if (!init) {
    // Component not registered yet - queue initialization for when it registers
    // This handles cases where parent script loads before child script
    if (!pendingChildInits.has(name)) {
      pendingChildInits.set(name, [])
    }
    pendingChildInits.get(name)!.push({ scope: childScope, props })
    return
  }

  // Skip if already initialized as a child component.
  // When scope has no ~ prefix, it's a root component whose parent
  // marked it with bf-h during hydrate — still needs child init.
  if (childScope.hasAttribute(BF_HYDRATED) && childScope.getAttribute(BF_SCOPE)?.startsWith(BF_CHILD_PREFIX)) {
    return
  }
  init(0, childScope, props)
}

// --- mount ---

/**
 * Options for mount().
 * @param template - Optional template function for client-side creation
 * @param comment - When true, use comment-based scope hydration (fragment roots)
 */
export interface MountOptions {
  template?: (props: Record<string, unknown>) => string
  comment?: boolean
}

/**
 * Combined component registration + template registration + hydration.
 * Replaces the three separate calls: registerComponent() + registerTemplate() + hydrate().
 *
 * @param name - Component name
 * @param init - Init function that takes (idx, scope, props)
 * @param options - Mount options or legacy template function (backward compat)
 */
export function mount(
  name: string,
  init: ComponentInitFn,
  options?: MountOptions | ((props: Record<string, unknown>) => string)
): void {
  // Backward compat: positional templateFn
  const resolved: MountOptions = typeof options === 'function'
    ? { template: options }
    : options ?? {}

  registerComponent(name, init)
  if (resolved.template) {
    registerTemplate(name, resolved.template)
  }
  hydrate(name, (props, idx, scope) => init(idx, scope, props), resolved.comment)
}

// --- shorthand finders ---

/**
 * Shorthand for find(scope, '[bf="id"]').
 * Used by compiler-generated code for regular slot element references.
 *
 * For parent-owned slots (^-prefixed IDs like '^s3'), searches all descendants
 * ignoring scope boundaries. This handles elements passed as children to child
 * components — they are owned by the parent but rendered inside the child's scope.
 *
 * @param scope - The scope element to search within
 * @param id - The slot ID (e.g., 's0' or '^s3')
 * @returns The matching element or null
 */
export function $(scope: Element | null, id: string): Element | null {
  if (id.startsWith(BF_PARENT_OWNED_PREFIX)) {
    return findParentOwned(scope, id)
  }
  return find(scope, `[${BF_SLOT}="${id}"]`)
}

/**
 * Find a parent-owned slot element that may be rendered inside a child component's scope.
 * Unlike regular find(), this searches ALL descendants without scope boundary checks,
 * because the ^ prefix guarantees the element is owned by this (parent) scope.
 */
function findParentOwned(scope: Element | null, id: string): Element | null {
  if (!scope) return null
  const selector = `[${BF_SLOT}="${id}"]`

  // Check scope itself
  if (scope.matches?.(selector)) return scope

  // Search ALL descendants (no belongsToScope check — ^ guarantees parent ownership)
  const match = scope.querySelector(selector)
  if (match) return match

  // Fragment root siblings
  const scopeId = scope.getAttribute(BF_SCOPE)
  if (scopeId) {
    const parent = scope.parentElement
    if (parent) {
      const siblings = parent.querySelectorAll(`[${BF_SCOPE}="${scopeId}"]`)
      for (const sibling of siblings) {
        if (sibling === scope) continue
        const siblingMatch = sibling.querySelector(selector)
        if (siblingMatch) return siblingMatch
      }
    }
    // Search portals
    return findInPortals(scopeId, selector)
  }

  // Comment-based scope
  const commentInfo = commentScopeRegistry.get(scope)
  if (commentInfo) {
    const boundary = getCommentScopeBoundary(commentInfo.commentNode)
    let node: Node | null = commentInfo.commentNode.nextSibling
    while (node && node !== boundary) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        if (el.matches?.(selector)) return el
        const innerMatch = el.querySelector(selector)
        if (innerMatch) return innerMatch
      }
      node = node.nextSibling
    }
  }

  return null
}

/**
 * Shorthand for finding child component scope elements.
 * - Slot ID (e.g., 's1'): uses suffix match [bf-s$="_s1"]
 * - Component name (e.g., 'Counter'): uses prefix match [bf-s^="Counter_"]
 *
 * @param scope - The scope element to search within
 * @param id - Slot ID suffix or component name
 * @returns The matching element or null
 */
export function $c(scope: Element | null, id: string): Element | null {
  // Strip ^ prefix defensively — component slot IDs should never have it,
  // but guard against compiler edge cases to avoid silent initialization failures.
  const cleanId = id.startsWith(BF_PARENT_OWNED_PREFIX) ? id.slice(1) : id
  // Slot IDs start with 's' + digit; component names start with uppercase
  if (/^s\d/.test(cleanId)) {
    return find(scope, `[${BF_SCOPE}$="_${cleanId}"]`)
  }
  // Component name prefix match - support both child (~Name_) and root (Name_) scopes
  return find(scope, `[${BF_SCOPE}^="${BF_CHILD_PREFIX}${cleanId}_"], [${BF_SCOPE}^="${cleanId}_"]`)
}

// --- $t: text node finder via comment markers ---

/**
 * Find the Text node for a reactive text expression marked by comment nodes.
 * Expects marker format: <!--bf:sX-->text<!--/bf:sX-->
 *
 * Used by compiler-generated code for reactive text expressions (e.g., {count()}).
 * Returns the Text node between the start and end comment markers so that
 * createEffect can update it via .nodeValue without needing a wrapper <span>.
 *
 * @param scope - The component scope element to search within
 * @param id - The slot ID (e.g., 's0' or '^s3')
 * @returns The Text node or null
 */
export function $t(scope: Element | null, id: string): Text | null {
  if (!scope) return null
  // Strip parent-owned prefix for matching
  const cleanId = id.startsWith(BF_PARENT_OWNED_PREFIX) ? id.slice(1) : id
  const marker = `bf:${cleanId}`

  // Determine search root
  const commentInfo = commentScopeRegistry.get(scope)
  const searchRoot: Node = commentInfo ? (commentInfo.commentNode.parentNode ?? scope) : scope

  const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_COMMENT)
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue === marker) {
      const next = walker.currentNode.nextSibling
      if (next?.nodeType === Node.TEXT_NODE) {
        return next as Text
      }
      // No text node exists (empty initial value) — create one
      const textNode = document.createTextNode('')
      walker.currentNode.parentNode?.insertBefore(textNode, walker.currentNode.nextSibling)
      return textNode
    }
  }
  return null
}

// --- updateClientMarker ---

/**
 * Update text content for a client marker.
 * Used for @client directive expressions that are evaluated only on the client side.
 *
 * Expects comment marker format: <!--bf-client:sX-->
 * Both GoTemplateAdapter and HonoAdapter output this format for @client directives.
 *
 * A zero-width space (\u200B) is used as a prefix to mark text nodes managed by @client.
 * This allows distinguishing managed text nodes from other content.
 *
 * @param scope - The component scope element to search within
 * @param id - The slot ID (e.g., 's5')
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
