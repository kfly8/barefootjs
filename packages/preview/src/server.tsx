/**
 * Preview development server
 *
 * Lightweight Hono server that renders previews with full hydration support.
 * Uses BfScripts/BfPortals from @barefootjs/hono.
 * Compiled components' hono imports are rewritten to the same hono instance
 * in compile.ts to ensure consistent request context sharing.
 */

/** @jsxImportSource hono/jsx */

import { Hono } from 'hono'
import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { serveStatic } from 'hono/bun'
import { BfScripts } from '@barefootjs/hono/scripts'
import { BfPortals } from '@barefootjs/hono/portals'
import { BfPreload, type Manifest } from '@barefootjs/hono/preload'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: {}): Response | Promise<Response>
  }
}

/**
 * Predictable instance ID generator (same as site/ui/renderer.tsx)
 */
const createPredictableIdGenerator = () => {
  const counters = new Map<string, number>()
  return (name: string) => {
    const count = counters.get(name) || 0
    counters.set(name, count + 1)
    return `${name}_${count}`
  }
}

function WithPredictableIds({ children }: { children: any }) {
  const c = useRequestContext()
  c.set('bfInstanceIdGenerator', createPredictableIdGenerator())
  return <>{children}</>
}

// Import map for resolving @barefootjs/dom in client JS
const importMapScript = JSON.stringify({
  imports: {
    '@barefootjs/dom': '/static/barefoot.js',
  },
})

export interface PreviewEntry {
  name: string
  displayName: string
}

export interface ServerOptions {
  /** Preview entries to render */
  previews: PreviewEntry[]
  /** Component name (for page title) */
  componentName: string
  /** Render function: given preview name, returns JSX */
  renderPreview: (name: string) => any
  /** Component manifest for modulepreload */
  manifest?: Manifest
  /** Port number */
  port?: number
}

/**
 * Convert PascalCase to display title: "WithLabel" → "With Label"
 */
export function pascalToTitle(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function createPreviewApp(options: ServerOptions) {
  const { previews, componentName, renderPreview, manifest } = options

  const app = new Hono()

  // Renderer: minimal HTML shell with import map, CSS, BfScripts
  app.use(
    '*',
    jsxRenderer(
      ({ children }) => {
        return (
          <WithPredictableIds>
            <html lang="en">
              <head>
                <script type="importmap" dangerouslySetInnerHTML={{ __html: importMapScript }} />
                {manifest && <BfPreload manifest={manifest as Manifest} />}
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{componentName} — Preview</title>
                <link rel="stylesheet" href="/static/globals.css" />
                <link rel="stylesheet" href="/static/uno.css" />
                <style>{`
                  body {
                    padding: 2rem;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  .preview-section {
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                  }
                  .preview-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--muted-foreground);
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                  h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                  }
                `}</style>
              </head>
              <body>
                {children}
                <BfPortals />
                <BfScripts />
              </body>
            </html>
          </WithPredictableIds>
        )
      },
      { stream: true }
    )
  )

  // Static files from .preview-dist/
  app.use('/static/*', serveStatic({
    root: '.preview-dist',
    rewriteRequestPath: (path) => path.replace('/static', ''),
  }))

  // Main route: render all previews
  app.get('/', (c) => {
    return c.render(
      <div>
        <h1>{componentName}</h1>
        {previews.map((preview) => (
          <div className="preview-section" data-preview={preview.name}>
            <div className="preview-title">{preview.displayName}</div>
            {renderPreview(preview.name)}
          </div>
        ))}
      </div>
    )
  })

  return app
}

export function startServer(app: ReturnType<typeof createPreviewApp>, port: number) {
  console.log(`\nPreview server running at http://localhost:${port}`)
  return Bun.serve({ port, fetch: app.fetch })
}
