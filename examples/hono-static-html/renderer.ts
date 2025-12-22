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
  body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
  h1 { color: #333; }
  nav ul { list-style: none; padding: 0; }
  nav li { margin: 0.5rem 0; }
  nav a { font-size: 1.2rem; }
  .counter { font-size: 3rem; font-weight: bold; }
  .doubled { color: #666; }
  .toggle span { font-size: 2rem; font-weight: bold; margin-right: 1rem; }
  button { font-size: 1.2rem; padding: 0.5rem 1rem; margin: 0.25rem; cursor: pointer; }
  .status { font-size: 18px; color: #666; margin: 16px 0; }
  .status .count { font-weight: bold; color: #4caf50; }
  .add-form { display: flex; gap: 8px; margin-bottom: 20px; }
  .new-todo-input { flex: 1; font-size: 16px; padding: 12px 16px; border: 2px solid #ddd; border-radius: 8px; outline: none; transition: border-color 0.2s; }
  .new-todo-input:focus { border-color: #2196f3; }
  .add-form .add-btn { margin-top: 0; width: auto; padding: 12px 24px; }
  .todo-list { list-style: none; padding: 0; margin: 0; }
  .todo-item { display: flex; align-items: center; gap: 12px; padding: 16px; margin: 8px 0; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: opacity 0.2s; }
  .todo-item.done { opacity: 0.6; }
  .todo-item.done .todo-text { text-decoration: line-through; color: #999; }
  .todo-text { flex: 1; font-size: 16px; }
  .toggle-btn { font-size: 13px; padding: 6px 12px; cursor: pointer; border: 1px solid #4caf50; background: white; color: #4caf50; border-radius: 4px; transition: all 0.2s; }
  .toggle-btn:hover { background: #4caf50; color: white; }
  .delete-btn { font-size: 13px; padding: 6px 12px; cursor: pointer; border: 1px solid #ff5252; background: white; color: #ff5252; border-radius: 4px; transition: all 0.2s; }
  .delete-btn:hover { background: #ff5252; color: white; }
  .add-btn { margin-top: 0; font-size: 16px; padding: 12px 20px; cursor: pointer; background: #2196f3; color: white; border: none; border-radius: 8px; transition: background 0.2s; }
  .add-btn:hover { background: #1976d2; }
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
    // Find the component whose props match the passed props
    const targetComponent = components.find(name => {
      const entry = manifest[name as keyof typeof manifest] as ManifestEntry | undefined
      if (!entry || entry.props.length === 0) return false
      // Check if all passed props are in the component's props
      return propsKeys.every(key => entry.props.includes(key))
    })
    if (targetComponent) {
      propsScript = `<script type="application/json" data-bf-props="${targetComponent}">${JSON.stringify(props)}</script>`
    }
  }

  return `<!DOCTYPE html>
<html lang="ja">
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
 *   app.get('/', (c) => c.render('HomePage', { title: 'Home' }))
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
