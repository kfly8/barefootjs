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

  if (elem.chainOrder === 'filter-sort') {
    return `${elem.array}${filterExpr}${sortExpr}`
  }
  return `${elem.array}${sortExpr}${filterExpr}`
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
 * Quote a prop name if it is not a valid JS identifier.
 * Returns the name as-is for valid identifiers (e.g., "checked"),
 * or JSON-quoted for names with hyphens etc. (e.g., '"aria-label"').
 */
export function quotePropName(name: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name
  }
  return JSON.stringify(name)
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
  const stripped = stripTypeScriptSyntax(handler)
  const trimmed = stripped.trim()

  if (trimmed.startsWith('(') && trimmed.includes('=>')) {
    const arrowIndex = trimmed.indexOf('=>')
    const params = trimmed.substring(0, arrowIndex + 2)
    const body = trimmed.substring(arrowIndex + 2).trim()

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
  // Non-null assertions: x! => x (but not !== or !=)
  let result = code.replace(/(\w)!(?!=)/g, '$1')

  // Type assertions: "expr as Type" or "expr as Type | Type2 | ..."
  // Supports identifier types (HTMLElement), string literal types ('horizontal'), and generics (Set<string>)
  const tsTypeAtom = `(?:[A-Za-z_][A-Za-z0-9_]*(?:<[^>]*>)?(?:\\[\\])?|'[^']*'|"[^"]*")`
  result = result.replace(new RegExp(`\\s+as\\s+${tsTypeAtom}(?:\\s*\\|\\s*${tsTypeAtom})*`, 'g'), '')

  // Parameter type annotations: (param: Type) or (param: Type | Type2) => (param)
  // Only match TypeScript types (uppercase initial or type keyword) to avoid matching object properties
  result = result.replace(
    /([(,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*((?:[A-Z][A-Za-z0-9_]*|number|string|boolean|void|null|undefined|any|unknown|never)(?:<[^>]*>)?(?:\[\])?(?:\s*\|\s*(?:[A-Z][A-Za-z0-9_]*|number|string|boolean|void|null|undefined|any|unknown|never)(?:<[^>]*>)?(?:\[\])?)*)(?=\s*[,)])/g,
    '$1$2'
  )

  // Return type annotations and type predicates on arrow functions
  result = result.replace(/\)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]\s|&]*(?:\s+is\s+[A-Za-z_][A-Za-z0-9_<>\[\]\s|&]*)?\s*=>/g, ') =>')

  // Generic type parameters: new Set<string>(), Map<K, V>()
  result = result.replace(/<[A-Za-z_][A-Za-z0-9_,\s<>]*>\s*\(/g, '(')

  // Variable type annotations: let/const x: Type = value
  result = result.replace(/(let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^\n=]+=(?!=)/g, '$1 $2 =')

  // Variable type annotations without initializer: let x: Type => let x
  result = result.replace(/(let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:[^\n;=]+/g, '$1 $2')

  // Multi-variable type annotations: let x: number, y: number
  // Use a function replacer to strip types from all variables in a single declaration
  result = result.replace(/(let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|&\s]*,/g, '$1 $2,')
  // Only strip continuation variables that follow a let/const/var declaration (lookbehind)
  result = result.replace(/(?<=(?:let|const|var)\s+[a-zA-Z_][a-zA-Z0-9_]*[^;]*),\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|&\s]*(?=[,\n;)])/g, ', $1')

  return result
}
