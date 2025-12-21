/**
 * BarefootJS JSX Compiler
 *
 * JSXをコンパイルして静的HTMLとクライアントJSを生成する。
 * - コンポーネントのインポートを解決
 * - イベントハンドラ（onClick等）を検出してクライアントJSを生成
 * - 動的コンテンツ（{count()}等）を検出して更新関数を生成
 *
 * 使用例:
 *   const result = await compileJSX(entryPath, readFile)
 *   // result.html: 静的HTML
 *   // result.components: コンポーネントごとのJS
 */

import ts from 'typescript'

type InteractiveElement = {
  id: string
  tagName: string
  events: Array<{
    name: string      // onClick
    eventName: string // click
    handler: string   // () => setCount(n => n + 1)
  }>
}

type DynamicElement = {
  id: string
  tagName: string
  expression: string    // count()
  fullContent: string   // "doubled: " + count() * 2 など
}

type ListElement = {
  id: string
  tagName: string
  mapExpression: string  // items().map(item => '<li>' + item + '</li>').join('')
  itemEvents: Array<{
    eventId: number       // イベントを区別するID
    eventName: string     // click, change, keydown
    handler: string       // (item) => remove(item.id)
    paramName: string     // item
  }>
  arrayExpression: string // items() - 配列を取得するための式
}

type DynamicAttribute = {
  id: string
  tagName: string
  attrName: string       // class, style, disabled, value など
  expression: string     // isActive() ? 'active' : ''
}

type SignalDeclaration = {
  getter: string      // count, on
  setter: string      // setCount, setOn
  initialValue: string // 0, false
}

type CompileResult = {
  staticHtml: string
  clientJs: string
  serverJsx: string
  signals: SignalDeclaration[]
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  listElements: ListElement[]
  dynamicAttributes: DynamicAttribute[]
  props: string[]  // コンポーネントが受け取るprops名
}

type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
}

export type ComponentOutput = {
  name: string
  clientJs: string
  serverComponent: string
}

export type CompileJSXResult = {
  html: string
  components: ComponentOutput[]
}

/**
 * ファイルからインポート文を抽出
 */
function extractImports(source: string, filePath: string): ComponentImport[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const imports: ComponentImport[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        const path = moduleSpecifier.text
        // ローカルインポートのみ（./で始まる）
        if (path.startsWith('./') || path.startsWith('../')) {
          const importClause = node.importClause
          if (importClause?.name) {
            // default import: import Counter from './Counter'
            imports.push({
              name: importClause.name.getText(sourceFile),
              path,
            })
          }
        }
      }
    }
  })

  return imports
}

/**
 * ソースコードからsignal宣言を抽出
 * const [count, setCount] = signal(0) のパターンを検出
 */
function extractSignals(source: string, filePath: string): SignalDeclaration[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const signals: SignalDeclaration[] = []

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) &&
        ts.isArrayBindingPattern(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)) {

      const callExpr = node.initializer
      if (ts.isIdentifier(callExpr.expression) &&
          callExpr.expression.text === 'signal') {

        const elements = node.name.elements
        if (elements.length === 2 &&
            ts.isBindingElement(elements[0]) &&
            ts.isBindingElement(elements[1]) &&
            ts.isIdentifier(elements[0].name) &&
            ts.isIdentifier(elements[1].name)) {

          const getter = elements[0].name.text
          const setter = elements[1].name.text
          const initialValue = callExpr.arguments[0]?.getText(sourceFile) || '0'

          signals.push({ getter, setter, initialValue })
        }
      }
    }
    ts.forEachChild(node, visit)
 }

  visit(sourceFile)
  return signals
}

/**
 * コンポーネント関数のパラメータ（props）を抽出
 * function Counter({ initial = 0 }) → ['initial']
 * function Counter(props) → [] (destructuringでない場合は抽出しない)
 */
function extractComponentProps(source: string, filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const props: string[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      const param = node.parameters[0]
      if (param && ts.isObjectBindingPattern(param.name)) {
        for (const element of param.name.elements) {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            props.push(element.name.text)
          }
        }
      }
    }
  })

  return props
}

/**
 * PascalCaseかどうか判定（コンポーネントタグの判定用）
 */
function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

let buttonIdCounter = 0
let dynamicIdCounter = 0
let listIdCounter = 0
let attrIdCounter = 0

function resetIdCounters() {
  buttonIdCounter = 0
  dynamicIdCounter = 0
  listIdCounter = 0
  attrIdCounter = 0
}

