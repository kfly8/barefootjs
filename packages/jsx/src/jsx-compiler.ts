/**
 * BarefootJS JSX Compiler
 *
 * Compiles JSX to Marked JSX and Client JS.
 * - Resolves component imports
 * - Detects event handlers (onClick, etc.) and generates Client JS
 * - Detects dynamic content ({count()}, etc.) and generates update functions
 *
 * Usage example:
 *   const result = await compileJSX(entryPath, readFile)
 *   // result.files[].markedJsx: Marked JSX (server-side JSX with hydration markers)
 *   // result.files[].clientJs: Client JS
 */

import ts from 'typescript'
import type {
  InteractiveElement,
  DynamicElement,
  ListElement,
  DynamicAttribute,
  RefElement,
  ConditionalElement,
  LocalFunction,
  LocalVariable,
  ChildComponentInit,
  CompileResult,
  CompileJSXResult,
  CompileOptions,
  IRNode,
  FileOutput,
  JsxToIRContext,
  ClientJsGeneratorContext,
} from './types'
import { extractSignals } from './extractors/signals'
import { extractMemos } from './extractors/memos'
import { extractEffects } from './extractors/effects'
import { extractModuleVariables } from './extractors/constants'
import { extractComponentPropsWithTypes, extractTypeDefinitions } from './extractors/props'
import { extractLocalFunctions } from './extractors/local-functions'
import { extractModuleFunctions } from './extractors/module-functions'
import { extractLocalVariables } from './extractors/local-variables'
import { extractImports, extractExternalImports } from './extractors/imports'
import { getDefaultExportName } from './extractors/local-components'
import { extractArrowBody, extractArrowParams, parseConditionalHandler } from './extractors/expression'
import { IdGenerator } from './utils/id-generator'
import { needsCapturePhase, collectClientJsInfo } from './transformers/ir-to-client-js'
import { findAndConvertJsxReturn } from './transformers/jsx-to-ir'
import {
  calculateElementPaths,
} from './utils/element-paths'
import {
  createResolveContext,
  resolveComponent,
} from './compiler/component-resolver'
import {
  collectComponentData,
  groupComponentsByFile,
  calculateFileMappings,
} from './compiler/file-grouping'
import { generateFileClientJs } from './compiler/client-js-generator'
import { generateFileMarkedJsx } from './compiler/marked-jsx-generator'
import {
  generateScopedElementFinder,
  generateEffectWithPreCheck,
  generateEffectWithInnerFinder,
} from './compiler/effect-helpers'

export type { CompileJSXResult }

/**
 * Compile application from entry point
 *
 * Recursively resolves component imports and
 * generates Marked JSX and Client JS for each component.
 *
 * @param entryPath - Entry file path (e.g., /path/to/index.tsx)
 * @param readFile - Function to read files
 * @returns { components } - Array of compiled components (Marked JSX + Client JS)
 */
