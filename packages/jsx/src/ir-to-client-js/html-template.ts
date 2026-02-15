/**
 * IR → HTML template string generation and validation.
 */

import type { IRNode } from '../types'
import { isBooleanAttr } from '../html-constants'
import { toHtmlAttrName, attrValueToString } from './utils'

/** Convert an IR node tree to an HTML template string (for conditionals/loops). */
export function irToHtmlTemplate(node: IRNode): string {
  switch (node.type) {
    case 'element': {
      const attrParts = node.attrs
        .map((a) => {
          if (a.name === '...') return ''
          const attrName = toHtmlAttrName(a.name)
          if (a.value === null) return attrName
          if (a.dynamic && isBooleanAttr(attrName)) {
            return `\${${a.value} ? '${attrName}' : ''}`
          }
          if (a.dynamic && a.booleanPresence) {
            return `\${${a.value} ? '${attrName}' : ''}`
          }
          if (a.dynamic) return `${attrName}="\${${a.value}}"`
          return `${attrName}="${a.value}"`
        })
        .filter(Boolean)

      if (node.slotId) {
        attrParts.push(`bf="${node.slotId}"`)
      }

      const attrs = attrParts.join(' ')
      const children = node.children.map(irToHtmlTemplate).join('')

      if (children) {
        return `<${node.tag}${attrs ? ' ' + attrs : ''}>${children}</${node.tag}>`
      }
      return `<${node.tag}${attrs ? ' ' + attrs : ''} />`
    }

    case 'text':
      return node.value

    case 'expression':
      if (node.expr === 'null' || node.expr === 'undefined') return ''
      if (node.slotId) {
        return `<span bf="${node.slotId}">\${${node.expr}}</span>`
      }
      return `\${${node.expr}}`

    case 'conditional':
      return `\${${node.condition} ? \`${irToHtmlTemplate(node.whenTrue)}\` : \`${irToHtmlTemplate(node.whenFalse)}\`}`

    case 'fragment':
      return node.children.map(irToHtmlTemplate).join('')

    case 'component': {
      // Portal is a special pass-through component - render its children directly
      // Portal moves content to document.body, so we need the actual content in templates
      if (node.name === 'Portal') {
        return node.children.map(irToHtmlTemplate).join('')
      }

      // Component children in loops require special handling.
      // We generate a placeholder with scope marker that can be hydrated.
      // Note: Full component rendering on client is a known limitation.
      // For dynamic lists, consider using plain elements instead of components.
      const keyProp = node.props.find((p) => p.name === 'key')
      const keyAttr = keyProp ? ` data-key="\${${keyProp.value}}"` : ''
      const scopeAttr = ` bf-s="${node.name}_\${Math.random().toString(36).slice(2, 8)}"`
      // Generate minimal placeholder - content will be rendered by component
      return `<div${keyAttr}${scopeAttr}></div>`
    }

    case 'loop':
      return node.children.map(irToHtmlTemplate).join('')

    case 'if-statement':
      return ''

    case 'provider':
      return node.children.map(irToHtmlTemplate).join('')

    default:
      return ''
  }
}

/**
 * Add bf-c attribute to the first element in an HTML template string.
 * This ensures cond() can find the element for subsequent swaps.
 */
export function addCondAttrToTemplate(html: string, condId: string): string {
  if (/^<\w+/.test(html)) {
    return html.replace(/^(<\w+)(\s|>)/, `$1 bf-c="${condId}"$2`)
  }
  // Text nodes use comment markers instead of attributes
  return `<!--bf-cond-start:${condId}-->${html}<!--bf-cond-end:${condId}-->`
}

/**
 * Generate HTML template for registerTemplate().
 * Used for client-side component creation via createComponent().
 *
 * This is similar to irToHtmlTemplate but:
 * - Expressions are transformed to use the template function's props parameter
 * - bf markers ARE included so client code can find elements
 *
 * @param node - IR node to render
 * @param propNames - Set of prop names to prefix with 'props.'
 */
