/**
 * Content discovery — scans docs/core/ for markdown files and builds page metadata.
 */

import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

export interface Page {
  /** URL slug, e.g. "advanced/performance". Empty string for index (README.md). */
  slug: string
  /** Absolute path to the source markdown file. */
  sourcePath: string
  /** Filename without extension, e.g. "performance" */
  name: string
}

/**
 * Recursively discover all .md files under contentDir.
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
 * Discover all pages in the content directory.
 * README.md becomes the index page (slug = "").
 */
export async function discoverPages(contentDir: string): Promise<Page[]> {
  const files = await discoverFiles(contentDir)
  const pages: Page[] = []

  for (const filePath of files) {
    const rel = relative(contentDir, filePath)
    const name = rel.replace(/\.md$/, '').split('/').pop() || ''

    if (rel === 'README.md') {
      pages.push({ slug: '', sourcePath: filePath, name: 'README' })
    } else {
      const slug = rel.replace(/\.md$/, '')
      pages.push({ slug, sourcePath: filePath, name })
    }
  }

  // Sort: index first, then alphabetically
  pages.sort((a, b) => {
    if (a.slug === '') return -1
    if (b.slug === '') return 1
    return a.slug.localeCompare(b.slug)
  })

  return pages
}
