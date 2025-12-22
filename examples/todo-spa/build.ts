/**
 * BarefootJS + Hono Todo SPA build script
 *
 * Compiles TodoApp and its dependencies
 */

import { compileJSX, honoServerAdapter } from '../../jsx'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_DIR = resolve(ROOT_DIR, '../../dom')

// Components to compile
const COMPONENTS = ['TodoApp']

await mkdir(DIST_DIR, { recursive: true })

// Copy barefoot.js
await Bun.write(
  resolve(DIST_DIR, 'barefoot.js'),
  Bun.file(resolve(DOM_DIR, 'runtime.js'))
)
console.log('Copied: dist/barefoot.js')

// Manifest
const manifest: Record<string, { clientJs?: string; serverComponent: string }> = {
  '__barefoot__': { serverComponent: '', clientJs: 'barefoot.js' }
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

    // Client JS (use compiler-generated filename)
    if (component.clientJs) {
      let clientJs = component.clientJs

      // Special handling for TodoApp - add initialization code
      if (component.name === 'TodoApp') {
        clientJs += `

// Initial data fetch (manually added)
fetch('/api/todos')
  .then(res => res.json())
  .then(data => {
    const loadingEl = document.getElementById('loading-indicator')
    const contentEl = document.getElementById('main-content')
    if (loadingEl) loadingEl.classList.add('hidden')
    if (contentEl) contentEl.classList.remove('hidden')

    setTodos(data.map(t => ({ ...t, editing: false })))
  })
  .catch(err => {
    const loadingEl = document.getElementById('loading-indicator')
    const contentEl = document.getElementById('main-content')
    const errorEl = document.getElementById('error-message')

    if (loadingEl) loadingEl.classList.add('hidden')
    if (contentEl) contentEl.classList.remove('hidden')
    if (errorEl) {
      errorEl.textContent = 'Failed to load todos: ' + err.message
      errorEl.style.display = 'block'
    }
  })
`
      }

      await Bun.write(resolve(DIST_DIR, component.filename), clientJs)
      console.log(`Generated: dist/${component.filename}`)
    }

    manifest[component.name] = {
      serverComponent: serverFileName,
      clientJs: component.filename,
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
