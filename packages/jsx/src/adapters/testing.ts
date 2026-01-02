/**
 * Testing Marked JSX Adapters
 *
 * Adapters specifically designed for testing purposes.
 * NOT for production use - use hono.ts or similar for real applications.
 *
 * Two adapters are provided:
 * - testJsxAdapter: Outputs JSX code (for compiler output verification)
 * - testHtmlAdapter: Outputs static HTML (for E2E DOM testing)
 */

import type { MarkedJsxAdapter, IRNode, IRElement, IRFragment, SignalDeclaration, MemoDeclaration } from '../types'
import { isSvgRoot } from '../utils/svg-helpers'

/**
 * Test adapter that generates minimal Marked JSX components.
 *
 * Use this for testing compiler output patterns:
 * - Verifying generated JSX structure
 * - Testing attribute/event handling
 * - Validating component composition
 *
 * @example
 * ```typescript
 * const result = await compileJSX(path, readFile, { markedJsxAdapter: testJsxAdapter })
 * expect(result.files[0].markedJsx).toContain('<p className="count">')
 * ```
 */
export const testJsxAdapter: MarkedJsxAdapter = {
  // Raw HTML helper for comment nodes (returns dangerouslySetInnerHTML wrapper)
  rawHtmlHelper: {
    importStatement: '',
    helperCode: "const __rawHtml = (s: string) => ({ dangerouslySetInnerHTML: { __html: s } })",
  },

  generateMarkedJsxComponent: ({ name, props, typeDefinitions: _typeDefinitions, jsx }) => {
    let propsParam = ''
    if (props.length > 0) {
      const propNames = props.map(p => p.name)
      const propsType = props.map(p => {
        const optionalMark = p.optional ? '?' : ''
        return `${p.name}${optionalMark}: ${p.type}`
      }).join('; ')
      propsParam = `{ ${propNames.join(', ')} }: { ${propsType} }`
    }

    // Check if JSX uses __rawHtml (for fragment conditional markers)
    const needsRawHtml = jsx.includes('__rawHtml(')
    const rawHtmlHelper = needsRawHtml ? 'const __rawHtml = (s: string) => ({ dangerouslySetInnerHTML: { __html: s } })\n\n' : ''

    return `${rawHtmlHelper}export function ${name}(${propsParam}) {
  return (
    ${jsx}
  )
}
`
  },

  generateMarkedJsxFile: ({ components }) => {
    // For test adapter, only output the first component's JSX
    // This matches the behavior expected by existing tests
    const comp = components[0]
    if (!comp) return ''

    let propsParam = ''
    if (comp.props.length > 0) {
      const propNames = comp.props.map(p => p.name)
      const propsType = comp.props.map(p => {
        const optionalMark = p.optional ? '?' : ''
        return `${p.name}${optionalMark}: ${p.type}`
      }).join('; ')
      propsParam = `{ ${propNames.join(', ')} }: { ${propsType} }`
    }

    // Check if JSX uses __rawHtml (for fragment conditional markers)
    const needsRawHtml = comp.jsx.includes('__rawHtml(')
    const rawHtmlHelper = needsRawHtml ? 'const __rawHtml = (s: string) => ({ dangerouslySetInnerHTML: { __html: s } })\n\n' : ''

    // Local variable declarations (computed from props)
    const localVarDefs = comp.localVariables && comp.localVariables.length > 0
      ? '\n  ' + comp.localVariables.map(v => v.code).join('\n  ') + '\n'
      : ''

    return `${rawHtmlHelper}export function ${comp.name}(${propsParam}) {${localVarDefs}
  return (
    ${comp.jsx}
  )
}
`
  },
}

// Legacy alias for backwards compatibility
export const testMarkedJsxAdapter = testJsxAdapter

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
 * const result = await compileJSX(path, readFile, { markedJsxAdapter: testHtmlAdapter })
 * document.body.innerHTML = result.files[0].markedJsx
 * // Execute clientJs, simulate events, verify DOM
 * ```
 */
export const testHtmlAdapter: MarkedJsxAdapter = {
  generateMarkedJsxComponent: ({ name, ir, signals }) => {
    if (!ir) {
      return `<!-- No IR for ${name} -->`
    }
    return irToHtml(ir, name, signals)
  },

  generateMarkedJsxFile: ({ components }) => {
    // For test adapter, only output the first component's HTML
    // This matches the behavior expected by existing tests
    const comp = components[0]
    if (!comp) return ''
    if (!comp.ir) {
      return `<!-- No IR for ${comp.name} -->`
    }
    return irToHtml(comp.ir, comp.name, comp.signals)
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
      // Dynamic conditionals with ID need data-bf-cond marker for hydration
      if (node.id) {
        const conditionResult = evaluateExpression(node.condition, ctx.signals)
        const branchNode = conditionResult ? node.whenTrue : node.whenFalse
        return injectConditionalMarkerHtml(branchNode, node.id, ctx)
      }
      // Static conditionals just evaluate and render
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

/**
 * Injects data-bf-cond attribute into conditional branch HTML
 */
function injectConditionalMarkerHtml(node: IRNode, condId: string, ctx: HtmlContext): string {
  switch (node.type) {
    case 'element': {
      const html = elementToHtml(node, ctx, false)
      return injectDataBfCondAttribute(html, condId)
    }

    case 'fragment': {
      // Use comment markers for fragment conditionals
      // This allows proper switching of multiple sibling elements
      const childrenHtml = node.children.map(child => irToHtmlInternal(child, ctx, false)).join('')
      return `<!--bf-cond-start:${condId}-->${childrenHtml}<!--bf-cond-end:${condId}-->`
    }

    case 'expression': {
      const exprValue = node.expression.trim()
      if (exprValue === 'null' || exprValue === 'undefined') {
        // Use empty comment markers for null
        return `<!--bf-cond-start:${condId}--><!--bf-cond-end:${condId}-->`
      }
      const value = evaluateExpression(node.expression, ctx.signals)
      return `<span data-bf-cond="${condId}">${escapeHtml(String(value))}</span>`
    }

    case 'text':
      return `<span data-bf-cond="${condId}">${escapeHtml(node.content)}</span>`

    case 'component':
      return `<div data-bf-cond="${condId}"><!-- ${node.name} --></div>`

    case 'conditional': {
      const conditionResult = evaluateExpression(node.condition, ctx.signals)
      const innerHtml = irToHtmlInternal(conditionResult ? node.whenTrue : node.whenFalse, ctx, false)
      return `<span data-bf-cond="${condId}">${innerHtml}</span>`
    }
  }
}

function injectDataBfCondAttribute(html: string, condId: string): string {
  const match = html.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)
  if (!match) return html

  const tagName = match[1]
  const tagLength = match[0].length

  return `<${tagName} data-bf-cond="${condId}"${html.slice(tagLength)}`
}
