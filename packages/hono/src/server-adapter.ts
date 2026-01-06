/**
 * Hono Marked JSX Adapter
 *
 * Generates Marked JSX components compatible with Hono's JSX runtime.
 * Each component outputs its own script tags for self-contained hydration.
 * This enables automatic script inclusion even inside Suspense boundaries.
 */

import type { MarkedJsxAdapter } from './types'

/**
 * Injects conditional data-key prop into the root element of JSX string.
 *
 * Transforms: <div className="foo">
 * Into: <div {...(__dataKey !== undefined ? { "data-key": __dataKey } : {})} className="foo">
 *
 * This enables list item reconciliation when the component is used with key prop.
 * The data-key is only rendered when __dataKey is defined, avoiding "undefined" values.
 *
 * Note: This function requires a single root element (not a Fragment).
 * Components used in lists with key props must return a single element,
 * not a Fragment (<>...</>). If a Fragment is detected, the JSX is returned
 * unchanged and data-key will not be applied.
 */
function injectDataKeyProp(jsx: string): string {
  // Match the first opening tag: <tagName followed by space, /, or >
  // Note: Does not match Fragments (<>) - they return unchanged
  const match = jsx.match(/^<([a-zA-Z][a-zA-Z0-9]*)(\s|\/|>)/)
  if (!match) return jsx

  const tagName = match[1]
  const afterTag = match[2]

  // Insert conditional data-key spread after the tag name
  // Only renders data-key when __dataKey is defined
  return `<${tagName} {...(__dataKey !== undefined ? { "data-key": __dataKey } : {})}${afterTag}${jsx.slice(match[0].length)}`
}

/**
 * Hono Marked JSX adapter for component generation
 */
