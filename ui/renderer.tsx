/**
 * BarefootJS Components Renderer
 *
 * Uses hono/jsx-renderer with UnoCSS.
 * BfScripts component renders collected script tags at body end.
 */

import { jsxRenderer } from 'hono/jsx-renderer'
import { BfScripts } from '../packages/hono/src/scripts'
import { ThemeSwitcher } from './dist/components/ThemeSwitcher'

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
  ({ children }) => {
    return (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BarefootJS Components</title>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <link rel="stylesheet" href="/static/globals.css" />
          <link rel="stylesheet" href="/static/uno.css" />
          <style>{`
            body {
              max-width: 720px;
              margin: 0 auto;
              padding: 3rem 1.5rem;
            }
          `}</style>
        </head>
        <body>
          <header class="flex justify-between items-center mb-8 pb-4 border-b border-border">
            <a href="/" class="text-lg font-semibold text-foreground hover:text-primary transition-colors">
              BarefootJS
            </a>
            <ThemeSwitcher defaultTheme="system" />
          </header>
          <main>
            {children}
          </main>
          <BfScripts />
        </body>
      </html>
    )
  },
  { stream: true }
)