function generateButtonId(): string {
  return `__b${buttonIdCounter++}`
}

function generateDynamicId(): string {
  return `__d${dynamicIdCounter++}`
}

function generateListId(): string {
  return `__l${listIdCounter++}`
}

function generateAttrId(): string {
  return `__a${attrIdCounter++}`
}

function extractArrowBody(handler: string): string {
  // () => count++ → count++
  // () => { count++ } → count++
  const arrowMatch = handler.match(/^\s*\([^)]*\)\s*=>\s*(.+)$/)
  if (arrowMatch) {
    let body = arrowMatch[1]!.trim()
    if (body.startsWith('{') && body.endsWith('}')) {
      body = body.slice(1, -1).trim()
    }
    return body
  }
  return handler
}

function extractArrowParams(handler: string): string {
  // (e) => ... → (e)
  // () => ... → ()
  const paramsMatch = handler.match(/^\s*(\([^)]*\))\s*=>/)
  if (paramsMatch) {
    return paramsMatch[1]!
  }
  return '()'
}

/**
 * 動的表現をsignalの初期値で評価して文字列を返す
 *
 * 例: on() ? 'ON' : 'OFF' + signals [{getter: 'on', initialValue: 'false'}]
 * → false ? 'ON' : 'OFF' → 'OFF'
 */
function evaluateWithInitialValues(expr: string, signals: SignalDeclaration[]): string {
  // signal呼び出しを初期値で置き換え
  let replaced = expr
  for (const s of signals) {
    // getter() を initialValue に置換
    const regex = new RegExp(`\\b${s.getter}\\s*\\(\\s*\\)`, 'g')
    replaced = replaced.replace(regex, s.initialValue)
  }

  try {
    // 評価して結果を返す
    const result = eval(replaced)
    return String(result)
  } catch {
    // 評価できない場合は空文字を返す
    return ''
  }
}

/**
 * エントリーポイントからアプリケーションをコンパイル
 *
 * コンポーネントのインポートを再帰的に解決し、
 * 静的HTMLとコンポーネントごとのJSを生成する。
 *
 * @param entryPath - エントリーファイルのパス (例: /path/to/index.tsx)
 * @param readFile - ファイルを読み込む関数
 * @returns { html, components } - 静的HTMLとコンポーネントJS配列
 */
export async function compileJSX(
  entryPath: string,
  readFile: (path: string) => Promise<string>
): Promise<CompileJSXResult> {
  resetIdCounters()

  // コンパイル済みコンポーネントのキャッシュ
  const compiledComponents: Map<string, CompileResult> = new Map()

  // ベースディレクトリを取得
  const baseDir = entryPath.substring(0, entryPath.lastIndexOf('/'))

  /**
   * コンポーネントをコンパイル（再帰的に依存を解決）
   */
  async function compileComponent(componentPath: string): Promise<CompileResult> {
    // キャッシュチェック
    if (compiledComponents.has(componentPath)) {
      return compiledComponents.get(componentPath)!
    }

    // ファイル読み込み（.tsx拡張子を補完）
    const fullPath = componentPath.endsWith('.tsx') ? componentPath : `${componentPath}.tsx`
    const source = await readFile(fullPath)

    // このコンポーネントのインポートを抽出
    const imports = extractImports(source, fullPath)

    // 依存コンポーネントを先にコンパイル
    const componentResults: Map<string, CompileResult> = new Map()
    for (const imp of imports) {
      const depPath = resolvePath(baseDir, imp.path)
      const result = await compileComponent(depPath)
      componentResults.set(imp.name, result)
    }

    // コンポーネントをコンパイル（子コンポーネントのHTMLを埋め込む）
    const result = compileJsxWithComponents(source, fullPath, componentResults)

    compiledComponents.set(componentPath, result)
    return result
  }

  // エントリーポイントをコンパイル
  const entryResult = await compileComponent(entryPath)

  // コンポーネントごとにJS/サーバーコンポーネントを生成
  const components: ComponentOutput[] = []

  for (const [path, result] of compiledComponents) {
    if (result.clientJs || result.serverJsx) {
      const name = path.split('/').pop()!.replace('.tsx', '')

      // signal宣言を生成
      const signalDeclarations = result.signals
        .map(s => `const [${s.getter}, ${s.setter}] = signal(${s.initialValue})`)
        .join('\n')

      const clientJs = result.clientJs ? `import { signal } from './barefoot.js'

${signalDeclarations}

${result.clientJs}
` : ''

      // propsがある場合は引数として受け取る
      const propsParam = result.props.length > 0
        ? `{ ${result.props.join(', ')} }`
        : ''

      const serverComponent = `import { useRequestContext } from 'hono/jsx-renderer'

export function ${name}(${propsParam}) {
  const c = useRequestContext()
  const used = c.get('usedComponents') || []
  if (!used.includes('${name}')) {
    c.set('usedComponents', [...used, '${name}'])
  }
  return (
    ${result.serverJsx}
  )
}
`
      components.push({ name, clientJs, serverComponent })
    }
  }

  return {
    html: entryResult.staticHtml,
    components,
  }
}

