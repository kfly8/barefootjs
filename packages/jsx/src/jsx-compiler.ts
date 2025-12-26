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
 *   // result.components[].serverJsx: Marked JSX (server-side JSX with hydration markers)
 *   // result.components[].clientJs: Client JS
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
  ChildComponentInit,
  CompileResult,
  ComponentOutput,
  CompileJSXResult,
  CompileOptions,
  IRNode,
  FileOutput,
  ServerComponentData,
} from './types'
import {
  extractImports,
  extractSignals,
  extractMemos,
  extractModuleVariables,
  isConstantUsedInClientCode,
  extractComponentPropsWithTypes,
  extractTypeDefinitions,
  extractLocalFunctions,
  extractLocalComponentFunctions,
  extractExportedComponentNames,
  getDefaultExportName,
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

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export type { ComponentOutput, CompileJSXResult }

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

  // Cache of compiled components: cacheKey -> { result, fullPath }
  const compiledComponents: Map<string, { result: CompileResult; fullPath: string }> = new Map()

  // Track components currently being compiled (for cycle detection)
  const compilingComponents: Set<string> = new Set()

  /**
   * Compile component (recursively resolve dependencies)
   *
   * @param componentPath - Path to component file
   * @param targetComponentName - Optional: specific component name to compile from the file
   */
  async function compileComponent(componentPath: string, targetComponentName?: string): Promise<CompileResult> {
    // Create cache key that includes target component name for local components
    const cacheKey = targetComponentName ? `${componentPath}#${targetComponentName}` : componentPath

    // Check cache
    if (compiledComponents.has(cacheKey)) {
      return compiledComponents.get(cacheKey)!.result
    }

    // Detect cycles - if we're already compiling this component, return a placeholder
    if (compilingComponents.has(cacheKey)) {
      // Return a placeholder to break the cycle
      // The actual result will be available after compilation completes
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
        imports: [],
        props: [],
        typeDefinitions: [],
        localFunctions: [],
        moduleConstants: [],
        childInits: [],
        source: '',
        isDefaultExport: false,
      }
    }

    // Mark as currently compiling
    compilingComponents.add(cacheKey)

    // Read file (try path.tsx first, then path/index.tsx)
    let fullPath: string
    let source: string
    if (componentPath.endsWith('.tsx')) {
      fullPath = componentPath
      source = await readFile(fullPath)
    } else {
      // Try path.tsx first
      const directPath = `${componentPath}.tsx`
      try {
        source = await readFile(directPath)
        fullPath = directPath
      } catch {
        // Fallback to path/index.tsx
        const indexPath = `${componentPath}/index.tsx`
        source = await readFile(indexPath)
        fullPath = indexPath
      }
    }

    // Get base directory for this component (resolve imports relative to this file)
    const componentDir = fullPath.substring(0, fullPath.lastIndexOf('/'))

    // Extract imports for this component
    const imports = extractImports(source, fullPath)

    // Compile dependent components first (imported from other files)
    const componentResults: Map<string, CompileResult> = new Map()
    for (const imp of imports) {
      const depPath = resolvePath(componentDir, imp.path)
      const result = await compileComponent(depPath)
      componentResults.set(imp.name, result)
    }

    // Extract all exported component names from the source
    const exportedComponentNames = extractExportedComponentNames(source, fullPath)

    // For index.tsx files, determine the main component name from directory
    // e.g., button/index.tsx → Button (used for matching imports like '../button')
    const fileName = fullPath.split('/').pop()!.replace('.tsx', '')
    const directoryComponentName = fileName === 'index'
      ? capitalizeFirst(fullPath.split('/').slice(-2, -1)[0] || 'index')
      : null

    // Determine the main component name:
    // 1. If targetComponentName is specified, use it
    // 2. For index.tsx files, prefer the directoryComponentName if it exists in exports
    // 3. Otherwise, use the first exported component
    let mainComponentName: string
    if (targetComponentName) {
      mainComponentName = targetComponentName
    } else if (directoryComponentName && exportedComponentNames.includes(directoryComponentName)) {
      mainComponentName = directoryComponentName
    } else if (exportedComponentNames.length > 0) {
      mainComponentName = exportedComponentNames[0]
    } else {
      // Fallback to file name (shouldn't happen for valid components)
      mainComponentName = fileName === 'index'
        ? capitalizeFirst(fullPath.split('/').slice(-2, -1)[0] || 'index')
        : capitalizeFirst(fileName)
    }

    // Extract local components (non-exported, defined in same file)
    const localComponents = extractLocalComponentFunctions(source, fullPath, mainComponentName)

    // Compile all components in the file (exported + local)
    if (!targetComponentName) {
      // Compile local (non-exported) components FIRST
      // This ensures they're available when exported components (which may use them) are compiled
      for (const localComp of localComponents) {
        const result = await compileComponent(componentPath, localComp.name)
        componentResults.set(localComp.name, result)
      }
      // Then compile other exported components (not the main one)
      for (const exportedName of exportedComponentNames) {
        if (exportedName !== mainComponentName) {
          const result = await compileComponent(componentPath, exportedName)
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
          const cached = compiledComponents.get(cachedKey)
          if (cached) {
            // Use the cached result - it has the real IR
            componentResults.set(compName, cached.result)
          } else {
            // Create a minimal placeholder - component will be compiled later
            componentResults.set(compName, {
              componentName: compName,
              ir: null,
              clientJs: '',
              interactiveElements: [],
              dynamicElements: [],
              listElements: [],
              dynamicAttributes: [],
              conditionalElements: [],
              refElements: [],
              signals: [],
              memos: [],
              imports: [],
              props: [],
              typeDefinitions: [],
              localFunctions: [],
              moduleConstants: [],
              childInits: [],
              source: '',
              isDefaultExport: false,
            })
          }
        }
      }
    }

    // Compile component with its own IdGenerator (each component has IDs starting from 0)
    const componentIdGenerator = new IdGenerator()
    const result = compileJsxWithComponents(source, fullPath, componentResults, componentIdGenerator, mainComponentName)

    // Store with the original cache key (path or path#TargetName)
    compiledComponents.set(cacheKey, { result, fullPath })

    // Remove from compiling set
    compilingComponents.delete(cacheKey)

    return result
  }

  // Compile entry point
  const entryResult = await compileComponent(entryPath)

  // Generate JS/server component for each component
  // 1. First generate code for all components (with placeholder import paths)
  const componentData: Array<{
    name: string
    path: string
    fullPath: string
    result: CompileResult
    constantDeclarations: string
    signalDeclarations: string
    memoDeclarations: string
    childInits: ChildComponentInit[]
  }> = []

  for (const [cacheKey, { result, fullPath }] of compiledComponents) {
    // Include component if it has clientJs OR ir (for serverJsx generation)
    if (result.clientJs || result.ir) {
      // Use the actual component name from the result
      const name = result.componentName
      const signalDeclarations = result.signals
        .map(s => `const [${s.getter}, ${s.setter}] = createSignal(${s.initialValue})`)
        .join('\n')
      const memoDeclarations = result.memos
        .map(m => `const ${m.getter} = createMemo(${m.computation})`)
        .join('\n')

      // Filter constants to only those used in client code
      const eventHandlers = result.interactiveElements.flatMap(e => e.events.map(ev => ev.handler))
      const refCallbacks = result.refElements.map(r => r.callback)
      const childPropsExpressions = result.childInits.map(c => c.propsExpr)
      const usedConstants = result.moduleConstants.filter(c =>
        isConstantUsedInClientCode(c.name, result.localFunctions, eventHandlers, refCallbacks, childPropsExpressions)
      )
      const constantDeclarations = usedConstants.map(c => c.code).join('\n')

      componentData.push({
        name,
        path: cacheKey,
        fullPath,
        result,
        constantDeclarations,
        signalDeclarations,
        memoDeclarations,
        childInits: result.childInits,
      })
    }
  }

  // 2. Calculate hash for each component (based on content including child init calls)
  const componentHashes: Map<string, string> = new Map()
  for (const data of componentData) {
    const { name, result, constantDeclarations, signalDeclarations, memoDeclarations, childInits } = data
    const bodyCode = result.clientJs
    // Include childInits in hash to invalidate cache when child components change
    const childInitsStr = childInits.map(c => `${c.name}:${c.propsExpr}`).join(',')
    const contentForHash = constantDeclarations + signalDeclarations + memoDeclarations + bodyCode + childInitsStr
    const hash = generateContentHash(contentForHash)
    componentHashes.set(name, hash)
  }

  // 3. Generate final clientJs (with correct hash-suffixed import paths)
  const components: ComponentOutput[] = []

  for (const data of componentData) {
    const { name, result, constantDeclarations, signalDeclarations, memoDeclarations, childInits } = data

    // Generate child component imports (with hash) - deduplicate by component name
    // Only include child components that have actual client JS
    const uniqueChildNames = [...new Set(childInits.map(child => child.name))]
    const childrenWithClientJs = uniqueChildNames.filter(childName => {
      const childData = componentData.find(d => d.name === childName)
      if (!childData) return false
      const { result } = childData
      // Include if has raw client JS, signals, or nested child inits
      return result.clientJs.length > 0 ||
             result.signals.length > 0 ||
             result.childInits.length > 0
    })
    const childImports = childrenWithClientJs
      .map(childName => {
        const childData = componentData.find(d => d.name === childName)
        const childHash = componentHashes.get(childName) || ''
        const childFilename = childHash ? `${childName}-${childHash}.js` : `${childName}.js`

        // Calculate relative path from current component to child component
        const currentLastSlash = data.fullPath.lastIndexOf('/')
        const currentDir = currentLastSlash > rootDir.length
          ? data.fullPath.substring(rootDir.length + 1, currentLastSlash)
          : ''
        let childDir = currentDir
        if (childData?.fullPath) {
          const childLastSlash = childData.fullPath.lastIndexOf('/')
          childDir = childLastSlash > rootDir.length
            ? childData.fullPath.substring(rootDir.length + 1, childLastSlash)
            : ''
        }

        let relativePath: string
        if (currentDir === childDir) {
          relativePath = `./${childFilename}`
        } else {
          // Calculate relative path between directories
          const currentParts = currentDir ? currentDir.split('/') : []
          const childParts = childDir ? childDir.split('/') : []

          // Find common prefix
          let commonLength = 0
          while (commonLength < currentParts.length &&
                 commonLength < childParts.length &&
                 currentParts[commonLength] === childParts[commonLength]) {
            commonLength++
          }

          // Build relative path
          const upCount = currentParts.length - commonLength
          const downPath = childParts.slice(commonLength).join('/')
          const upPath = '../'.repeat(upCount)
          relativePath = upPath + (downPath ? downPath + '/' : '') + childFilename
        }

        return `import { init${childName} } from '${relativePath}'`
      })
      .join('\n')

    // Generate child component init calls
    // Only call init for children that have client JS
    // Track instance index for each child component type
    // Pass __scope as parent scope so child components search within this component's DOM subtree
    const childInstanceCounts: Map<string, number> = new Map()
    const childInitCalls = childInits
      .filter(child => childrenWithClientJs.includes(child.name))
      .map(child => {
        const instanceIndex = childInstanceCounts.get(child.name) ?? 0
        childInstanceCounts.set(child.name, instanceIndex + 1)
        return `init${child.name}(${child.propsExpr}, ${instanceIndex}, __scope)`
      })
      .join('\n')

    // Check if there's dynamic content (whether createEffect is generated)
    const hasDynamicContent = result.dynamicElements.length > 0 ||
                              result.listElements.length > 0 ||
                              result.dynamicAttributes.length > 0

    // Check if any list uses key-based reconciliation
    const needsReconcileList = result.listElements.some(el => el.keyExpression !== null)

    // Check if component uses memos
    const needsCreateMemo = result.memos.length > 0

    // Wrap in init function if props exist
    let clientJs = ''
    if (result.clientJs || childInits.length > 0 || signalDeclarations) {
      // Calculate path to barefoot.js (at dist root)
      // Get the directory portion of the path relative to rootDir
      const lastSlashIndex = data.fullPath.lastIndexOf('/')
      const currentDir = lastSlashIndex > rootDir.length
        ? data.fullPath.substring(rootDir.length + 1, lastSlashIndex)
        : ''
      const dirDepth = currentDir ? currentDir.split('/').length : 0
      const barefootPath = dirDepth > 0 ? '../'.repeat(dirDepth) + 'barefoot.js' : './barefoot.js'

      // Determine which barefoot imports are needed
      const hasClientLogic = Boolean(result.clientJs)
      const hasSignals = result.signals.length > 0
      // Check if constantDeclarations contains createSignal calls
      const hasSignalInConstants = constantDeclarations.includes('createSignal')
      const barefootImports: string[] = []
      if (hasClientLogic || hasSignals || hasSignalInConstants) {
        barefootImports.push('createSignal', 'createEffect')
      }
      if (needsCreateMemo) {
        barefootImports.push('createMemo')
      }
      if (needsReconcileList) {
        barefootImports.push('reconcileList')
      }
      const barefootImportLine = barefootImports.length > 0
        ? `import { ${barefootImports.join(', ')} } from '${barefootPath}'`
        : ''
      const allImports = [
        barefootImportLine,
        childImports,
      ].filter(Boolean).join('\n')

      const bodyCode = [
        result.clientJs,
        childInitCalls ? `\n// Initialize child components\n${childInitCalls}` : '',
      ].filter(Boolean).join('\n')

      // Generate init function if component has props OR has child inits
      // Child inits require an init function because parent calls initComponentName({}, index, scope)
      const needsInitFunction = result.props.length > 0 || childInits.length > 0

      if (needsInitFunction) {
        const propsParam = result.props.length > 0
          ? `{ ${result.props.map(p => p.name).join(', ')} }`
          : '{}'  // Empty destructuring for components with no props but child inits
        // Add auto-hydration code that initializes when scope element exists
        // Only auto-hydrate root components (not nested inside another data-bf-scope)
        const autoHydrateCode = `
// Auto-hydration: initialize when scope element exists (root components only)
const __scopeEl = document.querySelector('[data-bf-scope="${name}"]')
if (__scopeEl && !__scopeEl.parentElement?.closest('[data-bf-scope]')) {
  const __propsEl = document.querySelector('script[data-bf-props="${name}"]')
  const __props = __propsEl ? JSON.parse(__propsEl.textContent || '{}') : {}
  init${name}(__props)
}
`
        const declarations = [constantDeclarations, signalDeclarations, memoDeclarations].filter(Boolean).join('\n')
        clientJs = `${allImports}

export function init${name}(${propsParam}, __instanceIndex = 0, __parentScope = null) {
${declarations ? declarations.split('\n').map(l => '  ' + l).join('\n') + '\n' : ''}
${bodyCode.split('\n').map(l => '  ' + l).join('\n')}
}
${autoHydrateCode}`
      } else {
        const declarations = [constantDeclarations, signalDeclarations, memoDeclarations].filter(Boolean).join('\n')
        // Define __instanceIndex and __parentScope if there's client logic that queries elements
        const instanceVarsLine = hasClientLogic ? 'const __instanceIndex = 0\nconst __parentScope = null\n' : ''
        clientJs = `${allImports}

${instanceVarsLine}${declarations}

${bodyCode}
`
      }
    }

    // Determine if this component needs client-side JS
    const hasClientJs = Boolean(clientJs.trim())
    const hash = componentHashes.get(name) || ''
    const filename = hasClientJs ? (hash ? `${name}-${hash}.js` : `${name}.js`) : ''

    // Calculate relative path from root directory
    const sourcePath = data.fullPath.startsWith(rootDir + '/')
      ? data.fullPath.substring(rootDir.length + 1)
      : data.fullPath

    // Generate server JSX component (only if adapter is provided)
    let serverJsx = ''
    if (options?.serverAdapter && result.ir) {
      // Calculate element paths to determine which elements need data-bf attributes
      // Elements with null paths (e.g., after component siblings) need data-bf for querySelector fallback
      // Also include dynamic elements (elements with signal-dependent content) for effect-based updates
      const paths = calculateElementPaths(result.ir)
      const needsDataBfIds = new Set([
        ...paths.filter(p => p.path === null).map(p => p.id),
        ...result.dynamicElements.map(el => el.id),
      ])
      const jsx = irToServerJsx(result.ir, name, result.signals, needsDataBfIds, { outputEventAttrs: true, memos: result.memos })
      // Collect all child component names (including those in lists) for server imports
      const childComponents = collectAllChildComponentNames(result.ir)
      // Filter imports to only include child components
      const originalImports = result.imports.filter(imp => childComponents.includes(imp.name))
      serverJsx = options.serverAdapter.generateServerComponent({
        name,
        props: result.props,
        typeDefinitions: result.typeDefinitions,
        jsx,
        ir: result.ir,
        signals: result.signals,
        memos: result.memos,
        childComponents,
        moduleConstants: result.moduleConstants,
        originalImports,
        sourcePath,
        isDefaultExport: result.isDefaultExport,
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
      sourcePath,
    })
  }

  // Generate file-based output (group components by source file)
  const files: FileOutput[] = []

  // Group components by source file path
  const fileGroups: Map<string, typeof componentData> = new Map()
  for (const data of componentData) {
    // Use fullPath to group components from the same source file
    const sourceFile = data.fullPath
    if (!fileGroups.has(sourceFile)) {
      fileGroups.set(sourceFile, [])
    }
    fileGroups.get(sourceFile)!.push(data)
  }

  // Pre-calculate file hashes and create component-to-file mapping
  const fileHashes: Map<string, string> = new Map()
  const componentToFile: Map<string, string> = new Map()
  const fileToSourcePath: Map<string, string> = new Map()

  for (const [sourceFile, fileComponents] of fileGroups) {
    const sourcePath = sourceFile.startsWith(rootDir + '/')
      ? sourceFile.substring(rootDir.length + 1)
      : sourceFile

    fileToSourcePath.set(sourceFile, sourcePath)

    // Calculate file-level hash
    const fileContentForHash = fileComponents
      .map(c => {
        const { constantDeclarations, signalDeclarations, memoDeclarations, result, childInits } = c
        const childInitsStr = childInits.map(ci => `${ci.name}:${ci.propsExpr}`).join(',')
        return constantDeclarations + signalDeclarations + memoDeclarations + result.clientJs + childInitsStr
      })
      .join('|')
    const fileHash = generateContentHash(fileContentForHash)
    fileHashes.set(sourceFile, fileHash)

    // Map each component to its file
    for (const comp of fileComponents) {
      componentToFile.set(comp.name, sourceFile)
    }
  }

  // Generate FileOutput for each source file
  for (const [sourceFile, fileComponents] of fileGroups) {
    // Use pre-calculated values
    const sourcePath = fileToSourcePath.get(sourceFile)!
    const fileHash = fileHashes.get(sourceFile)!

    // Collect component names and props
    const componentNames = fileComponents.map(c => c.name)
    const componentProps: Record<string, typeof fileComponents[0]['result']['props']> = {}
    for (const comp of fileComponents) {
      componentProps[comp.name] = comp.result.props
    }

    // Check if any component in this file needs client JS
    const hasClientJs = fileComponents.some(c => {
      const compOutput = components.find(co => co.name === c.name)
      return compOutput?.hasClientJs ?? false
    })

    // Get base filename from source path (e.g., '_shared/docs.tsx' -> 'docs')
    const baseFileName = sourcePath.split('/').pop()!.replace('.tsx', '')
    const clientJsFilename = hasClientJs ? `${baseFileName}-${fileHash}.js` : ''

    // Generate combined client JS
    let combinedClientJs = ''
    if (hasClientJs) {
      // Collect all imports from all components (deduplicated)
      const allImports: Set<string> = new Set()
      const allInitFunctions: string[] = []

      // Calculate path to barefoot.js (at dist root)
      const currentDir = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : ''
      const dirDepth = currentDir ? currentDir.split('/').length : 0
      const barefootPath = dirDepth > 0 ? '../'.repeat(dirDepth) + 'barefoot.js' : './barefoot.js'

      // Collect all barefoot imports needed
      const barefootImports: Set<string> = new Set()
      let needsReconcileList = false

      for (const comp of fileComponents) {
        const compOutput = components.find(co => co.name === comp.name)
        if (!compOutput?.hasClientJs) continue

        // Check what imports this component needs
        if (comp.result.clientJs || comp.result.signals.length > 0 || comp.constantDeclarations.includes('createSignal')) {
          barefootImports.add('createSignal')
          barefootImports.add('createEffect')
        }
        if (comp.result.memos.length > 0) {
          barefootImports.add('createMemo')
        }
        if (comp.result.listElements.some(el => el.keyExpression !== null)) {
          needsReconcileList = true
        }
      }

      if (needsReconcileList) {
        barefootImports.add('reconcileList')
      }

      if (barefootImports.size > 0) {
        allImports.add(`import { ${Array.from(barefootImports).join(', ')} } from '${barefootPath}'`)
      }

      // Collect child component imports (from other files only)
      for (const comp of fileComponents) {
        const compOutput = components.find(co => co.name === comp.name)
        if (!compOutput?.hasClientJs) continue

        const uniqueChildNames = [...new Set(comp.childInits.map(child => child.name))]
        const childrenWithClientJs = uniqueChildNames.filter(childName => {
          // Skip if child is in the same file
          if (componentNames.includes(childName)) return false
          const childData = componentData.find(d => d.name === childName)
          if (!childData) return false
          return childData.result.clientJs.length > 0 ||
                 childData.result.signals.length > 0 ||
                 childData.result.childInits.length > 0
        })

        for (const childName of childrenWithClientJs) {
          // Find which file contains this child component
          const childFile = componentToFile.get(childName)
          if (!childFile) continue

          const childSourcePath = fileToSourcePath.get(childFile) || ''
          const childFileHash = fileHashes.get(childFile) || ''
          const childDir = childSourcePath.includes('/') ? childSourcePath.substring(0, childSourcePath.lastIndexOf('/')) : ''
          const childBaseFileName = childSourcePath.split('/').pop()!.replace('.tsx', '')
          const childFilename = childFileHash ? `${childBaseFileName}-${childFileHash}.js` : `${childBaseFileName}.js`

          // Calculate relative path
          let relativePath: string
          if (currentDir === childDir) {
            relativePath = `./${childFilename}`
          } else {
            const currentParts = currentDir ? currentDir.split('/') : []
            const childParts = childDir ? childDir.split('/') : []
            let commonLength = 0
            while (commonLength < currentParts.length &&
                   commonLength < childParts.length &&
                   currentParts[commonLength] === childParts[commonLength]) {
              commonLength++
            }
            const upCount = currentParts.length - commonLength
            const downPath = childParts.slice(commonLength).join('/')
            const upPath = '../'.repeat(upCount)
            relativePath = upPath + (downPath ? downPath + '/' : '') + childFilename
          }

          allImports.add(`import { init${childName} } from '${relativePath}'`)
        }
      }

      // Generate init functions for each component
      for (const comp of fileComponents) {
        const compOutput = components.find(co => co.name === comp.name)
        if (!compOutput?.hasClientJs) continue

        const { name, result, constantDeclarations, signalDeclarations, memoDeclarations, childInits } = comp

        // Generate child init calls (including same-file children)
        const uniqueChildNames = [...new Set(childInits.map(child => child.name))]
        const childrenWithClientJs = uniqueChildNames.filter(childName => {
          const childData = componentData.find(d => d.name === childName)
          if (!childData) return false
          return childData.result.clientJs.length > 0 ||
                 childData.result.signals.length > 0 ||
                 childData.result.childInits.length > 0
        })

        const childInstanceCounts: Map<string, number> = new Map()
        const childInitCalls = childInits
          .filter(child => childrenWithClientJs.includes(child.name))
          .map(child => {
            const instanceIndex = childInstanceCounts.get(child.name) ?? 0
            childInstanceCounts.set(child.name, instanceIndex + 1)
            return `  init${child.name}(${child.propsExpr}, ${instanceIndex}, __scope)`
          })
          .join('\n')

        const bodyCode = [
          result.clientJs,
          childInitCalls ? `\n  // Initialize child components\n${childInitCalls}` : '',
        ].filter(Boolean).join('\n')

        const needsInitFunction = result.props.length > 0 || childInits.length > 0
        const declarations = [constantDeclarations, signalDeclarations, memoDeclarations].filter(Boolean).join('\n')

        if (needsInitFunction) {
          const propsParam = result.props.length > 0
            ? `{ ${result.props.map(p => p.name).join(', ')} }`
            : '{}'
          allInitFunctions.push(`export function init${name}(${propsParam}, __instanceIndex = 0, __parentScope = null) {
${declarations ? declarations.split('\n').map(l => '  ' + l).join('\n') + '\n' : ''}${bodyCode.split('\n').map(l => '  ' + l).join('\n')}
}`)
        } else {
          const instanceVarsLine = result.clientJs ? 'const __instanceIndex = 0\nconst __parentScope = null\n' : ''
          allInitFunctions.push(`// ${name} (no init function needed)
${instanceVarsLine}${declarations}

${bodyCode}`)
        }
      }

      // Auto-hydration code for root components
      const rootComponents = fileComponents.filter(c => {
        const compOutput = components.find(co => co.name === c.name)
        return compOutput?.hasClientJs && (c.result.props.length > 0 || c.childInits.length > 0)
      })

      const autoHydrateCodes = rootComponents.map(c => `
// Auto-hydration: initialize ${c.name} when scope element exists (root components only)
const __scopeEl_${c.name} = document.querySelector('[data-bf-scope="${c.name}"]')
if (__scopeEl_${c.name} && !__scopeEl_${c.name}.parentElement?.closest('[data-bf-scope]')) {
  const __propsEl = document.querySelector('script[data-bf-props="${c.name}"]')
  const __props = __propsEl ? JSON.parse(__propsEl.textContent || '{}') : {}
  init${c.name}(__props)
}`).join('\n')

      combinedClientJs = `${Array.from(allImports).join('\n')}

${allInitFunctions.join('\n\n')}
${autoHydrateCodes}
`
    }

    // Generate combined server JSX (if adapter supports it)
    let combinedServerJsx = ''
    if (options?.serverAdapter?.generateServerFile) {
      // Collect component data for server file generation
      const serverComponents: ServerComponentData[] = fileComponents
        .filter(c => c.result.ir)
        .map(c => {
          const paths = calculateElementPaths(c.result.ir!)
          const needsDataBfIds = new Set([
            ...paths.filter(p => p.path === null).map(p => p.id),
            ...c.result.dynamicElements.map(el => el.id),
          ])
          const jsx = irToServerJsx(c.result.ir!, c.name, c.result.signals, needsDataBfIds, { outputEventAttrs: true, memos: c.result.memos })
          const childComponents = collectAllChildComponentNames(c.result.ir!)

          return {
            name: c.name,
            props: c.result.props,
            typeDefinitions: c.result.typeDefinitions,
            jsx,
            ir: c.result.ir,
            signals: c.result.signals,
            memos: c.result.memos,
            childComponents,
            isDefaultExport: c.result.isDefaultExport,
          }
        })

      // Collect all module constants (deduplicated)
      const allModuleConstants = fileComponents.flatMap(c => c.result.moduleConstants)
      const uniqueModuleConstants = allModuleConstants.filter((c, i, arr) =>
        arr.findIndex(x => x.name === c.name) === i
      )

      // Collect all imports (deduplicated)
      const allOriginalImports = fileComponents.flatMap(c => c.result.imports)
      const uniqueImports = allOriginalImports.filter((imp, i, arr) =>
        arr.findIndex(x => x.name === imp.name && x.path === imp.path) === i
      )

      combinedServerJsx = options.serverAdapter.generateServerFile({
        sourcePath,
        components: serverComponents,
        moduleConstants: uniqueModuleConstants,
        originalImports: uniqueImports,
      })
    }

    files.push({
      sourcePath,
      serverJsx: combinedServerJsx,
      clientJs: combinedClientJs,
      hash: fileHash,
      clientJsFilename,
      hasClientJs,
      componentNames,
      componentProps,
    })
  }

  return {
    components,
    files,
  }
}

