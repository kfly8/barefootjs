/**
 * Component Resolver
 *
 * Handles component resolution, caching, and dependency tracking.
 * Recursively resolves component imports and detects circular dependencies.
 */

import type { CompileResult, ChildComponentInit } from '../types'
import { extractImports } from '../extractors/imports'
import { extractLocalComponentFunctions, extractExportedComponentNames, getDefaultExportName } from '../extractors/local-components'
import { extractUseClientDirective, validateDomImports, validateEventHandlers } from '../extractors/directive'
import { resolvePath } from './utils'

/**
 * Context for component resolution
 */
export interface ResolveContext {
  /** Cache of compiled components: cacheKey -> { result, fullPath } */
  compiledComponents: Map<string, { result: CompileResult; fullPath: string }>
  /** Track components currently being compiled (for cycle detection) */
  compilingComponents: Set<string>
  /** Cache of "use client" directive status per file: fullPath -> hasDirective */
  fileDirectives: Map<string, boolean>
  /** Function to read file contents */
  readFile: (path: string) => Promise<string>
  /** Root directory for calculating relative paths */
  rootDir: string
  /** Function to compile a single component with its dependencies */
  compileComponentFn: (
    source: string,
    fullPath: string,
    componentResults: Map<string, CompileResult>,
    targetComponentName: string,
    hasUseClientDirective: boolean
  ) => CompileResult
}

/**
 * Create a resolve context for component resolution
 */
export function createResolveContext(
  readFile: (path: string) => Promise<string>,
  rootDir: string,
  compileComponentFn: ResolveContext['compileComponentFn']
): ResolveContext {
  return {
    compiledComponents: new Map(),
    compilingComponents: new Set(),
    fileDirectives: new Map(),
    readFile,
    rootDir,
    compileComponentFn,
  }
}

/**
 * Create a placeholder result for cycle detection
 */