export async function compileJSX(
  entryPath: string,
  readFile: (path: string) => Promise<string>,
  options?: CompileOptions
): Promise<CompileJSXResult> {
  // Get root directory for calculating relative paths
  // If rootDir is specified, use it; otherwise use entry file's parent directory
  const rootDir = options?.rootDir || entryPath.substring(0, entryPath.lastIndexOf('/'))

  // Create component compilation function for the resolver
  const compileComponentFn = (
    source: string,
    fullPath: string,
    componentResults: Map<string, CompileResult>,
    targetComponentName: string,
    hasUseClientDirective: boolean
  ): CompileResult => {
    const componentIdGenerator = new IdGenerator()
    return compileJsxWithComponents(source, fullPath, componentResults, componentIdGenerator, targetComponentName, hasUseClientDirective)
  }

  // 1. Resolve all components recursively
  const ctx = createResolveContext(readFile, rootDir, compileComponentFn)
  await resolveComponent(entryPath, ctx)

  // 2. Collect and organize component data
  const componentData = collectComponentData(ctx.compiledComponents)
  const fileGroups = groupComponentsByFile(componentData)
  const mappings = calculateFileMappings(fileGroups, rootDir)

  // 3. Collect files that should be included in output
  // Include files that either:
  //   a) Have "use client" directive
  //   b) Are imported by files with "use client" directive (for import resolution)
  const clientFiles = new Set<string>()
  const importedByClientFiles = new Set<string>()

  // First pass: identify "use client" files and their imports
  for (const [sourceFile, fileComponents] of fileGroups) {
    const hasUseClientDirective = fileComponents[0]?.result.hasUseClientDirective ?? false
    if (hasUseClientDirective) {
      clientFiles.add(sourceFile)
      // Collect all imports from this file
      for (const comp of fileComponents) {
        for (const imp of comp.result.imports) {
          // Resolve the import path to find the actual file
          const sourceDir = sourceFile.substring(0, sourceFile.lastIndexOf('/'))
          // Find the file that contains this imported component
          for (const [otherFile] of fileGroups) {
            if (otherFile !== sourceFile && otherFile.includes(imp.path.replace('./', '').replace('../', ''))) {
              importedByClientFiles.add(otherFile)
            }
          }
        }
      }
    }
  }

  // Also check component-to-file mapping for imported components
  for (const [compName, sourceFile] of mappings.componentToFile) {
    // Check if this component is imported by any client file component
    for (const [clientFile, fileComponents] of fileGroups) {
      if (!clientFiles.has(clientFile)) continue
      for (const comp of fileComponents) {
        for (const imp of comp.result.imports) {
          if (imp.name === compName) {
            importedByClientFiles.add(sourceFile)
          }
        }
      }
    }
  }

  // 4. Generate output for each file
  const files: FileOutput[] = []

  for (const [sourceFile, fileComponents] of fileGroups) {
    // Get directive status from first component (all components in same file share directive)
    const hasUseClientDirective = fileComponents[0]?.result.hasUseClientDirective ?? false

    // Include files that are either "use client" or imported by "use client" files
    const isImportedByClient = importedByClientFiles.has(sourceFile)
    if (!hasUseClientDirective && !isImportedByClient) {
      continue
    }

    const sourcePath = mappings.fileToSourcePath.get(sourceFile)!
    const fileHash = mappings.fileHashes.get(sourceFile)!

    // Collect component names and props
    const componentNames = fileComponents.map(c => c.name)
    const componentProps: Record<string, typeof fileComponents[0]['result']['props']> = {}
    for (const comp of fileComponents) {
      componentProps[comp.name] = comp.result.props
    }

    // Check if any component in this file needs client JS
    // Only generate client JS if the file has "use client" directive
    const hasClientJs = hasUseClientDirective && fileComponents.some(c => c.hasClientJs)

    // Get base filename from source path (e.g., '_shared/docs.tsx' -> 'docs')
    const baseFileName = sourcePath.split('/').pop()!.replace('.tsx', '')
    const clientJsFilename = hasClientJs ? `${baseFileName}-${fileHash}.js` : ''

    // Generate combined client JS using new module (only if directive present)
    const clientJsCtx = {
      sourcePath,
      fileHash,
      componentToFile: mappings.componentToFile,
      fileHashes: mappings.fileHashes,
      fileToSourcePath: mappings.fileToSourcePath,
      allComponentData: componentData,
    }
    const combinedClientJs = hasUseClientDirective
      ? generateFileClientJs(fileComponents, clientJsCtx)
      : ''

    // Generate combined Marked JSX using new module
    const combinedMarkedJsx = generateFileMarkedJsx(fileComponents, sourcePath, options)

    files.push({
      sourcePath,
      markedJsx: combinedMarkedJsx,
      clientJs: combinedClientJs,
      hash: fileHash,
      clientJsFilename,
      hasClientJs,
      componentNames,
      componentProps,
      hasUseClientDirective,
    })
  }

  return {
    files,
  }
}

/**
 * JSX compilation with component support (internal use)
 * Compiles while embedding child components
 *
 * IR-based processing flow:
 * 1. JSX → IR conversion (jsx-to-ir.ts)
 * 2. IR → Marked JSX conversion (ir-to-marked-jsx.ts)
 * 3. IR → Client JS info collection (ir-to-client-js.ts)
 * 4. Client JS generation (createEffect-based)
 *
 * @param source - Source code
 * @param filePath - File path
 * @param components - Map of available child components
 * @param idGenerator - ID generator for element IDs
 * @param targetComponentName - Optional: specific component to compile from the source
 * @param hasUseClientDirective - Whether file has "use client" directive
 */
