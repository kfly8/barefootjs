/**
 * Development server for the BarefootJS site (landing page + documentation).
 * Run with: bun run --watch server.tsx
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { resolve, dirname } from 'node:path'
import { createApp } from './app'
import { loadContentFromDisk } from './lib/content-loader'

const CONTENT_DIR = resolve(dirname(import.meta.path), '../../docs/core')
const { pages, content } = await loadContentFromDisk(CONTENT_DIR)

const server = new Hono()

// Serve compiled static files (CSS, components, icons, logos, snippets)
server.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// Mount the main app
const app = await createApp(content, pages)
server.route('/', app)

export default {
  port: 3001,
  fetch: server.fetch,
}

console.log('Site running at http://localhost:3001')
