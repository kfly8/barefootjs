/**
 * Client JS Generator
 *
 * Generates client-side JavaScript for file-based output.
 * Handles imports, init functions, prop handling, and auto-hydration.
 */

import type { ComponentData } from './file-grouping'
import { filterChildrenWithClientJs, joinDeclarations } from './client-js-helpers'
import { replacePropsWithGetterCallsAST } from '../extractors/expression'

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
  const { name, result, signalDeclarations, memoDeclarations, effectDeclarations, childInits } = comp

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
  // Order matters: signals, memos, then user-written effects
  // Effects come last because they may depend on signals and memos
  // Note: localVariables are SSR-only and not included in Client JS
  const declarations = joinDeclarations(signalDeclarations, memoDeclarations, effectDeclarations)

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
  // - Callback props are used directly (with localName support)
  // - Value props get aliases for getter unwrapping (with localName support)
  // - Rest props are captured if restPropsName is set
  const propsParamParts = [
    ...callbackProps.map(p => {
      const localName = p.localName || p.name
      // If prop name differs from local name (e.g., class -> className), use rename syntax
      if (p.localName) {
        return `${p.name}: ${localName}`
      }
      return localName
    }),
    ...valueProps.map(p => {
      const localName = p.localName || p.name
      // Value props use __raw_ prefix for getter unwrapping
      if (p.localName) {
        return `${p.name}: __raw_${localName}`
      }
      return `${p.name}: __raw_${p.name}`
    })
  ]
  // Add rest props if present
  if (result.restPropsName) {
    propsParamParts.push(`...${result.restPropsName}`)
  }
  const propsParam = propsParamParts.length > 0
    ? `{ ${propsParamParts.join(', ')} }`
    : '{}'

  // Generate getter unwrapping code for value props only
  // Use localName when available for proper variable naming
  const propUnwrapCode = valueProps.length > 0
    ? valueProps.map(p => {
        const localName = p.localName || p.name
        return `const ${localName} = typeof __raw_${localName} === 'function' ? __raw_${localName} : () => __raw_${localName}`
      }).join('\n')
    : ''

  // Apply prop getter replacement to both declarations (for signal initial values) and body code
  // Using AST-based transformation for accurate handling of all contexts
  const propNames = valueProps.map(p => p.name)
  const processedDeclarations = replacePropsWithGetterCallsAST(declarations, propNames)
  const allDeclarations = [propUnwrapCode, processedDeclarations].filter(Boolean).join('\n')
  const processedBodyCode = replacePropsWithGetterCallsAST(bodyCode, propNames)

  // Generate rest props handling code
  // When restPropsName is set, attach event listeners and handle reactive props
  const restPropsEventCode = result.restPropsName
    ? `
  // Attach event listeners and reactive props from rest props to root element
  if (${result.restPropsName} && _0) {
    const __booleanProps = ['disabled', 'checked', 'hidden', 'readOnly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'selected', 'open']
    for (const [key, value] of Object.entries(${result.restPropsName})) {
      if (key.startsWith('on') && key.length > 2 && typeof value === 'function') {
        // Event listener
        const eventName = key[2].toLowerCase() + key.slice(3)
        _0.addEventListener(eventName, value)
      } else if (typeof value === 'function') {
        // Reactive prop - create effect to update attribute
        if (__booleanProps.includes(key)) {
          createEffect(() => { _0[key] = !!value() })
        } else {
          createEffect(() => {
            const v = value()
            if (v != null) _0.setAttribute(key, String(v))
            else _0.removeAttribute(key)
          })
        }
      } else {
        // Static prop - just set once (server already rendered this, but ensure consistency)
        if (__booleanProps.includes(key)) {
          _0[key] = !!value
        } else if (value != null) {
          _0.setAttribute(key, String(value))
        }
      }
    }
  }`
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
