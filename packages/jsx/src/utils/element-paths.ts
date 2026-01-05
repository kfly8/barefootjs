/**
 * Element Path Calculator
 *
 * Calculates DOM traversal paths for elements in IR.
 * Used for tree position-based hydration instead of querySelector.
 *
 * Example paths:
 * - "" (empty) -> scope itself
 * - "firstElementChild" -> scope.firstElementChild
 * - "firstElementChild.nextElementSibling" -> scope.firstElementChild.nextElementSibling
 * - "nextElementSibling" -> (for Fragment root siblings)
 */

import type { IRNode, IRElement, IRFragment } from '../types'

export type ElementPath = {
  id: string
  path: string | null  // null means path-based navigation is unreliable (e.g., after component sibling)
}

/**
 * Calculates paths for all elements with IDs in the IR tree
 *
 * @param ir - Root IR node
 * @returns Array of element paths
 */
export function calculateElementPaths(ir: IRNode): ElementPath[] {
  const paths: ElementPath[] = []

  if (ir.type === 'fragment') {
    // Fragment root: first element child gets the scope marker
    calculateFragmentPaths(ir, paths)
  } else if (ir.type === 'element') {
    // Regular element root: scope is on the root element itself
    calculateRootElementPaths(ir, paths)
  }

  return paths
}

/**
 * Calculate paths for a regular (non-fragment) root element
 */
function calculateRootElementPaths(root: IRElement, paths: ElementPath[]): void {
  // Root element has empty path (it IS the scope)
  if (root.id) {
    paths.push({ id: root.id, path: '' })
  }

  // Process children - they start at firstElementChild from scope
  processChildren(root.children, '', paths)
}

/**
 * Calculate paths for Fragment root
 * The scope marker (data-bf-scope) is on the first element child.
 * Sibling elements are accessed via nextElementSibling from the scope.
 *
 * When a conditional sibling is encountered at fragment level, subsequent elements
 * get null paths because conditionals render as comments at runtime.
 */
function calculateFragmentPaths(fragment: IRFragment, paths: ElementPath[]): void {
  let siblingIndex = 0
  let hasConditionalBefore = false

  for (const child of fragment.children) {
    if (child.type === 'element') {
      if (siblingIndex === 0 && !hasConditionalBefore) {
        // First element (and no conditional before): scope is on this element, path is empty
        if (child.id) {
          paths.push({ id: child.id, path: '' })
        }
        // Process its children
        processChildren(child.children, '', paths)
      } else if (hasConditionalBefore) {
        // Elements after conditionals need querySelector fallback
        if (child.id) {
          paths.push({ id: child.id, path: null })
        }
        // Process its children - use buildSiblingPath for context even though path is null
        processChildren(child.children, buildSiblingPath(siblingIndex), paths)
      } else {
        // Subsequent siblings: accessed via nextElementSibling chain from scope
        const siblingPath = buildSiblingPath(siblingIndex)
        if (child.id) {
          paths.push({ id: child.id, path: siblingPath })
        }
        // Process its children
        processChildren(child.children, siblingPath, paths)
      }
      siblingIndex++
    } else if (child.type === 'conditional') {
      // Conditional at fragment level
      // Mark that a conditional was encountered - subsequent siblings need null paths
      hasConditionalBefore = true
      // Don't increment siblingIndex - conditionals render as comments, not elements
      processConditional(child, siblingIndex === 0 ? '' : buildSiblingPath(siblingIndex), paths)
    }
    // Skip text and expression nodes (they don't affect element position)
  }
}

/**
 * Build sibling path (e.g., "nextElementSibling" or "nextElementSibling.nextElementSibling")
 */
function buildSiblingPath(count: number): string {
  return Array(count).fill('nextElementSibling').join('.')
}

/**
 * Process children of an element
 *
 * When a component sibling is encountered, subsequent elements get null paths
 * because components may output additional DOM elements (scripts) that shift positions.
 *
 * When a conditional sibling is encountered, subsequent elements get null paths
 * because conditionals render as comments at runtime, making path-based navigation unreliable.
 */
