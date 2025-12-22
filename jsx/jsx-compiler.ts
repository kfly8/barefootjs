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
  LocalFunction,
  ChildComponentInit,
  CompileResult,
  ComponentOutput,
  CompileJSXResult,
} from './types'
import {
  extractImports,
  extractSignals,
  extractComponentProps,
  extractLocalFunctions,
} from './extractors'
import { IdGenerator } from './utils/id-generator'
import {
  extractArrowBody,
  extractArrowParams,
  needsCapturePhase,
  parseConditionalHandler,
  generateAttributeUpdate,
  irToHtml,
  irToServerJsx,
  collectClientJsInfo,
  findAndConvertJsxReturn,
  type JsxToIRContext,
} from './transformers'
import {
  generateContentHash,
  resolvePath,
} from './compiler/utils'

export type { ComponentOutput, CompileJSXResult }

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
  // Create a new IdGenerator for each compilation (enables parallel compilation)
  const idGenerator = new IdGenerator()

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
    const result = compileJsxWithComponents(source, fullPath, componentResults, idGenerator)

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
        .map(s => `const [${s.getter}, ${s.setter}] = createSignal(${s.initialValue})`)
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

    // 子コンポーネントのinit呼び出しを生成
    // createEffect により自動的に更新されるため、コールバックのラップは不要
    const childInitCalls = childInits
      .map(child => {
        return `init${child.name}(${child.propsExpr})`
      })
      .join('\n')

    // 動的コンテンツがあるか（createEffectが生成されるか）
    const hasDynamicContent = result.dynamicElements.length > 0 ||
                              result.listElements.length > 0 ||
                              result.dynamicAttributes.length > 0

    // propsがある場合はinit関数でラップする
    let clientJs = ''
    if (result.clientJs || childInits.length > 0) {
      const allImports = [
        `import { createSignal, createEffect } from './barefoot.js'`,
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
 * コンポーネント対応のJSXコンパイル（内部用）
 * 子コンポーネントのHTMLを埋め込みつつコンパイルする
 *
 * IRベースの処理フロー：
 * 1. JSX → IR変換 (jsx-to-ir.ts)
 * 2. IR → HTML変換 (ir-to-html.ts)
 * 3. IR → ClientJS情報収集 (ir-to-client-js.ts)
 * 4. ClientJS生成 (createEffectベース)
 */
function compileJsxWithComponents(
  source: string,
  filePath: string,
  components: Map<string, CompileResult>,
  idGenerator: IdGenerator
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

  // Create IR context
  const irContext: JsxToIRContext = {
    sourceFile,
    signals,
    components,
    idGenerator,
  }

  // Convert JSX to IR
  const ir = findAndConvertJsxReturn(sourceFile, irContext)

  // Collect client JS info from IR
  const interactiveElements: InteractiveElement[] = []
  const dynamicElements: DynamicElement[] = []
  const listElements: ListElement[] = []
  const dynamicAttributes: DynamicAttribute[] = []
  const childInits: { name: string; propsExpr: string }[] = []

  if (ir) {
    collectClientJsInfo(ir, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits)
  }

  // Generate static HTML from IR
  const staticHtml = ir ? irToHtml(ir, signals) : ''

  // Generate client JS (createEffect-based)
  const clientJs = generateClientJsWithCreateEffect(
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    localFunctions
  )

  // Generate server JSX (Hono JSX format)
  const serverJsx = irToServerJsx(staticHtml)

  return {
    staticHtml,
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
 * Generate client JS with createEffect (reactive updates)
 */
function generateClientJsWithCreateEffect(
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[],
  localFunctions: LocalFunction[]
): string {
  const lines: string[] = []
  const hasDynamicContent = dynamicElements.length > 0 || listElements.length > 0 || dynamicAttributes.length > 0

  // Collect element IDs with dynamic attributes (remove duplicates)
  const attrElementIds = [...new Set(dynamicAttributes.map(da => da.id))]

  // Get DOM elements
  for (const el of dynamicElements) {
    lines.push(`const ${el.id} = document.querySelector('[data-bf="${el.id}"]')`)
  }

  for (const el of listElements) {
    lines.push(`const ${el.id} = document.querySelector('[data-bf="${el.id}"]')`)
  }

  for (const id of attrElementIds) {
    lines.push(`const ${id} = document.querySelector('[data-bf="${id}"]')`)
  }

  for (const el of interactiveElements) {
    // Only add if not already added for dynamic attributes
    if (!attrElementIds.includes(el.id)) {
      lines.push(`const ${el.id} = document.querySelector('[data-bf="${el.id}"]')`)
    }
  }

  if (hasDynamicContent || interactiveElements.length > 0) {
    lines.push('')
  }

  // Output local functions
  for (const fn of localFunctions) {
    lines.push(fn.code)
  }
  if (localFunctions.length > 0) {
    lines.push('')
  }

  // createEffect for dynamic elements
  for (const el of dynamicElements) {
    lines.push(`createEffect(() => {`)
    lines.push(`  ${el.id}.textContent = ${el.fullContent}`)
    lines.push(`})`)
  }

  // createEffect for list elements
  for (const el of listElements) {
    lines.push(`createEffect(() => {`)
    lines.push(`  ${el.id}.innerHTML = ${el.mapExpression}`)
    lines.push(`})`)
  }

  // createEffect for dynamic attributes
  for (const da of dynamicAttributes) {
    lines.push(`createEffect(() => {`)
    lines.push(`  ${generateAttributeUpdate(da)}`)
    lines.push(`})`)
  }

  if (hasDynamicContent) {
    lines.push('')
  }

  // Event delegation for list elements
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

        if (conditionalHandler) {
          // Conditional handler: execute action only when condition is met
          lines.push(`    if (${conditionalHandler.condition}) {`)
          lines.push(`      ${conditionalHandler.action}`)
          lines.push(`    }`)
        } else {
          lines.push(`    ${handlerBody}`)
        }

        lines.push(`  }`)
        lines.push(`}${captureArg})`)
      }
    }
  }

  // Event handlers for interactive elements
  for (const el of interactiveElements) {
    for (const event of el.events) {
      const handlerBody = extractArrowBody(event.handler)
      const conditionalHandler = parseConditionalHandler(handlerBody)

      if (conditionalHandler) {
        // Conditional handler: convert to if statement to prevent return false
        const params = extractArrowParams(event.handler)
        lines.push(`${el.id}.on${event.eventName} = ${params} => {`)
        lines.push(`  if (${conditionalHandler.condition}) {`)
        lines.push(`    ${conditionalHandler.action}`)
        lines.push(`  }`)
        lines.push(`}`)
      } else {
        lines.push(`${el.id}.on${event.eventName} = ${event.handler}`)
      }
    }
  }

  return lines.join('\n')
}

