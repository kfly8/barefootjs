/**
 * BarefootJS Components Server (Bun)
 *
 * Development server using Bun runtime.
 * For production deployment to Cloudflare Workers, see worker.ts.
 */

import { initHighlighter } from './components/shared/highlighter'

// Initialize syntax highlighter at startup
await initHighlighter()

import { serveStatic } from 'hono/bun'
import { createApp } from './routes'

const app = createApp()

// Static file serving (Bun-specific)
app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// Registry routes - serve static JSON files
app.use('/r/*', serveStatic({
  root: './dist',
}))

export default { port: 3002, fetch: app.fetch }
