/**
 * BarefootJS + Hono Counter ビルドスクリプト
 */

import { compileJSX } from '../../jsx/compiler'
import { mkdir, cp } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const CORE_DIR = resolve(ROOT_DIR, '../../core')

// dist/ ディレクトリを作成
await mkdir(DIST_DIR, { recursive: true })

// コンパイル
const entryPath = resolve(ROOT_DIR, 'index.tsx')
const result = await compileJSX(entryPath, async (path) => {
  return await Bun.file(path).text()
})

// コンポーネントJSを出力
for (const component of result.components) {
  const filename = `${component.name}.js`
  await Bun.write(resolve(DIST_DIR, filename), component.js)
  console.log(`Generated: dist/${filename}`)
}

// barefoot.js をコピー
await cp(resolve(CORE_DIR, 'runtime.js'), resolve(DIST_DIR, 'barefoot.js'))
console.log('Copied: dist/barefoot.js')

// index.html を生成
const scriptTags = result.components
  .map(c => `<script type="module" src="/${c.name}.js"></script>`)
  .join('\n  ')

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BarefootJS + Hono Counter</title>
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

await Bun.write(resolve(DIST_DIR, 'index.html'), html)
console.log('Generated: dist/index.html')

console.log('\nBuild complete! Run `bun run dev` to start the server.')
