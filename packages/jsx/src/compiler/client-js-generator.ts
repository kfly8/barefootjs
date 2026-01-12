/**
 * Client JS Generator
 *
 * Generates client-side JavaScript for file-based output.
 * Handles imports, init functions, prop handling, and auto-hydration.
 */

import type { ComponentData } from './file-grouping'
import { filterChildrenWithClientJs, joinDeclarations } from './client-js-helpers'
import { replacePropsWithObjectAccess } from '../extractors/expression'

/**
 * Context for client JS generation
 */
export interface ClientJsContext {
  /** Current file's source path (relative to root) */
  sourcePath: string
  /** Current file's hash */
  fileHash: string
  /** Component to file mapping */
  componentToFile: Map<string, string>
  /** File-level hashes */
  fileHashes: Map<string, string>
  /** File to source path mapping */
  fileToSourcePath: Map<string, string>
  /** All component data (for checking hasClientJs) */
  allComponentData: ComponentData[]
}

/**
 * Generate combined client JS for a file
 */
export function generateFileClientJs(
  fileComponents: ComponentData[],
  ctx: ClientJsContext
): string {
  // Check if any component in this file needs client JS
  const hasClientJs = fileComponents.some(c => c.hasClientJs)
  if (!hasClientJs) {
    return ''
  }

  const allImports: Set<string> = new Set()
  const allInitFunctions: string[] = []
  const componentNames = fileComponents.map(c => c.name)

  // Calculate path to barefoot.js (at dist root)
  const currentDir = ctx.sourcePath.includes('/') ? ctx.sourcePath.substring(0, ctx.sourcePath.lastIndexOf('/')) : ''
  const dirDepth = currentDir ? currentDir.split('/').length : 0
  const barefootPath = dirDepth > 0 ? '../'.repeat(dirDepth) + 'barefoot.js' : './barefoot.js'

  // Collect all barefoot imports needed
  const barefootImports = collectBarefootImports(fileComponents)

  if (barefootImports.size > 0) {
    allImports.add(`import { ${Array.from(barefootImports).join(', ')} } from '${barefootPath}'`)
  }

  // Collect child component imports (from other files only)
  const childImports = generateChildImports(fileComponents, currentDir, componentNames, ctx)
  for (const imp of childImports) {
    allImports.add(imp)
  }

  // Collect and deduplicate module-level helper functions across all components in this file
  const allModuleFunctions: Set<string> = new Set()
  for (const comp of fileComponents) {
    if (!comp.hasClientJs) continue
    if (comp.moduleFunctionDeclarations) {
      // Split by function declarations to deduplicate (same function may be used by multiple components)
      const functions = comp.moduleFunctionDeclarations.split(/(?=function\s+\w+|const\s+\w+\s*=)/).filter((f: string) => f.trim())
      for (const fn of functions) {
        allModuleFunctions.add(fn.trim())
      }
    }
  }
  // Check if any module functions contain jsx() calls (from JSX transformation)
  const needsJsxImport = Array.from(allModuleFunctions).some(fn =>
    fn.includes('jsx(') || fn.includes('jsxs(') || fn.includes('Fragment')
  )
  if (needsJsxImport) {
    allImports.add(`import { jsx, jsxs, Fragment } from 'hono/jsx/dom'`)
  }

  const moduleFunctionsCode = allModuleFunctions.size > 0
    ? '\n' + Array.from(allModuleFunctions).join('\n') + '\n'
    : ''

  // Generate init functions for each component
  // Note: Module-level constants are included via declarations in init functions
  // only if they are used in reactive code (signals, effects, event handlers)
  for (const comp of fileComponents) {
    if (!comp.hasClientJs) continue

    const initFn = generateInitFunction(comp, componentNames, ctx)
    allInitFunctions.push(initFn)
  }

  // Auto-hydration code for root components
  const autoHydrateCodes = generateAutoHydrationCode(fileComponents)

  return `${Array.from(allImports).join('\n')}
${moduleFunctionsCode}
${allInitFunctions.join('\n\n')}
${autoHydrateCodes}
`
}

/**
 * Collect barefoot imports needed by file components
 */
