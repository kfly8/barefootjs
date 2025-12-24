/**
 * Testing Server Adapters
 *
 * Adapters specifically designed for testing purposes.
 * NOT for production use - use hono.ts or similar for real applications.
 *
 * Two adapters are provided:
 * - testJsxAdapter: Outputs JSX code (for compiler output verification)
 * - testHtmlAdapter: Outputs static HTML (for E2E DOM testing)
 */

import type { ServerComponentAdapter, IRNode, IRElement, IRFragment, SignalDeclaration } from '../types'
import { isSvgRoot } from '../utils/svg-helpers'

/**
 * Test adapter that generates minimal server JSX components.
 *
 * Use this for testing compiler output patterns:
 * - Verifying generated JSX structure
 * - Testing attribute/event handling
 * - Validating component composition
 *
 * @example
 * ```typescript
 * const result = await compileJSX(path, readFile, { serverAdapter: testJsxAdapter })
 * expect(result.components[0].serverJsx).toContain('<p className="count">')
 * ```
 */
export const testJsxAdapter: ServerComponentAdapter = {
  generateServerComponent: ({ name, props, jsx }) => {
    const propsParam = props.length > 0
      ? `{ ${props.join(', ')} }: { ${props.map(p => `${p}: any`).join('; ')} }`
      : ''

    return `export function ${name}(${propsParam}) {
  return (
    ${jsx}
  )
}
`
  },
}

// Legacy alias for backwards compatibility
export const testServerAdapter = testJsxAdapter

/**
 * Test adapter that generates static HTML with initial values evaluated.
 *
 * Use this for E2E DOM testing:
 * - Rendering HTML in happy-dom/jsdom
 * - Testing hydration and event binding
 * - Verifying signal updates cause correct DOM changes
 *
 * @example
 * ```typescript
 * const result = await compileJSX(path, readFile, { serverAdapter: testHtmlAdapter })
 * document.body.innerHTML = result.components[0].serverJsx
 * // Execute clientJs, simulate events, verify DOM
 * ```
 */
export const testHtmlAdapter: ServerComponentAdapter = {
  generateServerComponent: ({ name, ir, signals }) => {
    if (!ir) {
      return `<!-- No IR for ${name} -->`
    }
    return irToHtml(ir, name, signals)
  },
}

// ============================================================
// HTML Generation (internal)
// ============================================================

type HtmlContext = {
  componentName: string
  signals: SignalDeclaration[]
}

function irToHtml(
  node: IRNode,
  componentName: string,
  signals: SignalDeclaration[]
): string {
  const ctx: HtmlContext = { componentName, signals }
  return irToHtmlInternal(node, ctx, true)
}

function irToHtmlInternal(node: IRNode, ctx: HtmlContext, isRoot: boolean): string {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.content)

    case 'expression':
      const value = evaluateExpression(node.expression, ctx.signals)
      return escapeHtml(String(value))

    case 'component':
      return `<!-- Component: ${node.name} -->`

    case 'conditional':
      const conditionResult = evaluateExpression(node.condition, ctx.signals)
      if (conditionResult) {
        return irToHtmlInternal(node.whenTrue, ctx, false)
      } else {
        return irToHtmlInternal(node.whenFalse, ctx, false)
      }

    case 'element':
      return elementToHtml(node, ctx, isRoot)

    case 'fragment':
      return fragmentToHtml(node, ctx, isRoot)
  }
}

function fragmentToHtml(node: IRFragment, ctx: HtmlContext, isRoot: boolean): string {
  return node.children.map((child, index) => {
    const childIsRoot = isRoot && index === 0 && child.type === 'element'
    return irToHtmlInternal(child, ctx, childIsRoot)
  }).join('')
}

function elementToHtml(el: IRElement, ctx: HtmlContext, isRoot: boolean): string {
  const { tagName, id, staticAttrs, dynamicAttrs, children, listInfo } = el

  const attrParts: string[] = []

  if (isRoot && ctx.componentName) {
    attrParts.push(`data-bf-scope="${ctx.componentName}"`)
  }

  if (id) {
    attrParts.push(`data-bf="${id}"`)
  }

  if (isSvgRoot(tagName)) {
    attrParts.push('xmlns="http://www.w3.org/2000/svg"')
  }

  for (const attr of staticAttrs) {
    if (attr.value) {
      attrParts.push(`${attr.name}="${escapeAttr(attr.value)}"`)
    } else {
      attrParts.push(attr.name)
    }
  }

  for (const attr of dynamicAttrs) {
    const value = evaluateExpression(attr.expression, ctx.signals)
    if (value !== undefined && value !== null && value !== false) {
      if (value === true) {
        attrParts.push(attr.name)
      } else {
        attrParts.push(`${attr.name}="${escapeAttr(String(value))}"`)
      }
    }
  }

  const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

  if (listInfo) {
    const arrayValue = evaluateExpression(listInfo.arrayExpression, ctx.signals)
    if (Array.isArray(arrayValue) && listInfo.itemIR) {
      const itemsHtml = arrayValue.map((item, index) => {
        const itemCtx: HtmlContext = {
          ...ctx,
          signals: [
            ...ctx.signals,
            { getter: listInfo.paramName, setter: '', initialValue: JSON.stringify(item) },
          ],
        }
        let itemHtml = irToHtmlInternal(listInfo.itemIR!, itemCtx, false)
        if (listInfo.keyExpression) {
          const keyValue = evaluateExpressionWithItem(listInfo.keyExpression, item, listInfo.paramName)
          itemHtml = injectDataKeyAttribute(itemHtml, String(keyValue))
        }
        return itemHtml
      }).join('')
      return `<${tagName}${attrsStr}>${itemsHtml}</${tagName}>`
    }
    return `<${tagName}${attrsStr}></${tagName}>`
  }

  const childrenHtml = children.map(child => irToHtmlInternal(child, ctx, false)).join('')

  if (children.length === 0 && isSelfClosingTag(tagName)) {
    return `<${tagName}${attrsStr}>`
  }

  return `<${tagName}${attrsStr}>${childrenHtml}</${tagName}>`
}

function evaluateExpression(expr: string, signals: SignalDeclaration[]): any {
  let evalExpr = expr

  for (const signal of signals) {
    const getterPattern = new RegExp(`\\b${signal.getter}\\(\\)`, 'g')
    evalExpr = evalExpr.replace(getterPattern, signal.initialValue)
  }

  try {
    return Function(`"use strict"; return (${evalExpr})`)()
  } catch {
    return evalExpr
  }
}

function evaluateExpressionWithItem(expr: string, item: any, paramName: string): any {
  try {
    return Function(paramName, `"use strict"; return (${expr})`)(item)
  } catch {
    return expr
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;')
}

function isSelfClosingTag(tagName: string): boolean {
  return ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())
}

function injectDataKeyAttribute(html: string, keyValue: string): string {
  const match = html.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)
  if (!match) return html

  const tagName = match[1]
  const tagLength = match[0].length

  return `<${tagName} data-key="${escapeAttr(keyValue)}"${html.slice(tagLength)}`
}
