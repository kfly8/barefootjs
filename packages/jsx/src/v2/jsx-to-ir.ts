/**
 * BarefootJS Compiler v2 - JSX to Pure IR Transformer
 *
 * Transforms TypeScript JSX AST to Pure IR (JSX-independent JSON structure).
 */

import ts from 'typescript'
import type {
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRFragment,
  IRAttribute,
  IREvent,
  IRProp,
  SourceLocation,
  TypeInfo,
} from './types'
import { type AnalyzerContext, getSourceLocation } from './analyzer-context'

// =============================================================================
// Transform Context
// =============================================================================

interface TransformContext {
  analyzer: AnalyzerContext
  sourceFile: ts.SourceFile
  filePath: string
  slotIdCounter: number
  isRoot: boolean
}

function createTransformContext(analyzer: AnalyzerContext): TransformContext {
  return {
    analyzer,
    sourceFile: analyzer.sourceFile,
    filePath: analyzer.filePath,
    slotIdCounter: 0,
    isRoot: true,
  }
}

function generateSlotId(ctx: TransformContext): string {
  return `slot_${ctx.slotIdCounter++}`
}

// =============================================================================
// Main Entry Point
// =============================================================================

export function jsxToIR(analyzer: AnalyzerContext): IRNode | null {
  if (!analyzer.jsxReturn) return null

  const ctx = createTransformContext(analyzer)
  return transformNode(analyzer.jsxReturn, ctx)
}

// =============================================================================
// Node Transformation
// =============================================================================

function transformNode(node: ts.Node, ctx: TransformContext): IRNode | null {
  // JSX Element: <div>...</div>
  if (ts.isJsxElement(node)) {
    return transformJsxElement(node, ctx)
  }

  // Self-closing element: <br />
  if (ts.isJsxSelfClosingElement(node)) {
    return transformSelfClosingElement(node, ctx)
  }

  // Fragment: <>...</>
  if (ts.isJsxFragment(node)) {
    return transformFragment(node, ctx)
  }

  // Text content
  if (ts.isJsxText(node)) {
    return transformText(node, ctx)
  }

  // Expression: {expr}
  if (ts.isJsxExpression(node)) {
    return transformExpression(node, ctx)
  }

  return null
}

// =============================================================================
// JSX Element Transformation
// =============================================================================

function transformJsxElement(
  node: ts.JsxElement,
  ctx: TransformContext
): IRNode {
  const tagName = node.openingElement.tagName.getText(ctx.sourceFile)
  const isComponent = /^[A-Z]/.test(tagName)

  if (isComponent) {
    return transformComponentElement(node, ctx, tagName)
  }

  return transformHtmlElement(node, ctx, tagName)
}

