/**
 * BarefootJS JSX Compiler - IR to HTML Transformer
 *
 * Generates static HTML from Intermediate Representation (IR).
 */

import type { IRNode, IRElement, SignalDeclaration } from '../types'
import { replaceSignalCalls } from '../utils/expression-parser'

/**
 * Evaluates dynamic expressions with signal initial values and returns a string.
 * Uses TypeScript API to avoid replacing signal names within string literals.
 */
export function evaluateWithInitialValues(expr: string, signals: SignalDeclaration[]): string {
  // Replace signal calls with initial values (AST-based)
  const replaced = replaceSignalCalls(expr, signals)

  try {
    // Safe to use eval as this only runs at build time
    const result = eval(replaced)
    return String(result)
  } catch {
    return ''
  }
}

/**
 * Generates HTML from an IR node
 */
export function irToHtml(node: IRNode, signals: SignalDeclaration[]): string {
  switch (node.type) {
    case 'text':
      return node.content

    case 'expression':
      if (node.isDynamic) {
        return evaluateWithInitialValues(node.expression, signals)
      }
      return node.expression

    case 'component':
      return node.staticHtml

    case 'conditional': {
      const condResult = evaluateWithInitialValues(node.condition, signals)
      if (condResult === 'true') {
        return irToHtml(node.whenTrue, signals)
      }
      return irToHtml(node.whenFalse, signals)
    }

    case 'element':
      return elementToHtml(node, signals)
  }
}

/**
 * Generates HTML from an IR element
 */
function elementToHtml(el: IRElement, signals: SignalDeclaration[]): string {
  const { tagName, id, staticAttrs, dynamicAttrs, children, listInfo } = el

  // Build attributes
  const attrParts: string[] = []

  // Add ID if present
  if (id) {
    attrParts.push(`id="${id}"`)
  }

  // Static attributes
  for (const attr of staticAttrs) {
    if (attr.value) {
      attrParts.push(`${attr.name}="${attr.value}"`)
    } else {
      attrParts.push(attr.name)
    }
  }

  // Dynamic attributes (evaluated with initial values)
  for (const attr of dynamicAttrs) {
    const value = evaluateWithInitialValues(attr.expression, signals)
    if (value && value !== 'false') {
      if (isBooleanAttribute(attr.name) && value === 'true') {
        attrParts.push(attr.name)
      } else {
        attrParts.push(`${attr.name}="${value}"`)
      }
    }
  }

  const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

  // List element
  if (listInfo) {
    const listHtml = evaluateListInitialHtml(listInfo, signals)
    return `<${tagName}${attrsStr}>${listHtml}</${tagName}>`
  }

  // Process children
  const childrenHtml = children.map(child => irToHtml(child, signals)).join('')

  // Self-closing tag
  if (children.length === 0 && isSelfClosingTag(tagName)) {
    return `<${tagName}${attrsStr} />`
  }

  return `<${tagName}${attrsStr}>${childrenHtml}</${tagName}>`
}

/**
 * Generates initial HTML for list elements.
 * Uses TypeScript API to replace signal calls.
 */
function evaluateListInitialHtml(
  listInfo: { arrayExpression: string; paramName: string; itemTemplate: string },
  signals: SignalDeclaration[]
): string {
  // Evaluate array expression (AST-based replacement)
  const replaced = replaceSignalCalls(listInfo.arrayExpression, signals)

  try {
    const arrayValue = eval(replaced)
    if (!Array.isArray(arrayValue)) return ''

    return arrayValue.map((item, __index) => {
      const evalFn = new Function(listInfo.paramName, '__index', `return ${listInfo.itemTemplate}`)
      return evalFn(item, __index)
    }).join('')
  } catch {
    return ''
  }
}

/**
 * Checks if a tag is a self-closing tag
 */
function isSelfClosingTag(tagName: string): boolean {
  return ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())
}

/**
 * Checks if an attribute is a boolean attribute
 */
function isBooleanAttribute(attrName: string): boolean {
  return ['disabled', 'checked', 'hidden', 'readonly', 'required'].includes(attrName)
}

/**
 * Generates server JSX (Hono format) from IR
 */
export function irToServerJsx(html: string): string {
  return html.replace(/class="/g, 'className="')
}
