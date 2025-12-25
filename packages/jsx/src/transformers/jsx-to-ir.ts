/**
 * BarefootJS JSX Compiler - JSX AST to IR Transformer
 *
 * Transforms TypeScript JSX AST to Intermediate Representation (IR).
 */

import ts from 'typescript'
import type {
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRComponent,
  IRConditional,
  IRFragment,
  IRListInfo,
  SignalDeclaration,
  MemoDeclaration,
  CompileResult,
} from '../types'
import { isPascalCase } from '../utils/helpers'
import { IdGenerator } from '../utils/id-generator'
import { jsxToTemplateString } from '../compiler/template-generator'

export type JsxToIRContext = {
  sourceFile: ts.SourceFile
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]
  components: Map<string, CompileResult>
  idGenerator: IdGenerator
}

/**
 * Converts JSX AST node to IR
 */
export function jsxToIR(node: ts.Node, ctx: JsxToIRContext): IRNode | null {
  if (ts.isJsxElement(node)) {
    return jsxElementToIR(node, ctx)
  }

  if (ts.isJsxSelfClosingElement(node)) {
    return jsxSelfClosingToIR(node, ctx)
  }

  if (ts.isJsxFragment(node)) {
    return jsxFragmentToIR(node, ctx)
  }

  if (ts.isJsxText(node)) {
    // JSX text processing follows React-like rules:
    // 1. Text containing only whitespace with newlines is ignored (indentation)
    // 2. Inline spaces between elements are preserved (e.g., "<span>A</span> <span>B</span>")
    // 3. Leading/trailing newlines with their indentation are trimmed
    // 4. Internal newlines are converted to single space
    // 5. Adjacent whitespace is preserved (e.g., "text: " keeps trailing space)
    const rawText = node.getText(ctx.sourceFile)

    // If text is only whitespace
    if (/^\s*$/.test(rawText)) {
      // Pure indentation (starts with newline) - skip it
      if (rawText.startsWith('\n') || rawText.startsWith('\r')) {
        return null
      }
      // Inline spaces (e.g., " " between elements) - preserve
      if (/^[ \t]+$/.test(rawText)) {
        return { type: 'text', content: rawText }
      }
      // Other whitespace patterns with embedded newlines - skip
      return null
    }

    // Normalize: collapse leading/trailing whitespace with newlines, preserve inline spaces
    let text = rawText
      // Remove leading whitespace that includes newlines
      .replace(/^[\t ]*\n[\s]*/, '')
      // Remove trailing whitespace that includes newlines
      .replace(/[\s]*\n[\t ]*$/, '')
      // Convert internal newlines to single space
      .replace(/\s*\n\s*/g, ' ')

    if (!text) return null
    return { type: 'text', content: text }
  }

  if (ts.isJsxExpression(node) && node.expression) {
    return jsxExpressionToIR(node.expression, ctx)
  }

  return null
}

/**
 * Converts JSX fragment to IR
 */
function jsxFragmentToIR(node: ts.JsxFragment, ctx: JsxToIRContext): IRFragment {
  const children: IRNode[] = []
  for (const child of node.children) {
    const irNode = jsxToIR(child, ctx)
    if (irNode) {
      children.push(irNode)
    }
  }
  return {
    type: 'fragment',
    children,
  }
}

/**
 * Converts JSX element to IR
 */
function jsxElementToIR(node: ts.JsxElement, ctx: JsxToIRContext): IRNode {
  const tagName = node.openingElement.tagName.getText(ctx.sourceFile)

  // Component tag
  if (isPascalCase(tagName) && ctx.components.has(tagName)) {
    return componentToIR(tagName, node.openingElement.attributes, node.children, ctx)
  }

  // Regular HTML element
  const { staticAttrs, dynamicAttrs, spreadAttrs, ref, events } = processAttributes(
    node.openingElement.attributes,
    ctx
  )

  // Process children
  const { children, listInfo, hasDynamicContent, dynamicContent } = processChildren(node.children, ctx)

  // Assign slot ID if element needs client-side handling
  const needsId = events.length > 0 || dynamicAttrs.length > 0 || listInfo || hasDynamicContent || ref !== null
  const id = needsId ? generateSlotId(ctx) : null

  return {
    type: 'element',
    tagName,
    id,
    staticAttrs,
    dynamicAttrs,
    spreadAttrs,
    ref,
    events,
    children,
    listInfo,
    dynamicContent,
  }
}

/**
 * Converts self-closing JSX element to IR
 */
