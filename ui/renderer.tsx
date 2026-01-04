/**
 * BarefootJS Components Renderer
 *
 * Uses hono/jsx-renderer with UnoCSS.
 * BfScripts component renders collected script tags at body end.
 */

import { jsxRenderer } from 'hono/jsx-renderer'
import { BfScripts } from '../packages/hono/src/scripts'

export const renderer = jsxRenderer(
  ({ children }) => {
    return (
      <html lang="en" class="dark">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BarefootJS Components</title>
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
          {children}
          <BfScripts />
        </body>
      </html>
    )
  },
  { stream: true }
)
