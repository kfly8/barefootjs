/**
 * Development server for the BarefootJS documentation site.
 * Run with: bun run --watch server.tsx
 */

import { serveStatic } from 'hono/bun'
import { resolve, dirname } from 'node:path'
import { createApp } from './app'
import { loadContentFromDisk } from './lib/content-loader'

const CONTENT_DIR = resolve(dirname(import.meta.path), '../../docs/core')
const { pages, content } = await loadContentFromDisk(CONTENT_DIR)
const app = await createApp(content, pages)

// Serve compiled static files (CSS, components, icons)
app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

export default {
  port: 3001,
  fetch: app.fetch,
}

console.log('Documentation site running at http://localhost:3001')
