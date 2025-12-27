/**
 * BarefootJS UI build script
 *
 * Generates (file-based output):
 * - dist/{source-path}.tsx (Marked JSX with all components from source)
 * - dist/{source-path}-{hash}.js (Client JS with all init functions)
 * - dist/barefoot.js (Runtime)
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

// Entry files to compile
const ENTRIES: string[] = [
  'components/Badge.tsx',
  'components/Button.tsx',
  'components/Checkbox.tsx',
  'components/Input.tsx',
  'pages/badge.tsx',
  'pages/button.tsx',
  'pages/checkbox.tsx',
  'pages/input.tsx',
]

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

// Manifest (file-based: maps file path to client JS)
type ManifestEntry = {
  clientJs?: string
  serverJsx: string
  props: PropWithType[]
}
const manifest: Record<string, ManifestEntry> = {
  '__barefoot__': { serverJsx: '', clientJs: barefootFileName, props: [] }
}

// Track all generated files for index.ts generation
const generatedFiles: Map<string, { sourcePath: string; componentNames: string[] }> = new Map()

// Compile each entry
for (const source of ENTRIES) {
  const entryPath = resolve(ROOT_DIR, source)
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { serverAdapter: honoServerAdapter, rootDir: ROOT_DIR })

  // Use file-based output
  for (const file of result.files) {
    // Create output directory
    const sourceDir = file.sourcePath.includes('/')
      ? file.sourcePath.substring(0, file.sourcePath.lastIndexOf('/'))
      : ''
    const targetDir = sourceDir ? resolve(DIST_DIR, sourceDir) : DIST_DIR
    await mkdir(targetDir, { recursive: true })

    // Write server JSX (preserves original filename)
    await Bun.write(resolve(DIST_DIR, file.sourcePath), file.serverJsx)
    console.log(`Generated: dist/${file.sourcePath}`)

    // Write client JS (same directory)
    let clientJsPath: string | undefined
    if (file.hasClientJs) {
      clientJsPath = sourceDir ? `${sourceDir}/${file.clientJsFilename}` : file.clientJsFilename
      await Bun.write(resolve(DIST_DIR, clientJsPath), file.clientJs)
      console.log(`Generated: dist/${clientJsPath}`)
    }

    // Track for index.ts generation
    generatedFiles.set(file.sourcePath, {
      sourcePath: file.sourcePath,
      componentNames: file.componentNames,
    })

    // Add file-level manifest entry
    const fileKey = `__file_${file.sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`
    manifest[fileKey] = {
      serverJsx: file.sourcePath,
      clientJs: clientJsPath,
      props: [],
    }

    // Add component-level manifest entries (for backward compatibility)
    for (const componentName of file.componentNames) {
      manifest[componentName] = {
        serverJsx: file.sourcePath,
        clientJs: clientJsPath,
        props: file.componentProps[componentName] || [],
      }
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

// Generate index files for subdirectories (for re-exporting)
const dirExports: Map<string, Array<{ fileName: string; componentNames: string[] }>> = new Map()
for (const [sourcePath, info] of generatedFiles) {
  if (!sourcePath.includes('/')) continue
  const dir = sourcePath.substring(0, sourcePath.lastIndexOf('/'))
  const fileName = sourcePath.split('/').pop()!.replace('.tsx', '')
  if (!dirExports.has(dir)) dirExports.set(dir, [])
  dirExports.get(dir)!.push({ fileName, componentNames: info.componentNames })
}

for (const [dir, files] of dirExports) {
  // Export each component from its source file
  const exports = files.flatMap(f =>
    f.componentNames.map(name => `export { ${name} } from './${f.fileName}'`)
  ).join('\n')
  await Bun.write(resolve(DIST_DIR, dir, 'index.ts'), exports + '\n')
  console.log(`Generated: dist/${dir}/index.ts`)
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
