/**
 * Build/dev-time content loading (requires Node.js APIs).
 *
 * This module uses node:fs and node:path to read markdown files from disk.
 * It must NOT be imported in Cloudflare Worker bundles.
 */

import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

import type { Page, ContentMap } from './content'
export type { Page, ContentMap }

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
