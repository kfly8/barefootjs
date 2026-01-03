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
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BarefootJS Components</title>
          <link rel="stylesheet" href="/static/uno.css" />
          <style>{`
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              max-width: 720px;
              margin: 0 auto;
              padding: 3rem 1.5rem;
              background: #09090b;
              color: #fafafa;
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
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
