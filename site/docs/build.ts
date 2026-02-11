/**
 * Build script for the BarefootJS documentation site.
 *
 * 1. Bundles all markdown content from docs/core/ into dist/content.json
 *    (Workers can't read from the filesystem at runtime)
 * 2. Copies static assets (CSS) to dist/ for Workers Assets
 */

import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { loadContentFromDisk } from './lib/content'

const ROOT_DIR = dirname(import.meta.path)
const CONTENT_DIR = resolve(ROOT_DIR, '../../docs/core')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const STATIC_DIR = resolve(DIST_DIR, 'static')

console.log('Building BarefootJS documentation...\n')

await mkdir(STATIC_DIR, { recursive: true })

// 1. Bundle all markdown content
const { pages, content } = await loadContentFromDisk(CONTENT_DIR)
await Bun.write(resolve(DIST_DIR, 'content.json'), JSON.stringify(content))
console.log(`Bundled: ${pages.length} pages → dist/content.json`)

// 2. Copy CSS
await Bun.write(
  resolve(STATIC_DIR, 'globals.css'),
  Bun.file(resolve(ROOT_DIR, 'styles/globals.css'))
)
console.log('Copied:  dist/static/globals.css')

console.log('\nBuild complete!')
