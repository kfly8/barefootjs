/**
 * Story development server
 *
 * Lightweight Hono server that renders stories with full hydration support.
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

export interface StoryEntry {
  name: string
  displayName: string
}

export interface ServerOptions {
  /** Story entries to render */
  stories: StoryEntry[]
  /** Component name (for page title) */
  componentName: string
  /** Render function: given story name, returns JSX */
  renderStory: (name: string) => any
  /** Port number */
  port?: number
}

/**
 * Convert PascalCase to display title: "WithLabel" → "With Label"
 */
export function pascalToTitle(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function createStoryApp(options: ServerOptions) {
  const { stories, componentName, renderStory } = options

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
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{componentName} — Stories</title>
                <link rel="stylesheet" href="/static/globals.css" />
                <link rel="stylesheet" href="/static/uno.css" />
                <style>{`
                  body {
                    padding: 2rem;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  .story-section {
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                  }
                  .story-title {
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

  // Static files from .story-dist/
  app.use('/static/*', serveStatic({
    root: '.story-dist',
    rewriteRequestPath: (path) => path.replace('/static', ''),
  }))

  // Main route: render all stories
  app.get('/', (c) => {
    return c.render(
      <div>
        <h1>{componentName}</h1>
        {stories.map((story) => (
          <div className="story-section" data-story={story.name}>
            <div className="story-title">{story.displayName}</div>
            {renderStory(story.name)}
          </div>
        ))}
      </div>
    )
  })

  return app
}

export function startServer(app: ReturnType<typeof createStoryApp>, port: number) {
  console.log(`\nStory server running at http://localhost:${port}`)
  return Bun.serve({ port, fetch: app.fetch })
}
