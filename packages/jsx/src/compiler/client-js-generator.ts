/**
 * Client JS Generator
 *
 * Generates client-side JavaScript for file-based output.
 * Handles imports, init functions, prop handling, and auto-hydration.
 */

import type { ComponentData } from './file-grouping'
import { filterChildrenWithClientJs, joinDeclarations } from './client-js-helpers'

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

  // Generate init functions for each component
  for (const comp of fileComponents) {
    if (!comp.hasClientJs) continue

    const initFn = generateInitFunction(comp, componentNames, ctx)
    allInitFunctions.push(initFn)
  }

  // Auto-hydration code for root components
  const autoHydrateCodes = generateAutoHydrationCode(fileComponents)

  return `${Array.from(allImports).join('\n')}

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
  const { name, result, constantDeclarations, signalDeclarations, localVariableDeclarations, memoDeclarations, effectDeclarations, childInits } = comp

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

  const needsInitFunction = result.props.length > 0 || childInits.length > 0
  // Order matters: constants, signals, local variables, memos, then user-written effects
  // Local variables must come before memos because memos may use them
  // Effects come last because they may depend on signals and memos
  const declarations = joinDeclarations(constantDeclarations, signalDeclarations, localVariableDeclarations, memoDeclarations, effectDeclarations)

  if (needsInitFunction) {
    return generateInitFunctionWithProps(name, result, declarations, bodyCode)
  } else {
    return generateModuleLevelCode(name, result, declarations, bodyCode)
  }
}

/**
 * Generate init function with prop handling
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

  // Destructure props:
  // - Callback props are used directly
  // - Value props get aliases for getter unwrapping
  const propsParamParts = [
    ...callbackProps.map(p => p.name),
    ...valueProps.map(p => `${p.name}: __raw_${p.name}`)
  ]
  const propsParam = propsParamParts.length > 0
    ? `{ ${propsParamParts.join(', ')} }`
    : '{}'

  // Generate getter unwrapping code for value props only
  const propUnwrapCode = valueProps.length > 0
    ? valueProps.map(p =>
        `const ${p.name} = typeof __raw_${p.name} === 'function' ? __raw_${p.name} : () => __raw_${p.name}`
      ).join('\n')
    : ''

  // Apply prop getter replacement to both declarations (for signal initial values) and body code
  const processedDeclarations = replacePropsWithGetterCalls(declarations, valueProps)
  const allDeclarations = [propUnwrapCode, processedDeclarations].filter(Boolean).join('\n')
  const processedBodyCode = replacePropsWithGetterCalls(bodyCode, valueProps)

  return `export function init${name}(${propsParam}, __instanceIndex = 0, __parentScope = null) {
${allDeclarations ? allDeclarations.split('\n').map(l => '  ' + l).join('\n') + '\n' : ''}${processedBodyCode.split('\n').map(l => '  ' + l).join('\n')}
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
 * Replace value prop usages with getter calls
 */
function replacePropsWithGetterCalls(
  code: string,
  valueProps: ComponentData['result']['props']
): string {
  let result = code
  for (const prop of valueProps) {
    // Replace standalone prop usage with getter call
    // Match: propName not followed by ( or : and not preceded by:
    // - . (object property access)
    // - __raw_ (our raw prop prefix)
    // - - (hyphen, part of HTML attribute like aria-checked)
    // Also skip if inside simple quotes (single/double quote string literals)
    // Note: We preserve template literals for replacement since ${...} contains JS expressions
    // Note: We exclude : suffix to preserve CSS pseudo-classes like disabled:cursor-not-allowed
    result = result.replace(
      new RegExp(`(["'](?:[^"'\\\\]|\\\\.)*["'])|((?<![-.]|__raw_)\\b${prop.name}\\b(?!\\s*[:(]))`, 'g'),
      (match, stringLiteral, identifier) => {
        // If it's a string literal, keep it unchanged
        if (stringLiteral) return stringLiteral
        // If it's the identifier, replace with getter call
        if (identifier) return `${prop.name}()`
        return match
      }
    )
  }
  return result
}

/**
 * Generate auto-hydration code for root components
 * Supports multiple instances of the same component using unique instance IDs
 */
function generateAutoHydrationCode(fileComponents: ComponentData[]): string {
  const rootComponents = fileComponents.filter(c => {
    return c.hasClientJs && (c.result.props.length > 0 || c.childInits.length > 0)
  })

  return rootComponents.map(c => `
// Auto-hydration: initialize all ${c.name} instances (root components only)
// Uses prefix matching to find all instances with unique IDs (e.g., ${c.name}_abc123)
const __scopeEls_${c.name} = document.querySelectorAll('[data-bf-scope^="${c.name}_"]')
for (const __scopeEl of __scopeEls_${c.name}) {
  // Skip nested instances (inside another component's scope)
  if (__scopeEl.parentElement?.closest('[data-bf-scope]')) continue
  // Get unique instance ID from scope element
  const __instanceId = __scopeEl.dataset.bfScope
  // Find corresponding props script by instance ID
  const __propsEl = document.querySelector(\`script[data-bf-props="\${__instanceId}"]\`)
  const __props = __propsEl ? JSON.parse(__propsEl.textContent || '{}') : {}
  init${c.name}(__props, 0, __scopeEl)
}`).join('\n')
}