function jsxSelfClosingToIR(node: ts.JsxSelfClosingElement, ctx: JsxToIRContext): IRNode {
  const tagName = node.tagName.getText(ctx.sourceFile)

  // Component tag (self-closing has no children)
  if (isPascalCase(tagName) && ctx.components.has(tagName)) {
    return componentToIR(tagName, node.attributes, [], ctx)
  }

  const { staticAttrs, dynamicAttrs, spreadAttrs, ref, events } = processAttributes(node.attributes, ctx)

  const needsId = events.length > 0 || dynamicAttrs.length > 0 || ref !== null
  const id = needsId ? generateSlotId(ctx) : null

  return {
    type: 'element',
    tagName,
    id,
    staticAttrs,
    dynamicAttrs,
    spreadAttrs,
    ref,
    events,
    children: [],
    listInfo: null,
    dynamicContent: null,
  }
}

/**
 * Converts component to IR
 */
function componentToIR(
  tagName: string,
  attributes: ts.JsxAttributes,
  jsxChildren: ts.NodeArray<ts.JsxChild> | ts.JsxChild[],
  ctx: JsxToIRContext
): IRComponent {
  const componentResult = ctx.components.get(tagName)!
  const props: IRComponent['props'] = []
  const spreadProps: IRComponent['spreadProps'] = []

  attributes.properties.forEach((attr) => {
    // Handle spread attributes ({...prop})
    if (ts.isJsxSpreadAttribute(attr)) {
      const expression = attr.expression.getText(ctx.sourceFile)
      spreadProps.push({ expression })
      return
    }

    if (ts.isJsxAttribute(attr) && attr.name) {
      const propName = attr.name.getText(ctx.sourceFile)
      if (attr.initializer) {
        if (ts.isStringLiteral(attr.initializer)) {
          props.push({ name: propName, value: `"${attr.initializer.text}"`, isDynamic: false })
        } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
          const expr = attr.initializer.expression.getText(ctx.sourceFile)
          props.push({ name: propName, value: expr, isDynamic: true })
        }
      }
    }
  })

  // Process children
  const children: IRNode[] = []
  for (const child of jsxChildren) {
    const irNode = jsxToIR(child, ctx)
    if (irNode) {
      children.push(irNode)
    }
  }

  // Child component initialization info
  let childInits = null
  if (componentResult.props.length > 0 && props.length > 0) {
    const propsExpr = `{ ${props.map(p => `${p.name}: ${p.value}`).join(', ')} }`
    childInits = { name: tagName, propsExpr }
  }

  return {
    type: 'component',
    name: tagName,
    props,
    spreadProps,
    staticHtml: '', // Not used - component HTML is generated in server adapter
    childInits,
    children,
  }
}

/**
 * Converts JSX expression to IR
 */
function jsxExpressionToIR(expr: ts.Expression, ctx: JsxToIRContext): IRNode {
  // Detect map expression
  if (ts.isCallExpression(expr)) {
    const mapInfo = extractMapInfo(expr, ctx)
    if (mapInfo) {
      // Map needs to pass list info to parent element,
      // so special handling is required here.
      // Return as expression for now, process in parent.
      return {
        type: 'expression',
        expression: expr.getText(ctx.sourceFile),
        isDynamic: true,
      }
    }
  }

  // Detect ternary operator
  if (ts.isConditionalExpression(expr)) {
    return conditionalToIR(expr, ctx)
  }

  // Detect logical AND with JSX (e.g., {flag && <Component />})
  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    const jsxInRight = findJsxInExpression(expr.right)
    if (jsxInRight) {
      const condition = expr.left.getText(ctx.sourceFile)
      const whenTrue = jsxToIR(jsxInRight, ctx)!
      const whenFalse: IRNode = { type: 'expression', expression: 'null', isDynamic: false }

      // Assign ID for dynamic conditionals
      const isDynamic = containsReactiveCall(condition, ctx.signals, ctx.memos)
      const id = isDynamic ? ctx.idGenerator.generateSlotId() : null

      return {
        type: 'conditional',
        id,
        condition,
        whenTrue,
        whenFalse,
      }
    }
  }

  // Detect logical OR with JSX (e.g., {loading || <Component />})
  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    const jsxInRight = findJsxInExpression(expr.right)
    if (jsxInRight) {
      const condition = expr.left.getText(ctx.sourceFile)
      const whenTrue = jsxToIR(jsxInRight, ctx)!
      const whenFalse: IRNode = { type: 'expression', expression: 'null', isDynamic: false }

      // Assign ID for dynamic conditionals
      const isDynamic = containsReactiveCall(condition, ctx.signals, ctx.memos)
      const id = isDynamic ? ctx.idGenerator.generateSlotId() : null

      return {
        type: 'conditional',
        id,
        condition: `!(${condition})`,
        whenTrue,
        whenFalse,
      }
    }
  }

  // Regular expression
  const exprText = expr.getText(ctx.sourceFile)
  const isDynamic = containsReactiveCall(exprText, ctx.signals, ctx.memos)

  return {
    type: 'expression',
    expression: exprText,
    isDynamic,
  }
}

