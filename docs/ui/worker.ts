/**
 * Cloudflare Worker Entry Point
 *
 * Production server for Cloudflare Workers.
 * Static files in ./dist are served automatically via [assets] in wrangler.toml.
 *
 * Note: Syntax highlighting may not be available in Workers environment.
 * Code blocks will display without highlighting as a fallback.
 */

import { createApp } from './routes'

const app = createApp()

export default app
