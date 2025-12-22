/**
 * BarefootJS Renderer Middleware for Hono
 *
 * Provides c.render(pageName, { title, ...props }) method.
 */

import { resolve, dirname } from 'node:path'
import { createMiddleware } from 'hono/factory'
import manifest from './dist/manifest.json'
import type { PageName, PageProps } from './dist/manifest.d.ts'

const DIST_DIR = resolve(dirname(import.meta.path), 'dist')

type ManifestEntry = {
  staticHtml: string
  clientJs?: string
  props: string[]
  components?: string[]
}

// Render options: title is always required, plus page-specific props
type RenderOptions<T extends PageName> = { title: string } & PageProps[T]

// Page HTML cache
const pageHtml: Record<string, string> = {}

// Load all page HTML
async function loadPages(): Promise<void> {
  for (const [name, entry] of Object.entries(manifest)) {
    if (name !== '__barefoot__' && (entry as ManifestEntry).staticHtml) {
      pageHtml[name] = await Bun.file(
        resolve(DIST_DIR, (entry as ManifestEntry).staticHtml)
      ).text()
    }
  }
}

// Load pages on module initialization
await loadPages()

// Get components for a page from manifest
function getPageComponents(pageName: PageName): string[] {
  const entry = manifest[pageName] as ManifestEntry | undefined
  return entry?.components ?? []
}

// Get script tags for components
function getScriptTags(components: string[]): string[] {
  const scripts: string[] = []

  if (components.length > 0) {
    const barefootEntry = manifest['__barefoot__'] as ManifestEntry
    if (barefootEntry.clientJs) {
      scripts.push(`<script type="module" src="/static/${barefootEntry.clientJs}"></script>`)
    }
  }

  for (const name of components) {
    const entry = manifest[name as keyof typeof manifest] as ManifestEntry | undefined
    if (entry?.clientJs) {
      scripts.push(`<script type="module" src="/static/${entry.clientJs}"></script>`)
    }
  }

  return scripts
}

// Default styles
const defaultStyles = `
  body {
    font-family: system-ui, sans-serif;
    max-width: 600px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  h1 { color: #333; }
  .hidden { display: none; }
  .status {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
  }
  .status .count { font-weight: bold; color: #4CAF50; }
  .status .total { font-weight: bold; }
  .add-form { display: flex; gap: 0.5rem; margin: 1rem 0; }
  .new-todo-input {
    flex: 1;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .add-btn {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .add-btn:hover { background: #45a049; }
  .todo-list { list-style: none; padding: 0; }
  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    margin: 0.5rem 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
  }
  .todo-item.done .todo-text { text-decoration: line-through; color: #999; }
  .todo-text { flex: 1; cursor: pointer; font-size: 1rem; }
  .todo-input {
    flex: 1;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #4CAF50;
    border-radius: 4px;
  }
  button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .toggle-btn { background: #2196F3; color: white; }
  .toggle-btn:hover { background: #1976D2; }
  .delete-btn { background: #f44336; color: white; }
  .delete-btn:hover { background: #d32f2f; }
  .loading { text-align: center; padding: 2rem; color: #999; }
  .error {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
  }
`

/**
 * Render a page by name with options
 */
function renderPage<T extends PageName>(
  pageName: T,
  options: RenderOptions<T>
): string {
  const { title, ...props } = options
  const html = pageHtml[pageName] || ''
  const components = getPageComponents(pageName)
  const scripts = getScriptTags(components)

  // Add props hydration script if props provided
  let propsScript = ''
  const propsKeys = Object.keys(props)
  if (propsKeys.length > 0) {
    const targetComponent = components.find(name => {
      const entry = manifest[name as keyof typeof manifest] as ManifestEntry | undefined
      if (!entry || entry.props.length === 0) return false
      return propsKeys.every(key => entry.props.includes(key))
    })
    if (targetComponent) {
      propsScript = `<script type="application/json" data-bf-props="${targetComponent}">${JSON.stringify(props)}</script>`
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${defaultStyles}</style>
</head>
<body>
  ${html}
  ${propsScript}
  ${scripts.join('\n  ')}
</body>
</html>`
}

// Extend Hono context type
declare module 'hono' {
  interface ContextRenderer {
    <T extends PageName>(pageName: T, options: RenderOptions<T>): Response | Promise<Response>
  }
}

/**
 * BarefootJS renderer middleware
 *
 * Usage:
 *   app.use(barefootRenderer())
 *   app.get('/', (c) => c.render('TodoPage', { title: 'Todo SPA' }))
 */
export const barefootRenderer = () => {
  return createMiddleware(async (c, next) => {
    c.setRenderer((pageName, options) => {
      const html = renderPage(pageName, options)
      return c.html(html)
    })
    await next()
  })
}