export const honoMarkedJsxAdapter: MarkedJsxAdapter = {
  // Raw HTML helper for comment nodes (fragment conditional markers)
  rawHtmlHelper: {
    importStatement: "import { raw } from 'hono/html'",
    helperCode: "const __rawHtml = raw",
  },

  /**
   * Generate Marked JSX file code (multiple components in one file)
   */
  generateMarkedJsxFile: ({ sourcePath, components, moduleConstants, originalImports, externalImports }) => {
    // Calculate relative path to manifest.json based on source path depth
    const sourceDir = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : ''
    const dirDepth = sourceDir ? sourceDir.split('/').length : 0
    const manifestPath = dirDepth > 0 ? '../'.repeat(dirDepth) + 'manifest.json' : './manifest.json'

    // Check if any component JSX uses __rawHtml
    const needsRawHtml = components.some(c => c.jsx.includes('__rawHtml('))

    // Generate imports for child components (from other files)
    // Use original import paths to maintain directory structure
    const childImports = originalImports
      .map(imp => {
        if (imp.isDefault) {
          return `import ${imp.name} from '${imp.path}'`
        }
        return `import { ${imp.name} } from '${imp.path}'`
      })
      .join('\n')

    // External package imports (npm packages like 'class-variance-authority', 'clsx')
    const externalImportLines = externalImports
      .map(imp => imp.code)
      .join('\n')

    // Shared imports
    const allImports = [
      `import { useRequestContext } from 'hono/jsx-renderer'`,
      `import manifest from '${manifestPath}'`,
      needsRawHtml ? `import { raw } from 'hono/html'` : '',
      externalImportLines,
      childImports,
    ].filter(Boolean).join('\n')

    // Raw HTML helper for comment nodes
    const rawHtmlHelper = needsRawHtml ? '\nconst __rawHtml = raw\n' : ''

    // Collect all type definitions (deduplicated)
    const allTypeDefs = components.flatMap(c => c.typeDefinitions)
    const uniqueTypeDefs = [...new Set(allTypeDefs)]
    const typeDefs = uniqueTypeDefs.length > 0 ? '\n' + uniqueTypeDefs.join('\n\n') + '\n' : ''

    // Module-level constants (shared)
    const constantDefs = moduleConstants.length > 0
      ? '\n' + moduleConstants.map(c => c.code).join('\n') + '\n'
      : ''

    // Generate each component function
    const componentFunctions = components.map(comp => {
      const { name, props, propsTypeRefName, restPropsName, jsx, isDefaultExport, localVariables } = comp

      // Extract prop names for destructuring (handle renamed props like { class: className })
      const propDestructure = props.map(p => {
        if (p.localName) {
          // Prop is renamed: { class: className }
          return `${p.name}: ${p.localName}`
        }
        return p.name
      })
      // Get local variable names for use in function body
      const propLocalNames = props.map(p => p.localName || p.name)
      const allProps = [...propDestructure, '"data-key": __dataKey', '__listIndex']
      // Add rest spread at the end if present
      if (restPropsName) {
        allProps.push(`...${restPropsName}`)
      }
      const propsParam = `{ ${allProps.join(', ')} }`

      // Hydration props that are always added
      const hydrationProps = `{ "data-key"?: string | number; __listIndex?: number }`

      // Build propsType with actual type annotations
      let propsType: string
      if (propsTypeRefName) {
        // Use intersection: ButtonProps & { "data-key"?: ... }
        propsType = `: ${propsTypeRefName} & ${hydrationProps}`
      } else if (props.length > 0) {
        // Inline type (existing behavior)
        const basePropsType = props.map(p => {
          const optionalMark = p.optional ? '?' : ''
          return `${p.name}${optionalMark}: ${p.type}`
        }).join('; ')
        const restPropsType = restPropsName ? `[key: string]: unknown; ` : ''
        propsType = `: { ${basePropsType}; ${restPropsType}"data-key"?: string | number; __listIndex?: number }`
      } else {
        const restPropsType = restPropsName ? `[key: string]: unknown; ` : ''
        propsType = `: { ${restPropsType}"data-key"?: string | number; __listIndex?: number }`
      }

      // Inject conditional data-key attribute
      const jsxWithDataKey = injectDataKeyProp(jsx)

      // File identifier for script deduplication
      const fileId = `__file_${sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`

      // Context helper with file-level script collection
      const contextHelper = `
  // Collect scripts for deferred rendering (via BfScripts component)
  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['${fileId}']?.clientJs
  let __inSuspense = false
  try {
    const c = useRequestContext()
    const __outputScripts: Set<string> = c.get('bfOutputScripts') || new Set<string>()
    const __collectedScripts: { src: string }[] = c.get('bfCollectedScripts') || []

    if (__barefootSrc && !__outputScripts.has('__barefoot__')) {
      __outputScripts.add('__barefoot__')
      __collectedScripts.push({ src: \`/static/\${__barefootSrc}\` })
    }
    if (__thisSrc && !__outputScripts.has('${fileId}')) {
      __outputScripts.add('${fileId}')
      __collectedScripts.push({ src: \`/static/\${__thisSrc}\` })
    }

    c.set('bfOutputScripts', __outputScripts)
    c.set('bfCollectedScripts', __collectedScripts)
  } catch {
    // Inside Suspense boundary - will output inline scripts
    __inSuspense = true
  }`

      // Fallback inline script tags for Suspense boundaries
      const suspenseFallbackScripts = `{__inSuspense && __barefootSrc && <script type="module" src={\`/static/\${__barefootSrc}\`} />}
      {__inSuspense && __thisSrc && <script type="module" src={\`/static/\${__thisSrc}\`} />}`

      // Local variable declarations (computed from props)
      const localVarDefs = localVariables && localVariables.length > 0
        ? '\n  ' + localVariables.map(v => v.code).join('\n  ')
        : ''

      // Use 'export default function' for default exports, 'export function' for named exports
      const exportKeyword = isDefaultExport ? 'export default function' : 'export function'

      if (props.length > 0 || restPropsName) {
        // Generate hydration serialization: use local variable name for access, prop name for key
        const hydratePropsCode = props.map(p => {
          const localVar = p.localName || p.name
          const propKey = p.name
          return `if (typeof ${localVar} !== 'function' && !(typeof ${localVar} === 'object' && ${localVar} !== null && 'isEscaped' in ${localVar})) __hydrateProps['${propKey}'] = ${localVar}`
        }).join('\n  ')

        return `${exportKeyword} ${name}(${propsParam}${propsType}) {
${contextHelper}${localVarDefs}

  // Serialize props for client hydration
  // Skip functions and JSX elements (they can't be JSON serialized)
  const __hydrateProps: Record<string, unknown> = {}
  ${hydratePropsCode}
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  // Generate unique instance ID for this component instance
  // This enables multiple instances of the same component on a page
  let __instanceId = '${name}'
  let __isRoot = false
  try {
    const c = useRequestContext()
    // Get ID generator from context or use default random ID generator
    const __idGen = c.get('bfInstanceIdGenerator') as ((name: string) => string) | undefined
    __instanceId = __idGen ? __idGen('${name}') : '${name}_' + Math.random().toString(36).slice(2, 8)

    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', '${name}')
    }
    // Collect props script for deferred rendering (for ALL components, not just root)
    if (__hasHydrateProps) {
      const __propsScripts: { name: string; instanceId: string; props: Record<string, unknown> }[] = c.get('bfCollectedPropsScripts') || []
      __propsScripts.push({ name: '${name}', instanceId: __instanceId, props: __hydrateProps })
      c.set('bfCollectedPropsScripts', __propsScripts)
    }
  } catch {
    // Inside Suspense boundary - treat as root, output inline
  }

  return (
    <>
      ${jsxWithDataKey}
      ${suspenseFallbackScripts}
      {__inSuspense && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props={__instanceId}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
    </>
  )
}`
      } else {
        return `${exportKeyword} ${name}({ "data-key": __dataKey, __listIndex }: { "data-key"?: string | number; __listIndex?: number } = {}) {
${contextHelper}${localVarDefs}

  // Generate unique instance ID for this component instance
  let __instanceId = '${name}'
  try {
    const c = useRequestContext()
    const __idGen = c.get('bfInstanceIdGenerator') as ((name: string) => string) | undefined
    __instanceId = __idGen ? __idGen('${name}') : '${name}_' + Math.random().toString(36).slice(2, 8)
  } catch {
    // Inside Suspense boundary - use simple random ID
    __instanceId = '${name}_' + Math.random().toString(36).slice(2, 8)
  }

  return (
    <>
      ${jsxWithDataKey}
      ${suspenseFallbackScripts}
    </>
  )
}`
      }
    }).join('\n\n')

    return `${allImports}
${typeDefs}${constantDefs}${rawHtmlHelper}
${componentFunctions}
`
  }
}
