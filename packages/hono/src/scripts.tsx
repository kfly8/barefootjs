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
  props: Record<string, unknown>
}

/**
 * Renders all collected BarefootJS script tags.
 * Place this component at the end of your <body> element.
 */
export function BfScripts(): JSX.Element | null {
  try {
    const c = useRequestContext()
    const scripts: CollectedScript[] = c.get('bfCollectedScripts') || []
    const propsScripts: CollectedPropsScript[] = c.get('bfCollectedPropsScripts') || []

    return (
      <Fragment>
        {scripts.map(({ src }) => (
          <script type="module" src={src} />
        ))}
        {propsScripts.map(({ name, props }) => (
          <script
            type="application/json"
            data-bf-props={name}
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
