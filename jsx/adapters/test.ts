/**
 * Test Server Adapter
 *
 * A minimal server adapter for testing purposes.
 * Outputs plain JSX without framework-specific code.
 */

import type { ServerComponentAdapter } from '../types'

/**
 * Test adapter that generates minimal server JSX components.
 *
 * Unlike the Hono adapter, this outputs only the essential JSX
 * without framework-specific imports, manifest handling, or script tags.
 */
export const testServerAdapter: ServerComponentAdapter = {
  generateServerComponent: ({ name, props, jsx }) => {
    const propsParam = props.length > 0
      ? `{ ${props.join(', ')} }: { ${props.map(p => `${p}: any`).join('; ')} }`
      : ''

    return `export function ${name}(${propsParam}) {
  return (
    ${jsx}
  )
}
`
  },
}