/**
 * パスを解決
 */
function resolvePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('./')) {
    return `${baseDir}/${relativePath.slice(2)}`
  }
  if (relativePath.startsWith('../')) {
    const parts = baseDir.split('/')
    parts.pop()
    return `${parts.join('/')}/${relativePath.slice(3)}`
  }
  return relativePath
}

/**
 * コンポーネント対応のJSXコンパイル（内部用）
 * 子コンポーネントのHTMLを埋め込みつつコンパイルする
 */
function compileJsxWithComponents(
  source: string,
  filePath: string,
  components: Map<string, CompileResult>
): CompileResult {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  // signal宣言を抽出
  const signals = extractSignals(source, filePath)

  // コンポーネントのpropsを抽出
  const props = extractComponentProps(source, filePath)

  const interactiveElements: InteractiveElement[] = []
  const dynamicElements: DynamicElement[] = []
  const listElements: ListElement[] = []
  const dynamicAttributes: DynamicAttribute[] = []

  function jsxToHtml(node: ts.Node): string {
    if (ts.isJsxElement(node)) {
      const openingElement = node.openingElement
      const tagName = openingElement.tagName.getText(sourceFile)

      // コンポーネントタグの場合（HTMLのみ返す、JSは別途結合される）
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        return componentResult.staticHtml
      }

      const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(openingElement, sourceFile, signals)
      const childrenResult = processChildrenInternal(node.children, sourceFile, components, interactiveElements, dynamicElements, listElements, signals, dynamicAttributes)
      const children = childrenResult.html
      const dynamicContent = childrenResult.dynamicExpression
      const listContent = childrenResult.listExpression

      let id: string | null = null
      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

      // 動的属性がある場合、IDを生成
      if (dynamicAttrs.length > 0) {
        id = generateAttrId()
        for (const da of dynamicAttrs) {
          dynamicAttributes.push({
            id,
            tagName,
            attrName: da.attrName,
            expression: da.expression,
          })
        }
      }

      if (isInteractive) {
        id = id || generateButtonId()
        interactiveElements.push({ id, tagName, events })
      }

      if (dynamicContent && !isInteractive && !listContent && !dynamicAttrs.length) {
        id = generateDynamicId()
        dynamicElements.push({
          id,
          tagName,
          expression: dynamicContent.expression,
          fullContent: dynamicContent.fullContent,
        })
      }

      if (listContent && !isInteractive) {
        id = id || generateListId()
        listElements.push({
          id,
          tagName,
          mapExpression: listContent.mapExpression,
          itemEvents: listContent.itemEvents,
          arrayExpression: listContent.arrayExpression,
        })
      }

      if (id) {
        return `<${tagName} id="${id}"${attrsStr}>${children}</${tagName}>`
      }
      return `<${tagName}${attrsStr}>${children}</${tagName}>`
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile)

      // コンポーネントタグの場合（HTMLのみ返す、JSは別途結合される）
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        return componentResult.staticHtml
      }

      const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(node, sourceFile, signals)

      let id: string | null = null

      // 動的属性がある場合、IDを生成
      if (dynamicAttrs.length > 0) {
        id = generateAttrId()
        for (const da of dynamicAttrs) {
          dynamicAttributes.push({
            id,
            tagName,
            attrName: da.attrName,
            expression: da.expression,
          })
        }
      }

      if (isInteractive) {
        id = id || generateButtonId()
        interactiveElements.push({ id, tagName, events })
        const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
        return `<${tagName} id="${id}"${attrsStr} />`
      }

      if (id) {
        const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
        return `<${tagName} id="${id}"${attrsStr} />`
      }

      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
      return `<${tagName}${attrsStr} />`
    }

    if (ts.isJsxText(node)) {
      return node.getText(sourceFile).trim()
    }

    if (ts.isJsxExpression(node)) {
      if (node.expression) {
        const expr = node.expression.getText(sourceFile)
        return `\${${expr}}`
      }
      return ''
    }

    return ''
  }

  function findJsxReturn(node: ts.Node): ts.JsxElement | ts.JsxSelfClosingElement | undefined {
    let result: ts.JsxElement | ts.JsxSelfClosingElement | undefined

    function visit(n: ts.Node) {
      if (ts.isReturnStatement(n) && n.expression) {
        if (ts.isParenthesizedExpression(n.expression)) {
          const inner = n.expression.expression
          if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
            result = inner
          }
        } else if (ts.isJsxElement(n.expression) || ts.isJsxSelfClosingElement(n.expression)) {
          result = n.expression
        }
      }
      ts.forEachChild(n, visit)
    }

    visit(node)
    return result
  }

  // メインのJSX要素を見つける
  let staticHtml = ''
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node)) {
      const jsx = findJsxReturn(node)
      if (jsx) {
        staticHtml = jsxToHtml(jsx)
      }
    }
  })

  // クライアントJSを生成
  const lines: string[] = []
  const hasDynamicContent = dynamicElements.length > 0 || listElements.length > 0 || dynamicAttributes.length > 0

  // 動的属性を持つ要素のIDを収集（重複を除去）
  const attrElementIds = [...new Set(dynamicAttributes.map(da => da.id))]

  for (const el of dynamicElements) {
    lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
  }

  for (const el of listElements) {
    lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
  }

  for (const id of attrElementIds) {
    lines.push(`const ${id} = document.getElementById('${id}')`)
  }

  for (const el of interactiveElements) {
    // 動的属性と重複していない場合のみ追加
    if (!attrElementIds.includes(el.id)) {
      lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
    }
  }

  if (hasDynamicContent || interactiveElements.length > 0) {
    lines.push('')
  }

  if (hasDynamicContent) {
    lines.push('function updateAll() {')
    for (const el of dynamicElements) {
      lines.push(`  ${el.id}.textContent = ${el.fullContent}`)
    }
    for (const el of listElements) {
      lines.push(`  ${el.id}.innerHTML = ${el.mapExpression}`)
    }
    // 動的属性の更新
    for (const da of dynamicAttributes) {
      lines.push(`  ${generateAttributeUpdate(da)}`)
    }
    lines.push('}')
    lines.push('')
  }

  // リスト要素内のイベントデリゲーション
  for (const el of listElements) {
    if (el.itemEvents.length > 0) {
      for (const event of el.itemEvents) {
        lines.push(`${el.id}.addEventListener('${event.eventName}', (e) => {`)
        lines.push(`  const target = e.target.closest('[data-event-id="${event.eventId}"]')`)
        lines.push(`  if (target && target.dataset.eventId === '${event.eventId}') {`)
        lines.push(`    const __index = parseInt(target.dataset.index, 10)`)
        lines.push(`    const ${event.paramName} = ${el.arrayExpression}[__index]`)
        lines.push(`    ${extractArrowBody(event.handler)}`)
        if (hasDynamicContent) {
          lines.push(`    updateAll()`)
        }
        lines.push(`  }`)
        lines.push(`})`)
      }
    }
  }

  for (const el of interactiveElements) {
    for (const event of el.events) {
      const handlerBody = extractArrowBody(event.handler)
      const handlerParams = extractArrowParams(event.handler)
      if (hasDynamicContent) {
        lines.push(`${el.id}.on${event.eventName} = ${handlerParams} => {`)
        lines.push(`  ${handlerBody}`)
        lines.push(`  updateAll()`)
        lines.push(`}`)
      } else {
        lines.push(`${el.id}.on${event.eventName} = ${event.handler}`)
      }
    }
  }

  if (hasDynamicContent) {
    lines.push('')
    lines.push('// 初期表示')
    lines.push('updateAll()')
  }

  const clientJs = lines.join('\n')

  // 動的表現を初期値で評価して置換
  const processedHtml = staticHtml.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    return evaluateWithInitialValues(expr, signals)
  })

  // サーバー用JSX（Hono JSX形式）を生成
  const serverJsx = generateServerJsx(processedHtml)

  return {
    staticHtml: processedHtml,
    clientJs,
    serverJsx,
    signals,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    props,
  }
}