function collectBarefootImports(fileComponents: ComponentData[]): Set<string> {
  const barefootImports: Set<string> = new Set()

  for (const comp of fileComponents) {
    if (!comp.hasClientJs) continue

    // Check what imports this component needs
    if (comp.result.clientJs || comp.result.signals.length > 0 || comp.constantDeclarations.includes('createSignal')) {
      barefootImports.add('createSignal')
      barefootImports.add('createEffect')
    }
    // User-written createEffect blocks also need createEffect import
    if (comp.result.effects.length > 0) {
      barefootImports.add('createEffect')
    }
    if (comp.result.memos.length > 0) {
      barefootImports.add('createMemo')
    }
    // reconcileList is needed for key-based list rendering
    if (comp.result.listElements.length > 0) {
      barefootImports.add('reconcileList')
    }

    // Runtime helpers

    // findScope is needed when component has elements (scope search)
    // Check if clientJs contains scope search patterns
    if (comp.result.clientJs?.includes('__scope')) {
      barefootImports.add('findScope')
    }

    // find is needed when scoped finder is required (elements with null paths)
    if (comp.result.clientJs?.includes('find(__scope')) {
      barefootImports.add('find')
    }

    // bind is needed when rest props are present
    if (comp.result.restPropsName) {
      barefootImports.add('bind')
    }

    // cond is needed for conditional elements
    if (comp.result.conditionalElements.length > 0) {
      barefootImports.add('cond')
    }

    // unwrap is needed when component has value props (non-callback props)
    // Value props may be passed as getter functions from parent components
    const isCallbackProp = (propName: string) => /^on[A-Z]/.test(propName)
    const hasValueProps = comp.result.props.some(p => !isCallbackProp(p.name))
    if (hasValueProps) {
      barefootImports.add('unwrap')
    }
  }

  // hydrate is needed if any root component has props or child inits
  const hasRootComponents = fileComponents.some(c =>
    c.hasClientJs && (c.result.props.length > 0 || c.childInits.length > 0)
  )
  if (hasRootComponents) {
    barefootImports.add('hydrate')
  }

  return barefootImports
}

/**
 * Generate child component imports from other files
 */
function generateChildImports(
  fileComponents: ComponentData[],
  currentDir: string,
  componentNames: string[],
  ctx: ClientJsContext
): Set<string> {
  const imports: Set<string> = new Set()

  for (const comp of fileComponents) {
    if (!comp.hasClientJs) continue

    const uniqueChildNames = [...new Set(comp.childInits.map(child => child.name))]
    const childrenWithClientJs = filterChildrenWithClientJs(uniqueChildNames, ctx.allComponentData, componentNames)

    for (const childName of childrenWithClientJs) {
      // Find which file contains this child component
      const childFile = ctx.componentToFile.get(childName)
      if (!childFile) continue

      const childSourcePath = ctx.fileToSourcePath.get(childFile) || ''
      const childFileHash = ctx.fileHashes.get(childFile) || ''
      const childDir = childSourcePath.includes('/') ? childSourcePath.substring(0, childSourcePath.lastIndexOf('/')) : ''
      const childBaseFileName = childSourcePath.split('/').pop()!.replace('.tsx', '')
      const childFilename = childFileHash ? `${childBaseFileName}-${childFileHash}.js` : `${childBaseFileName}.js`

      // Calculate relative path
      const relativePath = calculateRelativePath(currentDir, childDir, childFilename)

      imports.add(`import { init${childName} } from '${relativePath}'`)
    }
  }

  return imports
}

/**
 * Calculate relative path between directories
 */
function calculateRelativePath(currentDir: string, targetDir: string, filename: string): string {
  if (currentDir === targetDir) {
    return `./${filename}`
  }

  const currentParts = currentDir ? currentDir.split('/') : []
  const targetParts = targetDir ? targetDir.split('/') : []

  let commonLength = 0
  while (commonLength < currentParts.length &&
         commonLength < targetParts.length &&
         currentParts[commonLength] === targetParts[commonLength]) {
    commonLength++
  }

  const upCount = currentParts.length - commonLength
  const downPath = targetParts.slice(commonLength).join('/')
  const upPath = '../'.repeat(upCount)

  return upPath + (downPath ? downPath + '/' : '') + filename
}

/**
 * Generate init function for a component
 */
function generateInitFunction(
  comp: ComponentData,
  sameFileComponentNames: string[],
  ctx: ClientJsContext
): string {
  const { name, result, constantDeclarations, signalDeclarations, memoDeclarations, effectDeclarations, childInits } = comp

  // Generate child init calls (including same-file children)
  const uniqueChildNames = [...new Set(childInits.map(child => child.name))]
  const childrenWithClientJs = filterChildrenWithClientJs(uniqueChildNames, ctx.allComponentData)

  // Always use index 0 for child init calls because:
  // 1. Each init function filters out already-initialized scopes
  // 2. The first uninitialized scope is always at index 0 after filtering
  // 3. Components are initialized in DOM order, so the first uninitialized
  //    scope matches the component we want to initialize
  const childInitCalls = childInits
    .filter(child => childrenWithClientJs.includes(child.name))
    .map(child => {
      return `  init${child.name}(${child.propsExpr}, 0, __scope)`
    })
    .join('\n')

  const bodyCode = [
    result.clientJs,
    childInitCalls ? `\n  // Initialize child components\n${childInitCalls}` : '',
  ].filter(Boolean).join('\n')

  const needsInitFunction = result.props.length > 0 || result.restPropsName || childInits.length > 0
  // Order matters: constants, signals, memos, then user-written effects
  // Effects come last because they may depend on signals and memos
  // Note: localVariables are SSR-only and not included in Client JS (only module constants are included)
  const declarations = joinDeclarations(constantDeclarations, signalDeclarations, memoDeclarations, effectDeclarations)

  if (needsInitFunction) {
    return generateInitFunctionWithProps(name, result, declarations, bodyCode)
  } else {
    return generateModuleLevelCode(name, result, declarations, bodyCode)
  }
}


