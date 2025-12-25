/**
 * Hono Server Component Adapter
 *
 * Generates server components compatible with Hono's JSX runtime.
 * Each component outputs its own script tags for self-contained hydration.
 * This enables automatic script inclusion even inside Suspense boundaries.
 */

import type { ServerComponentAdapter } from './types'

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
 * Hono JSX adapter for server component generation
 */
export const honoServerAdapter: ServerComponentAdapter = {
  // Raw HTML helper for comment nodes (fragment conditional markers)
  rawHtmlHelper: {
    importStatement: "import { raw } from 'hono/html'",
    helperCode: "const __rawHtml = raw",
  },

  generateServerComponent: ({ name, props, typeDefinitions, jsx, ir: _ir, signals: _signals, memos: _memos, childComponents }) => {
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
    const childImports = childComponents
      .map(child => `import { ${child} } from './${child}'`)
      .join('\n')

    // Check if JSX uses __rawHtml (for fragment conditional markers)
    const needsRawHtml = jsx.includes('__rawHtml(')

    const allImports = [
      `import { useRequestContext } from 'hono/jsx-renderer'`,
      `import manifest from './manifest.json'`,
      needsRawHtml ? `import { raw } from 'hono/html'` : '',
      childImports,
    ].filter(Boolean).join('\n')

    // Raw HTML helper for comment nodes
    const rawHtmlHelper = needsRawHtml ? '\nconst __rawHtml = raw\n' : ''

    // Include type definitions used by props
    const typeDefs = typeDefinitions.length > 0 ? '\n' + typeDefinitions.join('\n\n') + '\n' : ''

    // Script output logic (self-contained)
    const scriptLogic = `
  // Track which scripts have been output to avoid duplicates
  const __outputScripts = c.get('bfOutputScripts') || new Set<string>()
  const __needsBarefoot = !__outputScripts.has('__barefoot__')
  const __needsThis = !__outputScripts.has('${name}')
  if (__needsBarefoot) __outputScripts.add('__barefoot__')
  if (__needsThis) __outputScripts.add('${name}')
  c.set('bfOutputScripts', __outputScripts)

  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['${name}']?.clientJs`

    const scriptTags = `{__needsBarefoot && __barefootSrc && <script type="module" src={\`/static/\${__barefootSrc}\`} />}
      {__needsThis && __thisSrc && <script type="module" src={\`/static/\${__thisSrc}\`} />}`

    // Script deduplication helper - handles Suspense boundaries gracefully
    const contextHelper = `
  // Try to get request context for script deduplication
  // Falls back to always outputting scripts when inside Suspense boundaries
  let __outputScripts: Set<string> | null = null
  let __needsBarefoot = true
  let __needsThis = true
  try {
    const c = useRequestContext()
    __outputScripts = c.get('bfOutputScripts') || new Set<string>()
    __needsBarefoot = !__outputScripts.has('__barefoot__')
    __needsThis = !__outputScripts.has('${name}')
    if (__needsBarefoot) __outputScripts.add('__barefoot__')
    if (__needsThis) __outputScripts.add('${name}')
    c.set('bfOutputScripts', __outputScripts)
  } catch {
    // Inside Suspense boundary - context unavailable
    // Always output scripts (browser will deduplicate)
  }

  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['${name}']?.clientJs`

    if (props.length > 0) {
      // For components with props, embed serializable props for client hydration
      return `${allImports}
${typeDefs}${rawHtmlHelper}
export function ${name}(${propsParam}${propsType}) {
${contextHelper}

  // Check if this is the root BarefootJS component (first to render)
  // Only root component outputs data-bf-props to avoid duplicate hydration data
  let __isRoot = true
  try {
    const c = useRequestContext()
    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', '${name}')
    }
  } catch {
    // Inside Suspense boundary - treat as root
  }

  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  ${propNames.map(p => `if (typeof ${p} !== 'function') __hydrateProps['${p}'] = ${p}`).join('\n  ')}
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  return (
    <>
      ${scriptTags}
      {__isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="${name}"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
      ${jsxWithDataKey}
    </>
  )
}
`
    } else {
      // Components without props still need data-key and __listIndex support for list items
      return `${allImports}
${typeDefs}${rawHtmlHelper}
export function ${name}({ "data-key": __dataKey, __listIndex }: { "data-key"?: string | number; __listIndex?: number } = {}) {
${contextHelper}

  return (
    <>
      ${scriptTags}
      ${jsxWithDataKey}
    </>
  )
}
`
    }
  }
}