/**
 * 動的属性の更新コードを生成
 */
function generateAttributeUpdate(da: DynamicAttribute): string {
  const { id, attrName, expression } = da

  // class/className の場合
  if (attrName === 'class' || attrName === 'className') {
    return `${id}.className = ${expression}`
  }

  // style の場合（オブジェクト形式）
  if (attrName === 'style') {
    // expression が { color: 'red' } のようなオブジェクトの場合
    // Object.assign を使用
    return `Object.assign(${id}.style, ${expression})`
  }

  // boolean属性（disabled, checked, hidden など）
  if (isBooleanAttribute(attrName)) {
    return `${id}.${attrName} = ${expression}`
  }

  // value の場合
  if (attrName === 'value') {
    return `${id}.value = ${expression}`
  }

  // その他の属性
  return `${id}.setAttribute('${attrName}', ${expression})`
}

/**
 * HTML文字列からHono JSX形式のコンポーネントを生成
 */
function generateServerJsx(html: string): string {
  // class -> className, 閉じタグの修正など
  const jsx = html
    .replace(/class="/g, 'className="')
    .replace(/<(\w+)([^>]*)\s*\/>/g, '<$1$2 />') // 自己閉じタグの正規化

  return jsx
}

/**
 * 動的属性かどうか判定
 * class, style, disabled, value など
 */
function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden'].includes(attrName)
}

