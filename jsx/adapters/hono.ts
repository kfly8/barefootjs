/**
 * Hono Server Component Adapter
 *
 * Generates server components compatible with Hono's JSX runtime.
 * Each component outputs its own script tags for self-contained hydration.
 * This enables automatic script inclusion even inside Suspense boundaries.
 */

import type { ServerComponentAdapter } from '../types'

/**
 * Hono JSX adapter for server component generation
 */
export const honoServerAdapter: ServerComponentAdapter = {
  generateServerComponent: ({ name, props, jsx, ir: _ir, signals: _signals, childComponents }) => {
    const propsParam = props.length > 0 ? `{ ${props.join(', ')} }` : ''
    const propsType = props.length > 0
      ? `: { ${props.map(p => `${p}?: unknown`).join('; ')} }`
      : ''

    // Generate imports for child components
    const childImports = childComponents
      .map(child => `import { ${child} } from './${child}'`)
      .join('\n')

    const allImports = [
      `import { useRequestContext } from 'hono/jsx-renderer'`,
      `import manifest from './manifest.json'`,
      childImports,
    ].filter(Boolean).join('\n')

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

    if (props.length > 0) {
      // For components with props, embed serializable props for client hydration
      return `${allImports}

export function ${name}(${propsParam}${propsType}) {
  const c = useRequestContext()
${scriptLogic}

  // Check if this is the root BarefootJS component (first to render)
  // Only root component outputs data-bf-props to avoid duplicate hydration data
  const __isRoot = !c.get('bfRootComponent')
  if (__isRoot) {
    c.set('bfRootComponent', '${name}')
  }

  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  ${props.map(p => `if (typeof ${p} !== 'function') __hydrateProps['${p}'] = ${p}`).join('\n  ')}
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
      ${jsx}
    </>
  )
}
`
    } else {
      // Components without props don't need hydration setup
      return `${allImports}

export function ${name}() {
  const c = useRequestContext()
${scriptLogic}

  return (
    <>
      ${scriptTags}
      ${jsx}
    </>
  )
}
`
    }
  }
}
