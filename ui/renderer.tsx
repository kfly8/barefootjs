/**
 * BarefootJS Components Renderer
 *
 * Uses hono/jsx-renderer with UnoCSS.
 * BfScripts component renders collected script tags at body end.
 */

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: {
        title?: string
        description?: string
      }
    ): Response | Promise<Response>
  }
}
import { BfScripts } from '../packages/hono/src/scripts'
import { SidebarMenu } from './components/docs/sidebar-menu'
import { SidebarPreview } from './dist/components/docs/sidebar-preview'
import { Header } from './dist/components/docs/header'
import { MobileHeader } from './dist/components/docs/mobile-header'
import { CommandPalette } from './dist/components/docs/command-palette'

/**
 * Predictable instance ID generator for E2E testing.
 * Generates IDs like "ComponentName_0", "ComponentName_1" for stable selectors.
 * The _N suffix is required because client JS uses prefix matching with underscore.
 */
const createPredictableIdGenerator = () => {
  const counters = new Map<string, number>()
  return (name: string) => {
    const count = counters.get(name) || 0
    counters.set(name, count + 1)
    return `${name}_${count}`
  }
}

/**
 * Wrapper component to set up predictable ID generator in context
 */
function WithPredictableIds({ children }: { children: any }) {
  const c = useRequestContext()
  c.set('bfInstanceIdGenerator', createPredictableIdGenerator())
  return <>{children}</>
}

// Theme initialization script - runs before page render to prevent FOUC
const themeInitScript = `
(function() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();
`

export const renderer = jsxRenderer(
  ({ children, title, description }) => {
    const c = useRequestContext()
    const currentPath = c.req.path
    const pageTitle = title || 'BarefootJS Components'
    return (
      <WithPredictableIds>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>{pageTitle}</title>
            {description && <meta name="description" content={description} />}
            <link rel="author" href="https://kobaken.co" />
            <meta name="author" content="kobaken a.k.a @kfly8" />
            <meta name="creator" content="kobaken a.k.a @kfly8" />
            <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            <link rel="stylesheet" href="/static/globals.css" />
            <link rel="stylesheet" href="/static/uno.css" />
            <style>{`
              body {
                padding: 5rem 1.5rem 3rem;
              }
            `}</style>
          </head>
          <body>
            {/* Desktop Header */}
            <Header currentPath={currentPath} />
            {/* Mobile Header with hamburger menu */}
            <MobileHeader currentPath={currentPath} />
            {/* Command Palette (global) */}
            <CommandPalette />
            <SidebarMenu currentPath={currentPath} />
            <SidebarPreview />
            <div class="sm:pl-56">
              <main class="max-w-[1000px] mx-auto px-4">
                {children}
              </main>
            </div>
            <BfScripts />
          </body>
        </html>
      </WithPredictableIds>
    )
  },
  { stream: true }
)
