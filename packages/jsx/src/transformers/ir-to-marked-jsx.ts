/**
 * BarefootJS JSX Compiler - IR to Marked JSX Transformer
 *
 * Generates Marked JSX components from Intermediate Representation (IR).
 * Unlike ir-to-html which evaluates expressions, this preserves them as JSX.
 */

import type {
  IRNode,
  IRElement,
  IRFragment,
  SignalDeclaration,
  MemoDeclaration,
  MarkedJsxContext,
} from '../types'
import { isSvgRoot } from '../utils/svg-helpers'

// Re-export type for backwards compatibility
export type { MarkedJsxContext }

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
export function irToMarkedJsx(
  node: IRNode,
  componentName: string,
  signals: SignalDeclaration[],
  needsDataBfIds: Set<string> = new Set(),
  options: { outputEventAttrs?: boolean; memos?: MemoDeclaration[] } = {}
): string {
  const ctx: MarkedJsxContext = {
    componentName,
    signals,
    memos: options.memos || [],
    needsDataBfIds,
    // Initialize event ID counter if outputEventAttrs is enabled
    eventIdCounter: options.outputEventAttrs ? { value: 0 } : null,
    inListContext: false,
  }
  return irToMarkedJsxInternal(node, ctx, true)
}

/**
 * Internal implementation of IR to Marked JSX conversion
 */
function irToMarkedJsxInternal(node: IRNode, ctx: MarkedJsxContext, isRoot: boolean): string {
  switch (node.type) {
    case 'text':
      return node.content

    case 'expression':
      // Preserve expression as JSX (replace signal calls with prop references)
      const expr = replaceSignalCallsWithProps(node.expression, ctx.signals, ctx.memos)
      // Handle children prop - it might be a function (lazy children pattern)
      if (expr === 'children') {
        return `{typeof children === 'function' ? children() : children}`
      }
      return `{${expr}}`

    case 'component': {
      // Output component call with props (component will be rendered by server)
      // If this is the root node and component needs a scope, wrap in span
      // This happens when a component directly returns another component (no root element)
      const needsScopeWrapper = isRoot && ctx.componentName

      const compPropParts: string[] = []

      // Spread props first ({...prop})
      for (const spread of node.spreadProps || []) {
        const expr = replaceSignalCallsWithProps(spread.expression, ctx.signals, ctx.memos)
        compPropParts.push(`{...${expr}}`)
      }

      // Named props (skip event handlers which reference undefined functions in server context)
      for (const p of node.props) {
        if (p.name.startsWith('on')) continue  // Skip event handlers like onToggle, onClick
        const value = replaceSignalCallsWithProps(p.value, ctx.signals, ctx.memos)
        // String literals keep quotes, expressions use braces
        if (value.startsWith('"') || value.startsWith("'")) {
          compPropParts.push(`${p.name}=${value}`)
        } else {
          compPropParts.push(`${p.name}={${value}}`)
        }
      }

      // Pass __listIndex to child components when inside a list
      // This enables proper data-index attribute for event delegation
      if (ctx.inListContext) {
        compPropParts.push('__listIndex={__index}')
      }
      const propsStr = compPropParts.join(' ')

      // Build the component JSX output
      let componentOutput: string
      // Handle children - if hasLazyChildren, pass as function prop for deferred evaluation
      if (node.children && node.children.length > 0) {
        if (node.hasLazyChildren) {
          // Lazy children: pass as children prop (function that returns content)
          // The component will call children() to render them
          const childrenJsx = node.children.map(child => irToMarkedJsxInternal(child, ctx, false)).join('')
          const childrenProp = `children={() => <>${childrenJsx}</>}`
          const allProps = propsStr ? `${propsStr} ${childrenProp}` : childrenProp
          componentOutput = `<${node.name} ${allProps} />`
        } else {
          // Static children: inline as usual
          const childrenJsx = node.children.map(child => irToMarkedJsxInternal(child, ctx, false)).join('')
          componentOutput = `<${node.name}${propsStr ? ' ' + propsStr : ''}>${childrenJsx}</${node.name}>`
        }
      } else {
        componentOutput = `<${node.name}${propsStr ? ' ' + propsStr : ''} />`
      }

      // Wrap in scope div if needed
      // Use div instead of span because components often contain block elements
      if (needsScopeWrapper) {
        return `<div data-bf-scope="${ctx.componentName}">${componentOutput}</div>`
      }
      return componentOutput
    }

    case 'conditional':
      // Generate ternary expression
      const condition = replaceSignalCallsWithProps(node.condition, ctx.signals, ctx.memos)

      // For dynamic conditionals with ID, inject data-bf-cond attribute
      if (node.id) {
        const whenTrueJsx = injectConditionalMarker(node.whenTrue, node.id, ctx)
        const whenFalseJsx = injectConditionalMarker(node.whenFalse, node.id, ctx)
        return `{${condition} ? ${whenTrueJsx} : ${whenFalseJsx}}`
      }

      // Static conditional - use standard processing
      const whenTrue = nodeToJsxExpressionValueInternal(node.whenTrue, ctx)
      const whenFalse = nodeToJsxExpressionValueInternal(node.whenFalse, ctx)
      return `{${condition} ? ${whenTrue} : ${whenFalse}}`

    case 'element':
      return elementToMarkedJsxInternal(node, ctx, isRoot)

    case 'fragment':
      return fragmentToMarkedJsxInternal(node, ctx, isRoot)
  }
}