/**
 * boolean属性かどうか判定
 */
function isBooleanAttribute(attrName: string): boolean {
  return ['disabled', 'checked', 'hidden', 'readonly', 'required'].includes(attrName)
}

/**
 * 属性を処理（内部版）
 */
function processAttributesInternal(
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  signals: SignalDeclaration[]
): {
  attrs: string[]
  events: InteractiveElement['events']
  isInteractive: boolean
  dynamicAttrs: Array<{ attrName: string; expression: string }>
} {
  const attrs: string[] = []
  const events: InteractiveElement['events'] = []
  const dynamicAttrs: Array<{ attrName: string; expression: string }> = []

  element.attributes.properties.forEach((attr) => {
    if (ts.isJsxAttribute(attr) && attr.name) {
      const attrName = attr.name.getText(sourceFile)

      if (attrName.startsWith('on')) {
        const eventName = attrName.slice(2).toLowerCase()
        let handler = ''
        if (attr.initializer && ts.isJsxExpression(attr.initializer)) {
          if (attr.initializer.expression) {
            handler = attr.initializer.expression.getText(sourceFile)
          }
        }
        events.push({ name: attrName, eventName, handler })
      } else if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        // 動的属性の検出
        const expression = attr.initializer.expression.getText(sourceFile)

        if (isDynamicAttributeTarget(attrName)) {
          // 動的属性として記録
          dynamicAttrs.push({ attrName, expression })

          // 初期値を評価してHTMLに出力
          if (attrName === 'style' && ts.isObjectLiteralExpression(attr.initializer.expression)) {
            // style={{ color: 'red' }} の場合
            const styleValue = evaluateStyleObject(attr.initializer.expression, sourceFile, signals)
            if (styleValue) {
              attrs.push(`style="${styleValue}"`)
            }
          } else if (isBooleanAttribute(attrName)) {
            // boolean属性の場合、初期値がtrueなら属性を出力
            const initialValue = evaluateWithInitialValues(expression, signals)
            if (initialValue === 'true') {
              attrs.push(attrName)
            }
          } else {
            // class, value などの場合
            const initialValue = evaluateWithInitialValues(expression, signals)
            if (initialValue) {
              attrs.push(`${attrName}="${initialValue}"`)
            }
          }
        } else {
          // その他の式属性
          attrs.push(`${attrName}="${expression}"`)
        }
      } else {
        // 静的属性
        let value = ''
        if (attr.initializer) {
          if (ts.isStringLiteral(attr.initializer)) {
            value = attr.initializer.text
          }
        }
        if (value) {
          attrs.push(`${attrName}="${value}"`)
        } else {
          attrs.push(attrName)
        }
      }
    }
  })

  return { attrs, events, isInteractive: events.length > 0, dynamicAttrs }
}

/**
 * styleオブジェクトを評価してCSS文字列に変換
 */
