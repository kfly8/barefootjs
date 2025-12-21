/**
 * BarefootJS + Hono SSR Server
 *
 * リクエスト時にJSXをコンパイルしてHTMLを生成し、
 * クライアント用JSをロードしてインタラクティブにする
 */

import { Hono } from 'hono'
import { compileJSX } from '../../jsx/compiler'
import { resolve, dirname } from 'node:path'

const app = new Hono()

const ROOT_DIR = dirname(import.meta.path)
const CORE_DIR = resolve(ROOT_DIR, '../../core')

// キャッシュ（開発時は無効化可能）
let compiledCache: Awaited<ReturnType<typeof compileJSX>> | null = null

async function getCompiled() {
  if (compiledCache) return compiledCache

  const entryPath = resolve(ROOT_DIR, 'index.tsx')
  compiledCache = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  })
  return compiledCache
}

// メインHTML（SSR）
app.get('/', async (c) => {
  const result = await getCompiled()

  const scriptTags = result.components
    .map(comp => `<script type="module" src="/${comp.name}.js"></script>`)
    .join('\n  ')

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BarefootJS + Hono SSR Counter</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #333; }
    .counter { font-size: 3rem; font-weight: bold; }
    .doubled { color: #666; }
    button { font-size: 1.2rem; padding: 0.5rem 1rem; margin: 0.25rem; cursor: pointer; }
  </style>
</head>
<body>
  ${result.html}
  <script type="module" src="/barefoot.js"></script>
  ${scriptTags}
</body>
</html>`

  return c.html(html)
})

// barefoot.js（ランタイム）
app.get('/barefoot.js', async (c) => {
  const content = await Bun.file(resolve(CORE_DIR, 'runtime.js')).text()
  c.header('Content-Type', 'application/javascript')
  return c.body(content)
})

// コンポーネントJS（クライアント用）
app.get('/:name.js', async (c) => {
  const name = c.req.param('name')
  const result = await getCompiled()

  const component = result.components.find(comp => comp.name === name)
  if (!component) {
    return c.notFound()
  }

  c.header('Content-Type', 'application/javascript')
  return c.body(component.js)
})

export default {
  port: 3000,
  fetch: app.fetch,
}
