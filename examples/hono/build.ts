/**
 * BarefootJS + Hono build script
 *
 * From each component (Counter.tsx, Toggle.tsx, etc.), generates:
 * - dist/{Component}.tsx (server component)
 * - dist/{Component}-{hash}.js (client JS with hash from compiler)
 * - dist/manifest.json (manifest)
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
const manifest: Record<string, { clientJs?: string; serverComponent: string }> = {
  '__barefoot__': { serverComponent: '', clientJs: barefootFileName }
}

// Compile each component
for (const componentName of COMPONENTS) {
  const entryPath = resolve(ROOT_DIR, `${componentName}.tsx`)
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { serverAdapter: honoServerAdapter })

  for (const component of result.components) {
    // Server component
    const serverFileName = `${component.name}.tsx`
    await Bun.write(resolve(DIST_DIR, serverFileName), component.serverComponent)
    console.log(`Generated: dist/${serverFileName}`)

    // Client JS (using hashed filename from compiler) - only for components with client JS
    let clientFileName: string | undefined
    if (component.hasClientJs) {
      clientFileName = component.filename
      await Bun.write(resolve(DIST_DIR, clientFileName), component.clientJs)
      console.log(`Generated: dist/${clientFileName}`)
    }

    manifest[component.name] = {
      serverComponent: serverFileName,
      clientJs: clientFileName,
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
