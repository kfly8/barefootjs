/**
 * BarefootJS Renderer for Todo SPA
 *
 * Handles layout and automatic client JS injection.
 */

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import manifest from './dist/manifest.json'

// Generate script tags for client JS
function getScriptTags(usedComponents: string[]): string[] {
  const scripts: string[] = []

  if (usedComponents.length > 0) {
    const barefootJs = manifest['__barefoot__']?.clientJs
    if (barefootJs) {
      scripts.push(`<script type="module" src="/static/${barefootJs}"></script>`)
    }
  }

  for (const name of usedComponents) {
    const entry = manifest[name as keyof typeof manifest]
    if (entry?.clientJs) {
      scripts.push(`<script type="module" src="/static/${entry.clientJs}"></script>`)
    }
  }

  return scripts
}

function Scripts() {
  const c = useRequestContext()
  const usedComponents: string[] = c.get('usedComponents') || []
  const scripts = getScriptTags(usedComponents)
  return <footer dangerouslySetInnerHTML={{ __html: scripts.join('\n') }} />
}

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BarefootJS Todo SPA</title>
        <style>{`
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
          
          .add-form {
            display: flex;
            gap: 0.5rem;
            margin: 1rem 0;
          }
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
          .add-btn:hover {
            background: #45a049;
          }
          
          .todo-list {
            list-style: none;
            padding: 0;
          }
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
          .todo-item.done .todo-text {
            text-decoration: line-through;
            color: #999;
          }
          .todo-text {
            flex: 1;
            cursor: pointer;
            font-size: 1rem;
          }
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
          .toggle-btn {
            background: #2196F3;
            color: white;
          }
          .toggle-btn:hover {
            background: #1976D2;
          }
          .delete-btn {
            background: #f44336;
            color: white;
          }
          .delete-btn:hover {
            background: #d32f2f;
          }
          
          .loading {
            text-align: center;
            padding: 2rem;
            color: #999;
          }
          .error {
            background: #ffebee;
            color: #c62828;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
          }
        `}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
})
