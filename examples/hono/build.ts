/**
 * BarefootJS + Hono build script
 *
 * From each component (Counter.tsx, Toggle.tsx, etc.), generates:
 * - dist/{Component}.tsx (server component)
 * - dist/{Component}.client-{hash}.js (client JS)
 * - dist/manifest.json (manifest)
 */

import { compileJSX } from '../../jsx'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_DIR = resolve(ROOT_DIR, '../../dom')

// Components to compile
const COMPONENTS = ['Counter', 'Toggle', 'TodoApp', 'TodoItem', 'AddTodoForm']

function contentHash(content: string): string {
  return Bun.hash(content).toString(16).slice(0, 8)
}

await mkdir(DIST_DIR, { recursive: true })

// Generate barefoot.js (with hash) first
const barefootContent = await Bun.file(resolve(DOM_DIR, 'runtime.js')).text()
const barefootHash = contentHash(barefootContent)
const barefootFileName = `barefoot-${barefootHash}.js`
await Bun.write(resolve(DIST_DIR, barefootFileName), barefootContent)
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
  })

  for (const component of result.components) {
    // Server component
    const serverFileName = `${component.name}.tsx`
    await Bun.write(resolve(DIST_DIR, serverFileName), component.serverComponent)
    console.log(`Generated: dist/${serverFileName}`)

    // Client JS (rewrite import paths, with hash)
    let clientFileName: string | undefined
    if (component.clientJs) {
      let updatedClientJs = component.clientJs.replace(
        /from ['"]\.\/barefoot\.js['"]/g,
        `from './${barefootFileName}'`
      )

      // Special handling for TodoApp - add initialization code
      if (component.name === 'TodoApp') {
        updatedClientJs += `

// Initial data fetch (manually added)
fetch('/api/todos')
  .then(res => res.json())
  .then(data => {
    setTodos(data.map(t => ({ ...t, editing: false })))
  })
  .catch(err => {
    console.error('Failed to load todos:', err)
  })
`
      }

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
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