function compileJsxWithComponents(
  source: string,
  filePath: string,
  components: Map<string, CompileResult>,
  idGenerator: IdGenerator,
  targetComponentName?: string,
  hasUseClientDirective: boolean = false
): CompileResult {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  // Extract signal declarations (for target component only)
  const signals = extractSignals(source, filePath, targetComponentName)

  // Extract memo declarations (for target component only)
  const memos = extractMemos(source, filePath, targetComponentName)

  // Extract user-written createEffect blocks (for target component only)
  const effects = extractEffects(source, filePath, targetComponentName)

  // Extract module-level constants (shared across all components in file)
  const moduleConstants = extractModuleVariables(source, filePath)

  // Extract component props with types (for target component only)
  const propsResult = extractComponentPropsWithTypes(source, filePath, targetComponentName)
  const props = propsResult.props
  const propsTypeRefName = propsResult.typeRefName
  const restPropsName = propsResult.restPropsName

  // Extract type definitions used by props
  const propTypes = props.map(p => p.type)
  // Also include the type reference name if present
  const allPropTypes = propsTypeRefName ? [...propTypes, propsTypeRefName] : propTypes
  const typeDefinitions = extractTypeDefinitions(source, filePath, allPropTypes)

  // Extract local functions (for target component only)
  const localFunctions = extractLocalFunctions(source, filePath, signals, targetComponentName)

  // Extract module-level helper functions (not inside any component)
  const moduleFunctions = extractModuleFunctions(source, filePath)

  // Extract local variables (for target component only, non-function declarations)
  const localVariables = extractLocalVariables(source, filePath, signals, targetComponentName)

  // Extract imports (for Marked JSX generation)
  const imports = extractImports(source, filePath)

  // Extract external package imports (npm packages like 'class-variance-authority')
  const externalImports = extractExternalImports(source, filePath)

  // Extract component name from target or file path
  const componentName = targetComponentName || filePath.split('/').pop()!.replace('.tsx', '')

  // Detect if this component is the default export
  const defaultExportName = getDefaultExportName(source, filePath)
  const isDefaultExport = componentName === defaultExportName

  // Extract value prop names (non-callback props) for reactivity detection
  // Props starting with 'on' followed by uppercase are callback props (e.g., onClick, onSubmit)
  // Exclude 'children' as it's a special prop that's already rendered and shouldn't be re-rendered
  const isCallbackProp = (name: string) => /^on[A-Z]/.test(name)
  const valueProps = props.filter(p => !isCallbackProp(p.name) && p.name !== 'children').map(p => p.name)

  // Create IR context
  const irContext: JsxToIRContext = {
    sourceFile,
    signals,
    memos,
    components,
    idGenerator,
    warnings: [],
    currentComponentName: componentName,
    valueProps,
  }

  // Convert JSX to IR (for target component)
  const ir = findAndConvertJsxReturn(sourceFile, irContext, targetComponentName)

  // Output warnings
  for (const warning of irContext.warnings) {
    console.warn(`[BarefootJS] Warning in ${componentName}: ${warning.message}`)
  }

  // Collect client JS info from IR
  const interactiveElements: InteractiveElement[] = []
  const dynamicElements: DynamicElement[] = []
  const listElements: ListElement[] = []
  const dynamicAttributes: DynamicAttribute[] = []
  const childInits: { name: string; propsExpr: string }[] = []
  const refElements: RefElement[] = []
  const conditionalElements: ConditionalElement[] = []

  if (ir) {
    collectClientJsInfo(ir, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, { signals, memos })
  }

  // Generate client JS (createEffect-based)
  const clientJs = generateClientJsWithCreateEffect(
    componentName,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    localFunctions,
    localVariables,
    refElements,
    conditionalElements,
    ir,
    childInits,
    moduleFunctions
  )

  return {
    componentName,
    clientJs,
    signals,
    memos,
    effects,
    moduleConstants,
    localFunctions,
    localVariables,
    childInits,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    refElements,
    conditionalElements,
    props,
    propsTypeRefName,
    restPropsName,
    typeDefinitions,
    source,
    ir,
    imports,
    externalImports,
    isDefaultExport,
    hasUseClientDirective,
  }
}

