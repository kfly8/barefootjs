/**
 * Hono Server Component Adapter
 *
 * Generates server components compatible with Hono's JSX runtime.
 * Uses useRequestContext to track which components are used for client-side hydration.
 */

import type { ServerComponentAdapter } from '../types'

/**
 * Hono JSX adapter for server component generation
 */
export const honoServerAdapter: ServerComponentAdapter = {
  generateServerComponent: ({ name, props, jsx }) => {
    const propsParam = props.length > 0 ? `{ ${props.join(', ')} }` : ''
    const propsType = props.length > 0
      ? `: { ${props.map(p => `${p}?: unknown`).join('; ')} }`
      : ''

    if (props.length > 0) {
      // For components with props, embed serializable props for client hydration
      return `import { useRequestContext } from 'hono/jsx-renderer'

export function ${name}(${propsParam}${propsType}) {
  const c = useRequestContext()
  const used = c.get('usedComponents') || []
  if (!used.includes('${name}')) {
    c.set('usedComponents', [...used, '${name}'])
  }

  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  ${props.map(p => `if (typeof ${p} !== 'function') __hydrateProps['${p}'] = ${p}`).join('\n  ')}
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  return (
    <>
      {__hasHydrateProps && (
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
      return `import { useRequestContext } from 'hono/jsx-renderer'

export function ${name}() {
  const c = useRequestContext()
  const used = c.get('usedComponents') || []
  if (!used.includes('${name}')) {
    c.set('usedComponents', [...used, '${name}'])
  }
  return (
    ${jsx}
  )
}
`
    }
  }
}
