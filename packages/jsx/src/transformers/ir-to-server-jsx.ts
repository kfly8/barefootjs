/**
 * BarefootJS JSX Compiler - IR to Server JSX Transformer
 *
 * Generates server-side JSX components from Intermediate Representation (IR).
 * Unlike ir-to-html which evaluates expressions, this preserves them as JSX.
 */

import type { IRNode, IRElement, IRFragment, SignalDeclaration, MemoDeclaration } from '../types'
import { isSvgRoot } from '../utils/svg-helpers'

/**
 * Context for server JSX generation
 */
export type ServerJsxContext = {
  componentName: string
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]
  needsDataBfIds: Set<string>  // IDs that need data-bf attribute for querySelector fallback
  /** Event ID counter for event attribute output (to match client-side event delegation) */
  eventIdCounter: { value: number } | null
  /** Whether we're inside a list context (for passing __listIndex to child components) */
  inListContext: boolean
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
 * @param needsDataBfIds - Set of element IDs that need data-bf attribute (for querySelector fallback)
 * @returns JSX string
 */
export function irToServerJsx(
  node: IRNode,
  componentName: string,
  signals: SignalDeclaration[],
  needsDataBfIds: Set<string> = new Set(),
  options: { outputEventAttrs?: boolean; memos?: MemoDeclaration[] } = {}
): string {
  const ctx: ServerJsxContext = {
    componentName,
    signals,
    memos: options.memos || [],
    needsDataBfIds,
    // Initialize event ID counter if outputEventAttrs is enabled
    eventIdCounter: options.outputEventAttrs ? { value: 0 } : null,
    inListContext: false,
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
      const expr = replaceSignalCallsWithProps(node.expression, ctx.signals, ctx.memos)
      return `{${expr}}`

    case 'component':
      // Output component call with props (component will be rendered by server)
      // Skip event handler props (they reference undefined functions in server context)
      const compProps = node.props
        .filter(p => !p.name.startsWith('on'))  // Skip event handlers like onToggle, onClick
        .map(p => {
          const value = replaceSignalCallsWithProps(p.value, ctx.signals, ctx.memos)
          // String literals keep quotes, expressions use braces
          if (value.startsWith('"') || value.startsWith("'")) {
            return `${p.name}=${value}`
          }
          return `${p.name}={${value}}`
        })
      // Pass __listIndex to child components when inside a list
      // This enables proper data-index attribute for event delegation
      if (ctx.inListContext) {
        compProps.push('__listIndex={__index}')
      }
      const propsStr = compProps.join(' ')
      return `<${node.name}${propsStr ? ' ' + propsStr : ''} />`

    case 'conditional':
      // Generate ternary expression
      const condition = replaceSignalCallsWithProps(node.condition, ctx.signals, ctx.memos)
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
 * Fragments output as-is (<>...</>). When fragment is at root,
 * data-bf-scope is added to the first element child.
 */
function fragmentToServerJsxInternal(node: IRFragment, ctx: ServerJsxContext, isRoot: boolean): string {
  const childrenJsx = node.children.map((child, index) => {
    // Pass isRoot to the first element child when fragment is root
    const childIsRoot = isRoot && index === 0 && child.type === 'element'
    return irToServerJsxInternal(child, ctx, childIsRoot)
  }).join('')
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
 * @param needsDataBfIds - Set of element IDs that need data-bf attribute
 * @returns String suitable for use inside JSX expression (e.g., ternary)
 */
function nodeToJsxExpressionValue(node: IRNode, signals: SignalDeclaration[], needsDataBfIds: Set<string> = new Set(), memos: MemoDeclaration[] = []): string {
  const ctx: ServerJsxContext = {
    componentName: '',
    signals,
    memos,
    needsDataBfIds,
    eventIdCounter: null,
    inListContext: false,
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
      return replaceSignalCallsWithProps(node.expression, ctx.signals, ctx.memos)

    case 'element':
      // Element is valid JSX, use as-is
      return elementToServerJsxInternal(node, ctx, false)

    case 'conditional':
      // Nested conditional - recursively process
      const cond = replaceSignalCallsWithProps(node.condition, ctx.signals, ctx.memos)
      const whenTrue = nodeToJsxExpressionValueInternal(node.whenTrue, ctx)
      const whenFalse = nodeToJsxExpressionValueInternal(node.whenFalse, ctx)
      return `(${cond} ? ${whenTrue} : ${whenFalse})`

    case 'component':
      // Component call with props (skip event handlers)
      const compPropsStr = node.props
        .filter(p => !p.name.startsWith('on'))  // Skip event handlers
        .map(p => {
          const value = replaceSignalCallsWithProps(p.value, ctx.signals, ctx.memos)
          if (value.startsWith('"') || value.startsWith("'")) {
            return `${p.name}=${value}`
          }
          return `${p.name}={${value}}`
        })
        .join(' ')
      return `<${node.name}${compPropsStr ? ' ' + compPropsStr : ''} />`

    case 'fragment':
      // Fragment inside expression context (not root)
      return fragmentToServerJsxInternal(node, ctx, false)
  }
}

/**
 * Generates JSX from an IR element (legacy wrapper)
 */
function elementToServerJsx(el: IRElement, signals: SignalDeclaration[], needsDataBfIds: Set<string> = new Set(), memos: MemoDeclaration[] = []): string {
  const ctx: ServerJsxContext = {
    componentName: '',
    signals,
    memos,
    needsDataBfIds,
    eventIdCounter: null,
    inListContext: false,
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

  // Add data-bf for elements that need querySelector fallback
  // (e.g., elements after component siblings where path-based navigation is unreliable)
  if (id && ctx.needsDataBfIds.has(id)) {
    attrParts.push(`data-bf="${id}"`)
  }

  // Add xmlns for SVG root element
  if (isSvgRoot(tagName)) {
    attrParts.push('xmlns="http://www.w3.org/2000/svg"')
  }

  // Spread attributes (preserve expressions)
  for (const spread of spreadAttrs) {
    const expr = replaceSignalCallsWithProps(spread.expression, ctx.signals, ctx.memos)
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
    const expr = replaceSignalCallsWithProps(attr.expression, ctx.signals, ctx.memos)

    // Style objects need special handling
    if (attrName === 'style' && expr.trim().startsWith('{')) {
      attrParts.push(`style={${expr}}`)
    } else {
      attrParts.push(`${attrName}={${expr}}`)
    }
  }

  // Add event attributes for elements with events (data-index and data-event-id)
  // This ensures server HTML matches client template for proper hydration
  if (ctx.eventIdCounter && events.length > 0) {
    const eventId = ctx.eventIdCounter.value++
    // __index is only defined inside .map() callbacks (inListContext)
    // __listIndex is a prop passed from parent when component is used in a list
    // For non-list contexts, only use __listIndex (which may be undefined)
    if (ctx.inListContext) {
      attrParts.push(`data-index={__listIndex ?? __index}`)
    } else {
      attrParts.push(`data-index={__listIndex}`)
    }
    attrParts.push(`data-event-id="${eventId}"`)
  }

  const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

  // List element - generate .map() expression
  if (listInfo) {
    const arrayExpr = replaceSignalCallsWithProps(listInfo.arrayExpression, ctx.signals, ctx.memos)

    // Use itemIR for proper JSX generation (avoids escaping issues)
    if (listInfo.itemIR) {
      // Create a new context for list item processing
      // - Reset event ID counter to 0 for each list item (intentional!)
      //   Each item has the same event-id pattern (0, 1, 2...), distinguished by data-index.
      //   This enables event delegation: handlers look for specific event-ids,
      //   and data-index identifies which item was interacted with.
      // - Set inListContext to true so child components get __listIndex
      const itemCtx: ServerJsxContext = {
        ...ctx,
        eventIdCounter: ctx.eventIdCounter ? { value: 0 } : null,
        inListContext: true,
      }
      let itemJsx = irToServerJsxInternal(listInfo.itemIR, itemCtx, false)
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
 * Replaces signal and memo calls with their values
 *
 * For server JSX, signals don't exist - we use their initial values.
 * Memos are evaluated with signals replaced by their initial values.
 * e.g., count() -> 0 (if signal 'count' has initialValue '0')
 * e.g., doubled() -> 0 * 2 (if memo 'doubled' computes count() * 2)
 *
 * @param expr - Expression string
 * @param signals - Signal declarations
 * @param memos - Memo declarations
 * @returns Expression with signal/memo calls replaced
 */
function replaceSignalAndMemoCalls(expr: string, signals: SignalDeclaration[], memos: MemoDeclaration[]): string {
  let result = expr

  // First, replace signal getter calls with their initial values
  for (const signal of signals) {
    const getterPattern = new RegExp(`\\b${signal.getter}\\(\\)`, 'g')
    result = result.replace(getterPattern, signal.initialValue)
  }

  // Then, replace memo getter calls with their evaluated computation
  for (const memo of memos) {
    const getterPattern = new RegExp(`\\b${memo.getter}\\(\\)`, 'g')
    if (getterPattern.test(result)) {
      // Extract the arrow function body from computation
      // e.g., "() => count() * 2" -> "count() * 2"
      let computationBody = memo.computation
      const arrowMatch = computationBody.match(/^\s*\(\s*\)\s*=>\s*(.+)$/s)
      if (arrowMatch) {
        computationBody = arrowMatch[1].trim()
      }
      // Replace signals in the computation body
      for (const signal of signals) {
        const signalPattern = new RegExp(`\\b${signal.getter}\\(\\)`, 'g')
        computationBody = computationBody.replace(signalPattern, signal.initialValue)
      }
      result = result.replace(getterPattern, `(${computationBody})`)
    }
  }

  return result
}

/**
 * Replaces signal calls with prop references (legacy wrapper for compatibility)
 */
function replaceSignalCallsWithProps(expr: string, signals: SignalDeclaration[], memos: MemoDeclaration[] = []): string {
  return replaceSignalAndMemoCalls(expr, signals, memos)
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
