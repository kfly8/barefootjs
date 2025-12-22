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
  IRListInfo,
  SignalDeclaration,
  CompileResult,
} from '../types'
import { isPascalCase } from '../utils/helpers'
import { IdGenerator } from '../utils/id-generator'
import { jsxToTemplateString } from '../compiler/template-generator'

export type JsxToIRContext = {
  sourceFile: ts.SourceFile
  signals: SignalDeclaration[]
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

  if (ts.isJsxText(node)) {
    const text = node.getText(ctx.sourceFile).trim()
    if (!text) return null
    return { type: 'text', content: text }
  }

  if (ts.isJsxExpression(node) && node.expression) {
    return jsxExpressionToIR(node.expression, ctx)
  }

  return null
}

/**
 * Converts JSX element to IR
 */
function jsxElementToIR(node: ts.JsxElement, ctx: JsxToIRContext): IRNode {
  const tagName = node.openingElement.tagName.getText(ctx.sourceFile)

  // Component tag
  if (isPascalCase(tagName) && ctx.components.has(tagName)) {
    return componentToIR(tagName, node.openingElement.attributes, ctx)
  }

  // Regular HTML element
  const { staticAttrs, dynamicAttrs, events } = processAttributes(
    node.openingElement.attributes,
    ctx
  )

  // Process children
  const { children, listInfo, hasDynamicContent } = processChildren(node.children, ctx)

  // Determine ID
  const needsId = events.length > 0 || dynamicAttrs.length > 0 || listInfo || hasDynamicContent
  const id = needsId ? determineId(events, dynamicAttrs, listInfo, hasDynamicContent, ctx) : null

  return {
    type: 'element',
    tagName,
    id,
    staticAttrs,
    dynamicAttrs,
    events,
    children,
    listInfo,
  }
}

/**
 * Converts self-closing JSX element to IR
 */
function jsxSelfClosingToIR(node: ts.JsxSelfClosingElement, ctx: JsxToIRContext): IRNode {
  const tagName = node.tagName.getText(ctx.sourceFile)

  // Component tag
  if (isPascalCase(tagName) && ctx.components.has(tagName)) {
    return componentToIR(tagName, node.attributes, ctx)
  }

  const { staticAttrs, dynamicAttrs, events } = processAttributes(node.attributes, ctx)

  const needsId = events.length > 0 || dynamicAttrs.length > 0
  const id = needsId ? determineId(events, dynamicAttrs, null, false, ctx) : null

  return {
    type: 'element',
    tagName,
    id,
    staticAttrs,
    dynamicAttrs,
    events,
    children: [],
    listInfo: null,
  }
}

/**
 * Converts component to IR
 */
function componentToIR(
  tagName: string,
  attributes: ts.JsxAttributes,
  ctx: JsxToIRContext
): IRComponent {
  const componentResult = ctx.components.get(tagName)!
  const props: IRComponent['props'] = []

  attributes.properties.forEach((attr) => {
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
    staticHtml: componentResult.staticHtml,
    childInits,
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

  // Regular expression
  const exprText = expr.getText(ctx.sourceFile)
  const isDynamic = containsSignalCall(exprText, ctx.signals)

  return {
    type: 'expression',
    expression: exprText,
    isDynamic,
  }
}

/**
 * Converts ternary operator to IR
 */
function conditionalToIR(expr: ts.ConditionalExpression, ctx: JsxToIRContext): IRConditional {
  const condition = expr.condition.getText(ctx.sourceFile)

  const whenTrue = processConditionalBranch(expr.whenTrue, ctx)
  const whenFalse = processConditionalBranch(expr.whenFalse, ctx)

  return {
    type: 'conditional',
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

  // JSX element
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    return jsxToIR(node, ctx)!
  }

  // Expression
  return {
    type: 'expression',
    expression: node.getText(ctx.sourceFile),
    isDynamic: containsSignalCall(node.getText(ctx.sourceFile), ctx.signals),
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
  events: IRElement['events']
} {
  const staticAttrs: IRElement['staticAttrs'] = []
  const dynamicAttrs: IRElement['dynamicAttrs'] = []
  const events: IRElement['events'] = []

  attributes.properties.forEach((attr) => {
    if (!ts.isJsxAttribute(attr) || !attr.name) return

    const attrName = attr.name.getText(ctx.sourceFile)

    // Event handler
    if (attrName.startsWith('on')) {
      const eventName = attrName.slice(2).toLowerCase()
      if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        const handler = attr.initializer.expression.getText(ctx.sourceFile)
        events.push({ name: attrName, eventName, handler })
      }
      return
    }

    // Dynamic attribute
    if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
      const expression = attr.initializer.expression.getText(ctx.sourceFile)
      if (isDynamicAttributeTarget(attrName)) {
        dynamicAttrs.push({ name: attrName, expression })
        return
      }
    }

    // Static attribute
    if (attr.initializer) {
      if (ts.isStringLiteral(attr.initializer)) {
        staticAttrs.push({ name: attrName, value: attr.initializer.text })
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        staticAttrs.push({ name: attrName, value: attr.initializer.expression.getText(ctx.sourceFile) })
      }
    } else {
      staticAttrs.push({ name: attrName, value: '' })
    }
  })

  return { staticAttrs, dynamicAttrs, events }
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
} {
  const irChildren: IRNode[] = []
  let listInfo: IRListInfo | null = null
  let hasDynamicContent = false

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
      }
    }
  }

  return { children: irChildren, listInfo, hasDynamicContent }
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

  // Convert JSX to template string (simplified)
  const { template, events } = jsxToTemplateString(jsxBody, ctx.sourceFile, paramName)

  return {
    arrayExpression: arrayExpr,
    paramName,
    itemTemplate: template,
    itemEvents: events.map(e => ({ ...e, paramName })),
  }
}

/**
 * Determines ID
 */
function determineId(
  events: IRElement['events'],
  dynamicAttrs: IRElement['dynamicAttrs'],
  listInfo: IRListInfo | null,
  hasDynamicContent: boolean,
  ctx: JsxToIRContext
): string {
  if (dynamicAttrs.length > 0) {
    return ctx.idGenerator.generateAttrId()
  }
  if (events.length > 0) {
    return ctx.idGenerator.generateButtonId()
  }
  if (listInfo) {
    return ctx.idGenerator.generateListId()
  }
  if (hasDynamicContent) {
    return ctx.idGenerator.generateDynamicId()
  }
  return ctx.idGenerator.generateButtonId()
}

/**
 * Checks if an attribute is a dynamic attribute target
 */
function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden'].includes(attrName)
}

/**
 * Checks if expression contains signal calls
 */
function containsSignalCall(expr: string, signals: SignalDeclaration[]): boolean {
  return signals.some(s => {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(`)
    return regex.test(expr)
  })
}

/**
 * Finds component's JSX return and converts to IR
 */
export function findAndConvertJsxReturn(
  sourceFile: ts.SourceFile,
  ctx: JsxToIRContext
): IRNode | null {
  let result: IRNode | null = null

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      ts.forEachChild(node, (child) => {
        if (ts.isReturnStatement(child) && child.expression) {
          let expr = child.expression
          if (ts.isParenthesizedExpression(expr)) {
            expr = expr.expression
          }
          if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr)) {
            result = jsxToIR(expr, ctx)
          }
        }
        ts.forEachChild(child, visit)
      })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}