function processChildren(children: IRNode[], basePath: string, paths: ElementPath[]): void {
  let elementIndex = 0
  let hasComponentBefore = false
  let hasConditionalBefore = false

  for (const child of children) {
    if (child.type === 'element') {
      // Elements after conditionals need querySelector fallback because
      // conditionals render as comments, making path-based navigation unreliable
      const childPath = (hasComponentBefore || hasConditionalBefore) ? null : buildChildPath(basePath, elementIndex)
      if (child.id) {
        paths.push({ id: child.id, path: childPath })
      }
      // Recursively process this element's children (paths inside are still valid)
      processChildren(child.children, childPath ?? buildChildPath(basePath, elementIndex), paths)
      elementIndex++
    } else if (child.type === 'conditional') {
      // Mark that a conditional was encountered - subsequent siblings need null paths
      hasConditionalBefore = true
      // Don't increment elementIndex - conditionals render as comments, not elements
      const childPath = hasComponentBefore ? null : buildChildPath(basePath, elementIndex)
      processConditional(child, childPath, paths, hasComponentBefore)
    } else if (child.type === 'fragment') {
      // Nested fragment: process its children as if they were direct children
      for (const fragChild of child.children) {
        if (fragChild.type === 'element') {
          const childPath = hasComponentBefore ? null : buildChildPath(basePath, elementIndex)
          if (fragChild.id) {
            paths.push({ id: fragChild.id, path: childPath })
          }
          processChildren(fragChild.children, childPath ?? buildChildPath(basePath, elementIndex), paths)
          elementIndex++
        }
      }
    } else if (child.type === 'component') {
      // Components may output additional DOM elements (scripts), making path-based
      // navigation unreliable for subsequent siblings
      hasComponentBefore = true
      elementIndex++  // Component still takes a slot
    }
    // Skip text and expression nodes
  }
}

/**
 * Build child path from base path and element index
 */
function buildChildPath(basePath: string, elementIndex: number): string {
  const childSelector = elementIndex === 0
    ? 'firstElementChild'
    : `firstElementChild${'.nextElementSibling'.repeat(elementIndex)}`

  return basePath === '' ? childSelector : `${basePath}.${childSelector}`
}

/**
 * Process conditional node
 *
 * Elements inside conditionals get null paths because the DOM structure
 * depends on which branch is rendered at runtime.
 */
function processConditional(
  node: { type: 'conditional'; whenTrue: IRNode; whenFalse: IRNode },
  basePath: string | null,
  paths: ElementPath[],
  hasComponentBefore: boolean = false
): void {
  // Elements inside conditionals need null paths (use querySelector fallback)
  // because we can't know which branch will be rendered at runtime
  processConditionalBranch(node.whenTrue, paths)
  processConditionalBranch(node.whenFalse, paths)
}

/**
 * Process a conditional branch, giving null paths to all elements inside
 */
function processConditionalBranch(node: IRNode, paths: ElementPath[]): void {
  if (node.type === 'element') {
    if (node.id) {
      paths.push({ id: node.id, path: null })
    }
    // Recursively process children - they also get null paths
    for (const child of node.children) {
      processConditionalBranch(child, paths)
    }
  } else if (node.type === 'fragment') {
    for (const child of node.children) {
      processConditionalBranch(child, paths)
    }
  } else if (node.type === 'conditional') {
    // Nested conditional
    processConditionalBranch(node.whenTrue, paths)
    processConditionalBranch(node.whenFalse, paths)
  }
  // text, expression, component nodes don't need paths
}

/**
 * Generate DOM traversal code for a given path
 *
 * @param scopeVar - Variable name of the scope element (e.g., "__scope")
 * @param path - Element path (e.g., "firstElementChild.nextElementSibling")
 * @returns DOM traversal expression
 */
export function generatePathExpression(scopeVar: string, path: string): string {
  if (path === '') {
    return scopeVar
  }
  return `${scopeVar}?.${path}`
}
