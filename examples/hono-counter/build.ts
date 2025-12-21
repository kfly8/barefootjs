/**
 * BarefootJS + Hono Counter ビルドスクリプト
 *
 * Counter.tsx から：
 * - dist/Counter.tsx（サーバー用コンポーネント）
 * - dist/Counter.client-{hash}.js（クライアント用JS）
 * - dist/manifest.json（マニフェスト）
 * を生成する
 */

import { compileJSX } from '../../jsx/compiler'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const CORE_DIR = resolve(ROOT_DIR, '../../core')

function contentHash(content: string): string {
  return Bun.hash(content).toString(16).slice(0, 8)
}

await mkdir(DIST_DIR, { recursive: true })

// barefoot.js（ハッシュ付き）を先に生成
const barefootContent = await Bun.file(resolve(CORE_DIR, 'runtime.js')).text()
const barefootHash = contentHash(barefootContent)
const barefootFileName = `barefoot-${barefootHash}.js`
await Bun.write(resolve(DIST_DIR, barefootFileName), barefootContent)
console.log(`Generated: dist/${barefootFileName}`)

// コンパイル
const entryPath = resolve(ROOT_DIR, 'Counter.tsx')
const result = await compileJSX(entryPath, async (path) => {
  return await Bun.file(path).text()
})

// マニフェスト
const manifest: Record<string, { clientJs?: string; serverComponent: string }> = {
  '__barefoot__': { serverComponent: '', clientJs: barefootFileName }
}

// 各コンポーネントを出力
for (const component of result.components) {
  // サーバー用コンポーネント
  const serverFileName = `${component.name}.tsx`
  await Bun.write(resolve(DIST_DIR, serverFileName), component.serverComponent)
  console.log(`Generated: dist/${serverFileName}`)

  // クライアント用JS（importパスを書き換え、ハッシュ付き）
  let clientFileName: string | undefined
  if (component.clientJs) {
    const updatedClientJs = component.clientJs.replace(
      /from ['"]\.\/barefoot\.js['"]/g,
      `from './${barefootFileName}'`
    )
    const hash = contentHash(updatedClientJs)
    clientFileName = `${component.name}.client-${hash}.js`
    await Bun.write(resolve(DIST_DIR, clientFileName), updatedClientJs)
    console.log(`Generated: dist/${clientFileName}`)
  }

  manifest[component.name] = {
    serverComponent: serverFileName,
    clientJs: clientFileName,
  }
}

// マニフェストを出力
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
