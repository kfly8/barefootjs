/**
 * BarefootJS + Mojolicious build script
 *
 * Generates Client JS for use with Mojolicious EP templates:
 * - public/js/barefoot.js (runtime)
 * - public/js/{Component}-{hash}.js (client JS)
 */

import { compileJSX, type PropWithType } from '@barefootjs/jsx'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const DIST_DIR = resolve(ROOT_DIR, 'public/js')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

await mkdir(DIST_DIR, { recursive: true })

// Discover all component files
const componentFiles = (await readdir(COMPONENTS_DIR))
  .filter(f => f.endsWith('.tsx'))
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
console.log(`Generated: public/js/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; props: PropWithType[] }> = {}

// Compile each component
for (const entryPath of componentFiles) {
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  })

  for (const file of result.files) {
    // Client JS
    if (file.hasClientJs) {
      await Bun.write(resolve(DIST_DIR, file.clientJsFilename), file.clientJs)
      console.log(`Generated: public/js/${file.clientJsFilename}`)

      // Manifest entries for each component in file
      for (const compName of file.componentNames) {
        manifest[compName] = {
          clientJs: file.clientJsFilename,
          props: file.componentProps[compName],
        }
      }
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: public/js/manifest.json')

console.log('\nBuild complete!')