/**
 * Generates update code for dynamic attributes (with custom variable name)
 *
 * For setAttribute, we add an undefined check to prevent overwriting
 * server-rendered default values when props are not passed.
 */
function generateAttributeUpdateWithVar(da: DynamicAttribute, varName: string): string {
  const { attrName, expression } = da

  if (attrName === 'class' || attrName === 'className') {
    // Use setAttribute for class to support both HTML and SVG elements
    // SVG elements have className as SVGAnimatedString (read-only)
    return `${varName}.setAttribute('class', ${expression})`
  }

  if (attrName === 'style') {
    // Object literal uses Object.assign, string/template literal uses cssText
    if (expression.trim().startsWith('{')) {
      return `Object.assign(${varName}.style, ${expression})`
    }
    return `${varName}.style.cssText = ${expression}`
  }

  if (['disabled', 'checked', 'hidden', 'readonly', 'required'].includes(attrName)) {
    return `${varName}.${attrName} = ${expression}`
  }

  if (attrName === 'value') {
    // Add undefined check for value to prevent showing "undefined" string
    return `{ const __val = ${expression}; if (__val !== undefined) ${varName}.value = __val }`
  }

  // Add undefined check to preserve server-rendered default values
  // when props are not passed to child components
  return `{ const __val = ${expression}; if (__val !== undefined) ${varName}.setAttribute('${attrName}', __val) }`
}


/**
 * Generate element queries: scope setup, path calculation, element declarations
 */
function generateElementQueries(
  ctx: ClientJsGeneratorContext,
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[],
  interactiveElements: InteractiveElement[],
  refElements: RefElement[],
  conditionalElements: ConditionalElement[],
  childInits: ChildComponentInit[]
): string[] {
  const lines: string[] = []

  // Collect element IDs with dynamic attributes (remove duplicates)
  const attrElementIds = [...new Set(dynamicAttributes.map(da => da.id))]

  // Check if there are any elements to query
  // Also need scope when there are child inits (to pass as parent scope)
  const hasElements = dynamicElements.length > 0 || listElements.length > 0 ||
                      attrElementIds.length > 0 || interactiveElements.length > 0 ||
                      refElements.length > 0 || conditionalElements.length > 0 ||
                      childInits.length > 0

  // Find the component's scope element first
  // Supports unique instance IDs (e.g., ComponentName_abc123)
  // __parentScope can be:
  //   1. The scope element itself (passed from auto-hydration)
  //   2. A parent element to search within (for nested components)
  // Child components are initialized first, so they mark their scopes with data-bf-init
  // Parent components filter out already-initialized scopes and select from remaining ones
  if (hasElements) {
    // Check if __parentScope is the scope element itself (has matching data-bf-scope prefix)
    lines.push(`let __scope = null`)
    lines.push(`if (__parentScope?.dataset?.bfScope?.startsWith('${ctx.componentName}_')) {`)
    lines.push(`  __scope = __parentScope`)
    lines.push(`} else {`)
    // Search for scope elements with prefix matching (ComponentName_xxx)
    lines.push(`  const __allScopes = Array.from((__parentScope || document).querySelectorAll('[data-bf-scope^="${ctx.componentName}_"]'))`)
    lines.push(`  const __uninitializedScopes = __allScopes.filter(s => !s.hasAttribute('data-bf-init'))`)
    lines.push(`  __scope = __uninitializedScopes[__instanceIndex]`)
    lines.push(`}`)
    lines.push(`if (!__scope) return`)
    lines.push(`__scope.setAttribute('data-bf-init', 'true')`)
  }

  // Check if we need a scoped element finder (for elements with null paths)
  const needsScopedFinder = [...ctx.elementPaths.values()].some(p => p === null || p === undefined)

  // Collect all element IDs that need to be queried, sorted by path length
  // This ensures shorter paths are declared first for optimal chaining
  const allElementIds = new Set<string>()
  for (const el of dynamicElements) allElementIds.add(el.id)
  for (const el of listElements) allElementIds.add(el.id)
  for (const id of attrElementIds) allElementIds.add(id)
  for (const el of interactiveElements) allElementIds.add(el.id)
  for (const el of refElements) allElementIds.add(el.id)
  // Note: conditional elements are found by data-bf-cond attribute, not by ID/path

  // Add scoped element finder helper if needed (for elements with null paths)
  // This finder excludes elements that are inside nested data-bf-scope components
  if (needsScopedFinder || conditionalElements.length > 0) {
    lines.push(`const __findInScope = (sel) => {`)
    lines.push(`  if (__scope?.matches?.(sel)) return __scope`)
    lines.push(`  for (const el of __scope?.querySelectorAll(sel) || []) {`)
    lines.push(`    if (el.closest('[data-bf-scope]') === __scope) return el`)
    lines.push(`  }`)
    lines.push(`  return null`)
    lines.push(`}`)
  }

  // Sort by path length to ensure proper chaining order
  const sortedIds = Array.from(allElementIds).sort((a, b) => {
    const pathA = ctx.elementPaths.get(a) ?? ''
    const pathB = ctx.elementPaths.get(b) ?? ''
    return pathA.length - pathB.length
  })

  // Generate element declarations in sorted order
  for (const id of sortedIds) {
    if (!ctx.queriedIds.has(id)) {
      lines.push(`const ${ctx.varName(id)} = ${ctx.getElementAccessCode(id)}`)
      ctx.queriedIds.add(id)
    }
  }

  return lines
}

