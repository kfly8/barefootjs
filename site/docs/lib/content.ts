/**
 * Runtime-safe content types and utilities.
 *
 * This module has NO Node.js dependencies and is safe for Cloudflare Workers.
 * For build/dev-time content loading, use ./content-loader.
 */

export interface Page {
  /** URL slug, e.g. "advanced/performance". Empty string for index (README.md). */
  slug: string
  /** Filename without extension, e.g. "performance" */
  name: string
}

/** slug → raw markdown content */
export type ContentMap = Record<string, string>

/**
 * Build page list from a pre-loaded content map (for Workers).
 */
export function pagesFromContentMap(content: ContentMap): Page[] {
  const pages: Page[] = Object.keys(content).map((slug) => ({
    slug,
    name: slug === '' ? 'README' : slug.split('/').pop() || '',
  }))

  pages.sort((a, b) => {
    if (a.slug === '') return -1
    if (b.slug === '') return 1
    return a.slug.localeCompare(b.slug)
  })

  return pages
}
