/**
 * BarefootJS - DOM Query Helpers
 *
 * Scope-aware DOM query utilities for compiler-generated ClientJS.
 * These helpers find elements within component scopes, respecting
 * nested scope boundaries and comment-based scopes.
 */

import { commentScopeRegistry, getCommentScopeBoundary } from './scope'
import { hydratedScopes } from './hydration-state'
import { BF_SCOPE, BF_SLOT, BF_CHILD_PREFIX, BF_PORTAL_OWNER, BF_PARENT_OWNED_PREFIX, BF_SCOPE_COMMENT_PREFIX } from './attrs'

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
      if (!hydratedScopes.has(parentEl)) {
        hydratedScopes.add(parentEl)
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
    s => !hydratedScopes.has(s)
  )
  const scope = uninitializedScopes[idx] || null

  if (scope) {
    hydratedScopes.add(scope)
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
 * Expects marker format: <!--bf:sX-->text<!--/-->
 *
 * Used by compiler-generated code for reactive text expressions (e.g., {count()}).
 * Returns the Text node after the start comment marker so that
 * createEffect can update it via .nodeValue without needing a wrapper <span>.
 *
 * @param scope - The component scope element to search within
 * @param id - The slot ID (e.g., 's0' or '^s3')
 * @returns The Text node or null
 */
export function $t(scope: Element | null, id: string): Text | null {
  if (!scope) return null
  // Keep the full id (including ^ prefix) for marker matching —
  // parent-owned slots produce <!--bf:^sN--> in the HTML.
  const marker = `bf:${id}`
  const isParentOwned = id.startsWith(BF_PARENT_OWNED_PREFIX)

  // Determine search root
  const commentInfo = commentScopeRegistry.get(scope)
  const searchRoot: Node = commentInfo ? (commentInfo.commentNode.parentNode ?? scope) : scope

  const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_COMMENT)
  while (walker.nextNode()) {
    const comment = walker.currentNode as Comment
    if (comment.nodeValue === marker) {
      // For non-parent-owned slots, verify the comment belongs to this scope
      // (not inside a nested child component scope)
      if (!isParentOwned && !commentBelongsToScope(comment, scope, commentInfo)) {
        continue
      }
      const next = comment.nextSibling
      if (next?.nodeType === Node.TEXT_NODE) {
        return next as Text
      }
      // No text node exists (empty initial value) — create one
      const textNode = document.createTextNode('')
      comment.parentNode?.insertBefore(textNode, comment.nextSibling)
      return textNode
    }
  }
  return null
}

/**
 * Check if a comment node belongs to the given scope (not inside a nested child scope).
 */
function commentBelongsToScope(
  comment: Comment,
  scope: Element,
  commentInfo: { commentNode: Comment; scopeId: string } | undefined
): boolean {
  // Walk up from the comment to find the nearest scope element
  const parent = comment.parentElement
  if (!parent) return false

  // If the comment's parent element has a bf-s attribute that is NOT our scope,
  // then the comment is inside a child component's scope
  const parentScope = parent.closest(`[${BF_SCOPE}]`)
  if (parentScope === scope) return true

  // For comment-based scopes, the scope element is virtual
  if (commentInfo) {
    return isInCommentScopeRange(parent, commentInfo.commentNode)
  }

  // If the nearest scope is inside our scope, the comment is in a nested scope
  return false
}