/**
 * Generate createEffect blocks for dynamic text content
 */
function generateDynamicElementEffects(
  ctx: ClientJsGeneratorContext,
  dynamicElements: DynamicElement[]
): string[] {
  const lines: string[] = []

  for (const el of dynamicElements) {
    const v = ctx.varName(el.id)
    const path = ctx.elementPaths.get(el.id)

    // Evaluate the expression BEFORE checking if element exists
    // This ensures signal dependencies are always tracked, even when element doesn't exist yet
    // (e.g., element is inside a conditional that's currently false)
    if (el.expression === 'children' || el.fullContent === 'children') {
      // Handle children prop - if it's a function (lazy children), call it
      // Only update if children is defined (static children are rendered server-side)
      lines.push(...generateEffectWithInnerFinder({
        varName: v,
        elementId: el.id,
        path,
        effectBody: `${v}.textContent = String(__childrenResult)`,
        evaluateFirst: `const __childrenResult = children !== undefined ? (typeof children === 'function' ? children() : children) : undefined\nif (!${v} || __childrenResult === undefined) return`,
      }))
    } else {
      // Evaluate expression first to track dependencies
      lines.push(...generateEffectWithInnerFinder({
        varName: v,
        elementId: el.id,
        path,
        effectBody: `${v}.textContent = String(__textValue)`,
        evaluateFirst: `const __textValue = ${el.fullContent}`,
      }))
    }
  }

  return lines
}

/**
 * Generate createEffect blocks for list rendering
 * Uses reconcileList for key-based DOM updates to preserve existing elements
 */
function generateListElementEffects(
  ctx: ClientJsGeneratorContext,
  listElements: ListElement[]
): string[] {
  const lines: string[] = []

  for (const el of listElements) {
    const v = ctx.varName(el.id)
    // Use reconcileList for key-based DOM updates
    // This preserves existing elements, preventing conflicts with in-flight events (e.g., blur)
    const effectBody = `reconcileList(${v}, ${el.arrayExpression}, (${el.paramName}, __index) => String(${el.keyExpression}), (${el.paramName}, __index) => ${el.itemTemplate})`

    lines.push(...generateEffectWithPreCheck({ varName: v, effectBody }))
  }

  return lines
}

/**
 * Generate createEffect blocks for dynamic attributes
 *
 * Filters out attributes that only reference local variables (SSR-only).
 * Local variables are computed once at SSR time and don't change on the client,
 * so they don't need reactive updates.
 */
