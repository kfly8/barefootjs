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
  RefElement,
  LocalFunction,
  ChildComponentInit,
  CompileResult,
  ComponentOutput,
  CompileJSXResult,
  CompileOptions,
  IRNode,
} from './types'
import {
  extractImports,
  extractSignals,
  extractComponentPropsWithTypes,
  extractTypeDefinitions,
  extractLocalFunctions,
} from './extractors'
import { IdGenerator } from './utils/id-generator'
import {
  extractArrowBody,
  extractArrowParams,
  needsCapturePhase,
  parseConditionalHandler,
  generateAttributeUpdate,
  irToServerJsx,
  collectClientJsInfo,
  collectAllChildComponentNames,
  findAndConvertJsxReturn,
  type JsxToIRContext,
} from './transformers'
import {
  generateContentHash,
  resolvePath,
} from './compiler/utils'
import {
  calculateElementPaths,
  generatePathExpression,
  type ElementPath,
} from './utils/element-paths'

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

    // Compile component with its own IdGenerator (each component has IDs starting from 0)
    const componentIdGenerator = new IdGenerator()
    const result = compileJsxWithComponents(source, fullPath, componentResults, componentIdGenerator)

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
    // Include component if it has clientJs OR ir (for serverJsx generation)
    if (result.clientJs || result.ir) {
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
    const contentForHash = signalDeclarations + bodyCode
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

    // Check if any list uses key-based reconciliation
    const needsReconcileList = result.listElements.some(el => el.keyExpression !== null)

    // Wrap in init function if props exist
    let clientJs = ''
    if (result.clientJs || childInits.length > 0) {
      const barefootImports = ['createSignal', 'createEffect']
      if (needsReconcileList) {
        barefootImports.push('reconcileList')
      }
      const allImports = [
        `import { ${barefootImports.join(', ')} } from './barefoot.js'`,
        childImports,
      ].filter(Boolean).join('\n')

      const bodyCode = [
        result.clientJs,
        childInitCalls ? `\n// Initialize child components\n${childInitCalls}` : '',
      ].filter(Boolean).join('\n')

      if (result.props.length > 0) {
        const propsParam = `{ ${result.props.map(p => p.name).join(', ')} }`
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
      // Calculate element paths to determine which elements need data-bf attributes
      // Elements with null paths (e.g., after component siblings) need data-bf for querySelector fallback
      const paths = calculateElementPaths(result.ir)
      const needsDataBfIds = new Set(
        paths.filter(p => p.path === null).map(p => p.id)
      )
      const jsx = irToServerJsx(result.ir, name, result.signals, needsDataBfIds, { outputEventAttrs: true })
      // Collect all child component names (including those in lists) for server imports
      const childComponents = collectAllChildComponentNames(result.ir)
      serverJsx = options.serverAdapter.generateServerComponent({
        name,
        props: result.props,
        typeDefinitions: result.typeDefinitions,
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
      serverJsx,
      props: result.props,
      hasClientJs,
    })
  }

  return {
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

  // Extract component props with types
  const props = extractComponentPropsWithTypes(source, filePath)

  // Extract type definitions used by props
  const propTypes = props.map(p => p.type)
  const typeDefinitions = extractTypeDefinitions(source, filePath, propTypes)

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
  const refElements: RefElement[] = []

  if (ir) {
    collectClientJsInfo(ir, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements)
  }

  // Extract component name from file path
  const componentName = filePath.split('/').pop()!.replace('.tsx', '')

  // Generate client JS (createEffect-based)
  const clientJs = generateClientJsWithCreateEffect(
    componentName,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    localFunctions,
    refElements,
    ir
  )

  return {
    clientJs,
    signals,
    localFunctions,
    childInits,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    refElements,
    props,
    typeDefinitions,
    source,
    ir,
  }
}

/**
 * Generates update code for dynamic attributes (with custom variable name)
 */
function generateAttributeUpdateWithVar(da: DynamicAttribute, varName: string): string {
  const { attrName, expression } = da

  if (attrName === 'class' || attrName === 'className') {
    return `${varName}.className = ${expression}`
  }

  if (attrName === 'style') {
    return `Object.assign(${varName}.style, ${expression})`
  }

  if (['disabled', 'checked', 'hidden', 'readonly', 'required'].includes(attrName)) {
    return `${varName}.${attrName} = ${expression}`
  }

  if (attrName === 'value') {
    return `${varName}.value = ${expression}`
  }

  return `${varName}.setAttribute('${attrName}', ${expression})`
}

/**
 * Generate client JS with createEffect (reactive updates)
 *
 * Uses tree position-based hydration: elements are found by DOM traversal
 * instead of querySelector. This enables Fragment root support.
 */
function generateClientJsWithCreateEffect(
  componentName: string,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[],
  localFunctions: LocalFunction[],
  refElements: RefElement[] = [],
  ir: IRNode | null = null
): string {
  const lines: string[] = []
  const hasDynamicContent = dynamicElements.length > 0 || listElements.length > 0 || dynamicAttributes.length > 0

  // Collect element IDs with dynamic attributes (remove duplicates)
  const attrElementIds = [...new Set(dynamicAttributes.map(da => da.id))]

  // Collect element IDs with refs (remove duplicates)
  const refElementIds = [...new Set(refElements.map(r => r.id))]

  // Helper to make valid JS variable name from slot ID
  const varName = (id: string) => `_${id}`

  // Track which IDs we've already added queries for
  const queriedIds = new Set<string>()

  // Check if there are any elements to query
  const hasElements = dynamicElements.length > 0 || listElements.length > 0 ||
                      attrElementIds.length > 0 || interactiveElements.length > 0 ||
                      refElements.length > 0

  // Calculate element paths from IR for tree position-based hydration
  const elementPaths: Map<string, string | null> = new Map()
  if (ir) {
    const paths = calculateElementPaths(ir)
    for (const { id, path } of paths) {
      elementPaths.set(id, path)
    }
  }

  // Find the component's scope element first
  if (hasElements) {
    lines.push(`const __scope = document.querySelector('[data-bf-scope="${componentName}"]')`)
  }

  // Track declared variables and their paths for chaining optimization
  // e.g., { '': '__scope', 'nextElementSibling': '_1' }
  const declaredPaths: Map<string, string> = new Map()
  declaredPaths.set('', '__scope')

  // Helper to generate optimized element access code
  // Instead of always using __scope, chain from previously declared variables
  const getElementAccessCode = (id: string): string => {
    const path = elementPaths.get(id)

    // Fallback to querySelector for null paths or when path not found
    if (path === undefined || path === null) {
      return `__scope?.querySelector('[data-bf="${id}"]')`
    }

    // Find the best base variable (longest matching prefix)
    let bestBase = '__scope'
    let bestBasePath = ''
    let remainingPath = path

    for (const [declaredPath, varNameStr] of declaredPaths) {
      if (path === declaredPath) {
        // Exact match - just use that variable
        return varNameStr
      }
      if (path.startsWith(declaredPath) && declaredPath.length > bestBasePath.length) {
        // This declared path is a prefix of our target path
        const suffix = path.slice(declaredPath.length)
        // Make sure it's a proper prefix (starts with '.' or is empty)
        if (suffix === '' || suffix.startsWith('.')) {
          bestBase = varNameStr
          bestBasePath = declaredPath
          remainingPath = suffix.startsWith('.') ? suffix.slice(1) : suffix
        }
      }
    }

    // Register this path for future chaining
    declaredPaths.set(path, varName(id))

    // Generate the access code
    if (remainingPath === '') {
      return bestBase
    }
    return `${bestBase}?.${remainingPath}`
  }

  // Collect all element IDs that need to be queried, sorted by path length
  // This ensures shorter paths are declared first for optimal chaining
  const allElementIds = new Set<string>()
  for (const el of dynamicElements) allElementIds.add(el.id)
  for (const el of listElements) allElementIds.add(el.id)
  for (const id of attrElementIds) allElementIds.add(id)
  for (const el of interactiveElements) allElementIds.add(el.id)
  for (const el of refElements) allElementIds.add(el.id)

  // Sort by path length to ensure proper chaining order
  const sortedIds = Array.from(allElementIds).sort((a, b) => {
    const pathA = elementPaths.get(a) ?? ''
    const pathB = elementPaths.get(b) ?? ''
    return pathA.length - pathB.length
  })

  // Generate element declarations in sorted order
  for (const id of sortedIds) {
    if (!queriedIds.has(id)) {
      lines.push(`const ${varName(id)} = ${getElementAccessCode(id)}`)
      queriedIds.add(id)
    }
  }

  if (hasDynamicContent || interactiveElements.length > 0 || refElements.length > 0) {
    lines.push('')
  }

  // Output local functions
  for (const fn of localFunctions) {
    lines.push(fn.code)
  }
  if (localFunctions.length > 0) {
    lines.push('')
  }

  // Execute ref callbacks (with existence check)
  for (const ref of refElements) {
    const v = varName(ref.id)
    lines.push(`if (${v}) {`)
    lines.push(`  (${ref.callback})(${v})`)
    lines.push(`}`)
  }
  if (refElements.length > 0) {
    lines.push('')
  }

  // createEffect for dynamic elements (with existence check)
  for (const el of dynamicElements) {
    const v = varName(el.id)
    lines.push(`if (${v}) {`)
    lines.push(`  createEffect(() => {`)
    // Wrap in String() for consistent textContent assignment across environments
    lines.push(`    ${v}.textContent = String(${el.fullContent})`)
    lines.push(`  })`)
    lines.push(`}`)
  }

  // createEffect for list elements (with existence check)
  for (const el of listElements) {
    const v = varName(el.id)
    lines.push(`if (${v}) {`)
    lines.push(`  createEffect(() => {`)
    if (el.keyExpression) {
      // Use reconcileList for efficient key-based updates
      // Convert key expression to work in render context (e.g., item.id -> item.id)
      const renderFn = `(${el.paramName}, __index) => ${el.itemTemplate}`
      const getKeyFn = `(${el.paramName}) => ${el.keyExpression}`
      lines.push(`    reconcileList(${v}, ${el.arrayExpression}, ${renderFn}, ${getKeyFn})`)
    } else {
      // Fall back to innerHTML for lists without key
      lines.push(`    ${v}.innerHTML = ${el.mapExpression}`)
    }
    lines.push(`  })`)
    lines.push(`}`)
  }

  // createEffect for dynamic attributes (with existence check)
  for (const da of dynamicAttributes) {
    const v = varName(da.id)
    lines.push(`if (${v}) {`)
    lines.push(`  createEffect(() => {`)
    lines.push(`    ${generateAttributeUpdateWithVar(da, v)}`)
    lines.push(`  })`)
    lines.push(`}`)
  }

  if (hasDynamicContent) {
    lines.push('')
  }

  // Event delegation for list elements (with existence check)
  for (const el of listElements) {
    if (el.itemEvents.length > 0) {
      const v = varName(el.id)
      for (const event of el.itemEvents) {
        const handlerBody = extractArrowBody(event.handler)
        const conditionalHandler = parseConditionalHandler(handlerBody)
        const useCapture = needsCapturePhase(event.eventName)
        const captureArg = useCapture ? ', true' : ''

        lines.push(`if (${v}) {`)
        lines.push(`  ${v}.addEventListener('${event.eventName}', (e) => {`)
        lines.push(`    const target = e.target.closest('[data-event-id="${event.eventId}"]')`)
        lines.push(`    if (target && target.dataset.eventId === '${event.eventId}') {`)
        lines.push(`      const __index = parseInt(target.dataset.index, 10)`)
        lines.push(`      const ${event.paramName} = ${el.arrayExpression}[__index]`)

        if (conditionalHandler) {
          // Conditional handler: execute action only when condition is met
          lines.push(`      if (${conditionalHandler.condition}) {`)
          lines.push(`        ${conditionalHandler.action}`)
          lines.push(`      }`)
        } else {
          lines.push(`      ${handlerBody}`)
        }

        lines.push(`    }`)
        lines.push(`  }${captureArg})`)
        lines.push(`}`)
      }
    }
  }

  // Event handlers for interactive elements (with existence check)
  for (const el of interactiveElements) {
    const v = varName(el.id)
    for (const event of el.events) {
      const handlerBody = extractArrowBody(event.handler)
      const conditionalHandler = parseConditionalHandler(handlerBody)

      lines.push(`if (${v}) {`)
      if (conditionalHandler) {
        // Conditional handler: convert to if statement to prevent return false
        const params = extractArrowParams(event.handler)
        lines.push(`  ${v}.on${event.eventName} = ${params} => {`)
        lines.push(`    if (${conditionalHandler.condition}) {`)
        lines.push(`      ${conditionalHandler.action}`)
        lines.push(`    }`)
        lines.push(`  }`)
      } else {
        lines.push(`  ${v}.on${event.eventName} = ${event.handler}`)
      }
      lines.push(`}`)
    }
  }

  return lines.join('\n')
}

