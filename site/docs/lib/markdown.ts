/**
 * Markdown processing with frontmatter parsing and Shiki syntax highlighting.
 */

import { Marked } from 'marked'
import { createHighlighter, type Highlighter } from 'shiki'
import type { TocItem } from '../../shared/components/table-of-contents'

export type { TocItem }

export interface Frontmatter {
  title?: string
  description?: string
  [key: string]: string | undefined
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter
  html: string
  raw: string
  toc: TocItem[]
}

let highlighter: Highlighter | null = null

export async function initHighlighter(): Promise<void> {
  if (highlighter) return
  highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'typescript', 'javascript', 'tsx', 'jsx',
      'bash', 'shell', 'json', 'html', 'css', 'go',
    ],
  })
}

/**
 * Parse YAML-like frontmatter from markdown content.
 * Supports flat key-value pairs:
 *   ---
 *   title: Page Title
 *   description: Page description
 *   og:image: https://example.com/image.png
 *   ---
 */
export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const trimmed = content.trimStart()
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: content }
  }

  const end = trimmed.indexOf('\n---', 3)
  if (end === -1) {
    return { frontmatter: {}, body: content }
  }

  const yaml = trimmed.slice(3, end).trim()
  const body = trimmed.slice(end + 4).trim()

  const frontmatter: Frontmatter = {}
  for (const line of yaml.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '')
    if (key) {
      frontmatter[key] = value
    }
  }

  return { frontmatter, body }
}

/**
 * Extract title from first H1 heading in markdown body.
 */
function extractTitleFromBody(body: string): string | undefined {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1] : undefined
}

/**
 * Create a configured Marked instance with Shiki highlighting and link transformation.
 */
function createMarked(): Marked {
  const marked = new Marked()

  marked.use({
    renderer: {
      code({ text, lang }: { text: string; lang?: string }) {
        if (!highlighter) {
          const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`
        }
        const resolvedLang = lang && highlighter.getLoadedLanguages().includes(lang) ? lang : 'text'
        try {
          return highlighter.codeToHtml(text, {
            lang: resolvedLang,
            themes: { light: 'github-light', dark: 'github-dark' },
          })
        } catch {
          const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`
        }
      },

      link({ href, title, tokens }: { href: string; title?: string | null; tokens: any[] }) {
        // @ts-expect-error - marked internal
        const text = this.parser.parseInline(tokens)
        let resolvedHref = href || ''

        // Transform .md links to clean URLs for internal navigation
        if (resolvedHref.startsWith('./') || resolvedHref.startsWith('../') || (!resolvedHref.startsWith('http') && resolvedHref.endsWith('.md'))) {
          resolvedHref = resolvedHref.replace(/\.md$/, '')
          if (resolvedHref.startsWith('./')) {
            resolvedHref = resolvedHref.slice(1)
          }
        }

        const titleAttr = title ? ` title="${title}"` : ''
        return `<a href="${resolvedHref}"${titleAttr}>${text}</a>`
      },

      heading({ text, depth }: { text: string; depth: number }) {
        const id = text
          .toLowerCase()
          .replace(/<[^>]*>/g, '')
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        return `<h${depth} id="${id}">${text}</h${depth}>\n`
      },
    },
  })

  return marked
}

/**
 * Extract TOC items (h2/h3) from rendered HTML.
 * h2 → top-level item, h3 → child item with branch markers.
 */
function extractTocFromHtml(html: string): TocItem[] {
  const headingRegex = /<h([23])\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/h[23]>/g
  const rawItems: { level: number; id: string; title: string }[] = []

  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const id = match[2]
    // Strip HTML tags from title text
    const title = match[3].replace(/<[^>]*>/g, '').trim()
    rawItems.push({ level, id, title })
  }

  const tocItems: TocItem[] = []

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i]
    if (item.level === 2) {
      tocItems.push({ id: item.id, title: item.title })
    } else if (item.level === 3) {
      // Determine branch position among consecutive h3 siblings
      const prevIsH3 = i > 0 && rawItems[i - 1].level === 3
      const nextIsH3 = i + 1 < rawItems.length && rawItems[i + 1].level === 3

      let branch: 'start' | 'child' | 'end'
      if (!prevIsH3 && nextIsH3) {
        branch = 'start'
      } else if (prevIsH3 && nextIsH3) {
        branch = 'child'
      } else {
        branch = 'end'
      }

      tocItems.push({ id: item.id, title: item.title, branch })
    }
  }

  return tocItems
}

const marked = createMarked()

/**
 * Render markdown content to HTML with frontmatter extraction.
 */
export async function renderMarkdown(content: string): Promise<ParsedMarkdown> {
  const { frontmatter, body } = parseFrontmatter(content)

  // Extract title from H1 if not in frontmatter
  if (!frontmatter.title) {
    frontmatter.title = extractTitleFromBody(body)
  }

  let html = await marked.parse(body)
  const toc = extractTocFromHtml(html)

  // Strip first H1 from rendered HTML (title is rendered separately in the layout)
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/, '')

  return {
    frontmatter,
    html,
    raw: content,
    toc,
  }
}
