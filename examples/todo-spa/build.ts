/**
 * BarefootJS + Hono Todo SPA build script
 *
 * Compiles TodoApp and its dependencies
 */

import { compileJSX } from '../../jsx'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = __dirname
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_DIR = resolve(ROOT_DIR, '../../dom')

// Components to compile
const COMPONENTS = ['TodoApp']

function contentHash(content: string): string {
  return createHash('md5').update(content).digest('hex').slice(0, 8)
}

await mkdir(DIST_DIR, { recursive: true })

// Generate barefoot.js (with hash) first
const barefootContent = await readFile(resolve(DOM_DIR, 'runtime.js'), 'utf-8')
const barefootHash = contentHash(barefootContent)
const barefootFileName = `barefoot-${barefootHash}.js`
await writeFile(resolve(DIST_DIR, barefootFileName), barefootContent)
console.log(`Generated: dist/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; serverComponent: string }> = {
  '__barefoot__': { serverComponent: '', clientJs: barefootFileName }
}

// Compile each component
for (const componentName of COMPONENTS) {
  const entryPath = resolve(ROOT_DIR, `${componentName}.tsx`)
  const result = await compileJSX(entryPath, async (path) => {
    return await readFile(path, 'utf-8')
  })

  for (const component of result.components) {
    // Server component
    const serverFileName = `${component.name}.tsx`
    await writeFile(resolve(DIST_DIR, serverFileName), component.serverComponent)
    console.log(`Generated: dist/${serverFileName}`)

    // Client JS (rewrite import paths, with hash)
    let clientFileName: string | undefined
    if (component.clientJs) {
      const updatedClientJs = component.clientJs.replace(
        /from ['"]\.\/barefoot\.js['"]/g,
        `from './${barefootFileName}'`
      )
      const hash = contentHash(updatedClientJs)
      clientFileName = `${component.name}.client-${hash}.js`
      await writeFile(resolve(DIST_DIR, clientFileName), updatedClientJs)
      console.log(`Generated: dist/${clientFileName}`)
    }

    manifest[component.name] = {
      serverComponent: serverFileName,
      clientJs: clientFileName,
    }
  }
}

// Output manifest
await writeFile(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
