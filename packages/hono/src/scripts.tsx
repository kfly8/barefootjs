/**
 * BfScripts Component
 *
 * Renders collected script tags at the end of the document body.
 * BarefootJS components collect their script URLs during SSR render,
 * and this component outputs them all at once to avoid DOM traversal issues.
 *
 * Usage:
 * ```tsx
 * import { BfScripts } from '@barefoot/hono/scripts'
 *
 * <html>
 *   <body>
 *     {children}
 *     <BfScripts />
 *   </body>
 * </html>
 * ```
 */

/** @jsxImportSource hono/jsx */

import { useRequestContext } from 'hono/jsx-renderer'
import { Fragment } from 'hono/jsx'

export type CollectedScript = {
  src: string
}

export type CollectedPropsScript = {
  name: string
  instanceId: string
  props: Record<string, unknown>
}

/**
 * Renders all collected BarefootJS script tags.
 * Place this component at the end of your <body> element.
 *
 * After rendering, sets 'bfScriptsRendered' flag to true.
 * Components rendered after BfScripts (e.g., inside Suspense boundaries)
 * will check this flag and output their scripts inline instead of
 * collecting them here.
 */
export function BfScripts() {
  try {
    const c = useRequestContext()

    // Mark that BfScripts has been rendered.
    // Components rendered after this point (e.g., inside Suspense)
    // should output their scripts inline.
    c.set('bfScriptsRendered', true)

    const scripts: CollectedScript[] = c.get('bfCollectedScripts') || []
    const propsScripts: CollectedPropsScript[] = c.get('bfCollectedPropsScripts') || []

    return (
      <Fragment>
        {scripts.map(({ src }) => (
          <script type="module" src={src} />
        ))}
        {propsScripts.map(({ instanceId, props }) => (
          <script
            type="application/json"
            data-bf-props={instanceId}
            dangerouslySetInnerHTML={{ __html: JSON.stringify(props) }}
          />
        ))}
      </Fragment>
    )
  } catch {
    // Context unavailable (e.g., not using jsxRenderer)
    return null
  }
}
