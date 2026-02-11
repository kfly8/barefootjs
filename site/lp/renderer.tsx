/**
 * BarefootJS Site Renderer
 *
 * Minimal layout for the landing page.
 */

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { Header } from '../shared/components/header'
import { SearchPlaceholder } from '../shared/components/search-placeholder'
import { ThemeSwitcher } from '@/components/theme-switcher'

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
import { BfScripts } from '../../packages/hono/src/scripts'

/**
 * Predictable instance ID generator for consistent SSR.
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

import { themeInitScript } from '@barefootjs/site-shared/lib/theme-init'

// Import map for resolving @barefootjs/dom in client JS
const importMapScript = JSON.stringify({
  imports: {
    '@barefootjs/dom': '/static/components/barefoot.js',
  },
})

export const renderer = jsxRenderer(
  ({ children, title, description }) => {
    const pageTitle = title || 'Barefoot.js'
    const pageDescription = description || 'Reactive JSX for any backend'
    return (
      <WithPredictableIds>
        <html lang="en">
          <head>
            <script type="importmap" dangerouslySetInnerHTML={{ __html: importMapScript }} />
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" type="image/png" sizes="32x32" href="/static/icon-32.png" />
            <link rel="icon" type="image/png" sizes="64x64" href="/static/icon-64.png" />
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <link rel="author" href="https://kobaken.co" />
            <meta name="author" content="kobaken a.k.a @kfly8" />
            <meta name="creator" content="kobaken a.k.a @kfly8" />
            {/* OGP meta tags */}
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:type" content="website" />
            <meta property="og:image" content="/static/og-image.png" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            <link rel="stylesheet" href="/static/globals.css" />
            <link rel="stylesheet" href="/static/uno.css" />
          </head>
          <body>
            <Header searchSlot={<SearchPlaceholder />} themeSwitcher={<ThemeSwitcher />} />
            <main>
              {children}
            </main>
            <BfScripts />
          </body>
        </html>
      </WithPredictableIds>
    )
  },
  { stream: true }
)
