/**
 * BfPreload Component
 *
 * Renders modulepreload link tags in the document head for faster module loading.
 * Modulepreload hints tell the browser to fetch and parse JavaScript modules early,
 * reducing the critical path latency.
 *
 * Usage:
 * ```tsx
 * import { BfPreload } from '@barefootjs/hono/preload'
 *
 * <html>
 *   <head>
 *     <BfPreload />
 *     {/* or with additional scripts *\/}
 *     <BfPreload scripts={['/static/components/button.js']} />
 *   </head>
 *   <body>
 *     {children}
 *     <BfScripts />
 *   </body>
 * </html>
 * ```
 */

/** @jsxImportSource hono/jsx */

import { Fragment } from 'hono/jsx'

export interface BfPreloadProps {
  /**
   * Path to static files directory.
   * @default '/static'
   */
  staticPath?: string

  /**
   * Additional script URLs to preload.
   * These are added in addition to the barefoot runtime.
   */
  scripts?: string[]

  /**
   * Whether to preload the barefoot runtime.
   * @default true
   */
  includeRuntime?: boolean
}

/**
 * Renders modulepreload link tags for BarefootJS scripts.
 * Place this component in your <head> element.
 *
 * By default, preloads the barefoot.js runtime which is required
 * by all BarefootJS components.
 */
export function BfPreload({
  staticPath = '/static',
  scripts = [],
  includeRuntime = true,
}: BfPreloadProps = {}) {
  const urls: string[] = []

  // Always preload the barefoot runtime first (most critical)
  if (includeRuntime) {
    urls.push(`${staticPath}/barefoot.js`)
  }

  // Add additional scripts
  urls.push(...scripts)

  return (
    <Fragment>
      {urls.map((url) => (
        <link rel="modulepreload" href={url} />
      ))}
    </Fragment>
  )
}
