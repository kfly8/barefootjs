/**
 * Cloudflare Worker Entry Point
 *
 * Production server for Cloudflare Workers.
 * Static files in ./dist are served automatically via [assets] in wrangler.toml.
 */

import { initHighlighter } from './components/shared/highlighter'
import { createApp } from './routes'

// Initialize syntax highlighter at startup
await initHighlighter()

const app = createApp()

export default app
