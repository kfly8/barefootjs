/**
 * カウンターのビルドスクリプト
 */

import { compileApp } from '../../jsx/plugins/jsx-compiler'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const CORE_DIR = resolve(ROOT_DIR, '../../core')

function contentHash(content: string): string {
  return Bun.hash(content).toString(16).slice(0, 8)
}

// dist/ ディレクトリを作成
await mkdir(DIST_DIR, { recursive: true })

// コンパイル
const entryPath = resolve(ROOT_DIR, 'index.tsx')
const result = await compileApp(entryPath, async (path) => {
  return await Bun.file(path).text()
})

// コンポーネントJSを出力（ハッシュ付き）
const scriptTags: string[] = []

for (const component of result.components) {
  const hash = contentHash(component.js)
  const filename = `${component.name}-${hash}.js`
  await Bun.write(resolve(DIST_DIR, filename), component.js)
  scriptTags.push(`<script type="module" src="./${filename}"></script>`)
  console.log(`Generated: dist/${filename}`)
}

// テンプレートを読み込んで HTML を生成
const template = await Bun.file(resolve(ROOT_DIR, 'template.html')).text()
const html = template
  .replace('{{title}}', 'BarefootJS Counter')
  .replace('{{content}}', result.html)
  .replace('{{scripts}}', scriptTags.join('\n  '))

await Bun.write(resolve(DIST_DIR, 'index.html'), html)
console.log('Generated: dist/index.html')

// barefoot.js をコピー
await Bun.write(
  resolve(DIST_DIR, 'barefoot.js'),
  Bun.file(resolve(CORE_DIR, 'runtime.js'))
)
console.log('Copied: dist/barefoot.js')
