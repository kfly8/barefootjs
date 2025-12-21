/**
 * BarefootJS Renderer
 *
 * レイアウトとクライアントJSの自動挿入を担当
 * 使用されたコンポーネントのみスクリプトを読み込む
 */

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import manifest from './dist/manifest.json'

// クライアントJSのscriptタグを生成（使用されたコンポーネントのみ）
function getScriptTags(usedComponents: string[]): string[] {
  const scripts: string[] = []

  // 使用されたコンポーネントがある場合のみbarefoot.jsを読み込む
  if (usedComponents.length > 0) {
    const barefootJs = manifest['__barefoot__']?.clientJs
    if (barefootJs) {
      scripts.push(`<script type="module" src="/static/${barefootJs}"></script>`)
    }
  }

  // 使用されたコンポーネントのclient.jsのみ
  for (const name of usedComponents) {
    const entry = manifest[name as keyof typeof manifest]
    if (entry?.clientJs) {
      scripts.push(`<script type="module" src="/static/${entry.clientJs}"></script>`)
    }
  }

  return scripts
}

// 子要素描画後にスクリプトを挿入するコンポーネント
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
        <title>BarefootJS + Hono Counter</title>
        <style>{`
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
          h1 { color: #333; }
          .counter { font-size: 3rem; font-weight: bold; }
          .doubled { color: #666; }
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