/**
 * Finds JSX element in expression (unwrapping parentheses)
 */
function findJsxInExpression(node: ts.Expression): ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment | null {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return node
  }
  if (ts.isParenthesizedExpression(node)) {
    return findJsxInExpression(node.expression)
  }
  return null
}

/**
 * Converts ternary operator to IR
 */
function conditionalToIR(expr: ts.ConditionalExpression, ctx: JsxToIRContext): IRConditional {
  const condition = expr.condition.getText(ctx.sourceFile)

  const whenTrue = processConditionalBranch(expr.whenTrue, ctx)
  const whenFalse = processConditionalBranch(expr.whenFalse, ctx)

  // Check if condition is dynamic (signal-dependent) and involves JSX elements
  const isDynamic = containsReactiveCall(condition, ctx.signals, ctx.memos)
  const hasJsxBranch = whenTrue.type === 'element' || whenTrue.type === 'fragment' ||
                       whenFalse.type === 'element' || whenFalse.type === 'fragment' ||
                       (whenFalse.type === 'expression' && whenFalse.expression === 'null')

  // Assign ID only for dynamic conditionals with JSX branches
  const id = isDynamic && hasJsxBranch ? ctx.idGenerator.generateSlotId() : null

  return {
    type: 'conditional',
    id,
    condition,
    whenTrue,
    whenFalse,
  }
}

/**
 * Processes conditional branch
 */
function processConditionalBranch(node: ts.Expression, ctx: JsxToIRContext): IRNode {
  // Parenthesized expression
  if (ts.isParenthesizedExpression(node)) {
    return processConditionalBranch(node.expression, ctx)
  }

  // JSX element or fragment
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return jsxToIR(node, ctx)!
  }

  // Expression
  return {
    type: 'expression',
    expression: node.getText(ctx.sourceFile),
    isDynamic: containsReactiveCall(node.getText(ctx.sourceFile), ctx.signals, ctx.memos),
  }
}

/**
 * Processes attributes
 */
function processAttributes(
  attributes: ts.JsxAttributes,
  ctx: JsxToIRContext
): {
  staticAttrs: IRElement['staticAttrs']
  dynamicAttrs: IRElement['dynamicAttrs']
  spreadAttrs: IRElement['spreadAttrs']
  ref: string | null
  events: IRElement['events']
} {
  const staticAttrs: IRElement['staticAttrs'] = []
  const dynamicAttrs: IRElement['dynamicAttrs'] = []
  const spreadAttrs: IRElement['spreadAttrs'] = []
  let ref: string | null = null
  const events: IRElement['events'] = []

  attributes.properties.forEach((attr) => {
    // Handle spread attributes
    if (ts.isJsxSpreadAttribute(attr)) {
      const expression = attr.expression.getText(ctx.sourceFile)
      spreadAttrs.push({ expression })
      return
    }

    if (!ts.isJsxAttribute(attr) || !attr.name) return

    const attrName = attr.name.getText(ctx.sourceFile)

    // Skip key attribute (handled separately by list processing)
    if (attrName === 'key') {
      return
    }

    // Handle ref attribute
    if (attrName === 'ref') {
      if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        ref = attr.initializer.expression.getText(ctx.sourceFile)
      }
      return
    }

    // Event handler
    if (attrName.startsWith('on')) {
      const eventName = attrName.slice(2).toLowerCase()
      if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        const handler = attr.initializer.expression.getText(ctx.sourceFile)
        events.push({ name: attrName, eventName, handler })
      }
      return
    }

    // Dynamic attribute (signal-dependent expression or specific attribute targets)
    if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
      const expression = attr.initializer.expression.getText(ctx.sourceFile)
      // Treat as dynamic if it's a known target OR contains signal calls
      if (isDynamicAttributeTarget(attrName) || containsReactiveCall(expression, ctx.signals, ctx.memos)) {
        dynamicAttrs.push({ name: attrName, expression })
        return
      }
    }

    // Static attribute
    if (attr.initializer) {
      if (ts.isStringLiteral(attr.initializer)) {
        staticAttrs.push({ name: attrName, value: attr.initializer.text })
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        // Expression without signal calls - store as static
        staticAttrs.push({ name: attrName, value: attr.initializer.expression.getText(ctx.sourceFile) })
      }
    } else {
      staticAttrs.push({ name: attrName, value: '' })
    }
  })

  return { staticAttrs, dynamicAttrs, spreadAttrs, ref, events }
}

