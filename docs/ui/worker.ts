/**
 * Cloudflare Worker Entry Point
 *
 * Handles:
 * - Static file serving for /r/*.json (registry)
 * - Documentation pages via Hono
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Registry routes - serve static JSON files
app.get('/r/*', serveStatic({ root: './' }))

// For now, redirect docs routes to home
// TODO: Integrate with full documentation server after migration is complete
app.get('/', (c) => {
  return c.text('BarefootJS UI - Coming Soon')
})

app.get('/docs/*', (c) => {
  return c.text('Documentation - Coming Soon')
})

export default app