function evaluateStyleObject(
  obj: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile,
  signals: SignalDeclaration[]
): string {
  const styles: string[] = []

  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name) {
      const propName = prop.name.getText(sourceFile)
      const cssName = propName.replace(/([A-Z])/g, '-$1').toLowerCase()

      const valueExpr = prop.initializer.getText(sourceFile)
      const value = evaluateWithInitialValues(valueExpr, signals)

      if (value) {
        styles.push(`${cssName}: ${value}`)
      }
    }
  }

  return styles.join('; ')
}

/**
 * 子要素を処理（内部版）
 */
type ListExpressionInfo = {
  mapExpression: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  arrayExpression: string
}

function processChildrenInternal(
  children: ts.NodeArray<ts.JsxChild>,
  sourceFile: ts.SourceFile,
  components: Map<string, CompileResult>,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  signals: SignalDeclaration[],
  dynamicAttributes: DynamicAttribute[] = []
): {
  html: string
  dynamicExpression: { expression: string; fullContent: string } | null
  listExpression: ListExpressionInfo | null
} {
  let html = ''
  let dynamicExpression: { expression: string; fullContent: string } | null = null
  let listExpression: ListExpressionInfo | null = null
  const parts: string[] = []

  for (const child of children) {
    if (ts.isJsxText(child)) {
      const text = child.getText(sourceFile).trim()
      if (text) {
        html += text
        parts.push(`"${text}"`)
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
      // map式を検出
      const mapInfo = extractMapExpression(child.expression, sourceFile, signals)
      if (mapInfo) {
        // map式の場合: items().map(item => <li>{item}</li>)
        listExpression = {
          mapExpression: mapInfo.mapExpression,
          itemEvents: mapInfo.itemEvents,
          arrayExpression: mapInfo.arrayExpression,
        }
        // 初期値で評価済みのHTMLを追加
        html += mapInfo.initialHtml
      } else {
        const expr = child.expression.getText(sourceFile)
        html += `\${${expr}}`
        parts.push(expr)
        if (ts.isCallExpression(child.expression) ||
            ts.isPropertyAccessExpression(child.expression) ||
            ts.isBinaryExpression(child.expression) ||
            ts.isConditionalExpression(child.expression)) {
          dynamicExpression = {
            expression: expr,
            fullContent: parts.length === 1 ? expr : parts.join(' + '),
          }
        }
      }
    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const tagName = ts.isJsxElement(child)
        ? child.openingElement.tagName.getText(sourceFile)
        : child.tagName.getText(sourceFile)

      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        html += componentResult.staticHtml
      } else {
        // 再帰的にJSXを処理（簡易版）
        html += jsxChildToHtml(child, sourceFile, components, interactiveElements, dynamicElements, listElements, signals, dynamicAttributes)
      }
    }
  }

  return { html, dynamicExpression, listExpression }
}

type MapExpressionResult = {
  mapExpression: string
  initialHtml: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  arrayExpression: string
}

/**
 * map式を抽出
 * items().map(item => <li>{item}</li>) のパターンを検出
 */
function extractMapExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile,
  signals: SignalDeclaration[]
): MapExpressionResult | null {
  // CallExpression で .map() を検出
  if (!ts.isCallExpression(expr)) return null

  const callExpr = expr
  if (!ts.isPropertyAccessExpression(callExpr.expression)) return null

  const propAccess = callExpr.expression
  if (propAccess.name.text !== 'map') return null

  // mapのコールバックを取得
  const callback = callExpr.arguments[0]
  if (!callback) return null

  // コールバックがアロー関数の場合
  if (ts.isArrowFunction(callback)) {
    const param = callback.parameters[0]
    if (!param) return null
    const paramName = param.name.getText(sourceFile)

    // コールバックのボディがJSX要素の場合
    const body = callback.body
    let jsxBody: ts.JsxElement | ts.JsxSelfClosingElement | null = null

    if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body)) {
      jsxBody = body
    } else if (ts.isParenthesizedExpression(body)) {
      const inner = body.expression
      if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
        jsxBody = inner
      }
    }

    if (jsxBody) {
      // JSXをテンプレートリテラル形式に変換
      const templateResult = jsxToTemplateString(jsxBody, sourceFile, paramName)
      const arrayExpr = propAccess.expression.getText(sourceFile)

      // イベントがある場合は__indexを使用
      const hasEvents = templateResult.events.length > 0
      const mapParams = hasEvents ? `(${paramName}, __index)` : paramName
      const mapExpression = `${arrayExpr}.map(${mapParams} => ${templateResult.template}).join('')`

      // 初期値を使ってHTMLを生成
      const initialHtml = evaluateMapWithInitialValues(arrayExpr, paramName, templateResult.template, signals)

      // イベント情報を収集
      const itemEvents = templateResult.events.map(e => ({
        eventId: e.eventId,
        eventName: e.eventName,
        handler: e.handler,
        paramName,
      }))

      return { mapExpression, initialHtml, itemEvents, arrayExpression: arrayExpr }
    }
  }

  return null
}

