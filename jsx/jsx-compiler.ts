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
import type {
  InteractiveElement,
  DynamicElement,
  ListElement,
  DynamicAttribute,
  SignalDeclaration,
  LocalFunction,
  ChildComponentInit,
  CompileResult,
  ComponentOutput,
  CompileJSXResult,
  ListExpressionInfo,
  MapExpressionResult,
  TemplateStringResult,
} from './types'
import {
  extractImports,
  extractSignals,
  extractComponentProps,
  extractLocalFunctions,
} from './extractors'
import { isPascalCase } from './utils/helpers'
import { IdGenerator } from './utils/id-generator'
import {
  evaluateWithInitialValues,
  extractArrowBody,
  extractArrowParams,
  needsCapturePhase,
  parseConditionalHandler,
  generateAttributeUpdate,
  isBooleanAttribute,
} from './transformers'

export type { ComponentOutput, CompileJSXResult }

// コンパイル単位でIDを管理
const idGenerator = new IdGenerator()

/**
 * コールバックprops（onXxx）をラップしてupdateAll()を追加
 * { onAdd: handleAdd } → { onAdd: (...args) => { handleAdd(...args); updateAll() } }
 */
function wrapCallbackProps(propsExpr: string, hasUpdateAll: boolean): string {
  if (!hasUpdateAll) return propsExpr

  // onで始まるprops（onAdd, onToggle等）をラップ
  return propsExpr.replace(
    /(on[A-Z]\w*):\s*([^,}]+)/g,
    (_, propName, value) => {
      const trimmedValue = value.trim()
      return `${propName}: (...args) => { ${trimmedValue}(...args); updateAll() }`
    }
  )
}

/**
 * 配列式を評価
 * ビルド時のみ実行されるためevalは安全
 */
function evaluateArrayExpression(expr: string): unknown[] | null {
  try {
    const result = eval(expr)
    return Array.isArray(result) ? result : null
  } catch {
    return null
  }
}

/**
 * テンプレートリテラルを評価
 * ビルド時のみ実行されるためFunctionコンストラクタは安全
 */
function evaluateTemplate(
  templateStr: string,
  paramName: string,
  item: unknown,
  __index: number
): string {
  try {
    const evalFn = new Function(paramName, '__index', `return ${templateStr}`)
    return evalFn(item, __index)
  } catch {
    return ''
  }
}

/**
 * コンテンツからハッシュを生成（8文字の16進数）
 */
function generateContentHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // 8文字の16進数に変換（負の値も正しく処理）
  return (hash >>> 0).toString(16).padStart(8, '0')
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
  idGenerator.reset()

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
  // 1. まず全コンポーネントのコードを生成（importパスはプレースホルダー）
  const componentData: Array<{
    name: string
    path: string
    result: CompileResult
    signalDeclarations: string
    childInits: ChildComponentInit[]
  }> = []

  for (const [path, result] of compiledComponents) {
    if (result.clientJs || result.serverJsx) {
      const name = path.split('/').pop()!.replace('.tsx', '')
      const signalDeclarations = result.signals
        .map(s => `const [${s.getter}, ${s.setter}] = signal(${s.initialValue})`)
        .join('\n')

      componentData.push({
        name,
        path,
        result,
        signalDeclarations,
        childInits: result.childInits,
      })
    }
  }

  // 2. 各コンポーネントのハッシュを計算（子コンポーネントのimportを除いた内容で）
  const componentHashes: Map<string, string> = new Map()
  for (const data of componentData) {
    const { name, result, signalDeclarations } = data
    const bodyCode = result.clientJs
    const contentForHash = signalDeclarations + bodyCode + result.serverJsx
    const hash = generateContentHash(contentForHash)
    componentHashes.set(name, hash)
  }

  // 3. 最終的なclientJsを生成（正しいハッシュ付きimportパスで）
  const components: ComponentOutput[] = []

  for (const data of componentData) {
    const { name, result, signalDeclarations, childInits } = data

    // 子コンポーネントのimportを生成（ハッシュ付き）
    const childImports = childInits
      .map(child => {
        const childHash = componentHashes.get(child.name) || ''
        const childFilename = childHash ? `${child.name}-${childHash}.js` : `${child.name}.js`
        return `import { init${child.name} } from './${childFilename}'`
      })
      .join('\n')

    // 親コンポーネントに動的コンテンツがあるか（updateAllが生成されるか）
    const hasDynamicContent = result.dynamicElements.length > 0 ||
                              result.listElements.length > 0 ||
                              result.dynamicAttributes.length > 0

    // 子コンポーネントのinit呼び出しを生成
    // コールバックpropsをラップしてupdateAll()を追加
    const childInitCalls = childInits
      .map(child => {
        const wrappedProps = wrapCallbackProps(child.propsExpr, hasDynamicContent)
        return `init${child.name}(${wrappedProps})`
      })
      .join('\n')

    // propsがある場合はinit関数でラップする
    let clientJs = ''
    if (result.clientJs || childInits.length > 0) {
      const allImports = [
        `import { signal } from './barefoot.js'`,
        childImports,
      ].filter(Boolean).join('\n')

      const bodyCode = [
        result.clientJs,
        childInitCalls ? `\n// 子コンポーネントの初期化\n${childInitCalls}` : '',
      ].filter(Boolean).join('\n')

      if (result.props.length > 0) {
        const propsParam = `{ ${result.props.join(', ')} }`
        clientJs = `${allImports}

export function init${name}(${propsParam}) {
${signalDeclarations ? signalDeclarations.split('\n').map(l => '  ' + l).join('\n') + '\n' : ''}
${bodyCode.split('\n').map(l => '  ' + l).join('\n')}
}
`
      } else {
        clientJs = `${allImports}

${signalDeclarations}

${bodyCode}
`
      }
    }

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
    const hash = componentHashes.get(name) || ''
    const filename = hash ? `${name}-${hash}.js` : `${name}.js`

    components.push({ name, hash, filename, clientJs, serverComponent })
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

  // ローカル関数を抽出
  const localFunctions = extractLocalFunctions(source, filePath, signals)

  const interactiveElements: InteractiveElement[] = []
  const dynamicElements: DynamicElement[] = []
  const listElements: ListElement[] = []
  const dynamicAttributes: DynamicAttribute[] = []
  const childInits: ChildComponentInit[] = []

  /**
   * コンポーネントタグからpropsを抽出してchildInitsに追加
   */
  function extractAndTrackComponentProps(
    tagName: string,
    attributes: ts.JsxAttributes,
    componentResult: CompileResult
  ): void {
    // propsを持つコンポーネントのみ
    if (componentResult.props.length === 0) return

    const propsObj: string[] = []
    attributes.properties.forEach((attr) => {
      if (ts.isJsxAttribute(attr) && attr.name) {
        const propName = attr.name.getText(sourceFile)
        if (attr.initializer) {
          if (ts.isStringLiteral(attr.initializer)) {
            propsObj.push(`${propName}: "${attr.initializer.text}"`)
          } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            const expr = attr.initializer.expression.getText(sourceFile)
            propsObj.push(`${propName}: ${expr}`)
          }
        }
      }
    })

    if (propsObj.length > 0) {
      childInits.push({
        name: tagName,
        propsExpr: `{ ${propsObj.join(', ')} }`,
      })
    }
  }

  function jsxToHtml(node: ts.Node): string {
    if (ts.isJsxElement(node)) {
      const openingElement = node.openingElement
      const tagName = openingElement.tagName.getText(sourceFile)

      // コンポーネントタグの場合（HTMLのみ返す、JSは別途結合される）
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        // propsを持つ子コンポーネントをトラッキング
        extractAndTrackComponentProps(tagName, openingElement.attributes, componentResult)
        return componentResult.staticHtml
      }

      const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(openingElement, sourceFile, signals)
      const childrenResult = processChildrenInternal(node.children, sourceFile, components, interactiveElements, dynamicElements, listElements, signals, dynamicAttributes, childInits)
      const children = childrenResult.html
      const dynamicContent = childrenResult.dynamicExpression
      const listContent = childrenResult.listExpression

      let id: string | null = null
      const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

      // 動的属性がある場合、IDを生成
      if (dynamicAttrs.length > 0) {
        id = idGenerator.generateAttrId()
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
        id = id || idGenerator.generateButtonId()
        interactiveElements.push({ id, tagName, events })
      }

      if (dynamicContent && !isInteractive && !listContent && !dynamicAttrs.length) {
        id = idGenerator.generateDynamicId()
        dynamicElements.push({
          id,
          tagName,
          expression: dynamicContent.expression,
          fullContent: dynamicContent.fullContent,
        })
      }

      if (listContent && !isInteractive) {
        id = id || idGenerator.generateListId()
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
        // propsを持つ子コンポーネントをトラッキング
        extractAndTrackComponentProps(tagName, node.attributes, componentResult)
        return componentResult.staticHtml
      }

      const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(node, sourceFile, signals)

      let id: string | null = null

      // 動的属性がある場合、IDを生成
      if (dynamicAttrs.length > 0) {
        id = idGenerator.generateAttrId()
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
        id = id || idGenerator.generateButtonId()
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

  // ローカル関数を出力
  for (const fn of localFunctions) {
    lines.push(fn.code)
  }
  if (localFunctions.length > 0) {
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
        const handlerBody = extractArrowBody(event.handler)
        const conditionalHandler = parseConditionalHandler(handlerBody)
        const useCapture = needsCapturePhase(event.eventName)
        const captureArg = useCapture ? ', true' : ''

        lines.push(`${el.id}.addEventListener('${event.eventName}', (e) => {`)
        lines.push(`  const target = e.target.closest('[data-event-id="${event.eventId}"]')`)
        lines.push(`  if (target && target.dataset.eventId === '${event.eventId}') {`)
        lines.push(`    const __index = parseInt(target.dataset.index, 10)`)
        lines.push(`    const ${event.paramName} = ${el.arrayExpression}[__index]`)

        if (conditionalHandler && hasDynamicContent) {
          // 条件付きハンドラ: 条件が満たされた時のみ action と updateAll を実行
          lines.push(`    if (${conditionalHandler.condition}) {`)
          lines.push(`      ${conditionalHandler.action}`)
          lines.push(`      updateAll()`)
          lines.push(`    }`)
        } else {
          lines.push(`    ${handlerBody}`)
          if (hasDynamicContent) {
            lines.push(`    updateAll()`)
          }
        }

        lines.push(`  }`)
        lines.push(`}${captureArg})`)
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
    localFunctions,
    childInits,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    props,
    source,
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
 * 動的属性かどうか判定
 * class, style, disabled, value など
 */
function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden'].includes(attrName)
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
function processChildrenInternal(
  children: ts.NodeArray<ts.JsxChild>,
  sourceFile: ts.SourceFile,
  components: Map<string, CompileResult>,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  signals: SignalDeclaration[],
  dynamicAttributes: DynamicAttribute[] = [],
  childInits: ChildComponentInit[] = []
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
      const mapInfo = extractMapExpression(child.expression, sourceFile, signals, components)
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

        // propsを持つ子コンポーネントをトラッキング
        if (componentResult.props.length > 0) {
          const attributes = ts.isJsxElement(child)
            ? child.openingElement.attributes
            : child.attributes
          const propsObj: string[] = []
          attributes.properties.forEach((attr) => {
            if (ts.isJsxAttribute(attr) && attr.name) {
              const propName = attr.name.getText(sourceFile)
              if (attr.initializer) {
                if (ts.isStringLiteral(attr.initializer)) {
                  propsObj.push(`${propName}: "${attr.initializer.text}"`)
                } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                  const expr = attr.initializer.expression.getText(sourceFile)
                  propsObj.push(`${propName}: ${expr}`)
                }
              }
            }
          })
          if (propsObj.length > 0) {
            childInits.push({
              name: tagName,
              propsExpr: `{ ${propsObj.join(', ')} }`,
            })
          }
        }
      } else {
        // 再帰的にJSXを処理（簡易版）
        html += jsxChildToHtml(child, sourceFile, components, interactiveElements, dynamicElements, listElements, signals, dynamicAttributes, childInits)
      }
    }
  }

  return { html, dynamicExpression, listExpression }
}