function transformHtmlElement(
  node: ts.JsxElement,
  ctx: TransformContext,
  tagName: string
): IRElement {
  const { attrs, events, ref } = processAttributes(
    node.openingElement.attributes,
    ctx
  )
  const children = transformChildren(node.children, ctx)

  // Determine if this element needs a slot ID
  const needsSlot = events.length > 0 || hasDynamicContent(children)
  const slotId = needsSlot ? generateSlotId(ctx) : null

  const needsScope = ctx.isRoot
  ctx.isRoot = false

  return {
    type: 'element',
    tag: tagName,
    attrs,
    events,
    ref,
    children,
    slotId,
    needsScope,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

function transformSelfClosingElement(
  node: ts.JsxSelfClosingElement,
  ctx: TransformContext
): IRNode {
  const tagName = node.tagName.getText(ctx.sourceFile)
  const isComponent = /^[A-Z]/.test(tagName)

  if (isComponent) {
    return transformSelfClosingComponent(node, ctx, tagName)
  }

  const { attrs, events, ref } = processAttributes(node.attributes, ctx)

  const needsSlot = events.length > 0
  const slotId = needsSlot ? generateSlotId(ctx) : null

  const needsScope = ctx.isRoot
  ctx.isRoot = false

  return {
    type: 'element',
    tag: tagName,
    attrs,
    events,
    ref,
    children: [],
    slotId,
    needsScope,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Component Transformation
// =============================================================================

function transformComponentElement(
  node: ts.JsxElement,
  ctx: TransformContext,
  name: string
): IRComponent {
  const props = processComponentProps(node.openingElement.attributes, ctx)
  const children = transformChildren(node.children, ctx)

  return {
    type: 'component',
    name,
    props,
    propsType: null, // Will be resolved later
    children,
    template: name.toLowerCase(),
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

function transformSelfClosingComponent(
  node: ts.JsxSelfClosingElement,
  ctx: TransformContext,
  name: string
): IRComponent {
  const props = processComponentProps(node.attributes, ctx)

  return {
    type: 'component',
    name,
    props,
    propsType: null,
    children: [],
    template: name.toLowerCase(),
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Fragment Transformation
// =============================================================================

function transformFragment(
  node: ts.JsxFragment,
  ctx: TransformContext
): IRFragment {
  const children = transformChildren(node.children, ctx)

  return {
    type: 'fragment',
    children,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Children Transformation
// =============================================================================

function transformChildren(
  children: ts.NodeArray<ts.JsxChild>,
  ctx: TransformContext
): IRNode[] {
  const result: IRNode[] = []

  for (const child of children) {
    const transformed = transformNode(child, ctx)
    if (transformed) {
      // Skip empty text nodes
      if (transformed.type === 'text' && transformed.value.trim() === '') {
        continue
      }
      result.push(transformed)
    }
  }

  return result
}

// =============================================================================
// Text Transformation
// =============================================================================

function transformText(node: ts.JsxText, ctx: TransformContext): IRText | null {
  // Normalize whitespace (React-like behavior)
  const text = node.text.replace(/\s+/g, ' ')

  if (text.trim() === '') {
    return null
  }

  return {
    type: 'text',
    value: text,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Expression Transformation
// =============================================================================

function transformExpression(
  node: ts.JsxExpression,
  ctx: TransformContext
): IRNode | null {
  if (!node.expression) return null

  const expr = node.expression

  // Ternary expression: {cond ? a : b}
  if (ts.isConditionalExpression(expr)) {
    return transformConditional(expr, ctx)
  }

  // Logical AND: {cond && <Component />}
  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    return transformLogicalAnd(expr, ctx)
  }

  // Array map: {items.map(item => <li>{item}</li>)}
  if (ts.isCallExpression(expr) && isMapCall(expr)) {
    return transformMapCall(expr, ctx)
  }

  // Regular expression
  const exprText = expr.getText(ctx.sourceFile)
  const reactive = isReactiveExpression(exprText, ctx)
  const slotId = reactive ? generateSlotId(ctx) : null

  return {
    type: 'expression',
    expr: exprText,
    typeInfo: inferExpressionType(expr, ctx),
    reactive,
    slotId,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Conditional Transformation
// =============================================================================

function transformConditional(
  node: ts.ConditionalExpression,
  ctx: TransformContext
): IRConditional {
  const condition = node.condition.getText(ctx.sourceFile)
  const reactive = isReactiveExpression(condition, ctx)
  const slotId = reactive ? generateSlotId(ctx) : null

  // Transform both branches
  const whenTrue = transformConditionalBranch(node.whenTrue, ctx)
  const whenFalse = transformConditionalBranch(node.whenFalse, ctx)

  return {
    type: 'conditional',
    condition,
    conditionType: null,
    reactive,
    whenTrue,
    whenFalse,
    slotId,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

function transformLogicalAnd(
  node: ts.BinaryExpression,
  ctx: TransformContext
): IRConditional {
  const condition = node.left.getText(ctx.sourceFile)
  const reactive = isReactiveExpression(condition, ctx)
  const slotId = reactive ? generateSlotId(ctx) : null

  const whenTrue = transformConditionalBranch(node.right, ctx)
  const whenFalse: IRExpression = {
    type: 'expression',
    expr: 'null',
    typeInfo: { kind: 'primitive', raw: 'null', primitive: 'null' },
    reactive: false,
    slotId: null,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }

  return {
    type: 'conditional',
    condition,
    conditionType: null,
    reactive,
    whenTrue,
    whenFalse,
    slotId,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

function transformConditionalBranch(
  node: ts.Expression,
  ctx: TransformContext
): IRNode {
  // JSX element
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return transformNode(node, ctx)!
  }

  // Parenthesized expression
  if (ts.isParenthesizedExpression(node)) {
    return transformConditionalBranch(node.expression, ctx)
  }

  // Regular expression (including null)
  const exprText = node.getText(ctx.sourceFile)
  return {
    type: 'expression',
    expr: exprText,
    typeInfo: inferExpressionType(node, ctx),
    reactive: isReactiveExpression(exprText, ctx),
    slotId: null,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Map Call (Loop) Transformation
// =============================================================================

function isMapCall(node: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) return false
  return node.expression.name.text === 'map'
}

function transformMapCall(
  node: ts.CallExpression,
  ctx: TransformContext
): IRLoop {
  const propAccess = node.expression as ts.PropertyAccessExpression
  const array = propAccess.expression.getText(ctx.sourceFile)

  // Get callback function
  const callback = node.arguments[0]
  let param = 'item'
  let index: string | null = null
  let children: IRNode[] = []

  if (ts.isArrowFunction(callback)) {
    // Extract parameter names
    if (callback.parameters.length > 0) {
      const firstParam = callback.parameters[0]
      param = firstParam.name.getText(ctx.sourceFile)
    }
    if (callback.parameters.length > 1) {
      const secondParam = callback.parameters[1]
      index = secondParam.name.getText(ctx.sourceFile)
    }

    // Transform callback body
    const body = callback.body
    if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body) || ts.isJsxFragment(body)) {
      const transformed = transformNode(body, ctx)
      if (transformed) {
        children = [transformed]
      }
    } else if (ts.isParenthesizedExpression(body)) {
      const inner = body.expression
      if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner) || ts.isJsxFragment(inner)) {
        const transformed = transformNode(inner, ctx)
        if (transformed) {
          children = [transformed]
        }
      }
    }
  }

  // Look for key prop in first child
  let key: string | null = null
  if (children.length > 0 && children[0].type === 'element') {
    const keyAttr = children[0].attrs.find((a) => a.name === 'key')
    if (keyAttr && keyAttr.value) {
      key = keyAttr.value
    }
  }

  return {
    type: 'loop',
    array,
    arrayType: null,
    itemType: null,
    param,
    index,
    key,
    children,
    slotId: generateSlotId(ctx),
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  }
}

// =============================================================================
// Attribute Processing
// =============================================================================

interface ProcessedAttributes {
  attrs: IRAttribute[]
  events: IREvent[]
  ref: string | null
}

function processAttributes(
  attributes: ts.JsxAttributes,
  ctx: TransformContext
): ProcessedAttributes {
  const attrs: IRAttribute[] = []
  const events: IREvent[] = []
  let ref: string | null = null

  for (const attr of attributes.properties) {
    // Spread attribute: {...props}
    if (ts.isJsxSpreadAttribute(attr)) {
      attrs.push({
        name: '...',
        value: attr.expression.getText(ctx.sourceFile),
        dynamic: true,
        loc: getSourceLocation(attr, ctx.sourceFile, ctx.filePath),
      })
      continue
    }

    if (!ts.isJsxAttribute(attr)) continue

    const name = attr.name.getText(ctx.sourceFile)

    // Ref attribute
    if (name === 'ref') {
      if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        ref = attr.initializer.expression.getText(ctx.sourceFile)
      }
      continue
    }

    // Event handler: onClick, onChange, etc.
    if (/^on[A-Z]/.test(name)) {
      if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        const eventName = name.slice(2).toLowerCase()
        events.push({
          name: eventName,
          handler: attr.initializer.expression.getText(ctx.sourceFile),
          loc: getSourceLocation(attr, ctx.sourceFile, ctx.filePath),
        })
      }
      continue
    }

    // Regular attribute
    const { value, dynamic } = getAttributeValue(attr, ctx)
    attrs.push({
      name,
      value,
      dynamic,
      loc: getSourceLocation(attr, ctx.sourceFile, ctx.filePath),
    })
  }

  return { attrs, events, ref }
}

function getAttributeValue(
  attr: ts.JsxAttribute,
  ctx: TransformContext
): { value: string | null; dynamic: boolean } {
  // Boolean attribute: <button disabled />
  if (!attr.initializer) {
    return { value: null, dynamic: false }
  }

  // String literal: <div id="main" />
  if (ts.isStringLiteral(attr.initializer)) {
    return { value: attr.initializer.text, dynamic: false }
  }

  // Expression: <div class={className} />
  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    const expr = attr.initializer.expression.getText(ctx.sourceFile)
    const dynamic = isReactiveExpression(expr, ctx)
    return { value: expr, dynamic }
  }

  return { value: null, dynamic: false }
}

// =============================================================================
// Component Props Processing
// =============================================================================

function processComponentProps(
  attributes: ts.JsxAttributes,
  ctx: TransformContext
): IRProp[] {
  const props: IRProp[] = []

  for (const attr of attributes.properties) {
    // Spread props: {...props}
    if (ts.isJsxSpreadAttribute(attr)) {
      props.push({
        name: '...',
        value: attr.expression.getText(ctx.sourceFile),
        dynamic: true,
        loc: getSourceLocation(attr, ctx.sourceFile, ctx.filePath),
      })
      continue
    }

    if (!ts.isJsxAttribute(attr)) continue

    const name = attr.name.getText(ctx.sourceFile)
    const { value, dynamic } = getAttributeValue(attr, ctx)

    props.push({
      name,
      value: value ?? 'true', // Boolean shorthand
      dynamic,
      loc: getSourceLocation(attr, ctx.sourceFile, ctx.filePath),
    })
  }

  return props
}

// =============================================================================
// Helpers
// =============================================================================

function isReactiveExpression(expr: string, ctx: TransformContext): boolean {
  // Check for signal calls: count()
  for (const signal of ctx.analyzer.signals) {
    const pattern = new RegExp(`\\b${signal.getter}\\s*\\(`)
    if (pattern.test(expr)) {
      return true
    }
  }

  // Check for memo calls: doubled()
  for (const memo of ctx.analyzer.memos) {
    const pattern = new RegExp(`\\b${memo.name}\\s*\\(`)
    if (pattern.test(expr)) {
      return true
    }
  }

  // Check for props that might be reactive (called as functions)
  for (const prop of ctx.analyzer.propsParams) {
    const pattern = new RegExp(`\\b${prop.name}\\s*\\(`)
    if (pattern.test(expr)) {
      return true
    }
  }

  return false
}

function hasDynamicContent(children: IRNode[]): boolean {
  for (const child of children) {
    if (child.type === 'expression' && child.reactive) {
      return true
    }
    if (child.type === 'conditional' && child.reactive) {
      return true
    }
    if (child.type === 'loop') {
      return true
    }
    if (child.type === 'element' && hasDynamicContent(child.children)) {
      return true
    }
    if (child.type === 'fragment' && hasDynamicContent(child.children)) {
      return true
    }
  }
  return false
}

function inferExpressionType(
  _node: ts.Expression,
  _ctx: TransformContext
): TypeInfo | null {
  // TODO: Implement type inference from expression
  return null
}