/**
 * Internal implementation of fragment to Marked JSX conversion
 *
 * Fragments output as-is (<>...</>). When fragment is at root,
 * data-bf-scope is added to the first element child.
 */
function fragmentToMarkedJsxInternal(node: IRFragment, ctx: MarkedJsxContext, isRoot: boolean): string {
  const childrenJsx = node.children.map((child, index) => {
    // Pass isRoot to the first element child when fragment is root
    const childIsRoot = isRoot && index === 0 && child.type === 'element'
    return irToMarkedJsxInternal(child, ctx, childIsRoot)
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
  const ctx: MarkedJsxContext = {
    componentName: '',
    signals,
    memos,
    needsDataBfIds,
    eventIdCounter: null,
    inListContext: false,
  }
  return nodeToJsxExpressionValueInternal(node, ctx)
}

function nodeToJsxExpressionValueInternal(node: IRNode, ctx: MarkedJsxContext): string {
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
      return elementToMarkedJsxInternal(node, ctx, false)

    case 'conditional':
      // Nested conditional - recursively process
      const cond = replaceSignalCallsWithProps(node.condition, ctx.signals, ctx.memos)
      const whenTrue = nodeToJsxExpressionValueInternal(node.whenTrue, ctx)
      const whenFalse = nodeToJsxExpressionValueInternal(node.whenFalse, ctx)
      return `(${cond} ? ${whenTrue} : ${whenFalse})`

    case 'component':
      // Component call with props (skip event handlers)
      const compPropPartsExpr: string[] = []

      // Spread props first ({...prop})
      for (const spread of node.spreadProps || []) {
        const spreadExpr = replaceSignalCallsWithProps(spread.expression, ctx.signals, ctx.memos)
        compPropPartsExpr.push(`{...${spreadExpr}}`)
      }

      // Named props (skip event handlers)
      for (const p of node.props) {
        if (p.name.startsWith('on')) continue  // Skip event handlers
        const value = replaceSignalCallsWithProps(p.value, ctx.signals, ctx.memos)
        if (value.startsWith('"') || value.startsWith("'")) {
          compPropPartsExpr.push(`${p.name}=${value}`)
        } else {
          compPropPartsExpr.push(`${p.name}={${value}}`)
        }
      }

      const compPropsStr = compPropPartsExpr.join(' ')
      // If component has children, output them
      if (node.children && node.children.length > 0) {
        const compChildrenJsx = node.children.map(child => nodeToJsxExpressionValueInternal(child, ctx)).join('')
        return `<${node.name}${compPropsStr ? ' ' + compPropsStr : ''}>${compChildrenJsx}</${node.name}>`
      }
      return `<${node.name}${compPropsStr ? ' ' + compPropsStr : ''} />`

    case 'fragment':
      // Fragment inside expression context (not root)
      return fragmentToMarkedJsxInternal(node, ctx, false)
  }
}

/**
 * Generates JSX from an IR element (legacy wrapper)
 */
function elementToMarkedJsx(el: IRElement, signals: SignalDeclaration[], needsDataBfIds: Set<string> = new Set(), memos: MemoDeclaration[] = []): string {
  const ctx: MarkedJsxContext = {
    componentName: '',
    signals,
    memos,
    needsDataBfIds,
    eventIdCounter: null,
    inListContext: false,
  }
  return elementToMarkedJsxInternal(el, ctx, false)
}

/**
 * Internal implementation of element to Marked JSX conversion
 */
function elementToMarkedJsxInternal(el: IRElement, ctx: MarkedJsxContext, isRoot: boolean): string {
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
      const itemCtx: MarkedJsxContext = {
        ...ctx,
        eventIdCounter: ctx.eventIdCounter ? { value: 0 } : null,
        inListContext: true,
      }
      let itemJsx = irToMarkedJsxInternal(listInfo.itemIR, itemCtx, false)
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
  const childrenJsx = children.map(child => irToMarkedJsxInternal(child, ctx, false)).join('')

  // Self-closing tag
  if (children.length === 0 && isSelfClosingTag(tagName)) {
    return `<${tagName}${attrsStr} />`
  }

  return `<${tagName}${attrsStr}>${childrenJsx}</${tagName}>`
}

/**
 * Replaces signal and memo calls with their values
 *
 * For Marked JSX, signals don't exist - we use their initial values.
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
      // e.g., "() => { if (x) return 'a'; return 'b' }" -> "{ if (x) return 'a'; return 'b' }"
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
      // Check if computation body is a block (starts with {)
      // Block bodies need to be wrapped as IIFE: (() => {...})()
      // Simple expressions can just be wrapped in parentheses: (expr)
      if (computationBody.startsWith('{')) {
        result = result.replace(getterPattern, `(() => ${computationBody})()`)
      } else {
        result = result.replace(getterPattern, `(${computationBody})`)
      }
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
 * Injects conditional markers into branch for DOM tracking
 *
 * For dynamic conditionals (element switching), we need to mark elements
 * so the client can find and replace them when the condition changes.
 *
 * - Single elements: inject data-bf-cond attribute
 * - Fragments (multiple children): use comment markers <!--bf-cond-start:N-->...<!--bf-cond-end:N-->
 * - Null/undefined: use empty comment markers
 * - Text: wrap in span with data-bf-cond
 *
 * @param node - IR node (branch of conditional)
 * @param condId - Conditional slot ID
 * @param ctx - Marked JSX context
 * @returns JSX string with conditional marker
 */
function injectConditionalMarker(node: IRNode, condId: string, ctx: MarkedJsxContext): string {
  switch (node.type) {
    case 'element': {
      // Generate JSX and inject data-bf-cond attribute
      const jsx = elementToMarkedJsxInternal(node, ctx, false)
      return injectDataBfCondAttribute(jsx, condId)
    }

    case 'fragment': {
      // Empty fragment - use empty comment markers
      if (node.children.length === 0) {
        return `<>{__rawHtml("<!--bf-cond-start:${condId}-->")}{__rawHtml("<!--bf-cond-end:${condId}-->")}</>`
      }

      // Single element child - inject marker to that element
      if (node.children.length === 1 && node.children[0].type === 'element') {
        const childJsx = elementToMarkedJsxInternal(node.children[0], ctx, false)
        return injectDataBfCondAttribute(childJsx, condId)
      }

      // Multiple children - use comment markers to wrap all content
      // __rawHtml outputs raw HTML (comment nodes) without escaping
      const childrenJsx = node.children.map(child => irToMarkedJsxInternal(child, ctx, false)).join('')
      return `<>{__rawHtml("<!--bf-cond-start:${condId}-->")}<>${childrenJsx}</>{__rawHtml("<!--bf-cond-end:${condId}-->")}</>`
    }

    case 'expression': {
      // Check if it's a null/undefined expression
      const exprValue = node.expression.trim()
      if (exprValue === 'null' || exprValue === 'undefined') {
        // Use empty comment markers for null
        return `<>{__rawHtml("<!--bf-cond-start:${condId}-->")}{__rawHtml("<!--bf-cond-end:${condId}-->")}</>`
      }
      // Other expressions - evaluate and wrap if needed
      const expr = replaceSignalCallsWithProps(node.expression, ctx.signals, ctx.memos)
      // Wrap in span with marker
      return `<span data-bf-cond="${condId}">{${expr}}</span>`
    }

    case 'text': {
      // Wrap text in span with marker
      const escaped = node.content.replace(/"/g, '\\"')
      return `<span data-bf-cond="${condId}">${node.content}</span>`
    }

    case 'component': {
      // For components, we need to wrap in a div with the marker
      // since we can't inject attributes into component tags
      const compJsx = nodeToJsxExpressionValueInternal(node, ctx)
      return `<div data-bf-cond="${condId}">${compJsx}</div>`
    }

    case 'conditional': {
      // Nested conditional - wrap in span with marker
      const innerCond = replaceSignalCallsWithProps(node.condition, ctx.signals, ctx.memos)
      const whenTrue = nodeToJsxExpressionValueInternal(node.whenTrue, ctx)
      const whenFalse = nodeToJsxExpressionValueInternal(node.whenFalse, ctx)
      return `<span data-bf-cond="${condId}">{${innerCond} ? ${whenTrue} : ${whenFalse}}</span>`
    }
  }
}

/**
 * Injects data-bf-cond attribute into JSX string
 *
 * Finds the first element tag and adds data-bf-cond="N" after the tag name.
 * e.g., "<span className=\"visible\">" -> "<span data-bf-cond=\"0\" className=\"visible\">"
 */
function injectDataBfCondAttribute(jsx: string, condId: string): string {
  // Match the first opening tag: <tagName followed by space, /, or >
  const match = jsx.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)
  if (!match) return jsx

  const tagName = match[1]
  const tagLength = match[0].length

  // Insert data-bf-cond after the tag name
  return `<${tagName} data-bf-cond="${condId}"${jsx.slice(tagLength)}`
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