function generateAttributeEffects(
  ctx: ClientJsGeneratorContext,
  dynamicAttributes: DynamicAttribute[],
  localVariableNames: string[] = []
): string[] {
  const lines: string[] = []
  const localVarSet = new Set(localVariableNames)

  for (const da of dynamicAttributes) {
    // Skip attributes that reference local variables (SSR-only)
    // These don't need reactive updates since localVariables are evaluated at SSR time
    const expr = da.expression.trim()

    // Check if expression is just a local variable reference
    if (localVarSet.has(expr)) {
      continue
    }

    // Check if expression contains any local variable references
    // Local variables are SSR-only, so attributes using them don't need createEffect
    let containsLocalVar = false
    for (const varName of localVarSet) {
      // Use word boundary to avoid false positives (e.g., "count" in "accountId")
      const regex = new RegExp(`\\b${varName}\\b`)
      if (regex.test(expr)) {
        containsLocalVar = true
        break
      }
    }

    if (containsLocalVar) {
      // Skip this attribute - it uses SSR-only local variables
      continue
    }

    const v = ctx.varName(da.id)
    const effectBody = generateAttributeUpdateWithVar(da, v)
    lines.push(...generateEffectWithPreCheck({ varName: v, effectBody }))
  }

  return lines
}

/**
 * Generate createEffect blocks for conditional DOM switching
 */