/**
 * Generate init function with prop handling
 *
 * Uses SolidJS-style props access pattern where props are received as an object
 * and accessed via props.propName. This allows lazy evaluation and proper reactivity
 * when props are passed as getters from parent components.
 */
function generateInitFunctionWithProps(
  name: string,
  result: ComponentData['result'],
  declarations: string,
  bodyCode: string
): string {
  // Separate callback props (on*) from value props
  const isCallbackProp = (propName: string) => /^on[A-Z]/.test(propName)
  const callbackProps = result.props.filter(p => isCallbackProp(p.name))
  const valueProps = result.props.filter(p => !isCallbackProp(p.name))

  // Build props parameter based on what we need
  // If we have rest props, we need to destructure callback props from __props
  // Otherwise, we can use the simple __props pattern
  const hasCallbackProps = callbackProps.length > 0
  const hasValueProps = valueProps.length > 0
  const hasRestProps = !!result.restPropsName

  let propsParam: string
  let callbackDestructure = ''

  if (hasRestProps) {
    // With rest props, we need to destructure callbacks and rest from __props
    const callbackDestructureParts = callbackProps.map(p => {
      const localName = p.localName || p.name
      if (p.localName) {
        return `${p.name}: ${localName}`
      }
      return localName
    })
    propsParam = '__props'
    if (callbackDestructureParts.length > 0 || hasRestProps) {
      callbackDestructure = `const { ${[...callbackDestructureParts, `...${result.restPropsName}`].join(', ')} } = __props`
    }
  } else if (hasCallbackProps && !hasValueProps) {
    // Only callback props - can destructure directly
    const callbackParts = callbackProps.map(p => {
      const localName = p.localName || p.name
      if (p.localName) {
        return `${p.name}: ${localName}`
      }
      return localName
    })
    propsParam = `{ ${callbackParts.join(', ')} }`
  } else {
    // Has value props or mixed - use __props and access via __props.propName
    propsParam = '__props'
    if (hasCallbackProps) {
      const callbackParts = callbackProps.map(p => {
        const localName = p.localName || p.name
        if (p.localName) {
          return `${p.name}: ${localName}`
        }
        return localName
      })
      callbackDestructure = `const { ${callbackParts.join(', ')} } = __props`
    }
  }

  // No getter unwrapping needed - props are accessed directly via __props.propName
  // This is the SolidJS pattern where reactivity comes from getter access

  // Apply prop replacement to convert propName -> __props.propName
  const propNames = valueProps.map(p => p.localName || p.name)
  const processedDeclarations = replacePropsWithObjectAccess(declarations, propNames, '__props')
  const allDeclarations = [callbackDestructure, processedDeclarations].filter(Boolean).join('\n')
  const processedBodyCode = replacePropsWithObjectAccess(bodyCode, propNames, '__props')

  // Generate rest props handling code using bind() helper
  // When restPropsName is set, attach event listeners and handle reactive props
  const restPropsEventCode = result.restPropsName
    ? `\n  bind(_0, ${result.restPropsName})`
    : ''

  return `export function init${name}(${propsParam}, __instanceIndex = 0, __parentScope = null) {
${allDeclarations ? allDeclarations.split('\n').map(l => '  ' + l).join('\n') + '\n' : ''}${processedBodyCode.split('\n').map(l => '  ' + l).join('\n')}${restPropsEventCode}
}`
}

/**
 * Generate module-level code (no init function needed)
 */
function generateModuleLevelCode(
  name: string,
  result: ComponentData['result'],
  declarations: string,
  bodyCode: string
): string {
  // Module-level code that contains `return` statements needs to be wrapped in an IIFE
  // because `return` is invalid at module top-level in ES modules
  const hasReturnStatement = bodyCode.includes('return')

  if (hasReturnStatement) {
    return `// ${name} (wrapped in IIFE for return statement)
;(function() {
const __instanceIndex = 0
const __parentScope = null
${declarations}

${bodyCode}
})()`
  } else {
    const instanceVarsLine = result.clientJs ? 'const __instanceIndex = 0\nconst __parentScope = null\n' : ''
    return `// ${name} (no init function needed)
${instanceVarsLine}${declarations}

${bodyCode}`
  }
}

/**
 * Generate auto-hydration code for root components
 * Uses hydrate() helper to find and initialize all instances
 */
function generateAutoHydrationCode(fileComponents: ComponentData[]): string {
  const rootComponents = fileComponents.filter(c => {
    return c.hasClientJs && (c.result.props.length > 0 || c.childInits.length > 0)
  })

  return rootComponents.map(c => `
hydrate('${c.name}', init${c.name})`).join('\n')
}
