/**
 * Hono Server Component Adapter
 *
 * Generates server components compatible with Hono's JSX runtime.
 * Uses useRequestContext to track which components are used for client-side hydration.
 * Outputs slot registry for reliable hydration with Slot Registry pattern.
 */

import type { ServerComponentAdapter, SlotRegistry } from '../types'

/**
 * Hono JSX adapter for server component generation
 */
export const honoServerAdapter: ServerComponentAdapter = {
  generateServerComponent: ({ name, props, jsx, ir: _ir, signals: _signals, childComponents, registry }) => {
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
      childImports,
    ].filter(Boolean).join('\n')

    // Registry script (embedded in component)
    const registryScript = registry && registry.slots.length > 0
      ? `<script type="application/json" data-bf-registry dangerouslySetInnerHTML={{ __html: ${JSON.stringify(JSON.stringify(registry))} }} />`
      : ''

    if (props.length > 0) {
      // For components with props, embed serializable props for client hydration
      return `${allImports}

export function ${name}(${propsParam}${propsType}) {
  const c = useRequestContext()
  const used = c.get('usedComponents') || []
  if (!used.includes('${name}')) {
    c.set('usedComponents', [...used, '${name}'])
  }

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
      {__isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="${name}"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
      ${jsx}
      ${registryScript}
    </>
  )
}
`
    } else {
      // Components without props don't need hydration setup
      return `${allImports}

export function ${name}() {
  const c = useRequestContext()
  const used = c.get('usedComponents') || []
  if (!used.includes('${name}')) {
    c.set('usedComponents', [...used, '${name}'])
  }

  // Check if this is the root BarefootJS component
  const __isRoot = !c.get('bfRootComponent')
  if (__isRoot) {
    c.set('bfRootComponent', '${name}')
  }

  return (
    <>
      ${jsx}
      ${registryScript}
    </>
  )
}
`
    }
  }
}
