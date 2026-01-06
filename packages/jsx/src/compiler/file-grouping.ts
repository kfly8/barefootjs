/**
 * File Grouping
 *
 * Groups compiled components by their source file and calculates
 * file-level hashes and component-to-file mappings.
 */

import type { CompileResult, ChildComponentInit, CvaPatternInfo, LocalVariable } from '../types'
import { generateContentHash } from './utils'
import { isConstantUsedInClientCode } from '../extractors/constants'

/**
 * Generates CVA lookup map constant code from a pattern.
 *
 * @example
 * Input: { name: 'buttonVariants', baseClass: 'flex', variantDefs: {...}, defaultVariants: {...} }
 * Output: `const __cva_buttonVariants = { base: 'flex', variants: {...}, defaults: {...} }`
 */
function generateCvaLookupMap(pattern: CvaPatternInfo): string {
  const variantsObj = JSON.stringify(pattern.variantDefs, null, 2)
    .split('\n')
    .map((line, i) => i === 0 ? line : '  ' + line)
    .join('\n')
  const defaultsObj = JSON.stringify(pattern.defaultVariants)

  return `const __cva_${pattern.name} = {
  base: ${JSON.stringify(pattern.baseClass)},
  variants: ${variantsObj},
  defaults: ${defaultsObj}
}`
}

/**
 * Checks if a local variable uses a cva pattern and transforms it to a getter function.
 *
 * @example
 * Input: { name: 'buttonClass', code: 'const buttonClass = cn(buttonVariants({ variant, size, className }))' }
 * Output: { transformed: true, code: 'const buttonClass = () => { ... lookup code ... }' }
 */
function transformCvaLocalVariable(
  lv: LocalVariable,
  cvaPatterns: CvaPatternInfo[]
): { transformed: boolean; code: string; cvaName?: string } {
  // Check if the code uses any cva pattern
  for (const pattern of cvaPatterns) {
    // Match patterns like: cn(buttonVariants({...})) or buttonVariants({...})
    const cvaCallPattern = new RegExp(`\\b${pattern.name}\\s*\\(`)
    if (cvaCallPattern.test(lv.code)) {
      // Extract variant keys from the cva pattern
      const variantKeys = Object.keys(pattern.variantDefs)

      // Generate lookup getter function
      const lookupCode = variantKeys.map(key => {
        return `const __${key} = ${key}() ?? __cva_${pattern.name}.defaults.${key}`
      }).join('\n  ')

      const variantLookups = variantKeys.map(key => {
        return `__cva_${pattern.name}.variants.${key}[__${key}]`
      }).join(' + " " + ')

      // Handle className prop (usually the last arg to cn())
      // Check if className is in the pattern call
      const hasClassName = /className/.test(lv.code)
      const classNamePart = hasClassName ? ' + " " + (className() || "")' : ''

      const getterCode = `const ${lv.name} = () => {
  ${lookupCode}
  return (__cva_${pattern.name}.base + " " + ${variantLookups}${classNamePart}).trim()
}`

      return { transformed: true, code: getterCode, cvaName: pattern.name }
    }
  }

  return { transformed: false, code: lv.code }
}

/**
 * Transforms a CVA pattern call in an expression into lookup code.
 * Used for dynamic attributes like class={buttonVariants({ variant, size, className })}
 *
 * @example
 * Input: 'buttonVariants({ variant, size, className })'
 * Output: '(() => { const __variant = variant() ?? ...; return (__cva_buttonVariants.base + ...).trim() })()'
 */
export function transformCvaInExpression(
  expression: string,
  cvaPatterns: CvaPatternInfo[]
): { transformed: boolean; expression: string; cvaName?: string } {
  for (const pattern of cvaPatterns) {
    const cvaCallPattern = new RegExp(`\\b${pattern.name}\\s*\\(`)
    if (cvaCallPattern.test(expression)) {
      const variantKeys = Object.keys(pattern.variantDefs)

      const lookupCode = variantKeys.map(key => {
        return `const __${key} = ${key}() ?? __cva_${pattern.name}.defaults.${key}`
      }).join('; ')

      const variantLookups = variantKeys.map(key => {
        return `__cva_${pattern.name}.variants.${key}[__${key}]`
      }).join(' + " " + ')

      const hasClassName = /className/.test(expression)
      const classNamePart = hasClassName ? ' + " " + (className() || "")' : ''

      // IIFE for immediate execution
      const transformedExpr = `(() => { ${lookupCode}; return (__cva_${pattern.name}.base + " " + ${variantLookups}${classNamePart}).trim() })()`

      return { transformed: true, expression: transformedExpr, cvaName: pattern.name }
    }
  }
  return { transformed: false, expression }
}

/**
 * Component data with pre-calculated declarations
 */
export interface ComponentData {
  name: string
  path: string
  fullPath: string
  result: CompileResult
  constantDeclarations: string
  cvaLookupDeclarations: string    // CVA lookup map constants
  signalDeclarations: string
  localVariableDeclarations: string
  memoDeclarations: string
  effectDeclarations: string
  childInits: ChildComponentInit[]
  hasClientJs: boolean
  hasUseClientDirective: boolean
  cvaGetterNames: string[]          // Local variable names that are CVA getters (need () call)
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

      // Transform local variables that use CVA patterns to getter functions
      const cvaGetterNames: string[] = []
      const usedCvaPatterns: CvaPatternInfo[] = []
      const transformedLocalVars = result.localVariables.map(lv => {
        const transformed = transformCvaLocalVariable(lv, result.cvaPatterns)
        if (transformed.transformed && transformed.cvaName) {
          cvaGetterNames.push(lv.name)
          // Track which CVA patterns are used
          const pattern = result.cvaPatterns.find(p => p.name === transformed.cvaName)
          if (pattern && !usedCvaPatterns.includes(pattern)) {
            usedCvaPatterns.push(pattern)
          }
        }
        return transformed.code
      })
      const localVariableDeclarations = transformedLocalVars.join('\n')

      // Also check dynamic attributes for CVA pattern calls
      for (const da of result.dynamicAttributes) {
        for (const pattern of result.cvaPatterns) {
          const cvaCallPattern = new RegExp(`\\b${pattern.name}\\s*\\(`)
          if (cvaCallPattern.test(da.expression)) {
            if (!usedCvaPatterns.includes(pattern)) {
              usedCvaPatterns.push(pattern)
            }
          }
        }
      }

      // Generate CVA lookup map constants for used patterns
      const cvaLookupDeclarations = usedCvaPatterns.map(p => generateCvaLookupMap(p)).join('\n')

      // Filter constants to only those used in client code
      // Exclude CVA pattern constants (they're replaced with lookup maps)
      const cvaPatternNames = new Set(result.cvaPatterns.map(p => p.name))
      const eventHandlers = result.interactiveElements.flatMap(e => e.events.map(ev => ev.handler))
      const refCallbacks = result.refElements.map(r => r.callback)
      const childPropsExpressions = result.childInits.map(c => c.propsExpr)
      const usedConstants = result.moduleConstants.filter(c =>
        !cvaPatternNames.has(c.name) &&  // Exclude CVA patterns
        isConstantUsedInClientCode(c.name, result.localFunctions, eventHandlers, refCallbacks, childPropsExpressions)
      )
      const constantDeclarations = usedConstants.map(c => c.code).join('\n')

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
        cvaLookupDeclarations,
        signalDeclarations,
        localVariableDeclarations,
        memoDeclarations,
        effectDeclarations,
        childInits: result.childInits,
        hasClientJs,
        hasUseClientDirective,
        cvaGetterNames,
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
