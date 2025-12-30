/**
 * BarefootJS + Hono/JSX build script
 *
 * Generates server JSX components for use with hono/jsx:
 * - dist/{Component}.tsx (server JSX component)
 * - dist/{basename}-{hash}.js (client JS)
 * - dist/manifest.json
 */

import { compileJSX, type PropWithType } from '@barefootjs/jsx'
import { honoServerAdapter } from '@barefootjs/hono'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

// Components to compile
const COMPONENTS = ['Counter', 'FizzBuzzCounter', 'Toggle', 'TodoApp', 'TodoItem', 'AddTodoForm', 'Dashboard', 'Game']

await mkdir(DIST_DIR, { recursive: true })

// Build and copy barefoot.js from @barefootjs/dom
const barefootFileName = 'barefoot.js'
const domDistFile = resolve(DOM_PKG_DIR, 'dist/index.js')
// Build dom package if dist doesn't exist
if (!await Bun.file(domDistFile).exists()) {
  console.log('Building @barefootjs/dom...')
  const proc = Bun.spawn(['bun', 'run', 'build'], { cwd: DOM_PKG_DIR })
  await proc.exited
}
await Bun.write(
  resolve(DIST_DIR, barefootFileName),
  Bun.file(domDistFile)
)
console.log(`Generated: dist/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; serverJsx: string; props: PropWithType[] }> = {
  '__barefoot__': { serverJsx: '', clientJs: barefootFileName, props: [] }
}

// Compile each component
for (const componentName of COMPONENTS) {
  const entryPath = resolve(ROOT_DIR, `${componentName}.tsx`)
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { serverAdapter: honoServerAdapter })

  for (const file of result.files) {
    // Server JSX file - use base filename without path
    const baseFileName = file.sourcePath.split('/').pop()!
    const jsxFileName = baseFileName
    await Bun.write(resolve(DIST_DIR, jsxFileName), file.serverJsx)
    console.log(`Generated: dist/${jsxFileName}`)

    // Client JS
    if (file.hasClientJs) {
      await Bun.write(resolve(DIST_DIR, file.clientJsFilename), file.clientJs)
      console.log(`Generated: dist/${file.clientJsFilename}`)
    }

    // Manifest entries for file-level script deduplication
    // Key format: __file_{sourcePath} with non-alphanumeric chars replaced by underscores
    const fileKey = `__file_${file.sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`
    manifest[fileKey] = {
      serverJsx: jsxFileName,
      clientJs: file.hasClientJs ? file.clientJsFilename : undefined,
      props: [],
    }

    // Manifest entries for each component in file
    for (const compName of file.componentNames) {
      manifest[compName] = {
        serverJsx: jsxFileName,
        clientJs: file.hasClientJs ? file.clientJsFilename : undefined,
        props: file.componentProps[compName],
      }
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

console.log('\nBuild complete!')