/**
 * map式を初期値で評価してHTMLを生成
 */
function evaluateMapWithInitialValues(
  arrayExpr: string,
  paramName: string,
  templateStr: string,
  signals: SignalDeclaration[]
): string {
  // 配列式からsignal呼び出しを見つけて初期値を取得
  // items() または items().filter(...) のパターンに対応

  // signal呼び出しを初期値で置き換えた式を作成
  let replaced = arrayExpr
  for (const s of signals) {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(\\s*\\)`, 'g')
    replaced = replaced.replace(regex, s.initialValue)
  }

  // 配列を評価
  let arrayValue: unknown[]
  try {
    arrayValue = eval(replaced)
    if (!Array.isArray(arrayValue)) {
      return ''
    }
  } catch {
    return ''
  }

  // 各要素に対してテンプレートを適用
  try {
    const results = arrayValue.map((item) => {
      // テンプレートリテラルを評価
      // templateStr は `<li>${item}</li>` のような形式
      // バッククォートを除去してテンプレートを評価
      const templateBody = templateStr.slice(1, -1) // バッククォートを除去

      // ${paramName} と ${paramName.prop} を実際の値に置換
      const result = templateBody.replace(
        new RegExp(`\\$\\{${paramName}(\\.\\w+)?\\}`, 'g'),
        (_, prop) => {
          if (prop) {
            // プロパティアクセス: ${item.text} → item.textの値
            const propName = prop.slice(1) // '.' を除去
            return String((item as Record<string, unknown>)[propName] ?? '')
          }
          return String(item)
        }
      )
      return result
    })
    return results.join('')
  } catch {
    return ''
  }
}

type TemplateStringResult = {
  template: string
  events: Array<{
    eventId: number
    eventName: string
    handler: string
  }>
}

/**
 * JSX要素をテンプレートリテラル文字列に変換
 * <li>{item}</li> → `<li>${item}</li>`
 * イベントハンドラはdata-index属性とdata-event-id属性に置き換え、イベント情報を返す
 */
function jsxToTemplateString(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  paramName: string
): TemplateStringResult {
  const events: Array<{ eventId: number; eventName: string; handler: string }> = []
  let eventIdCounter = 0

  /**
   * 式を処理（三項演算子内のJSXを検出して変換）
   */
  function processExpression(expr: ts.Expression): string {
    // 三項演算子の場合
    if (ts.isConditionalExpression(expr)) {
      const condition = expr.condition.getText(sourceFile)
      const whenTrue = processExpressionOrJsx(expr.whenTrue)
      const whenFalse = processExpressionOrJsx(expr.whenFalse)
      return `\${${condition} ? ${whenTrue} : ${whenFalse}}`
    }

    // ParenthesizedExpressionの場合（括弧で囲まれた式）
    if (ts.isParenthesizedExpression(expr)) {
      return processExpression(expr.expression)
    }

    // その他の式はそのまま出力
    return `\${${expr.getText(sourceFile)}}`
  }

  /**
   * 式またはJSXを処理
   */
  function processExpressionOrJsx(node: ts.Expression): string {
    // JSX要素の場合はテンプレート文字列に変換
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      return `\`${processNode(node)}\``
    }

    // 括弧で囲まれた式の場合
    if (ts.isParenthesizedExpression(node)) {
      return processExpressionOrJsx(node.expression)
    }

    // その他の式はそのまま
    return node.getText(sourceFile)
  }

  function processNode(
    n: ts.JsxElement | ts.JsxSelfClosingElement
  ): string {
    function processAttributes(
      attributes: ts.JsxAttributes
    ): { attrs: string; eventAttrs: string } {
      let attrs = ''
      let eventAttrs = ''

      attributes.properties.forEach((attr) => {
        if (ts.isJsxAttribute(attr) && attr.name) {
          const attrName = attr.name.getText(sourceFile)

          if (attrName.startsWith('on')) {
            // イベントハンドラを検出
            const eventName = attrName.slice(2).toLowerCase()
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const handler = attr.initializer.expression.getText(sourceFile)
              const eventId = eventIdCounter++
              events.push({ eventId, eventName, handler })
              // data-indexとdata-event-idを追加
              eventAttrs = ` data-index="\${__index}" data-event-id="${eventId}"`
            }
          } else if (attr.initializer) {
            if (ts.isStringLiteral(attr.initializer)) {
              attrs += ` ${attrName}="${attr.initializer.text}"`
            } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              attrs += ` ${attrName}="\${${attr.initializer.expression.getText(sourceFile)}}"`
            }
          }
        }
      })

      return { attrs, eventAttrs }
    }

    if (ts.isJsxSelfClosingElement(n)) {
      const tagName = n.tagName.getText(sourceFile)
      const { attrs, eventAttrs } = processAttributes(n.attributes)
      return `<${tagName}${eventAttrs}${attrs} />`
    }

    if (ts.isJsxElement(n)) {
      const tagName = n.openingElement.tagName.getText(sourceFile)
      const { attrs, eventAttrs } = processAttributes(n.openingElement.attributes)

      // 子要素を処理
      let children = ''
      for (const child of n.children) {
        if (ts.isJsxText(child)) {
          const text = child.getText(sourceFile).trim()
          if (text) {
            children += text
          }
        } else if (ts.isJsxExpression(child) && child.expression) {
          // 三項演算子内のJSXを処理
          children += processExpression(child.expression)
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
          // 再帰的に処理
          children += processNode(child)
        }
      }

      return `<${tagName}${eventAttrs}${attrs}>${children}</${tagName}>`
    }

    return ''
  }

  const template = `\`${processNode(node)}\``
  return { template, events }
}

