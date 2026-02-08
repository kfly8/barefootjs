/**
 * Pure helper functions for client JS generation.
 * No dependencies on ClientJsContext or other internal modules.
 */

import type { IRTemplateLiteral } from '../types'
import type { LoopElement } from './types'

/**
 * Convert an attribute value to a string expression.
 * Handles both string values and IRTemplateLiteral.
 */
export function attrValueToString(value: string | IRTemplateLiteral | null): string | null {
  if (value === null) return null
  if (typeof value === 'string') return value

  // Reconstruct the template literal as a JS expression
  let result = '`'
  for (const part of value.parts) {
    if (part.type === 'string') {
      result += part.value
    } else if (part.type === 'ternary') {
      result += `\${${part.condition} ? '${part.whenTrue}' : '${part.whenFalse}'}`
    }
  }
  result += '`'
  return result
}

/**
 * Build the chained array expression for reconcileList.
 * Chains .toSorted() and .filter() in the correct order based on chainOrder.
 * Always uses .toSorted() (non-mutating) regardless of source method.
 */
export function buildChainedArrayExpr(elem: LoopElement): string {
  const sortExpr = elem.sortComparator
    ? `.toSorted((${elem.sortComparator.paramA}, ${elem.sortComparator.paramB}) => ${elem.sortComparator.raw})`
    : ''
  const filterExpr = elem.filterPredicate
    ? `.filter(${elem.filterPredicate.param} => ${elem.filterPredicate.raw})`
    : ''

  if (!sortExpr && !filterExpr) return elem.array

  if (elem.chainOrder === 'sort-filter') {
    // sort first, then filter
    return `${elem.array}${sortExpr}${filterExpr}`
  } else if (elem.chainOrder === 'filter-sort') {
    // filter first, then sort
    return `${elem.array}${filterExpr}${sortExpr}`
  } else {
    // Only one of sort or filter
    return `${elem.array}${sortExpr}${filterExpr}`
  }
}

/**
 * Map of JSX event names to DOM event property names.
 * JSX uses React-style naming (e.g., onDoubleClick) which gets converted to
 * lowercase (doubleclick), but some DOM events have different names (dblclick).
 */
export const jsxToDomEventMap: Record<string, string> = {
  doubleclick: 'dblclick',
}

/**
 * Convert JSX-derived event name to DOM event property name.
 * Example: 'doubleclick' → 'ondblclick'
 */
export function toDomEventProp(eventName: string): string {
  const mappedName = jsxToDomEventMap[eventName] ?? eventName
  return `on${mappedName}`
}

/**
 * Convert JSX attribute name to HTML attribute name.
 * Handles React-style naming conventions (e.g., className → class).
 */
export function toHtmlAttrName(jsxAttrName: string): string {
  if (jsxAttrName === 'className') return 'class'
  return jsxAttrName
}

/**
 * Wrap arrow function handler in block to prevent accidental return false.
 * Returning false from a DOM event handler prevents default behavior.
 *
 * Example:
 *   Input:  (e) => e.key === 'Enter' && handleAdd()
 *   Output: (e) => { e.key === 'Enter' && handleAdd() }
 */
export function wrapHandlerInBlock(handler: string): string {
  // Strip TypeScript syntax (type assertions, type annotations) from the handler
  const stripped = stripTypeScriptSyntax(handler)
  const trimmed = stripped.trim()

  // Check if it's an arrow function with expression body
  if (trimmed.startsWith('(') && trimmed.includes('=>')) {
    const arrowIndex = trimmed.indexOf('=>')
    const params = trimmed.substring(0, arrowIndex + 2)
    const body = trimmed.substring(arrowIndex + 2).trim()

    // If body is not already a block, wrap it
    if (!body.startsWith('{')) {
      return `${params} { ${body} }`
    }
  }

  return trimmed
}

/** Infer a sensible JS default value literal from a type descriptor. */
export function inferDefaultValue(type: { kind: string; primitive?: string }): string {
  if (type.kind === 'primitive') {
    switch (type.primitive) {
      case 'number':
        return '0'
      case 'boolean':
        return 'false'
      case 'string':
        return "''"
    }
  }
  if (type.kind === 'array') return '[]'
  if (type.kind === 'object') return '{}'
  return 'undefined'
}

/**
 * Strip TypeScript-specific syntax from a code string.
 * Converts TypeScript to JavaScript by removing:
 * - Type annotations on parameters: (e: KeyboardEvent) => (e)
 * - Type assertions: e.target as HTMLElement => e.target
 * - Variable type annotations: let x: number = 1 => let x = 1
 * - Return type annotations: (x): void => x  =>  (x) => x
 * - Type predicates: (el): el is HTMLElement => ...  =>  (el) => ...
 * - Generic type parameters: new Set<string>()  =>  new Set()
 * - Non-null assertions: x! => x
 */
export function stripTypeScriptSyntax(code: string): string {
  // Remove non-null assertions: x! => x (but not !== or !=)
  // Match: identifier followed by ! not followed by =
  let result = code.replace(/(\w)!(?!=)/g, '$1')

  // Remove type assertions: "as TypeName" (including generic types like "as HTMLElement[]")
  // Match: space + 'as' + space + identifier (with optional [], <>, etc.)
  result = result.replace(/\s+as\s+[A-Za-z_][A-Za-z0-9_]*(?:<[^>]*>)?(?:\[\])?/g, '')

  // Remove parameter type annotations: (param: Type) => (param)
  // This handles: (e: KeyboardEvent), (x: number, y: string), etc.
  // Important: Only match if the "type" looks like a TypeScript type (uppercase initial or type keyword)
  // This prevents matching object properties like `bubbles: true`
  result = result.replace(
    /([(,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*((?:[A-Z][A-Za-z0-9_]*|number|string|boolean|void|null|undefined|any|unknown|never)(?:<[^>]*>)?(?:\[\])?)(?=\s*[,)])/g,
    '$1$2'
  )

  // Remove return type annotations on arrow functions: (x): void => body
  // Also handles type predicates: (el): el is HTMLElement =>
  result = result.replace(/\)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]\s|&]*(?:\s+is\s+[A-Za-z_][A-Za-z0-9_<>\[\]\s|&]*)?\s*=>/g, ') =>')

  // Remove generic type parameters: new Set<string>(), Map<K, V>(), etc.
  result = result.replace(/<[A-Za-z_][A-Za-z0-9_,\s<>]*>\s*\(/g, '(')

  // Remove variable type annotations: let/const x: Type = value => let/const x = value
  // Use non-greedy match and avoid spanning newlines
  result = result.replace(/(let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^\n=]+=(?!=)/g, '$1 $2 =')

  // Remove multi-variable type annotations: let x: number, y: number => let x, y
  // This handles: let x: Type, y: Type, ... where there's no initializer
  result = result.replace(/(let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|&\s]*,/g, '$1 $2,')
  result = result.replace(/,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|&\s]*(?=[,\n;)])/g, ', $1')

  return result
}