/**
 * JSX compilation with component support (internal use)
 * Compiles while embedding child components
 *
 * IR-based processing flow:
 * 1. JSX → IR conversion (jsx-to-ir.ts)
 * 2. IR → Marked JSX conversion (ir-to-server-jsx.ts)
 * 3. IR → Client JS info collection (ir-to-client-js.ts)
 * 4. Client JS generation (createEffect-based)
 *
 * @param source - Source code
 * @param filePath - File path
 * @param components - Map of available child components
 * @param idGenerator - ID generator for element IDs
 * @param targetComponentName - Optional: specific component to compile from the source
 */
function compileJsxWithComponents(
  source: string,
  filePath: string,
  components: Map<string, CompileResult>,
  idGenerator: IdGenerator,
  targetComponentName?: string
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

  // Extract module-level constants (shared across all components in file)
  const moduleConstants = extractModuleVariables(source, filePath)

  // Extract component props with types (for target component only)
  const props = extractComponentPropsWithTypes(source, filePath, targetComponentName)

  // Extract type definitions used by props
  const propTypes = props.map(p => p.type)
  const typeDefinitions = extractTypeDefinitions(source, filePath, propTypes)

  // Extract local functions (for target component only)
  const localFunctions = extractLocalFunctions(source, filePath, signals, targetComponentName)

  // Extract imports (for server JSX generation)
  const imports = extractImports(source, filePath)

  // Extract component name from target or file path
  const componentName = targetComponentName || filePath.split('/').pop()!.replace('.tsx', '')

  // Detect if this component is the default export
  const defaultExportName = getDefaultExportName(source, filePath)
  const isDefaultExport = componentName === defaultExportName

  // Create IR context
  const irContext: JsxToIRContext = {
    sourceFile,
    signals,
    memos,
    components,
    idGenerator,
    warnings: [],
    currentComponentName: componentName,
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
    refElements,
    conditionalElements,
    ir,
    childInits
  )

  return {
    componentName,
    clientJs,
    signals,
    memos,
    moduleConstants,
    localFunctions,
    childInits,
    interactiveElements,
    dynamicElements,
    listElements,
    dynamicAttributes,
    refElements,
    conditionalElements,
    props,
    typeDefinitions,
    source,
    ir,
    imports,
    isDefaultExport,
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
  conditionalElements: ConditionalElement[] = [],
  ir: IRNode | null = null,
  childInits: ChildComponentInit[] = []
): string {
  const lines: string[] = []
  const hasDynamicContent = dynamicElements.length > 0 || listElements.length > 0 || dynamicAttributes.length > 0 || conditionalElements.length > 0

  // Collect element IDs with dynamic attributes (remove duplicates)
  const attrElementIds = [...new Set(dynamicAttributes.map(da => da.id))]

  // Collect element IDs with refs (remove duplicates)
  const refElementIds = [...new Set(refElements.map(r => r.id))]

  // Helper to make valid JS variable name from slot ID
  const varName = (id: string) => `_${id}`

  // Track which IDs we've already added queries for
  const queriedIds = new Set<string>()

  // Check if there are any elements to query
  // Also need scope when there are child inits (to pass as parent scope)
  const hasElements = dynamicElements.length > 0 || listElements.length > 0 ||
                      attrElementIds.length > 0 || interactiveElements.length > 0 ||
                      refElements.length > 0 || conditionalElements.length > 0 ||
                      childInits.length > 0

  // Calculate element paths from IR for tree position-based hydration
  const elementPaths: Map<string, string | null> = new Map()
  if (ir) {
    const paths = calculateElementPaths(ir)
    for (const { id, path } of paths) {
      elementPaths.set(id, path)
    }
  }

  // Find the component's scope element first
  // Use querySelectorAll with __instanceIndex to support multiple instances of the same component
  // __parentScope allows searching within a parent component's scope (for nested components)
  if (hasElements) {
    lines.push(`const __allScopes = (__parentScope || document).querySelectorAll('[data-bf-scope="${componentName}"]')`)
    lines.push(`const __scope = __allScopes[__instanceIndex]`)
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
  // Note: conditional elements are found by data-bf-cond attribute, not by ID/path

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

  // createEffect for dynamic elements
  // Use path-based navigation when path is known, otherwise fallback to querySelector
  // (elements inside conditionals or after components get null paths)
  for (const el of dynamicElements) {
    const v = varName(el.id)
    const path = elementPaths.get(el.id)

    lines.push(`createEffect(() => {`)

    if (path !== undefined && path !== null) {
      // Use path-based navigation when path is known and reliable
      const accessCode = path === '' ? '__scope' : `__scope?.${path}`
      lines.push(`  const ${v} = ${accessCode}`)
    } else {
      // Fallback to querySelector for elements with null paths (inside conditionals, after components)
      lines.push(`  const ${v} = __scope?.matches?.('[data-bf="${el.id}"]') ? __scope : __scope?.querySelector('[data-bf="${el.id}"]')`)
    }

    lines.push(`  if (${v}) {`)
    // Handle children prop - if it's a function (lazy children), call it
    // Only update if children is defined (static children are rendered server-side)
    if (el.expression === 'children' || el.fullContent === 'children') {
      lines.push(`    if (children !== undefined) {`)
      lines.push(`      const __childrenResult = typeof children === 'function' ? children() : children`)
      lines.push(`      ${v}.textContent = String(__childrenResult)`)
      lines.push(`    }`)
    } else {
      // Wrap in String() for consistent textContent assignment across environments
      lines.push(`    ${v}.textContent = String(${el.fullContent})`)
    }
    lines.push(`  }`)
    lines.push(`})`)
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

  // createEffect for conditional elements (DOM switching)
  for (const cond of conditionalElements) {
    const condId = cond.id
    // Templates use backticks for template literals with ${} interpolation
    // Only escape backticks that aren't part of nested template literals
    const whenTrueTemplate = cond.whenTrueTemplate.replace(/\n/g, '\\n')
    const whenFalseTemplate = cond.whenFalseTemplate.replace(/\n/g, '\\n')

    // Check if this is a fragment conditional (uses comment markers)
    const isFragmentCond = whenTrueTemplate.includes(`<!--bf-cond-start:${condId}-->`) ||
                           whenFalseTemplate.includes(`<!--bf-cond-start:${condId}-->`)

    lines.push(`createEffect(() => {`)
    if (isFragmentCond) {
      // Fragment conditional: find content between comment markers
      lines.push(`  const __html = ${cond.condition} ? \`${whenTrueTemplate}\` : \`${whenFalseTemplate}\``)
      lines.push(`  // Find start comment marker`)
      lines.push(`  let __startComment = null`)
      lines.push(`  const __walker = document.createTreeWalker(__scope, NodeFilter.SHOW_COMMENT)`)
      lines.push(`  while (__walker.nextNode()) {`)
      lines.push(`    if (__walker.currentNode.nodeValue === 'bf-cond-start:${condId}') {`)
      lines.push(`      __startComment = __walker.currentNode`)
      lines.push(`      break`)
      lines.push(`    }`)
      lines.push(`  }`)
      lines.push(`  // Also check for single element with data-bf-cond (for branch switching)`)
      lines.push(`  const __condEl = __scope?.querySelector('[data-bf-cond="${condId}"]')`)
      lines.push(`  if (__startComment) {`)
      lines.push(`    // Remove nodes between start and end markers`)
      lines.push(`    const __nodesToRemove = []`)
      lines.push(`    let __node = __startComment.nextSibling`)
      lines.push(`    while (__node && !((__node.nodeType === 8) && __node.nodeValue === 'bf-cond-end:${condId}')) {`)
      lines.push(`      __nodesToRemove.push(__node)`)
      lines.push(`      __node = __node.nextSibling`)
      lines.push(`    }`)
      lines.push(`    const __endComment = __node`)
      lines.push(`    __nodesToRemove.forEach(n => n.remove())`)
      lines.push(`    // Insert new content`)
      lines.push(`    const __template = document.createElement('template')`)
      lines.push(`    __template.innerHTML = __html`)
      lines.push(`    // Extract content (skip comment markers from template)`)
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
      lines.push(`    // Single element: replace with new content`)
      lines.push(`    const __template = document.createElement('template')`)
      lines.push(`    __template.innerHTML = __html`)
      lines.push(`    // Check if new content is fragment or single element`)
      lines.push(`    const __firstChild = __template.content.firstChild`)
      lines.push(`    if (__firstChild?.nodeType === 8 && __firstChild?.nodeValue === 'bf-cond-start:${condId}') {`)
      lines.push(`      // Switching from element to fragment: insert markers and content`)
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
    lines.push(`})`)
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

