/**
 * BarefootJS Site Worker (Cloudflare Workers)
 *
 * Production deployment target.
 * Static files are served via wrangler [assets] configuration.
 */

import { initHighlighter } from './components/shared/highlighter'
import { createApp } from './routes'

// Initialize highlighter at startup
await initHighlighter()

const app = createApp()

export default app
