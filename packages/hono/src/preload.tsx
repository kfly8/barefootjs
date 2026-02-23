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
 * import manifest from './dist/components/manifest.json'
 *
 * <html>
 *   <head>
 *     <BfPreload />
 *     {/* or with additional scripts *\/}
 *     <BfPreload scripts={['/static/components/button.js']} />
 *     {/* or preload all client JS from manifest *\/}
 *     <BfPreload manifest={manifest} />
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

/**
 * Manifest entry type for compiled components.
 */
export interface ManifestEntry {
  markedTemplate: string
  clientJs?: string
  props?: Array<{ name: string; type: string; optional: boolean }>
}

/**
 * Manifest type mapping component names to their metadata.
 */
export type Manifest = Record<string, ManifestEntry>

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

  /**
   * Component manifest. When provided, preloads all clientJs entries.
   * Modulepreload only fetches and parses — it doesn't execute —
   * so unused preloads have minimal cost.
   */
  manifest?: Manifest
}

/**
 * Renders modulepreload link tags for BarefootJS scripts.
 * Place this component in your <head> element.
 *
 * By default, preloads the barefoot.js runtime which is required
 * by all BarefootJS components.
 *
 * When manifest is provided, preloads all client JS entries
 * from the manifest for early browser discovery.
 */
export function BfPreload({
  staticPath = '/static',
  scripts = [],
  includeRuntime = true,
  manifest,
}: BfPreloadProps = {}) {
  const urls: string[] = []

  // Always preload the barefoot runtime first (most critical)
  if (includeRuntime) {
    urls.push(`${staticPath}/components/barefoot.js`)
  }

  // Preload all client JS entries from manifest
  if (manifest) {
    for (const [name, entry] of Object.entries(manifest)) {
      if (name === '__barefoot__') continue
      if (entry.clientJs) {
        urls.push(`${staticPath}/${entry.clientJs}`)
      }
    }
  }

  // Add additional scripts
  urls.push(...scripts)

  // Deduplicate URLs while preserving order
  const uniqueUrls = [...new Set(urls)]

  return (
    <Fragment>
      {uniqueUrls.map((url) => (
        <link rel="modulepreload" href={url} />
      ))}
    </Fragment>
  )
}
