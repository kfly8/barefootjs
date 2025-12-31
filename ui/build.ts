/**
 * BarefootJS UI build script
 *
 * Generates (file-based output):
 * - dist/components/{Component}.tsx (Marked JSX)
 * - dist/components/{Component}-{hash}.js (Client JS)
 * - dist/barefoot.js (Runtime)
 * - dist/uno.css (UnoCSS output)
 * - dist/manifest.json
 *
 * Note: pages/* are server components imported directly from source by server.tsx.
 * Only components/* with "use client" are compiled to dist/.
 */

import { compileJSX, type PropWithType } from '@barefootjs/jsx'
import { honoMarkedJsxAdapter } from '@barefootjs/hono'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../packages/dom')

// Discover all component files
// The compiler handles "use client" filtering:
// - Files with "use client" are included in output
// - Files without "use client" are processed for dependency resolution only
const componentFiles = (await readdir(COMPONENTS_DIR))
  .filter(f => f.endsWith('.tsx'))
  .map(f => resolve(COMPONENTS_DIR, f))

await mkdir(DIST_COMPONENTS_DIR, { recursive: true })

// Build and copy barefoot.js from @barefootjs/dom
const barefootFileName = 'barefoot.js'
const domDistFile = resolve(DOM_PKG_DIR, 'dist/index.js')

if (!await Bun.file(domDistFile).exists()) {
  console.log('Building @barefootjs/dom...')
  const proc = Bun.spawn(['bun', 'run', 'build'], { cwd: DOM_PKG_DIR })
  await proc.exited
}

await Bun.write(
  resolve(DIST_COMPONENTS_DIR, barefootFileName),
  Bun.file(domDistFile)
)
console.log(`Generated: dist/components/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; markedJsx: string; props: PropWithType[] }> = {
  '__barefoot__': { markedJsx: '', clientJs: `components/${barefootFileName}`, props: [] }
}

// Compile each component
for (const entryPath of componentFiles) {
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { markedJsxAdapter: honoMarkedJsxAdapter })

  for (const file of result.files) {
    // Marked JSX file - output to dist/components/
    const baseFileName = file.sourcePath.split('/').pop()!
    const jsxFileName = baseFileName
    await Bun.write(resolve(DIST_COMPONENTS_DIR, jsxFileName), file.markedJsx)
    console.log(`Generated: dist/components/${jsxFileName}`)

    // Client JS - colocate with Marked JSX
    if (file.hasClientJs) {
      await Bun.write(resolve(DIST_COMPONENTS_DIR, file.clientJsFilename), file.clientJs)
      console.log(`Generated: dist/components/${file.clientJsFilename}`)
    }

    // Manifest entries for file-level script deduplication
    const fileKey = `__file_${file.sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`
    const markedJsxPath = `components/${jsxFileName}`
    const clientJsPath = file.hasClientJs ? `components/${file.clientJsFilename}` : undefined
    manifest[fileKey] = {
      markedJsx: markedJsxPath,
      clientJs: clientJsPath,
      props: [],
    }

    // Manifest entries for each component in file
    for (const compName of file.componentNames) {
      manifest[compName] = {
        markedJsx: markedJsxPath,
        clientJs: clientJsPath,
        props: file.componentProps[compName] || [],
      }
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/components/manifest.json')

// Generate index.ts for re-exporting all components
const componentExports: string[] = []
for (const file of await readdir(DIST_COMPONENTS_DIR)) {
  if (file.endsWith('.tsx')) {
    const baseName = file.replace('.tsx', '')
    // Read the file to find exported component names
    const content = await Bun.file(resolve(DIST_COMPONENTS_DIR, file)).text()
    const exportMatches = content.matchAll(/export\s+(?:function|const)\s+(\w+)/g)
    for (const match of exportMatches) {
      componentExports.push(`export { ${match[1]} } from './${baseName}'`)
    }
  }
}
if (componentExports.length > 0) {
  await Bun.write(resolve(DIST_COMPONENTS_DIR, 'index.ts'), componentExports.join('\n') + '\n')
  console.log('Generated: dist/components/index.ts')
}

// Generate UnoCSS
console.log('\nGenerating UnoCSS...')
const unoProc = Bun.spawn(['bunx', 'unocss', './**/*.tsx', './dist/**/*.tsx', '-o', 'dist/uno.css'], {
  cwd: ROOT_DIR,
  stdout: 'inherit',
  stderr: 'inherit',
})
await unoProc.exited
console.log('Generated: dist/uno.css')

console.log('\nBuild complete!')
