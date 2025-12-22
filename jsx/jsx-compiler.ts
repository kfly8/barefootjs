/**
 * BarefootJS JSX Compiler
 *
 * Compiles JSX to static HTML and client JS.
 * - Resolves component imports
 * - Detects event handlers (onClick, etc.) and generates client JS
 * - Detects dynamic content ({count()}, etc.) and generates update functions
 *
 * Usage example:
 *   const result = await compileJSX(entryPath, readFile)
 *   // result.html: static HTML
 *   // result.components: JS for each component
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
  CompileOptions,
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
 * Compile application from entry point
 *
 * Recursively resolves component imports and
 * generates static HTML and JS for each component.
 *
 * @param entryPath - Entry file path (e.g., /path/to/index.tsx)
 * @param readFile - Function to read files
 * @returns { html, components } - Static HTML and component JS array
 */
export async function compileJSX(
  entryPath: string,
  readFile: (path: string) => Promise<string>,
  options?: CompileOptions
): Promise<CompileJSXResult> {
  // Create a new IdGenerator for each compilation (enables parallel compilation)
  const idGenerator = new IdGenerator()

  // Cache of compiled components
  const compiledComponents: Map<string, CompileResult> = new Map()

  /**
   * Compile component (recursively resolve dependencies)
   */
  async function compileComponent(componentPath: string): Promise<CompileResult> {
    // Check cache
    if (compiledComponents.has(componentPath)) {
      return compiledComponents.get(componentPath)!
    }

    // Read file (append .tsx extension)
    const fullPath = componentPath.endsWith('.tsx') ? componentPath : `${componentPath}.tsx`
    const source = await readFile(fullPath)

    // Get base directory for this component (resolve imports relative to this file)
    const componentDir = fullPath.substring(0, fullPath.lastIndexOf('/'))

    // Extract imports for this component
    const imports = extractImports(source, fullPath)

    // Compile dependent components first
    const componentResults: Map<string, CompileResult> = new Map()
    for (const imp of imports) {
      const depPath = resolvePath(componentDir, imp.path)
      const result = await compileComponent(depPath)
      componentResults.set(imp.name, result)
    }

    // Compile component (embed child component HTML)
    const result = compileJsxWithComponents(source, fullPath, componentResults, idGenerator)

    compiledComponents.set(componentPath, result)
    return result
  }

  // Compile entry point
  const entryResult = await compileComponent(entryPath)

  // Generate JS/server component for each component
  // 1. First generate code for all components (with placeholder import paths)
  const componentData: Array<{
    name: string
    path: string
    result: CompileResult
    signalDeclarations: string
    childInits: ChildComponentInit[]
  }> = []

  for (const [path, result] of compiledComponents) {
    if (result.clientJs || result.staticHtml) {
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

  // 2. Calculate hash for each component (based on content excluding child component imports)
  const componentHashes: Map<string, string> = new Map()
  for (const data of componentData) {
    const { name, result, signalDeclarations } = data
    const bodyCode = result.clientJs
    const contentForHash = signalDeclarations + bodyCode + result.staticHtml
    const hash = generateContentHash(contentForHash)
    componentHashes.set(name, hash)
  }

  // 3. Generate final clientJs (with correct hash-suffixed import paths)
  const components: ComponentOutput[] = []

  for (const data of componentData) {
    const { name, result, signalDeclarations, childInits } = data

    // Generate child component imports (with hash)
    const childImports = childInits
      .map(child => {
        const childHash = componentHashes.get(child.name) || ''
        const childFilename = childHash ? `${child.name}-${childHash}.js` : `${child.name}.js`
        return `import { init${child.name} } from './${childFilename}'`
      })
      .join('\n')

    // Generate child component init calls
    // Automatically updated by createEffect, so no need to wrap in callback
    const childInitCalls = childInits
      .map(child => {
        return `init${child.name}(${child.propsExpr})`
      })
      .join('\n')

    // Check if there's dynamic content (whether createEffect is generated)
    const hasDynamicContent = result.dynamicElements.length > 0 ||
                              result.listElements.length > 0 ||
                              result.dynamicAttributes.length > 0

    // Wrap in init function if props exist
    let clientJs = ''
    if (result.clientJs || childInits.length > 0) {
      const allImports = [
        `import { createSignal, createEffect } from './barefoot.js'`,
        childImports,
      ].filter(Boolean).join('\n')

      const bodyCode = [
        result.clientJs,
        childInitCalls ? `\n// Initialize child components\n${childInitCalls}` : '',
      ].filter(Boolean).join('\n')

      if (result.props.length > 0) {
        const propsParam = `{ ${result.props.join(', ')} }`
        // Add auto-hydration code that looks for embedded props and calls init
        const autoHydrateCode = `
// Auto-hydration: look for embedded props from server
const __propsEl = document.querySelector('script[data-bf-props="${name}"]')
if (__propsEl) {
  const __props = JSON.parse(__propsEl.textContent || '{}')
  init${name}(__props)
}
`
        clientJs = `${allImports}

export function init${name}(${propsParam}) {
${signalDeclarations ? signalDeclarations.split('\n').map(l => '  ' + l).join('\n') + '\n' : ''}
${bodyCode.split('\n').map(l => '  ' + l).join('\n')}
}
${autoHydrateCode}`
      } else {
        clientJs = `${allImports}

${signalDeclarations}

${bodyCode}
`
      }
    }

    // Determine if this component needs client-side JS
    const hasClientJs = Boolean(clientJs.trim())
    const hash = componentHashes.get(name) || ''
    const filename = hasClientJs ? (hash ? `${name}-${hash}.js` : `${name}.js`) : ''

    // Generate server JSX component (only if adapter is provided)
    let serverJsx = ''
    if (options?.serverAdapter && result.ir) {
      const jsx = irToServerJsx(result.ir, result.signals)
      // Extract unique child component names
      const childComponents = [...new Set(childInits.map(c => c.name))]
      serverJsx = options.serverAdapter.generateServerComponent({
        name,
        props: result.props,
        jsx,
        ir: result.ir,
        signals: result.signals,
        childComponents,
      })
    }

    components.push({
      name,
      hash,
      filename,
      clientJs,
      staticHtml: result.staticHtml,
      serverJsx,
      props: result.props,
      hasClientJs,
    })
  }

  return {
    html: entryResult.staticHtml,
    components,
  }
}

/**
 * JSX compilation with component support (internal use)
 * Compiles while embedding child component HTML
 *
 * IR-based processing flow:
 * 1. JSX → IR conversion (jsx-to-ir.ts)
 * 2. IR → HTML conversion (ir-to-html.ts)
 * 3. IR → ClientJS info collection (ir-to-client-js.ts)
 * 4. ClientJS generation (createEffect-based)
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

  // Extract signal declarations
  const signals = extractSignals(source, filePath)

  // Extract component props
  const props = extractComponentProps(source, filePath)

  // Extract local functions
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

  return {
    staticHtml,
    clientJs,
    signals,
    localFunctions,
    childInits,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    props,
    source,
    ir,
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

