/**
 * BarefootJS + Hono/JSX build script
 *
 * Generates server JSX components for use with hono/jsx:
 * - dist/{Component}.tsx (server JSX component)
 * - dist/{Component}-{hash}.js (client JS)
 * - dist/manifest.json
 */

import { compileJSX, honoServerAdapter } from '../../jsx'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_DIR = resolve(ROOT_DIR, '../../dom')

// Components to compile
const COMPONENTS = ['Counter', 'Toggle', 'TodoApp', 'TodoItem', 'AddTodoForm']

await mkdir(DIST_DIR, { recursive: true })

// Copy barefoot.js
const barefootFileName = 'barefoot.js'
await Bun.write(
  resolve(DIST_DIR, barefootFileName),
  Bun.file(resolve(DOM_DIR, 'runtime.js'))
)
console.log(`Generated: dist/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; serverJsx: string; props: string[] }> = {
  '__barefoot__': { serverJsx: '', clientJs: barefootFileName, props: [] }
}

// Compile each component
for (const componentName of COMPONENTS) {
  const entryPath = resolve(ROOT_DIR, `${componentName}.tsx`)
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { serverAdapter: honoServerAdapter })

  for (const component of result.components) {
    // Server JSX component
    const jsxFileName = `${component.name}.tsx`
    await Bun.write(resolve(DIST_DIR, jsxFileName), component.serverJsx)
    console.log(`Generated: dist/${jsxFileName}`)

    // Client JS
    let clientFileName: string | undefined
    if (component.hasClientJs) {
      clientFileName = component.filename
      await Bun.write(resolve(DIST_DIR, clientFileName), component.clientJs)
      console.log(`Generated: dist/${clientFileName}`)
    }

    manifest[component.name] = {
      serverJsx: jsxFileName,
      clientJs: clientFileName,
      props: component.props,
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
