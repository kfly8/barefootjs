/**
 * BarefootJS JSX Compiler - JSX AST to IR Transformer
 *
 * TypeScript JSX ASTを中間表現（IR）に変換する。
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

export type JsxToIRContext = {
  sourceFile: ts.SourceFile
  signals: SignalDeclaration[]
  components: Map<string, CompileResult>
  idGenerator: IdGenerator
}

/**
 * JSX ASTノードをIRに変換
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
 * JSX要素をIRに変換
 */
function jsxElementToIR(node: ts.JsxElement, ctx: JsxToIRContext): IRNode {
  const tagName = node.openingElement.tagName.getText(ctx.sourceFile)

  // コンポーネントタグの場合
  if (isPascalCase(tagName) && ctx.components.has(tagName)) {
    return componentToIR(tagName, node.openingElement.attributes, ctx)
  }

  // 通常のHTML要素
  const { staticAttrs, dynamicAttrs, events } = processAttributes(
    node.openingElement.attributes,
    ctx
  )

  // 子要素を処理
  const { children, listInfo, hasDynamicContent } = processChildren(node.children, ctx)

  // IDの決定
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
 * 自己閉じJSX要素をIRに変換
 */
function jsxSelfClosingToIR(node: ts.JsxSelfClosingElement, ctx: JsxToIRContext): IRNode {
  const tagName = node.tagName.getText(ctx.sourceFile)

  // コンポーネントタグの場合
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
 * コンポーネントをIRに変換
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

  // 子コンポーネントの初期化情報
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
 * JSX式をIRに変換
 */
function jsxExpressionToIR(expr: ts.Expression, ctx: JsxToIRContext): IRNode {
  // map式の検出
  if (ts.isCallExpression(expr)) {
    const mapInfo = extractMapInfo(expr, ctx)
    if (mapInfo) {
      // mapはリスト要素として親要素に情報を渡す必要があるため、
      // ここでは特別な処理が必要
      // 一旦expressionとして返し、親で処理する
      return {
        type: 'expression',
        expression: expr.getText(ctx.sourceFile),
        isDynamic: true,
      }
    }
  }

  // 三項演算子の検出
  if (ts.isConditionalExpression(expr)) {
    return conditionalToIR(expr, ctx)
  }

  // 通常の式
  const exprText = expr.getText(ctx.sourceFile)
  const isDynamic = containsSignalCall(exprText, ctx.signals)

  return {
    type: 'expression',
    expression: exprText,
    isDynamic,
  }
}

/**
 * 三項演算子をIRに変換
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
 * 条件分岐のブランチを処理
 */
function processConditionalBranch(node: ts.Expression, ctx: JsxToIRContext): IRNode {
  // 括弧で囲まれている場合
  if (ts.isParenthesizedExpression(node)) {
    return processConditionalBranch(node.expression, ctx)
  }

  // JSX要素の場合
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    return jsxToIR(node, ctx)!
  }

  // 式の場合
  return {
    type: 'expression',
    expression: node.getText(ctx.sourceFile),
    isDynamic: containsSignalCall(node.getText(ctx.sourceFile), ctx.signals),
  }
}

/**
 * 属性を処理
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

    // イベントハンドラ
    if (attrName.startsWith('on')) {
      const eventName = attrName.slice(2).toLowerCase()
      if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        const handler = attr.initializer.expression.getText(ctx.sourceFile)
        events.push({ name: attrName, eventName, handler })
      }
      return
    }

    // 動的属性
    if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
      const expression = attr.initializer.expression.getText(ctx.sourceFile)
      if (isDynamicAttributeTarget(attrName)) {
        dynamicAttrs.push({ name: attrName, expression })
        return
      }
    }

    // 静的属性
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
 * 子要素を処理
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
    // map式の検出
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
 * map式から情報を抽出
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

  // コールバックのボディからテンプレートを生成
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

  // JSXをテンプレート文字列に変換（簡易版）
  const { template, events } = jsxToTemplateString(jsxBody, ctx.sourceFile, paramName)

  return {
    arrayExpression: arrayExpr,
    paramName,
    itemTemplate: template,
    itemEvents: events.map(e => ({ ...e, paramName })),
  }
}

/**
 * JSXをテンプレート文字列に変換
 */
function jsxToTemplateString(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  paramName: string
): { template: string; events: Array<{ eventId: number; eventName: string; handler: string }> } {
  const events: Array<{ eventId: number; eventName: string; handler: string }> = []
  let eventIdCounter = 0

  function processNode(n: ts.JsxElement | ts.JsxSelfClosingElement): string {
    if (ts.isJsxSelfClosingElement(n)) {
      const tagName = n.tagName.getText(sourceFile)
      const { attrs, eventAttrs } = processAttrsForTemplate(n.attributes)
      return `<${tagName}${eventAttrs}${attrs} />`
    }

    const tagName = n.openingElement.tagName.getText(sourceFile)
    const { attrs, eventAttrs } = processAttrsForTemplate(n.openingElement.attributes)

    let children = ''
    for (const child of n.children) {
      if (ts.isJsxText(child)) {
        const text = child.getText(sourceFile).trim()
        if (text) children += text
      } else if (ts.isJsxExpression(child) && child.expression) {
        if (ts.isConditionalExpression(child.expression)) {
          const cond = child.expression.condition.getText(sourceFile)
          const whenTrue = processExprOrJsx(child.expression.whenTrue)
          const whenFalse = processExprOrJsx(child.expression.whenFalse)
          children += `\${${cond} ? ${whenTrue} : ${whenFalse}}`
        } else {
          children += `\${${child.expression.getText(sourceFile)}}`
        }
      } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
        children += processNode(child)
      }
    }

    return `<${tagName}${eventAttrs}${attrs}>${children}</${tagName}>`
  }

  function processExprOrJsx(expr: ts.Expression): string {
    if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr)) {
      return `\`${processNode(expr)}\``
    }
    if (ts.isParenthesizedExpression(expr)) {
      return processExprOrJsx(expr.expression)
    }
    return expr.getText(sourceFile)
  }

  function processAttrsForTemplate(attributes: ts.JsxAttributes): { attrs: string; eventAttrs: string } {
    let attrs = ''
    let eventAttrs = ''
    let elementEventId: number | null = null

    attributes.properties.forEach((attr) => {
      if (!ts.isJsxAttribute(attr) || !attr.name) return

      const attrName = attr.name.getText(sourceFile)

      if (attrName.startsWith('on')) {
        const eventName = attrName.slice(2).toLowerCase()
        if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
          const handler = attr.initializer.expression.getText(sourceFile)
          if (elementEventId === null) {
            elementEventId = eventIdCounter++
            eventAttrs = ` data-index="\${__index}" data-event-id="${elementEventId}"`
          }
          events.push({ eventId: elementEventId, eventName, handler })
        }
      } else if (attr.initializer) {
        if (ts.isStringLiteral(attr.initializer)) {
          attrs += ` ${attrName}="${attr.initializer.text}"`
        } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
          attrs += ` ${attrName}="\${${attr.initializer.expression.getText(sourceFile)}}"`
        }
      }
    })

    return { attrs, eventAttrs }
  }

  const template = `\`${processNode(node)}\``
  return { template, events }
}

/**
 * IDを決定
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
 * 動的属性のターゲットかどうか
 */
function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden'].includes(attrName)
}

/**
 * signal呼び出しを含むかどうか
 */
function containsSignalCall(expr: string, signals: SignalDeclaration[]): boolean {
  return signals.some(s => {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(`)
    return regex.test(expr)
  })
}

/**
 * コンポーネントのJSX returnを見つけてIRに変換
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
