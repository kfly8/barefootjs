/**
 * File Grouping
 *
 * Groups compiled components by their source file and calculates
 * file-level hashes and component-to-file mappings.
 */

import type { CompileResult, ChildComponentInit } from '../types'
import { generateContentHash } from './utils'
import { isConstantUsedInClientCode } from '../extractors/constants'

/**
 * Component data with pre-calculated declarations
 */
export interface ComponentData {
  name: string
  path: string
  fullPath: string
  result: CompileResult
  constantDeclarations: string
  moduleFunctionDeclarations: string
  signalDeclarations: string
  localVariableDeclarations: string
  memoDeclarations: string
  effectDeclarations: string
  childInits: ChildComponentInit[]
  hasClientJs: boolean
  hasUseClientDirective: boolean
}

/**
 * Mappings for file-based output generation
 */
export interface FileMappings {
  /** File-level hashes: sourceFile -> hash */
  fileHashes: Map<string, string>
  /** Component to file mapping: componentName -> sourceFile */
  componentToFile: Map<string, string>
  /** File to source path mapping: sourceFile -> sourcePath */
  fileToSourcePath: Map<string, string>
}

/**
 * Collect and process component data from compiled components
 */
export function collectComponentData(
  compiledComponents: Map<string, { result: CompileResult; fullPath: string }>
): ComponentData[] {
  const componentData: ComponentData[] = []

  for (const [cacheKey, { result, fullPath }] of compiledComponents) {
    // Include component if it has clientJs OR ir (for Marked JSX generation)
    if (result.clientJs || result.ir) {
      // Use the actual component name from the result
      const name = result.componentName
      const signalDeclarations = result.signals
        .map(s => `const [${s.getter}, ${s.setter}] = createSignal(${s.initialValue})`)
        .join('\n')
      const memoDeclarations = result.memos
        .map(m => `const ${m.getter} = createMemo(${m.computation})`)
        .join('\n')
      const effectDeclarations = result.effects
        .map(e => e.code)
        .join('\n')

      const localVariableDeclarations = result.localVariables.map(lv => lv.code).join('\n')

      // Filter constants to only those used in client code
      const eventHandlers = result.interactiveElements.flatMap(e => e.events.map(ev => ev.handler))
      const refCallbacks = result.refElements.map(r => r.callback)
      const childPropsExpressions = result.childInits.map(c => c.propsExpr)
      const memoComputations = result.memos.map(m => m.computation)
      const signalInitializers = result.signals.map(s => s.initialValue)
      const effectBodies = result.effects.map(e => e.code)
      // Dynamic elements are rendered on client side, so their expressions need client code
      const dynamicExpressions = result.dynamicElements.map(d => d.expression)

      // Check module-level constants
      const usedModuleConstants = result.moduleConstants.filter(c =>
        isConstantUsedInClientCode(
          c.name,
          result.localFunctions,
          eventHandlers,
          refCallbacks,
          childPropsExpressions,
          memoComputations,
          signalInitializers,
          effectBodies,
          dynamicExpressions
        )
      )

      // Also check local variables used in reactive code (memo/signal/effect)
      // These are normally SSR-only, but if referenced in reactive computations,
      // they must be included in Client JS
      const usedLocalVars = result.localVariables.filter(lv =>
        isConstantUsedInClientCode(
          lv.name,
          result.localFunctions,
          eventHandlers,
          refCallbacks,
          childPropsExpressions,
          memoComputations,
          signalInitializers,
          effectBodies,
          dynamicExpressions
        )
      )

      const constantDeclarations = [
        ...usedModuleConstants.map(c => c.code),
        ...usedLocalVars.map(lv => lv.code)
      ].join('\n')

      // Include all module-level helper functions in client JS
      // Like local variables, module functions should be available in "use client" components
      const moduleFunctionDeclarations = result.moduleFunctions.map(fn => fn.code).join('\n')

      // Get directive status from compile result
      const hasUseClientDirective = result.hasUseClientDirective

      // Calculate hasClientJs early (before ComponentOutput generation)
      // A component needs client JS if it has "use client" directive AND:
      // - Raw client JS code
      // - Signals (reactive state)
      // - User-written createEffect blocks
      // - Child component inits (needs to initialize children)
      const hasClientJs = hasUseClientDirective && (
        result.clientJs.length > 0 ||
        result.signals.length > 0 ||
        result.effects.length > 0 ||
        result.childInits.length > 0
      )

      componentData.push({
        name,
        path: cacheKey,
        fullPath,
        result,
        constantDeclarations,
        moduleFunctionDeclarations,
        signalDeclarations,
        localVariableDeclarations,
        memoDeclarations,
        effectDeclarations,
        childInits: result.childInits,
        hasClientJs,
        hasUseClientDirective,
      })
    }
  }

  return componentData
}

/**
 * Group components by their source file path
 */
export function groupComponentsByFile(
  componentData: ComponentData[]
): Map<string, ComponentData[]> {
  const fileGroups: Map<string, ComponentData[]> = new Map()

  for (const data of componentData) {
    // Use fullPath to group components from the same source file
    const sourceFile = data.fullPath
    if (!fileGroups.has(sourceFile)) {
      fileGroups.set(sourceFile, [])
    }
    fileGroups.get(sourceFile)!.push(data)
  }

  return fileGroups
}

/**
 * Calculate file-level hashes and create component-to-file mappings
 */
export function calculateFileMappings(
  fileGroups: Map<string, ComponentData[]>,
  rootDir: string
): FileMappings {
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
        const { constantDeclarations, signalDeclarations, memoDeclarations, effectDeclarations, result, childInits } = c
        const childInitsStr = childInits.map(ci => `${ci.name}:${ci.propsExpr}`).join(',')
        return constantDeclarations + signalDeclarations + memoDeclarations + effectDeclarations + result.clientJs + childInitsStr
      })
      .join('|')
    const fileHash = generateContentHash(fileContentForHash)
    fileHashes.set(sourceFile, fileHash)

    // Map each component to its file
    for (const comp of fileComponents) {
      componentToFile.set(comp.name, sourceFile)
    }
  }

  return {
    fileHashes,
    componentToFile,
    fileToSourcePath,
  }
}

/**
 * Calculate component-level hashes
 */
export function calculateComponentHashes(
  componentData: ComponentData[]
): Map<string, string> {
  const componentHashes: Map<string, string> = new Map()

  for (const data of componentData) {
    const { name, result, constantDeclarations, signalDeclarations, memoDeclarations, effectDeclarations, childInits } = data
    const bodyCode = result.clientJs
    // Include childInits in hash to invalidate cache when child components change
    const childInitsStr = childInits.map(c => `${c.name}:${c.propsExpr}`).join(',')
    const contentForHash = constantDeclarations + signalDeclarations + memoDeclarations + effectDeclarations + bodyCode + childInitsStr
    const hash = generateContentHash(contentForHash)
    componentHashes.set(name, hash)
  }

  return componentHashes
}
