/**
 * BarefootJS JSX Compiler - IR to Server JSX Transformer
 *
 * Generates server-side JSX components from Intermediate Representation (IR).
 * Unlike ir-to-html which evaluates expressions, this preserves them as JSX.
 */

import type { IRNode, IRElement, IRFragment, SignalDeclaration } from '../types'
import { isSvgRoot } from '../utils/svg-helpers'

/**
 * Context for server JSX generation
 */
export type ServerJsxContext = {
  componentName: string
  signals: SignalDeclaration[]
}

/**
 * Converts HTML to JSX format (internal helper)
 *
 * Transforms HTML attributes to their JSX equivalents:
 * - class -> className
 */
function htmlToJsx(html: string): string {
  return html.replace(/\bclass="/g, 'className="')
}

/**
 * Generates JSX from an IR node (preserves expressions)
 *
 * Unlike irToHtml which evaluates expressions with initial values,
 * this function preserves expressions as JSX `{...}` syntax.
 *
 * @param node - IR node to convert
 * @param componentName - Name of the component (for data-bf-scope)
 * @param signals - Signal declarations for prop mapping
 * @returns JSX string
 */
export function irToServerJsx(node: IRNode, componentName: string, signals: SignalDeclaration[]): string {
  const ctx: ServerJsxContext = {
    componentName,
    signals,
  }
  return irToServerJsxInternal(node, ctx, true)
}

/**
 * Internal implementation of IR to Server JSX conversion
 */
function irToServerJsxInternal(node: IRNode, ctx: ServerJsxContext, isRoot: boolean): string {
  switch (node.type) {
    case 'text':
      return node.content

    case 'expression':
      // Preserve expression as JSX (replace signal calls with prop references)
      const expr = replaceSignalCallsWithProps(node.expression, ctx.signals)
      return `{${expr}}`

    case 'component':
      // Output component call with props (component will be rendered by server)
      // Skip event handler props (they reference undefined functions in server context)
      const propsStr = node.props
        .filter(p => !p.name.startsWith('on'))  // Skip event handlers like onToggle, onClick
        .map(p => {
          const value = replaceSignalCallsWithProps(p.value, ctx.signals)
          // String literals keep quotes, expressions use braces
          if (value.startsWith('"') || value.startsWith("'")) {
            return `${p.name}=${value}`
          }
          return `${p.name}={${value}}`
        })
        .join(' ')
      return `<${node.name}${propsStr ? ' ' + propsStr : ''} />`

    case 'conditional':
      // Generate ternary expression
      const condition = replaceSignalCallsWithProps(node.condition, ctx.signals)
      // Use helper to get values suitable for inside JSX expression context
      const whenTrue = nodeToJsxExpressionValueInternal(node.whenTrue, ctx)
      const whenFalse = nodeToJsxExpressionValueInternal(node.whenFalse, ctx)
      return `{${condition} ? ${whenTrue} : ${whenFalse}}`

    case 'element':
      return elementToServerJsxInternal(node, ctx, isRoot)

    case 'fragment':
      return fragmentToServerJsxInternal(node, ctx, isRoot)
  }
}

/**
 * Internal implementation of fragment to server JSX conversion
 *
 * When fragment is the root, wraps children in a div with data-bf-scope
 * to enable proper hydration (querySelector needs a common parent).
 */
function fragmentToServerJsxInternal(node: IRFragment, ctx: ServerJsxContext, isRoot: boolean): string {
  const childrenJsx = node.children.map(child => irToServerJsxInternal(child, ctx, false)).join('')

  // Fragment at root needs a wrapper div for hydration to work
  if (isRoot && ctx.componentName) {
    return `<div data-bf-scope="${ctx.componentName}">${childrenJsx}</div>`
  }

  return `<>${childrenJsx}</>`
}

/**
 * Converts an IR node to a value suitable for use inside a JSX expression context
 *
 * This is used for ternary branches where:
 * - text nodes need to be quoted strings (e.g., "text")
 * - expression nodes should be the expression itself (no outer braces)
 * - element nodes should be the JSX element as-is
 *
 * @param node - IR node to convert
 * @param signals - Signal declarations for prop mapping
 * @returns String suitable for use inside JSX expression (e.g., ternary)
 */
function nodeToJsxExpressionValue(node: IRNode, signals: SignalDeclaration[]): string {
  const ctx: ServerJsxContext = {
    componentName: '',
    signals,
  }
  return nodeToJsxExpressionValueInternal(node, ctx)
}

function nodeToJsxExpressionValueInternal(node: IRNode, ctx: ServerJsxContext): string {
  switch (node.type) {
    case 'text':
      // Text inside expression context needs to be a quoted string
      // Escape any double quotes in the content
      const escaped = node.content.replace(/"/g, '\\"')
      return `"${escaped}"`

    case 'expression':
      // Expression inside expression context: just the expression, no braces
      return replaceSignalCallsWithProps(node.expression, ctx.signals)

    case 'element':
      // Element is valid JSX, use as-is
      return elementToServerJsxInternal(node, ctx, false)

    case 'conditional':
      // Nested conditional - recursively process
      const cond = replaceSignalCallsWithProps(node.condition, ctx.signals)
      const whenTrue = nodeToJsxExpressionValueInternal(node.whenTrue, ctx)
      const whenFalse = nodeToJsxExpressionValueInternal(node.whenFalse, ctx)
      return `(${cond} ? ${whenTrue} : ${whenFalse})`

    case 'component':
      // Component call with props (skip event handlers)
      const compPropsStr = node.props
        .filter(p => !p.name.startsWith('on'))  // Skip event handlers
        .map(p => {
          const value = replaceSignalCallsWithProps(p.value, ctx.signals)
          if (value.startsWith('"') || value.startsWith("'")) {
            return `${p.name}=${value}`
          }
          return `${p.name}={${value}}`
        })
        .join(' ')
      return `<${node.name}${compPropsStr ? ' ' + compPropsStr : ''} />`

    case 'fragment':
      // Fragment inside expression context
      return fragmentToServerJsxInternal(node, ctx)
  }
}

/**
 * Generates JSX from an IR element (legacy wrapper)
 */
function elementToServerJsx(el: IRElement, signals: SignalDeclaration[]): string {
  const ctx: ServerJsxContext = {
    componentName: '',
    signals,
  }
  return elementToServerJsxInternal(el, ctx, false)
}

/**
 * Internal implementation of element to server JSX conversion
 */
function elementToServerJsxInternal(el: IRElement, ctx: ServerJsxContext, isRoot: boolean): string {
  const { tagName, id, staticAttrs, dynamicAttrs, spreadAttrs = [], events, children, listInfo, dynamicContent } = el

  // Build attributes
  const attrParts: string[] = []

  // Add data-bf-scope for root element
  if (isRoot && ctx.componentName) {
    attrParts.push(`data-bf-scope="${ctx.componentName}"`)
  }

  // Add data-bf attribute if present (for DOM references)
  if (id) {
    attrParts.push(`data-bf="${id}"`)
  }

  // Add xmlns for SVG root element
  if (isSvgRoot(tagName)) {
    attrParts.push('xmlns="http://www.w3.org/2000/svg"')
  }

  // Spread attributes (preserve expressions)
  for (const spread of spreadAttrs) {
    const expr = replaceSignalCallsWithProps(spread.expression, ctx.signals)
    attrParts.push(`{...${expr}}`)
  }

  // Static attributes (convert class to className)
  for (const attr of staticAttrs) {
    const attrName = attr.name === 'class' ? 'className' : attr.name
    if (attr.value) {
      attrParts.push(`${attrName}="${attr.value}"`)
    } else {
      attrParts.push(attrName)
    }
  }

  // Dynamic attributes (preserve expressions)
  for (const attr of dynamicAttrs) {
    const attrName = attr.name === 'class' ? 'className' : attr.name
    const expr = replaceSignalCallsWithProps(attr.expression, ctx.signals)

    // Style objects need special handling
    if (attrName === 'style' && expr.trim().startsWith('{')) {
      attrParts.push(`style={${expr}}`)
    } else {
      attrParts.push(`${attrName}={${expr}}`)
    }
  }

  const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

  // List element - generate .map() expression
  if (listInfo) {
    const arrayExpr = replaceSignalCallsWithProps(listInfo.arrayExpression, ctx.signals)

    // Use itemIR for proper JSX generation (avoids escaping issues)
    if (listInfo.itemIR) {
      let itemJsx = irToServerJsxInternal(listInfo.itemIR, ctx, false)
      // Inject data-key attribute if key expression is present
      if (listInfo.keyExpression) {
        itemJsx = injectDataKeyAttribute(itemJsx, listInfo.keyExpression)
      }
      const mapExpr = `{${arrayExpr}?.map((${listInfo.paramName}, __index) => (${itemJsx}))}`
      return `<${tagName}${attrsStr}>${mapExpr}</${tagName}>`
    }

    // Fallback to template string (for backwards compatibility)
    const itemTemplate = htmlToJsx(listInfo.itemTemplate)
    const mapExpr = `{${arrayExpr}?.map((${listInfo.paramName}, __index) => (${itemTemplate}))}`
    return `<${tagName}${attrsStr}>${mapExpr}</${tagName}>`
  }

  // Process children
  const childrenJsx = children.map(child => irToServerJsxInternal(child, ctx, false)).join('')

  // Self-closing tag
  if (children.length === 0 && isSelfClosingTag(tagName)) {
    return `<${tagName}${attrsStr} />`
  }

  return `<${tagName}${attrsStr}>${childrenJsx}</${tagName}>`
}

/**
 * Replaces signal calls with prop references
 *
 * For server JSX, signals don't exist - we use props directly.
 * e.g., todos() -> initialTodos (if signal 'todos' is initialized from prop 'initialTodos')
 *
 * @param expr - Expression string
 * @param signals - Signal declarations
 * @returns Expression with signal calls replaced
 */
function replaceSignalCallsWithProps(expr: string, signals: SignalDeclaration[]): string {
  let result = expr

  for (const signal of signals) {
    // Replace signal getter calls: count() -> initialValue
    // For now, just replace with the initial value expression
    // TODO: Track which signals are initialized from props
    const getterPattern = new RegExp(`\\b${signal.getter}\\(\\)`, 'g')
    result = result.replace(getterPattern, signal.initialValue)
  }

  return result
}

/**
 * Checks if a tag is a self-closing tag
 */
function isSelfClosingTag(tagName: string): boolean {
  return ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())
}

/**
 * Injects data-key attribute into JSX string
 *
 * Finds the first element tag and adds data-key={expression} after the tag name.
 * e.g., "<li className=\"item\">" -> "<li data-key={item.id} className=\"item\">"
 */
function injectDataKeyAttribute(jsx: string, keyExpression: string): string {
  // Match the first opening tag: <tagName followed by space, /, or >
  const match = jsx.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)
  if (!match) return jsx

  const tagName = match[1]
  const tagLength = match[0].length

  // Insert data-key after the tag name
  return `<${tagName} data-key={${keyExpression}}${jsx.slice(tagLength)}`
}