/**
 * Processes children
 */
function processChildren(
  children: ts.NodeArray<ts.JsxChild>,
  ctx: JsxToIRContext
): {
  children: IRNode[]
  listInfo: IRListInfo | null
  hasDynamicContent: boolean
  dynamicContent: { expression: string; fullContent: string } | null
} {
  const irChildren: IRNode[] = []
  let listInfo: IRListInfo | null = null
  let hasDynamicContent = false
  const contentParts: Array<{ type: 'text' | 'expression'; value: string }> = []
  let dynamicExpression = ''

  for (const child of children) {
    // Detect map expression
    if (ts.isJsxExpression(child) && child.expression && ts.isCallExpression(child.expression)) {
      const mapResult = extractMapInfo(child.expression, ctx)
      if (mapResult) {
        listInfo = mapResult
        continue
      }
    }

    const irNode = jsxToIR(child, ctx)
    if (irNode) {
      irChildren.push(irNode)
      if (irNode.type === 'expression' && irNode.isDynamic) {
        hasDynamicContent = true
        dynamicExpression = irNode.expression
        contentParts.push({ type: 'expression', value: irNode.expression })
      } else if (irNode.type === 'text') {
        contentParts.push({ type: 'text', value: irNode.content })
      } else if (irNode.type === 'expression' && !irNode.isDynamic) {
        contentParts.push({ type: 'expression', value: irNode.expression })
      } else if (irNode.type === 'conditional') {
        // Conditional expression with signal-dependent condition
        // Only mark as dynamic content if it's a text-only conditional (no id)
        // Element conditionals with id are handled by DOM switching, not textContent
        if (!irNode.id && containsReactiveCall(irNode.condition, ctx.signals, ctx.memos)) {
          hasDynamicContent = true
          // Reconstruct the ternary expression for fullContent
          const whenTrueExpr = irNode.whenTrue.type === 'expression' ? irNode.whenTrue.expression : ''
          const whenFalseExpr = irNode.whenFalse.type === 'expression' ? irNode.whenFalse.expression : ''
          const ternaryExpr = `${irNode.condition} ? ${whenTrueExpr} : ${whenFalseExpr}`
          dynamicExpression = ternaryExpr
          contentParts.push({ type: 'expression', value: ternaryExpr })
        }
      }
    }
  }

  // Build fullContent for dynamic elements
  let dynamicContent: { expression: string; fullContent: string } | null = null
  if (hasDynamicContent && contentParts.length > 0) {
    // If only one expression, use it directly without String() wrapper
    if (contentParts.length === 1 && contentParts[0].type === 'expression') {
      dynamicContent = { expression: dynamicExpression, fullContent: contentParts[0].value }
    } else {
      // Multiple parts: wrap expressions with String() for concatenation
      const fullContent = contentParts.map(part =>
        part.type === 'text' ? `"${part.value}"` : `String(${part.value})`
      ).join(' + ')
      dynamicContent = { expression: dynamicExpression, fullContent }
    }
  }

  return { children: irChildren, listInfo, hasDynamicContent, dynamicContent }
}

/**
 * Extracts information from map expression
 */
function extractMapInfo(expr: ts.CallExpression, ctx: JsxToIRContext): IRListInfo | null {
  if (!ts.isPropertyAccessExpression(expr.expression)) return null
  if (expr.expression.name.text !== 'map') return null

  const callback = expr.arguments[0]
  if (!callback || !ts.isArrowFunction(callback)) return null

  const param = callback.parameters[0]
  if (!param) return null

  const paramName = param.name.getText(ctx.sourceFile)
  // Check for index parameter (e.g., (item, index) => ...)
  const indexParam = callback.parameters[1]
  const indexParamName = indexParam ? indexParam.name.getText(ctx.sourceFile) : null
  const arrayExpr = expr.expression.expression.getText(ctx.sourceFile)

  // Generate template from callback body
  let jsxBody: ts.JsxElement | ts.JsxSelfClosingElement | null = null
  const body = callback.body

  if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body)) {
    jsxBody = body
  } else if (ts.isParenthesizedExpression(body)) {
    const inner = body.expression
    if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
      jsxBody = inner
    }
  }

  if (!jsxBody) return null

  // Extract key attribute from the root element
  const keyExpression = extractKeyAttribute(jsxBody, ctx, indexParamName)

  // Convert JSX to template string (with component inlining support)
  const { template, events } = jsxToTemplateString(jsxBody, ctx.sourceFile, paramName, ctx.components)

  // Also convert JSX to IR for server JSX generation
  const itemIR = jsxToIR(jsxBody, ctx)

  return {
    arrayExpression: arrayExpr,
    paramName,
    itemTemplate: template,
    itemIR,
    itemEvents: events.map(e => ({ ...e, paramName })),
    keyExpression,
  }
}

