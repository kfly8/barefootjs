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

// CORS + cache headers for registry (matches _headers for production)
app.use('/r/*', async (c, next) => {
  await next()
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Cache-Control', 'public, max-age=300')
})

// Registry routes - serve static JSON files
app.use('/r/*', serveStatic({
  root: './dist',
}))

const port = Number(process.env.PORT) || 3002

export default { port, fetch: app.fetch }
