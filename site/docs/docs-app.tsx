/**
 * Hono application for the BarefootJS documentation site.
 *
 * Registers routes for each markdown page:
 *   GET /{slug}     → Rendered HTML
 *   GET /{slug}.md  → Raw Markdown
 */

import { Hono } from 'hono'
import { renderer } from './renderer'
import { initHighlighter, renderMarkdown } from './lib/markdown'
import { getDocsNavLinks } from './lib/navigation'
import type { Page, ContentMap } from './lib/content'

/**
 * Create the Hono app with routes for all documentation pages.
 *
 * @param content - Map of slug → raw markdown content
 * @param pages   - List of page metadata (slug, name)
 */
export async function createDocsApp(content: ContentMap, pages: Page[]): Promise<Hono> {
  await initHighlighter()

  const app = new Hono()
  app.use(renderer)

  // Index page (README.md)
  const indexContent = content['']
  if (indexContent !== undefined) {
    app.get('/', async (c) => {
      const parsed = await renderMarkdown(indexContent)
      const navLinks = getDocsNavLinks('')
      return c.render(
        <div dangerouslySetInnerHTML={{ __html: parsed.html }} />,
        {
          title: parsed.frontmatter.title || 'Documentation',
          description: parsed.frontmatter.description,
          slug: '',
          toc: parsed.toc,
          prev: navLinks.prev,
          next: navLinks.next,
        }
      )
    })
    app.get('/README.md', (c) => {
      c.header('Content-Type', 'text/markdown; charset=utf-8')
      return c.body(indexContent)
    })
  }

  // All other pages: HTML version + raw Markdown version
  for (const page of pages.filter((p) => p.slug !== '')) {
    const pageContent = content[page.slug]
    if (pageContent === undefined) continue

    // HTML version
    app.get(`/${page.slug}`, async (c) => {
      const parsed = await renderMarkdown(pageContent)

      // Collect extra meta tags from frontmatter
      const meta: Record<string, string> = {}
      for (const [key, value] of Object.entries(parsed.frontmatter)) {
        if (key !== 'title' && key !== 'description' && value) {
          meta[key] = value
        }
      }

      const navLinks = getDocsNavLinks(page.slug)

      return c.render(
        <div dangerouslySetInnerHTML={{ __html: parsed.html }} />,
        {
          title: parsed.frontmatter.title,
          description: parsed.frontmatter.description,
          meta: Object.keys(meta).length > 0 ? meta : undefined,
          slug: page.slug,
          toc: parsed.toc,
          prev: navLinks.prev,
          next: navLinks.next,
        }
      )
    })

    // Raw Markdown version
    app.get(`/${page.slug}.md`, (c) => {
      c.header('Content-Type', 'text/markdown; charset=utf-8')
      return c.body(pageContent)
    })
  }

  return app
}