function createCyclePlaceholder(targetComponentName?: string, hasUseClientDirective: boolean = false): CompileResult {
  return {
    componentName: targetComponentName || 'Placeholder',
    ir: { type: 'text', content: '' } as any,
    clientJs: '',
    interactiveElements: [],
    dynamicElements: [],
    listElements: [],
    dynamicAttributes: [],
    conditionalElements: [],
    refElements: [],
    signals: [],
    memos: [],
    effects: [],
    imports: [],
    externalImports: [],
    props: [],
    propsTypeRefName: null,
    restPropsName: null,
    typeDefinitions: [],
    localFunctions: [],
    localVariables: [],
    moduleConstants: [],
    childInits: [],
    source: '',
    isDefaultExport: false,
    hasUseClientDirective,
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Resolve file path (try .tsx first, then /index.tsx)
 */
async function resolveFilePath(
  componentPath: string,
  readFile: (path: string) => Promise<string>
): Promise<{ fullPath: string; source: string }> {
  if (componentPath.endsWith('.tsx')) {
    const source = await readFile(componentPath)
    return { fullPath: componentPath, source }
  }

  // Try path.tsx first
  const directPath = `${componentPath}.tsx`
  try {
    const source = await readFile(directPath)
    return { fullPath: directPath, source }
  } catch {
    // Fallback to path/index.tsx
    const indexPath = `${componentPath}/index.tsx`
    const source = await readFile(indexPath)
    return { fullPath: indexPath, source }
  }
}

/**
 * Determine the main component name from a source file
 */
function determineMainComponentName(
  targetComponentName: string | undefined,
  exportedComponentNames: string[],
  directoryComponentName: string | null,
  defaultExportName: string | null,
  fileName: string
): string {
  // 1. If targetComponentName is specified, use it
  if (targetComponentName) {
    return targetComponentName
  }

  // 2. For index.tsx files, prefer the directoryComponentName if it exists in exports
  if (directoryComponentName && exportedComponentNames.includes(directoryComponentName)) {
    return directoryComponentName
  }

  // 3. Otherwise, use the first exported component
  if (exportedComponentNames.length > 0) {
    return exportedComponentNames[0]
  }

  // 4. Use the default export name if available
  if (defaultExportName) {
    return defaultExportName
  }

  // 5. Fallback to directory name (for index.tsx) or file name
  return directoryComponentName || capitalizeFirst(fileName)
}

/**
 * Resolve a component and its dependencies recursively
 *
 * @param componentPath - Path to component file
 * @param ctx - Resolve context
 * @param targetComponentName - Optional: specific component name to compile from the file
 */
export async function resolveComponent(
  componentPath: string,
  ctx: ResolveContext,
  targetComponentName?: string
): Promise<CompileResult> {
  // Create cache key that includes target component name for local components
  const cacheKey = targetComponentName ? `${componentPath}#${targetComponentName}` : componentPath

  // Check cache
  if (ctx.compiledComponents.has(cacheKey)) {
    return ctx.compiledComponents.get(cacheKey)!.result
  }

  // Read file first to get fullPath for directive cache lookup
  const { fullPath, source } = await resolveFilePath(componentPath, ctx.readFile)

  // Check and cache "use client" directive status (per file, not per component)
  let hasUseClientDirective: boolean
  if (ctx.fileDirectives.has(fullPath)) {
    hasUseClientDirective = ctx.fileDirectives.get(fullPath)!
  } else {
    hasUseClientDirective = extractUseClientDirective(source, fullPath)
    ctx.fileDirectives.set(fullPath, hasUseClientDirective)

    // Validate @barefootjs/dom imports (only once per file)
    validateDomImports(source, fullPath, hasUseClientDirective)

    // Validate event handlers (only once per file)
    validateEventHandlers(source, fullPath, hasUseClientDirective)
  }

  // Detect cycles - if we're already compiling this component, return a placeholder
  if (ctx.compilingComponents.has(cacheKey)) {
    return createCyclePlaceholder(targetComponentName, hasUseClientDirective)
  }

  // Mark as currently compiling
  ctx.compilingComponents.add(cacheKey)

  // Get base directory for this component (resolve imports relative to this file)
  const componentDir = fullPath.substring(0, fullPath.lastIndexOf('/'))

  // Extract imports for this component
  const imports = extractImports(source, fullPath)

  // Compile dependent components first (imported from other files)
  const componentResults: Map<string, CompileResult> = new Map()
  for (const imp of imports) {
    const depPath = resolvePath(componentDir, imp.path)
    const result = await resolveComponent(depPath, ctx)
    componentResults.set(imp.name, result)
  }

  // Extract all exported component names from the source
  const exportedComponentNames = extractExportedComponentNames(source, fullPath)

  // Get the default export name
  const defaultExportName = getDefaultExportName(source, fullPath)

  // For index.tsx files, determine the main component name from directory
  // e.g., button/index.tsx → Button (used for matching imports like '../button')
  const fileName = fullPath.split('/').pop()!.replace('.tsx', '')
  const directoryComponentName = fileName === 'index'
    ? capitalizeFirst(fullPath.split('/').slice(-2, -1)[0] || 'index')
    : null

  // Determine the main component name
  const mainComponentName = determineMainComponentName(
    targetComponentName,
    exportedComponentNames,
    directoryComponentName,
    defaultExportName,
    fileName
  )

  // Extract local components (non-exported, defined in same file)
  const localComponents = extractLocalComponentFunctions(source, fullPath, mainComponentName)

  // Compile all components in the file (exported + local)
  if (!targetComponentName) {
    // Compile local (non-exported) components FIRST
    // This ensures they're available when exported components (which may use them) are compiled
    for (const localComp of localComponents) {
      const result = await resolveComponent(componentPath, ctx, localComp.name)
      componentResults.set(localComp.name, result)
    }
    // Then compile other exported components (not the main one)
    for (const exportedName of exportedComponentNames) {
      if (exportedName !== mainComponentName) {
        const result = await resolveComponent(componentPath, ctx, exportedName)
        componentResults.set(exportedName, result)
      }
    }
  } else {
    // For local component compilation, add entries for sibling components
    // First check if they're already compiled (in cache), otherwise add placeholders
    const allComponentNames = [...exportedComponentNames, ...localComponents.map(c => c.name)]
    for (const compName of allComponentNames) {
      if (compName !== targetComponentName && !componentResults.has(compName)) {
        // Check if this component was already compiled (in the cache)
        const cachedKey = `${componentPath}#${compName}`
        const cached = ctx.compiledComponents.get(cachedKey)
        if (cached) {
          // Use the cached result - it has the real IR
          componentResults.set(compName, cached.result)
        } else {
          // Create a minimal placeholder - component will be compiled later
          componentResults.set(compName, createCyclePlaceholder(compName, hasUseClientDirective))
        }
      }
    }
  }

  // Compile component with its dependencies
  const result = ctx.compileComponentFn(source, fullPath, componentResults, mainComponentName, hasUseClientDirective)

  // Store with the original cache key (path or path#TargetName)
  ctx.compiledComponents.set(cacheKey, { result, fullPath })

  // Remove from compiling set
  ctx.compilingComponents.delete(cacheKey)

  return result
}
