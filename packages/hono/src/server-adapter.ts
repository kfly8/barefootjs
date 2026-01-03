/**
 * Hono Marked JSX Adapter
 *
 * Generates Marked JSX components compatible with Hono's JSX runtime.
 * Each component outputs its own script tags for self-contained hydration.
 * This enables automatic script inclusion even inside Suspense boundaries.
 */

import type { MarkedJsxAdapter, MarkedJsxComponentData } from './types'
import type { CollectedScript, CollectedPropsScript } from './scripts'

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

  generateMarkedJsxComponent: ({ name, props, typeDefinitions, jsx, ir: _ir, signals: _signals, memos: _memos, childComponents, moduleConstants, originalImports, sourcePath, isDefaultExport }) => {
    // Calculate relative path to manifest.json based on source path depth
    // e.g., 'pages/ButtonPage.tsx' -> '../manifest.json'
    // e.g., 'Button.tsx' -> './manifest.json'
    const sourceDir = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : ''
    const dirDepth = sourceDir ? sourceDir.split('/').length : 0
    const manifestPath = dirDepth > 0 ? '../'.repeat(dirDepth) + 'manifest.json' : './manifest.json'
    // Extract prop names for destructuring
    const propNames = props.map(p => p.name)
    // Always include "data-key" for list item reconciliation support
    // Also include "__listIndex" for event delegation in lists
    const allProps = [...propNames, '"data-key": __dataKey', '__listIndex']
    const propsParam = `{ ${allProps.join(', ')} }`
    // Build propsType with actual type annotations from source
    const basePropsType = props.map(p => {
      const optionalMark = p.optional ? '?' : ''
      return `${p.name}${optionalMark}: ${p.type}`
    }).join('; ')
    const propsType = `: { ${basePropsType}${basePropsType ? '; ' : ''}"data-key"?: string | number; __listIndex?: number }`

    // Inject conditional data-key attribute into root element
    // Only renders when __dataKey is defined (component used in a list with key)
    const jsxWithDataKey = injectDataKeyProp(jsx)

    // Generate imports for child components
    // Use original import paths to maintain directory structure
    const importedNames = new Set(originalImports.map(imp => imp.name))
    const externalImports = originalImports
      .map(imp => {
        if (imp.isDefault) {
          return `import ${imp.name} from '${imp.path}'`
        }
        return `import { ${imp.name} } from '${imp.path}'`
      })
    // Local components (defined in same file, not in originalImports) need ./ComponentName imports
    // Use named imports since local components are not default exports
    const localComponentImports = childComponents
      .filter(name => !importedNames.has(name))
      .map(name => `import { ${name} } from './${name}'`)
    const childImports = [...externalImports, ...localComponentImports].join('\n')

    // Check if JSX uses __rawHtml (for fragment conditional markers)
    const needsRawHtml = jsx.includes('__rawHtml(')

    const allImports = [
      `import { useRequestContext } from 'hono/jsx-renderer'`,
      `import manifest from '${manifestPath}'`,
      needsRawHtml ? `import { raw } from 'hono/html'` : '',
      childImports,
    ].filter(Boolean).join('\n')

    // Raw HTML helper for comment nodes
    const rawHtmlHelper = needsRawHtml ? '\nconst __rawHtml = raw\n' : ''

    // Include type definitions used by props
    const typeDefs = typeDefinitions.length > 0 ? '\n' + typeDefinitions.join('\n\n') + '\n' : ''

    // Include module-level constants
    const constantDefs = moduleConstants.length > 0
      ? '\n' + moduleConstants.map(c => c.code).join('\n') + '\n'
      : ''

    // Script collection helper - collects scripts for deferred rendering at body end
    // This avoids DOM traversal issues caused by inline script tags between siblings
    const contextHelper = `
  // Collect scripts for deferred rendering (via BfScripts component)
  // Falls back to inline output inside Suspense boundaries
  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['${name}']?.clientJs
  let __inSuspense = false
  try {
    const c = useRequestContext()
    const __outputScripts: Set<string> = c.get('bfOutputScripts') || new Set<string>()
    const __collectedScripts: { src: string }[] = c.get('bfCollectedScripts') || []

    if (__barefootSrc && !__outputScripts.has('__barefoot__')) {
      __outputScripts.add('__barefoot__')
      __collectedScripts.push({ src: \`/static/\${__barefootSrc}\` })
    }
    if (__thisSrc && !__outputScripts.has('${name}')) {
      __outputScripts.add('${name}')
      __collectedScripts.push({ src: \`/static/\${__thisSrc}\` })
    }

    c.set('bfOutputScripts', __outputScripts)
    c.set('bfCollectedScripts', __collectedScripts)
  } catch {
    // Inside Suspense boundary - context unavailable
    // Will output inline scripts as fallback
    __inSuspense = true
  }`

    // Fallback inline script tags for Suspense boundaries
    const suspenseFallbackScripts = `{__inSuspense && __barefootSrc && <script type="module" src={\`/static/\${__barefootSrc}\`} />}
      {__inSuspense && __thisSrc && <script type="module" src={\`/static/\${__thisSrc}\`} />}`

    // Use 'export default function' for default exports, 'export function' for named exports
    const exportKeyword = isDefaultExport ? 'export default function' : 'export function'

    if (props.length > 0) {
      // For components with props, embed serializable props for client hydration
      return `${allImports}
${typeDefs}${constantDefs}${rawHtmlHelper}
${exportKeyword} ${name}(${propsParam}${propsType}) {
${contextHelper}

  // Check if this is the root BarefootJS component (first to render)
  // Only root component outputs data-bf-props to avoid duplicate hydration data
  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  ${propNames.map(p => `if (typeof ${p} !== 'function') __hydrateProps['${p}'] = ${p}`).join('\n  ')}
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  let __isRoot = false
  try {
    const c = useRequestContext()
    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', '${name}')
      // Collect props script for deferred rendering
      if (__hasHydrateProps) {
        const __propsScripts: { name: string; props: Record<string, unknown> }[] = c.get('bfCollectedPropsScripts') || []
        __propsScripts.push({ name: '${name}', props: __hydrateProps })
        c.set('bfCollectedPropsScripts', __propsScripts)
      }
    }
  } catch {
    // Inside Suspense boundary - treat as root, output inline
  }

  return (
    <>
      ${jsxWithDataKey}
      ${suspenseFallbackScripts}
      {__inSuspense && __isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="${name}"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
    </>
  )
}
`
    } else {
      // Components without props still need data-key and __listIndex support for list items
      return `${allImports}
${typeDefs}${constantDefs}${rawHtmlHelper}
${exportKeyword} ${name}({ "data-key": __dataKey, __listIndex }: { "data-key"?: string | number; __listIndex?: number } = {}) {
${contextHelper}

  return (
    <>
      ${jsxWithDataKey}
      ${suspenseFallbackScripts}
    </>
  )
}
`
    }
  },

  /**
   * Generate Marked JSX file code (multiple components in one file)
   */
  generateMarkedJsxFile: ({ sourcePath, components, moduleConstants, originalImports }) => {
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

    // Shared imports
    const allImports = [
      `import { useRequestContext } from 'hono/jsx-renderer'`,
      `import manifest from '${manifestPath}'`,
      needsRawHtml ? `import { raw } from 'hono/html'` : '',
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
      const { name, props, jsx, isDefaultExport, localVariables } = comp

      // Extract prop names for destructuring
      const propNames = props.map(p => p.name)
      const allProps = [...propNames, '"data-key": __dataKey', '__listIndex']
      const propsParam = `{ ${allProps.join(', ')} }`

      // Build propsType with actual type annotations
      const basePropsType = props.map(p => {
        const optionalMark = p.optional ? '?' : ''
        return `${p.name}${optionalMark}: ${p.type}`
      }).join('; ')
      const propsType = `: { ${basePropsType}${basePropsType ? '; ' : ''}"data-key"?: string | number; __listIndex?: number }`

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

      if (props.length > 0) {
        return `${exportKeyword} ${name}(${propsParam}${propsType}) {
${contextHelper}${localVarDefs}

  // Serialize props for client hydration
  const __hydrateProps: Record<string, unknown> = {}
  ${propNames.map(p => `if (typeof ${p} !== 'function') __hydrateProps['${p}'] = ${p}`).join('\n  ')}
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  // Check if this is the root BarefootJS component
  let __isRoot = false
  try {
    const c = useRequestContext()
    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', '${name}')
      // Collect props script for deferred rendering
      if (__hasHydrateProps) {
        const __propsScripts: { name: string; props: Record<string, unknown> }[] = c.get('bfCollectedPropsScripts') || []
        __propsScripts.push({ name: '${name}', props: __hydrateProps })
        c.set('bfCollectedPropsScripts', __propsScripts)
      }
    }
  } catch {
    // Inside Suspense boundary - treat as root, output inline
  }

  return (
    <>
      ${jsxWithDataKey}
      ${suspenseFallbackScripts}
      {__inSuspense && __isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="${name}"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
    </>
  )
}`
      } else {
        return `${exportKeyword} ${name}({ "data-key": __dataKey, __listIndex }: { "data-key"?: string | number; __listIndex?: number } = {}) {
${contextHelper}${localVarDefs}

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