function generateConditionalEffects(
  conditionalElements: ConditionalElement[]
): string[] {
  const lines: string[] = []

  for (const cond of conditionalElements) {
    const condId = cond.id
    // Templates use backticks for template literals with ${} interpolation
    // Only escape backticks that aren't part of nested template literals
    const whenTrueTemplate = cond.whenTrueTemplate.replace(/\n/g, '\\n')
    const whenFalseTemplate = cond.whenFalseTemplate.replace(/\n/g, '\\n')

    // Check if this is a fragment conditional (uses comment markers)
    const isFragmentCond = whenTrueTemplate.includes(`<!--bf-cond-start:${condId}-->`) ||
                           whenFalseTemplate.includes(`<!--bf-cond-start:${condId}-->`)

    // Track previous condition value to only replace DOM when condition changes
    // This prevents unnecessary DOM replacement when only content signals change
    lines.push(`let __prevCond_${condId}`)
    lines.push(`createEffect(() => {`)
    lines.push(`  const __currCond = Boolean(${cond.condition})`)
    lines.push(`  const __isFirstRun = __prevCond_${condId} === undefined`)
    lines.push(`  const __prevVal = __prevCond_${condId}`)
    lines.push(`  __prevCond_${condId} = __currCond`)
    // On first run, skip DOM replacement but attach handlers
    // On subsequent runs, skip if condition unchanged
    lines.push(`  if (__isFirstRun) {`)
    lines.push(`    if (!__currCond) return`)
    lines.push(`  } else if (__currCond === __prevVal) {`)
    lines.push(`    return`)
    lines.push(`  }`)
    lines.push(`  if (!__isFirstRun) {`)
    if (isFragmentCond) {
      // Fragment conditional: find content between comment markers
      lines.push(`  const __html = ${cond.condition} ? \`${whenTrueTemplate}\` : \`${whenFalseTemplate}\``)
      // Find start comment marker
      lines.push(`  let __startComment = null`)
      lines.push(`  const __walker = document.createTreeWalker(__scope, NodeFilter.SHOW_COMMENT)`)
      lines.push(`  while (__walker.nextNode()) {`)
      lines.push(`    if (__walker.currentNode.nodeValue === 'bf-cond-start:${condId}') {`)
      lines.push(`      __startComment = __walker.currentNode`)
      lines.push(`      break`)
      lines.push(`    }`)
      lines.push(`  }`)
      // Also check for single element with data-bf-cond (for branch switching)
      lines.push(`  const __condEl = __scope?.querySelector('[data-bf-cond="${condId}"]')`)
      lines.push(`  if (__startComment) {`)
      // Remove nodes between start and end markers
      lines.push(`    const __nodesToRemove = []`)
      lines.push(`    let __node = __startComment.nextSibling`)
      lines.push(`    while (__node && !((__node.nodeType === 8) && __node.nodeValue === 'bf-cond-end:${condId}')) {`)
      lines.push(`      __nodesToRemove.push(__node)`)
      lines.push(`      __node = __node.nextSibling`)
      lines.push(`    }`)
      lines.push(`    const __endComment = __node`)
      lines.push(`    __nodesToRemove.forEach(n => n.remove())`)
      // Insert new content
      lines.push(`    const __template = document.createElement('template')`)
      lines.push(`    __template.innerHTML = __html`)
      // Extract content (skip comment markers from template)
      lines.push(`    const __newNodes = []`)
      lines.push(`    let __child = __template.content.firstChild`)
      lines.push(`    while (__child) {`)
      lines.push(`      if (!(__child.nodeType === 8 && (__child.nodeValue?.startsWith('bf-cond-') || false))) {`)
      lines.push(`        __newNodes.push(__child.cloneNode(true))`)
      lines.push(`      }`)
      lines.push(`      __child = __child.nextSibling`)
      lines.push(`    }`)
      lines.push(`    __newNodes.forEach(n => __startComment.parentNode?.insertBefore(n, __endComment))`)
      lines.push(`  } else if (__condEl) {`)
      // Single element: replace with new content
      lines.push(`    const __template = document.createElement('template')`)
      lines.push(`    __template.innerHTML = __html`)
      // Check if new content is fragment or single element
      lines.push(`    const __firstChild = __template.content.firstChild`)
      lines.push(`    if (__firstChild?.nodeType === 8 && __firstChild?.nodeValue === 'bf-cond-start:${condId}') {`)
      // Switching from element to fragment: insert markers and content
      lines.push(`      const __parent = __condEl.parentNode`)
      lines.push(`      const __nodes = Array.from(__template.content.childNodes).map(n => n.cloneNode(true))`)
      lines.push(`      __nodes.forEach(n => __parent?.insertBefore(n, __condEl))`)
      lines.push(`      __condEl.remove()`)
      lines.push(`    } else if (__firstChild) {`)
      lines.push(`      __condEl.replaceWith(__firstChild.cloneNode(true))`)
      lines.push(`    }`)
      lines.push(`  }`)
    } else {
      // Simple element conditional: use querySelector and replaceWith
      lines.push(`  const __condEl = __scope?.querySelector('[data-bf-cond="${condId}"]')`)
      lines.push(`  if (__condEl) {`)
      lines.push(`    const __template = document.createElement('template')`)
      lines.push(`    __template.innerHTML = ${cond.condition} ? \`${whenTrueTemplate}\` : \`${whenFalseTemplate}\``)
      lines.push(`    const __newEl = __template.content.firstChild`)
      lines.push(`    if (__newEl) {`)
      lines.push(`      __condEl.replaceWith(__newEl)`)
      lines.push(`    }`)
      lines.push(`  }`)
    }
    lines.push(`  }`)  // Close if (!__isFirstRun) block

    // Re-attach event handlers for elements inside conditional
    // This runs on first run (to attach) and after DOM update (to re-attach)
    if (cond.interactiveElements && cond.interactiveElements.length > 0) {
      for (const el of cond.interactiveElements) {
        const elVar = `__cond_el_${el.id}`
        lines.push(`  ${generateScopedElementFinder({ varName: elVar, elementId: el.id, path: null })}`)
        for (const event of el.events) {
          const handlerBody = extractArrowBody(event.handler)
          const conditionalHandler = parseConditionalHandler(handlerBody)

          lines.push(`  if (${elVar}) {`)
          if (conditionalHandler) {
            const params = extractArrowParams(event.handler)
            lines.push(`    ${elVar}.on${event.eventName} = ${params} => {`)
            lines.push(`      if (${conditionalHandler.condition}) {`)
            lines.push(`        ${conditionalHandler.action}`)
            lines.push(`      }`)
            lines.push(`    }`)
          } else {
            lines.push(`    ${elVar}.on${event.eventName} = ${event.handler}`)
          }
          lines.push(`  }`)
        }
      }
    }

    lines.push(`})`)
  }

  return lines
}

/**
 * Generate event handlers: list delegation + direct event handlers
 */