/**
 * Extracts key attribute from JSX element
 * Returns the expression (e.g., 'item.id' or '__index') or null if no key
 */
function extractKeyAttribute(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  ctx: JsxToIRContext,
  indexParamName: string | null
): string | null {
  const attributes = ts.isJsxElement(node)
    ? node.openingElement.attributes
    : node.attributes

  for (const attr of attributes.properties) {
    if (!ts.isJsxAttribute(attr) || !attr.name) continue

    const attrName = attr.name.getText(ctx.sourceFile)
    if (attrName !== 'key') continue

    if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
      const expr = attr.initializer.expression.getText(ctx.sourceFile)
      // If key is the index parameter, normalize to __index
      if (indexParamName && expr === indexParamName) {
        return '__index'
      }
      return expr
    }
  }

  return null
}

/**
 * Generates a slot ID for dynamic elements
 *
 * All dynamic elements get sequential IDs (0, 1, 2...).
 * The type of element (event, attr, list, content) is tracked in the registry.
 */
function generateSlotId(ctx: JsxToIRContext): string {
  return ctx.idGenerator.generateSlotId()
}

/**
 * Checks if an attribute is a dynamic attribute target
 */
function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden', 'data-key'].includes(attrName)
}

/**
 * Checks if expression contains signal or memo calls
 */
function containsReactiveCall(expr: string, signals: SignalDeclaration[], memos: MemoDeclaration[]): boolean {
  const hasSignalCall = signals.some(s => {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(`)
    return regex.test(expr)
  })
  if (hasSignalCall) return true

  const hasMemoCall = memos.some(m => {
    const regex = new RegExp(`\\b${m.getter}\\s*\\(`)
    return regex.test(expr)
  })
  return hasMemoCall
}

/**
 * Checks if expression contains signal calls (legacy - for backwards compatibility)
 */
function containsSignalCall(expr: string, signals: SignalDeclaration[]): boolean {
  return signals.some(s => {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(`)
    return regex.test(expr)
  })
}

/**
 * Finds component's JSX return and converts to IR
 *
 * @param sourceFile - TypeScript source file
 * @param ctx - JSX to IR context
 * @param targetComponentName - Optional: specific component name to find (if not provided, finds first PascalCase function)
 */
export function findAndConvertJsxReturn(
  sourceFile: ts.SourceFile,
  ctx: JsxToIRContext,
  targetComponentName?: string
): IRNode | null {
  let result: IRNode | null = null

  // Track all found components for fallback
  let fallbackResult: IRNode | null = null
  let foundTargetComponent = false

  function visit(node: ts.Node) {
    if (result) return // Already found target

    // Find function declaration with PascalCase name (component)
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      // If targetComponentName is specified, only process that component
      if (targetComponentName && node.name.text !== targetComponentName) {
        // Save first component as fallback (in case target is not found)
        if (fallbackResult === null && node.body) {
          const savedResult = result
          findReturnInBody(node.body)
          fallbackResult = result
          result = savedResult
        }
      } else {
        // Target found (or no target specified, use first PascalCase function)
        foundTargetComponent = true
        findReturnInBody(node.body)
      }
    }
    ts.forEachChild(node, visit)
  }

  function findReturnInBody(node: ts.Node | undefined) {
    if (!node) return

    if (ts.isReturnStatement(node) && node.expression) {
      let expr = node.expression
      if (ts.isParenthesizedExpression(expr)) {
        expr = expr.expression
      }
      if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr) || ts.isJsxFragment(expr)) {
        result = jsxToIR(expr, ctx)
      }
      return
    }

    ts.forEachChild(node, findReturnInBody)
  }

  visit(sourceFile)

  // If target component not found but we have a fallback, use it
  // This handles the case where file name doesn't match function name
  if (!result && !foundTargetComponent && fallbackResult) {
    result = fallbackResult
  }

  return result
}
