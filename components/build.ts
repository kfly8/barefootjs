/**
 * BarefootJS Components build script
 *
 * Generates:
 * - dist/{Component}.tsx (server JSX component)
 * - dist/{Component}-{hash}.js (client JS)
 * - dist/uno.css (UnoCSS output)
 * - dist/manifest.json
 */

import { compileJSX, type PropWithType } from '@barefootjs/jsx'
import { honoServerAdapter } from '@barefootjs/hono'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../packages/dom')

// Components to compile
const COMPONENTS = [
  'button/index.tsx',
  'pages/button.tsx',
]

await mkdir(DIST_DIR, { recursive: true })

// Build and copy barefoot.js from @barefootjs/dom
const barefootFileName = 'barefoot.js'
const domDistFile = resolve(DOM_PKG_DIR, 'dist/index.js')

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
for (const entry of COMPONENTS) {
  const entryPath = resolve(ROOT_DIR, entry)
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