function generateEventHandlers(
  ctx: ClientJsGeneratorContext,
  listElements: ListElement[],
  interactiveElements: InteractiveElement[]
): string[] {
  const lines: string[] = []

  // Event delegation for list elements (with existence check)
  // Uses key-based item lookup for stable references during DOM updates
  for (const el of listElements) {
    if (el.itemEvents.length > 0) {
      const v = ctx.varName(el.id)
      for (const event of el.itemEvents) {
        const handlerBody = extractArrowBody(event.handler)
        const conditionalHandler = parseConditionalHandler(handlerBody)
        const useCapture = needsCapturePhase(event.eventName)
        const captureArg = useCapture ? ', true' : ''

        lines.push(`if (${v}) {`)
        lines.push(`  ${v}.addEventListener('${event.eventName}', (e) => {`)
        lines.push(`    const target = e.target.closest('[data-event-id="${event.eventId}"]')`)
        lines.push(`    if (target && target.dataset.eventId === '${event.eventId}') {`)
        // Use key-based lookup instead of index-based
        // Find the closest parent element with data-key attribute
        lines.push(`      const __keyEl = target.closest('[data-key]')`)
        lines.push(`      const __key = __keyEl?.dataset.key`)
        lines.push(`      const __index = ${el.arrayExpression}.findIndex((${el.paramName}) => String(${el.keyExpression}) === __key)`)
        lines.push(`      if (__index === -1) return`)
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
    const v = ctx.varName(el.id)
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

  return lines
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
  localVariables: LocalVariable[],
  refElements: RefElement[] = [],
  conditionalElements: ConditionalElement[] = [],
  ir: IRNode | null = null,
  childInits: ChildComponentInit[] = [],
  moduleFunctions: LocalFunction[] = []
): string {
  const lines: string[] = []
  const hasDynamicContent = dynamicElements.length > 0 || listElements.length > 0 || dynamicAttributes.length > 0 || conditionalElements.length > 0

  // Helper to make valid JS variable name from slot ID
  const varName = (id: string) => `_${id}`

  // Calculate element paths from IR for tree position-based hydration
  const elementPaths: Map<string, string | null> = new Map()
  if (ir) {
    const paths = calculateElementPaths(ir)
    for (const { id, path } of paths) {
      elementPaths.set(id, path)
    }
  }

  // Track declared variables and their paths for chaining optimization
  // e.g., { '': '__scope', 'nextElementSibling': '_1' }
  const declaredPaths: Map<string, string> = new Map()
  declaredPaths.set('', '__scope')

  // Track which IDs we've already added queries for
  const queriedIds = new Set<string>()

  // Helper to generate optimized element access code
  // Instead of always using __scope, chain from previously declared variables
  const getElementAccessCode = (id: string): string => {
    const path = elementPaths.get(id)

    // Fallback to scoped finder for null paths or when path not found
    // The scoped finder excludes elements inside nested data-bf-scope components
    if (path === undefined || path === null) {
      return `__findInScope('[data-bf="${id}"]')`
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

  // Create context for helper functions
  const ctx: ClientJsGeneratorContext = {
    componentName,
    elementPaths,
    declaredPaths,
    queriedIds,
    varName,
    getElementAccessCode
  }

  // Generate element queries (scope setup, scoped finder, element declarations)
  lines.push(...generateElementQueries(
    ctx,
    dynamicElements,
    listElements,
    dynamicAttributes,
    interactiveElements,
    refElements,
    conditionalElements,
    childInits
  ))

  if (hasDynamicContent || interactiveElements.length > 0 || refElements.length > 0) {
    lines.push('')
  }

  // Output module-level helper functions (if any)
  for (const fn of moduleFunctions) {
    lines.push(fn.code)
  }
  if (moduleFunctions.length > 0) {
    lines.push('')
  }

  // Output local functions
  for (const fn of localFunctions) {
    lines.push(fn.code)
  }
  if (localFunctions.length > 0) {
    lines.push('')
  }

  // Note: Local variables are output as declarations (before memos) in client-js-generator.ts
  // They are not output here because memos may depend on them and declarations come first

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

  // Generate createEffect blocks for each type
  lines.push(...generateDynamicElementEffects(ctx, dynamicElements))
  lines.push(...generateListElementEffects(ctx, listElements))
  // Pass local variable names to filter out SSR-only attributes
  const localVarNames = localVariables.map(lv => lv.name)
  lines.push(...generateAttributeEffects(ctx, dynamicAttributes, localVarNames))
  lines.push(...generateConditionalEffects(conditionalElements))

  if (hasDynamicContent) {
    lines.push('')
  }

  // Generate event handlers
  lines.push(...generateEventHandlers(ctx, listElements, interactiveElements))

  return lines.join('\n')
}