/**
 * map式を抽出
 * items().map(item => <li>{item}</li>) のパターンを検出
 */
function extractMapExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile,
  signals: SignalDeclaration[],
  components: Map<string, CompileResult> = new Map()
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
      const templateResult = jsxToTemplateString(jsxBody, sourceFile, paramName, components)
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
 * evalを使用せず安全にテンプレートを評価する
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

  // 配列を安全に評価
  const arrayValue = evaluateArrayExpression(replaced)
  if (arrayValue === null) {
    return ''
  }

  // 各要素に対してテンプレートを適用（eval不使用）
  try {
    const results = arrayValue.map((item, __index) => {
      // テンプレートリテラルを安全に評価
      // templateStr は `<li>${item}</li>` のような形式
      return evaluateTemplate(templateStr, paramName, item, __index)
    })
    return results.join('')
  } catch {
    return ''
  }
}

/**
 * JSX要素をテンプレートリテラル文字列に変換
 * <li>{item}</li> → `<li>${item}</li>`
 * イベントハンドラはdata-index属性とdata-event-id属性に置き換え、イベント情報を返す
 * コンポーネントタグはインライン展開する
 */
function jsxToTemplateString(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  paramName: string,
  components: Map<string, CompileResult> = new Map()
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

  /**
   * コンポーネントのJSX属性からpropsを抽出
   */
  function extractComponentProps(
    attributes: ts.JsxAttributes,
    sf: ts.SourceFile
  ): Map<string, string> {
    const props = new Map<string, string>()
    attributes.properties.forEach((attr) => {
      if (ts.isJsxAttribute(attr) && attr.name) {
        const propName = attr.name.getText(sf)
        if (attr.initializer) {
          if (ts.isStringLiteral(attr.initializer)) {
            props.set(propName, `"${attr.initializer.text}"`)
          } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            props.set(propName, attr.initializer.expression.getText(sf))
          }
        }
      }
    })
    return props
  }

  /**
   * コンポーネントをインライン展開する
   * コンポーネントのソースを解析し、propsを置換したテンプレートを生成
   */
  function inlineComponent(
    componentResult: CompileResult,
    propsMap: Map<string, string>
  ): string {
    // コンポーネントのソースをパース
    const componentSource = componentResult.source
    const componentSf = ts.createSourceFile(
      'component.tsx',
      componentSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    )

    // コンポーネントのJSXを探す
    let componentJsx: ts.JsxElement | ts.JsxSelfClosingElement | null = null

    function findJsxReturn(node: ts.Node) {
      if (ts.isReturnStatement(node) && node.expression) {
        let expr = node.expression
        if (ts.isParenthesizedExpression(expr)) {
          expr = expr.expression
        }
        if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr)) {
          componentJsx = expr
        }
      }
      ts.forEachChild(node, findJsxReturn)
    }

    ts.forEachChild(componentSf, (node) => {
      if (ts.isFunctionDeclaration(node)) {
        findJsxReturn(node)
      }
    })

    if (!componentJsx) {
      return ''
    }

    // コンポーネントのJSXをテンプレートに変換（propsを置換）
    return processComponentJsx(componentJsx, componentSf, propsMap)
  }

  /**
   * コンポーネントのJSXを処理してテンプレートに変換（props置換付き）
   */
  function processComponentJsx(
    n: ts.JsxElement | ts.JsxSelfClosingElement,
    sf: ts.SourceFile,
    propsMap: Map<string, string>
  ): string {
    /**
     * 式内のprop参照を置換
     */
    function substituteProps(expr: string): string {
      let result = expr
      for (const [propName, propValue] of propsMap) {
        // prop() の呼び出しを置換（イベントハンドラの呼び出し）
        // 例: onToggle() → (() => handleToggle(todo.id))()
        // しかし () => onToggle() パターンの場合は onToggle を propValue に置換
        const callRegex = new RegExp(`\\b${propName}\\s*\\(([^)]*)\\)`, 'g')
        result = result.replace(callRegex, (match, args) => {
          // propValue が arrow function の場合、それを呼び出し
          // (args) => body を body(args) に変換
          const arrowMatch = propValue.match(/^\s*\(([^)]*)\)\s*=>\s*(.+)$/)
          if (arrowMatch) {
            const arrowParams = arrowMatch[1] || ''
            let body = arrowMatch[2]!.trim()
            // 引数の置換が必要な場合
            if (args && arrowParams) {
              // 簡易的な引数の置換
              const paramNames = arrowParams.split(',').map(p => p.trim())
              const argValues = args.split(',').map((a: string) => a.trim())
              for (let i = 0; i < paramNames.length && i < argValues.length; i++) {
                if (paramNames[i]) {
                  body = body.replace(new RegExp(`\\b${paramNames[i]}\\b`, 'g'), argValues[i])
                }
              }
            }
            return body
          }
          return `(${propValue})(${args})`
        })
        // 単純な参照を置換（例: todo.done → todo.done）
        // prop名だけの場合（関数呼び出しでない）
        const refRegex = new RegExp(`\\b${propName}\\b(?!\\s*\\()`, 'g')
        result = result.replace(refRegex, propValue)
      }
      return result
    }

    function processAttrs(
      attributes: ts.JsxAttributes
    ): { attrs: string; eventAttrs: string } {
      let attrs = ''
      let eventAttrs = ''
      let elementEventId: number | null = null

      attributes.properties.forEach((attr) => {
        if (ts.isJsxAttribute(attr) && attr.name) {
          const attrName = attr.name.getText(sf)

          if (attrName.startsWith('on')) {
            const eventName = attrName.slice(2).toLowerCase()
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              let handler = attr.initializer.expression.getText(sf)
              // ハンドラ内のprop参照を置換
              handler = substituteProps(handler)
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
              const expr = attr.initializer.expression.getText(sf)
              const substituted = substituteProps(expr)
              attrs += ` ${attrName}="\${${substituted}}"`
            }
          }
        }
      })

      return { attrs, eventAttrs }
    }

    function processJsxNode(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
      if (ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sf)
        const { attrs, eventAttrs } = processAttrs(node.attributes)
        return `<${tagName}${eventAttrs}${attrs} />`
      }

      if (ts.isJsxElement(node)) {
        const tagName = node.openingElement.tagName.getText(sf)
        const { attrs, eventAttrs } = processAttrs(node.openingElement.attributes)

        let children = ''
        for (const child of node.children) {
          if (ts.isJsxText(child)) {
            const text = child.getText(sf).trim()
            if (text) {
              children += text
            }
          } else if (ts.isJsxExpression(child) && child.expression) {
            // 条件式や通常の式を処理
            if (ts.isConditionalExpression(child.expression)) {
              const condition = substituteProps(child.expression.condition.getText(sf))
              const whenTrue = processJsxOrExpr(child.expression.whenTrue, sf)
              const whenFalse = processJsxOrExpr(child.expression.whenFalse, sf)
              children += `\${${condition} ? ${whenTrue} : ${whenFalse}}`
            } else {
              const expr = substituteProps(child.expression.getText(sf))
              children += `\${${expr}}`
            }
          } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            children += processJsxNode(child)
          }
        }

        return `<${tagName}${eventAttrs}${attrs}>${children}</${tagName}>`
      }

      return ''
    }

    function processJsxOrExpr(expr: ts.Expression, sf: ts.SourceFile): string {
      if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr)) {
        return `\`${processJsxNode(expr)}\``
      }
      if (ts.isParenthesizedExpression(expr)) {
        return processJsxOrExpr(expr.expression, sf)
      }
      return substituteProps(expr.getText(sf))
    }

    return processJsxNode(n)
  }

  function processNode(
    n: ts.JsxElement | ts.JsxSelfClosingElement
  ): string {
    function processAttributes(
      attributes: ts.JsxAttributes
    ): { attrs: string; eventAttrs: string } {
      let attrs = ''
      let eventAttrs = ''
      let elementEventId: number | null = null  // この要素のevent-id（複数イベントで共有）

      attributes.properties.forEach((attr) => {
        if (ts.isJsxAttribute(attr) && attr.name) {
          const attrName = attr.name.getText(sourceFile)

          if (attrName.startsWith('on')) {
            // イベントハンドラを検出
            const eventName = attrName.slice(2).toLowerCase()
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const handler = attr.initializer.expression.getText(sourceFile)
              // 最初のイベントでevent-idを割り当て、同じ要素の全イベントで共有
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
        }
      })

      return { attrs, eventAttrs }
    }

    if (ts.isJsxSelfClosingElement(n)) {
      const tagName = n.tagName.getText(sourceFile)

      // コンポーネントタグの検出とインライン展開
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const propsMap = extractComponentProps(n.attributes, sourceFile)
        return inlineComponent(componentResult, propsMap)
      }

      const { attrs, eventAttrs } = processAttributes(n.attributes)
      return `<${tagName}${eventAttrs}${attrs} />`
    }

    if (ts.isJsxElement(n)) {
      const tagName = n.openingElement.tagName.getText(sourceFile)

      // コンポーネントタグの検出とインライン展開
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const propsMap = extractComponentProps(n.openingElement.attributes, sourceFile)
        return inlineComponent(componentResult, propsMap)
      }

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
  dynamicAttributes: DynamicAttribute[],
  childInits: ChildComponentInit[] = []
): string {
  if (ts.isJsxElement(node)) {
    const tagName = node.openingElement.tagName.getText(sourceFile)
    const { attrs, events, isInteractive, dynamicAttrs } = processAttributesInternal(node.openingElement, sourceFile, signals)
    const childrenResult = processChildrenInternal(node.children, sourceFile, components, interactiveElements, dynamicElements, listElements, signals, dynamicAttributes, childInits)

    let id: string | null = null
    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

    // 動的属性がある場合、IDを生成
    if (dynamicAttrs.length > 0) {
      id = idGenerator.generateAttrId()
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
      id = id || idGenerator.generateButtonId()
      interactiveElements.push({ id, tagName, events })
    }

    if (childrenResult.dynamicExpression && !isInteractive && !childrenResult.listExpression && !dynamicAttrs.length) {
      id = idGenerator.generateDynamicId()
      dynamicElements.push({
        id,
        tagName,
        expression: childrenResult.dynamicExpression.expression,
        fullContent: childrenResult.dynamicExpression.fullContent,
      })
    }

    if (childrenResult.listExpression && !isInteractive) {
      id = id || idGenerator.generateListId()
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
      id = idGenerator.generateAttrId()
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
      id = id || idGenerator.generateButtonId()
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
