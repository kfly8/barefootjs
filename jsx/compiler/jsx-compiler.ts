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
 * PascalCaseかどうか判定（コンポーネントタグの判定用）
 */
function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

let buttonIdCounter = 0
let dynamicIdCounter = 0

function resetIdCounters() {
  buttonIdCounter = 0
  dynamicIdCounter = 0
}

function generateButtonId(): string {
  return `__b${buttonIdCounter++}`
}

function generateDynamicId(): string {
  return `__d${dynamicIdCounter++}`
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

      const serverComponent = `import { useRequestContext } from 'hono/jsx-renderer'

export function ${name}() {
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

  const interactiveElements: InteractiveElement[] = []
  const dynamicElements: DynamicElement[] = []

  function jsxToHtml(node: ts.Node): string {
    if (ts.isJsxElement(node)) {
      const openingElement = node.openingElement
      const tagName = openingElement.tagName.getText(sourceFile)

      // コンポーネントタグの場合（HTMLのみ返す、JSは別途結合される）
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        return componentResult.staticHtml
      }

      const { attrs, events, isInteractive } = processAttributesInternal(openingElement, sourceFile)
      const childrenResult = processChildrenInternal(node.children, sourceFile, components, interactiveElements, dynamicElements)
      const children = childrenResult.html
      const dynamicContent = childrenResult.dynamicExpression

      let id: string | null = null
      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

      if (isInteractive) {
        id = generateButtonId()
        interactiveElements.push({ id, tagName, events })
      }

      if (dynamicContent && !isInteractive) {
        id = generateDynamicId()
        dynamicElements.push({
          id,
          tagName,
          expression: dynamicContent.expression,
          fullContent: dynamicContent.fullContent,
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

      const { attrs, events, isInteractive } = processAttributesInternal(node, sourceFile)

      if (isInteractive) {
        const id = generateButtonId()
        interactiveElements.push({ id, tagName, events })
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

  for (const el of dynamicElements) {
    lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
  }

  for (const el of interactiveElements) {
    lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
  }

  if (dynamicElements.length > 0 || interactiveElements.length > 0) {
    lines.push('')
  }

  if (dynamicElements.length > 0) {
    lines.push('function updateAll() {')
    for (const el of dynamicElements) {
      lines.push(`  ${el.id}.textContent = ${el.fullContent}`)
    }
    lines.push('}')
    lines.push('')
  }

  for (const el of interactiveElements) {
    for (const event of el.events) {
      const handlerBody = extractArrowBody(event.handler)
      if (dynamicElements.length > 0) {
        lines.push(`${el.id}.on${event.eventName} = () => {`)
        lines.push(`  ${handlerBody}`)
        lines.push(`  updateAll()`)
        lines.push(`}`)
      } else {
        lines.push(`${el.id}.on${event.eventName} = ${event.handler}`)
      }
    }
  }

  if (dynamicElements.length > 0) {
    lines.push('')
    lines.push('// 初期表示')
    lines.push('updateAll()')
  }

  const clientJs = lines.join('\n')
  const processedHtml = staticHtml.replace(/\$\{[^}]+\}/g, '0')

  // サーバー用JSX（Hono JSX形式）を生成
  const serverJsx = generateServerJsx(processedHtml)

  return {
    staticHtml: processedHtml,
    clientJs,
    serverJsx,
    signals,
    interactiveElements,
    dynamicElements,
  }
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
 * 属性を処理（内部版）
 */
function processAttributesInternal(
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile
): {
  attrs: string[]
  events: InteractiveElement['events']
  isInteractive: boolean
} {
  const attrs: string[] = []
  const events: InteractiveElement['events'] = []

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
      } else {
        let value = ''
        if (attr.initializer) {
          if (ts.isStringLiteral(attr.initializer)) {
            value = attr.initializer.text
          } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            value = attr.initializer.expression.getText(sourceFile)
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

  return { attrs, events, isInteractive: events.length > 0 }
}

/**
 * 子要素を処理（内部版）
 */
function processChildrenInternal(
  children: ts.NodeArray<ts.JsxChild>,
  sourceFile: ts.SourceFile,
  components: Map<string, CompileResult>,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[]
): {
  html: string
  dynamicExpression: { expression: string; fullContent: string } | null
} {
  let html = ''
  let dynamicExpression: { expression: string; fullContent: string } | null = null
  const parts: string[] = []

  for (const child of children) {
    if (ts.isJsxText(child)) {
      const text = child.getText(sourceFile).trim()
      if (text) {
        html += text
        parts.push(`"${text}"`)
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
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
    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const tagName = ts.isJsxElement(child)
        ? child.openingElement.tagName.getText(sourceFile)
        : child.tagName.getText(sourceFile)

      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        html += componentResult.staticHtml
      } else {
        // 再帰的にJSXを処理（簡易版）
        html += jsxChildToHtml(child, sourceFile, components, interactiveElements, dynamicElements)
      }
    }
  }

  return { html, dynamicExpression }
}

/**
 * JSX子要素をHTMLに変換（簡易版）
 */
function jsxChildToHtml(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  components: Map<string, CompileResult>,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[]
): string {
  if (ts.isJsxElement(node)) {
    const tagName = node.openingElement.tagName.getText(sourceFile)
    const { attrs, events, isInteractive } = processAttributesInternal(node.openingElement, sourceFile)
    const childrenResult = processChildrenInternal(node.children, sourceFile, components, interactiveElements, dynamicElements)

    let id: string | null = null
    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

    if (isInteractive) {
      id = generateButtonId()
      interactiveElements.push({ id, tagName, events })
    }

    if (childrenResult.dynamicExpression && !isInteractive) {
      id = generateDynamicId()
      dynamicElements.push({
        id,
        tagName,
        expression: childrenResult.dynamicExpression.expression,
        fullContent: childrenResult.dynamicExpression.fullContent,
      })
    }

    if (id) {
      return `<${tagName} id="${id}"${attrsStr}>${childrenResult.html}</${tagName}>`
    }
    return `<${tagName}${attrsStr}>${childrenResult.html}</${tagName}>`
  }

  if (ts.isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText(sourceFile)
    const { attrs, events, isInteractive } = processAttributesInternal(node, sourceFile)

    if (isInteractive) {
      const id = generateButtonId()
      interactiveElements.push({ id, tagName, events })
      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
      return `<${tagName} id="${id}"${attrsStr} />`
    }

    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
    return `<${tagName}${attrsStr} />`
  }

  return ''
}
