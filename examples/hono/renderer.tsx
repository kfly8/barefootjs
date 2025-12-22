/**
 * BarefootJS Renderer
 *
 * Handles layout and automatic client JS injection.
 * Only loads scripts for components that are used.
 */

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import manifest from './dist/manifest.json'

// Generate script tags for client JS (only for used components)
function getScriptTags(usedComponents: string[]): string[] {
  const scripts: string[] = []

  // Only load barefoot.js if components are used
  if (usedComponents.length > 0) {
    const barefootJs = manifest['__barefoot__']?.clientJs
    if (barefootJs) {
      scripts.push(`<script type="module" src="/static/${barefootJs}"></script>`)
    }
  }

  // Only client.js for used components
  for (const name of usedComponents) {
    const entry = manifest[name as keyof typeof manifest]
    if (entry?.clientJs) {
      scripts.push(`<script type="module" src="/static/${entry.clientJs}"></script>`)
    }
  }

  return scripts
}

// Component that inserts scripts after children are rendered
function Scripts() {
  const c = useRequestContext()
  const usedComponents: string[] = c.get('usedComponents') || []
  const scripts = getScriptTags(usedComponents)
  return <footer dangerouslySetInnerHTML={{ __html: scripts.join('\n') }} />
}

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BarefootJS + Hono</title>
        <style>{`
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
          h1 { color: #333; }
          nav ul { list-style: none; padding: 0; }
          nav li { margin: 0.5rem 0; }
          nav a { font-size: 1.2rem; }
          .counter { font-size: 3rem; font-weight: bold; }
          .doubled { color: #666; }
          .toggle span { font-size: 2rem; font-weight: bold; margin-right: 1rem; }
          button { font-size: 1.2rem; padding: 0.5rem 1rem; margin: 0.25rem; cursor: pointer; }
        `}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
})
