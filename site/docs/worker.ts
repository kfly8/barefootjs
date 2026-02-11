/**
 * Cloudflare Workers entry point for the BarefootJS documentation site.
 *
 * Content is bundled at build time (dist/content.json) since Workers
 * can't read from the filesystem.
 */

import { createApp } from './app'
import { pagesFromContentMap, type ContentMap } from './lib/content'
import contentBundle from './dist/content.json'

const content = contentBundle as ContentMap
const pages = pagesFromContentMap(content)
const app = await createApp(content, pages)

export default app