/**
 * JSX子要素をHTMLに変換（簡易版）
 */
function jsxChildToHtml(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  components: Map<string, CompileResult>,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  signals: SignalDeclaration[],
  dynamicAttributes: DynamicAttribute[]
): string {
  if (ts.isJsxElement(node)) {
    const tagName = node.openingElement.tagName.getText(sourceFile)
    const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(node.openingElement, sourceFile, signals)
    const childrenResult = processChildrenInternal(node.children, sourceFile, components, interactiveElements, dynamicElements, listElements, signals, dynamicAttributes)

    let id: string | null = null
    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

    // 動的属性がある場合、IDを生成
    if (dynamicAttrs.length > 0) {
      id = generateAttrId()
      for (const da of dynamicAttrs) {
        dynamicAttributes.push({
          id,
          tagName,
          attrName: da.attrName,
          expression: da.expression,
        })
      }
    }

    if (isInteractive) {
      id = id || generateButtonId()
      interactiveElements.push({ id, tagName, events })
    }

    if (childrenResult.dynamicExpression && !isInteractive && !childrenResult.listExpression && !dynamicAttrs.length) {
      id = generateDynamicId()
      dynamicElements.push({
        id,
        tagName,
        expression: childrenResult.dynamicExpression.expression,
        fullContent: childrenResult.dynamicExpression.fullContent,
      })
    }

    if (childrenResult.listExpression && !isInteractive) {
      id = id || generateListId()
      listElements.push({
        id,
        tagName,
        mapExpression: childrenResult.listExpression.mapExpression,
        itemEvents: childrenResult.listExpression.itemEvents,
        arrayExpression: childrenResult.listExpression.arrayExpression,
      })
    }

    if (id) {
      return `<${tagName} id="${id}"${attrsStr}>${childrenResult.html}</${tagName}>`
    }
    return `<${tagName}${attrsStr}>${childrenResult.html}</${tagName}>`
  }

  if (ts.isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText(sourceFile)
    const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(node, sourceFile, signals)

    let id: string | null = null

    // 動的属性がある場合、IDを生成
    if (dynamicAttrs.length > 0) {
      id = generateAttrId()
      for (const da of dynamicAttrs) {
        dynamicAttributes.push({
          id,
          tagName,
          attrName: da.attrName,
          expression: da.expression,
        })
      }
    }

    if (isInteractive) {
      id = id || generateButtonId()
      interactiveElements.push({ id, tagName, events })
      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
      return `<${tagName} id="${id}"${attrsStr} />`
    }

    if (id) {
      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
      return `<${tagName} id="${id}"${attrsStr} />`
    }

    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
    return `<${tagName}${attrsStr} />`
  }

  return ''
}
