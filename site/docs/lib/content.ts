/**
 * Content discovery and loading.
 *
 * - Dev mode:  reads markdown files from docs/core/ on disk
 * - Prod mode: uses a pre-bundled content map generated at build time
 */

import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

export interface Page {
  /** URL slug, e.g. "advanced/performance". Empty string for index (README.md). */
  slug: string
  /** Filename without extension, e.g. "performance" */
  name: string
}

/** slug → raw markdown content */
export type ContentMap = Record<string, string>

/**
 * Recursively discover all .md files under a directory.
 */
async function discoverFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await discoverFiles(fullPath))
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Build page list and content map by reading from the filesystem.
 * Used by: dev server (reads fresh on startup) and build script (generates bundle).
 */
export async function loadContentFromDisk(contentDir: string): Promise<{ pages: Page[]; content: ContentMap }> {
  const files = await discoverFiles(contentDir)
  const pages: Page[] = []
  const content: ContentMap = {}

  for (const filePath of files) {
    const rel = relative(contentDir, filePath)
    const name = rel.replace(/\.md$/, '').split('/').pop() || ''
    const slug = rel === 'README.md' ? '' : rel.replace(/\.md$/, '')

    pages.push({ slug, name })
    content[slug] = await Bun.file(filePath).text()
  }

  // Sort: index first, then alphabetically
  pages.sort((a, b) => {
    if (a.slug === '') return -1
    if (b.slug === '') return 1
    return a.slug.localeCompare(b.slug)
  })

  return { pages, content }
}

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