export function irToComponentTemplate(node: IRNode, propNames: Set<string>): string {
  const transformExpr = (expr: string): string => {
    let result = expr
    for (const propName of propNames) {
      // Match propName as identifier followed by property/index/call access,
      // but not already prefixed with 'props.' or inside string literals
      const pattern = new RegExp(`(?<!props\\.)(?<!['"\\w])\\b${propName}\\b(?=[.\\[()])`, 'g')
      result = result.replace(pattern, `props.${propName}`)
    }
    return result
  }

  switch (node.type) {
    case 'element': {
      const attrParts = node.attrs
        .map((a) => {
          if (a.name === '...') return ''
          if (a.name === 'key') return ''
          const attrName = toHtmlAttrName(a.name)
          if (a.value === null) return attrName
          const valueStr = attrValueToString(a.value)
          if (a.dynamic && valueStr && isBooleanAttr(attrName)) {
            return `\${${transformExpr(valueStr)} ? '${attrName}' : ''}`
          }
          if (a.dynamic && valueStr && a.booleanPresence) {
            return `\${${transformExpr(valueStr)} ? '${attrName}' : ''}`
          }
          if (a.dynamic && valueStr) return `${attrName}="\${${transformExpr(valueStr)}}"`
          if (valueStr) return `${attrName}="${valueStr}"`
          return attrName
        })
        .filter(Boolean)

      if (node.slotId) {
        attrParts.push(`bf="${node.slotId}"`)
      }

      const attrs = attrParts.join(' ')
      const children = node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

      if (children) {
        return `<${node.tag}${attrs ? ' ' + attrs : ''}>${children}</${node.tag}>`
      }
      return `<${node.tag}${attrs ? ' ' + attrs : ''} />`
    }

    case 'text':
      return node.value

    case 'expression':
      if (node.expr === 'null' || node.expr === 'undefined') return ''
      if (node.slotId) {
        return `<span bf="${node.slotId}">\${${transformExpr(node.expr)}}</span>`
      }
      return `\${${transformExpr(node.expr)}}`

    case 'conditional': {
      const trueBranch = irToComponentTemplate(node.whenTrue, propNames)
      const falseBranch = irToComponentTemplate(node.whenFalse, propNames)
      const trueHtml = node.slotId ? addCondAttrToTemplate(trueBranch, node.slotId) : trueBranch
      const falseHtml = node.slotId ? addCondAttrToTemplate(falseBranch, node.slotId) : falseBranch
      return `\${${transformExpr(node.condition)} ? \`${trueHtml}\` : \`${falseHtml}\`}`
    }

    case 'fragment':
      return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

    case 'component': {
      if (node.name === 'Portal') {
        return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')
      }

      const keyProp = node.props.find((p) => p.name === 'key')
      const keyAttr = keyProp ? ` data-key="\${${transformExpr(keyProp.value)}}"` : ''
      return `<div${keyAttr} bf-s="${node.name}_\${Math.random().toString(36).slice(2, 8)}"></div>`
    }

    case 'loop':
      return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

    case 'if-statement':
      return ''

    case 'provider':
      return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

    default:
      return ''
  }
}

/**
 * Check if a component can have a simple static template generated.
 * Returns false if the component has:
 * - Loops (which use dynamic signal arrays)
 * - Child components (which can't be fully represented in templates)
 * - Signal calls in expressions (like todos().length)
 *
 * Components that fail this check should not have registerTemplate() generated
 * as the template would reference undefined variables at module scope.
 */
export function canGenerateStaticTemplate(node: IRNode, propNames: Set<string>): boolean {
  switch (node.type) {
    case 'loop':
      return false

    case 'component':
      return false

    case 'expression':
      if (node.expr.includes('()') && !isSimplePropExpression(node.expr, propNames)) {
        return false
      }
      return true

    case 'element':
      for (const attr of node.attrs) {
        if (attr.dynamic && attr.value) {
          const valueStr = attrValueToString(attr.value)
          if (valueStr && valueStr.includes('()') && !isSimplePropExpression(valueStr, propNames)) {
            return false
          }
        }
      }
      return node.children.every((c) => canGenerateStaticTemplate(c, propNames))

    case 'conditional':
      if (node.condition.includes('()') && !isSimplePropExpression(node.condition, propNames)) {
        return false
      }
      return canGenerateStaticTemplate(node.whenTrue, propNames) &&
             canGenerateStaticTemplate(node.whenFalse, propNames)

    case 'fragment':
      return node.children.every((c) => canGenerateStaticTemplate(c, propNames))

    case 'if-statement':
      if (!canGenerateStaticTemplate(node.consequent, propNames)) {
        return false
      }
      if (node.alternate && !canGenerateStaticTemplate(node.alternate, propNames)) {
        return false
      }
      return true

    case 'provider':
      return node.children.every((c) => canGenerateStaticTemplate(c, propNames))

    case 'text':
      return true

    default:
      return true
  }
}

/**
 * Check if an expression is a simple prop-based expression.
 * Simple prop expressions access props only: todo.done, todo.text, props.name
 * Non-prop expressions call signals: todos(), todos().length, todos().filter(...)
 */
export function isSimplePropExpression(expr: string, propNames: Set<string>): boolean {
  const match = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/)
  if (!match) return true

  const rootIdent = match[1]
  if (propNames.has(rootIdent)) return true
  if (expr.includes('()')) return false

  return true
}
