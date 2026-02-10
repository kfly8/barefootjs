/**
 * Hono application for the BarefootJS documentation site.
 *
 * Registers routes for each markdown page:
 *   GET /{slug}     → Rendered HTML
 *   GET /{slug}.md  → Raw Markdown
 */

import { Hono } from 'hono'
import { resolve, dirname } from 'node:path'
import { renderer } from './renderer'
import { discoverPages, type Page } from './lib/content'
import { initHighlighter, renderMarkdown } from './lib/markdown'

const CONTENT_DIR = resolve(dirname(import.meta.path), '../core')

export async function createApp(): Promise<{ app: Hono; pages: Page[] }> {
  await initHighlighter()
  const pages = await discoverPages(CONTENT_DIR)

  const app = new Hono()
  app.use(renderer)

  // Index page (README.md)
  const indexPage = pages.find((p) => p.slug === '')
  if (indexPage) {
    app.get('/', async (c) => {
      const content = await Bun.file(indexPage.sourcePath).text()
      const parsed = await renderMarkdown(content)
      return c.render(
        <div dangerouslySetInnerHTML={{ __html: parsed.html }} />,
        {
          title: parsed.frontmatter.title || 'Documentation',
          description: parsed.frontmatter.description,
          slug: '',
        }
      )
    })
    app.get('/README.md', async (c) => {
      const content = await Bun.file(indexPage.sourcePath).text()
      c.header('Content-Type', 'text/markdown; charset=utf-8')
      return c.body(content)
    })
  }

  // All other pages: HTML version + raw Markdown version
  for (const page of pages.filter((p) => p.slug !== '')) {
    // HTML version
    app.get(`/${page.slug}`, async (c) => {
      const content = await Bun.file(page.sourcePath).text()
      const parsed = await renderMarkdown(content)

      // Collect extra meta tags from frontmatter
      const meta: Record<string, string> = {}
      for (const [key, value] of Object.entries(parsed.frontmatter)) {
        if (key !== 'title' && key !== 'description' && value) {
          meta[key] = value
        }
      }

      return c.render(
        <div dangerouslySetInnerHTML={{ __html: parsed.html }} />,
        {
          title: parsed.frontmatter.title,
          description: parsed.frontmatter.description,
          meta: Object.keys(meta).length > 0 ? meta : undefined,
          slug: page.slug,
        }
      )
    })

    // Raw Markdown version
    app.get(`/${page.slug}.md`, async (c) => {
      const content = await Bun.file(page.sourcePath).text()
      c.header('Content-Type', 'text/markdown; charset=utf-8')
      return c.body(content)
    })
  }

  return { app, pages }
}
