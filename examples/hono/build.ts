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
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

await mkdir(DIST_COMPONENTS_DIR, { recursive: true })

// Discover component files from components directory
// Exclude Async*.tsx files (plain async wrappers, not BarefootJS components)
const componentFiles = (await readdir(COMPONENTS_DIR))
  .filter(f => f.endsWith('.tsx') && !f.startsWith('Async'))
  .map(f => resolve(COMPONENTS_DIR, f))

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
for (const entryPath of componentFiles) {
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { serverAdapter: honoServerAdapter })

  for (const file of result.files) {
    // Server JSX file - output to dist/components/
    const baseFileName = file.sourcePath.split('/').pop()!
    const jsxFileName = baseFileName
    await Bun.write(resolve(DIST_COMPONENTS_DIR, jsxFileName), file.serverJsx)
    console.log(`Generated: dist/components/${jsxFileName}`)

    // Client JS
    if (file.hasClientJs) {
      await Bun.write(resolve(DIST_DIR, file.clientJsFilename), file.clientJs)
      console.log(`Generated: dist/${file.clientJsFilename}`)
    }

    // Manifest entries for file-level script deduplication
    // Key format: __file_{sourcePath} with non-alphanumeric chars replaced by underscores
    const fileKey = `__file_${file.sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`
    const serverJsxPath = `components/${jsxFileName}`
    manifest[fileKey] = {
      serverJsx: serverJsxPath,
      clientJs: file.hasClientJs ? file.clientJsFilename : undefined,
      props: [],
    }

    // Manifest entries for each component in file
    for (const compName of file.componentNames) {
      manifest[compName] = {
        serverJsx: serverJsxPath,
        clientJs: file.hasClientJs ? file.clientJsFilename : undefined,
        props: file.componentProps[compName],
      }
    }
  }
}

// Output manifest (in components/ alongside the server JSX files)
await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/components/manifest.json')

console.log('\nBuild complete!')
