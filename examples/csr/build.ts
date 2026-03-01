/**
 * BarefootJS CSR build script
 *
 * Compiles JSX components into client JS only (no marked templates needed).
 * Uses HonoAdapter for compilation but only outputs clientJs files.
 *
 * Output:
 *   dist/components/barefoot.js    - @barefootjs/dom runtime
 *   dist/components/{Name}.client.js - Component client JS with template function
 */

import { compileJSX, combineParentChildClientJs } from '@barefootjs/jsx'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const SHARED_COMPONENTS_DIR = resolve(ROOT_DIR, '../shared/components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

await mkdir(DIST_COMPONENTS_DIR, { recursive: true })

// Check if file has "use client" directive
function hasUseClientDirective(content: string): boolean {
  let trimmed = content.trimStart()
  while (trimmed.startsWith('/*')) {
    const endIndex = trimmed.indexOf('*/')
    if (endIndex === -1) break
    trimmed = trimmed.slice(endIndex + 2).trimStart()
  }
  while (trimmed.startsWith('//')) {
    const endIndex = trimmed.indexOf('\n')
    if (endIndex === -1) break
    trimmed = trimmed.slice(endIndex + 1).trimStart()
  }
  return trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")
}

// Discover shared component files
const sharedComponents = (await readdir(SHARED_COMPONENTS_DIR))
  .filter(f => f.endsWith('.tsx'))
  .map(f => resolve(SHARED_COMPONENTS_DIR, f))

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

// Track component names for combining
const clientJsFiles = new Map<string, string>()

// Compile each component
for (const entryPath of sharedComponents) {
  const sourceContent = await Bun.file(entryPath).text()
  if (!hasUseClientDirective(sourceContent)) {
    continue
  }

  const baseFileName = entryPath.split('/').pop()!
  const baseNameNoExt = baseFileName.replace('.tsx', '')
  const clientJsFilename = `${baseNameNoExt}.client.js`

  const adapter = new HonoAdapter()
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { adapter })

  const errors = result.errors.filter(e => e.severity === 'error')
  const warnings = result.errors.filter(e => e.severity === 'warning')

  if (warnings.length > 0) {
    console.warn(`Warnings compiling ${baseFileName}:`)
    for (const warning of warnings) {
      console.warn(`  ${warning.message}`)
    }
  }

  if (errors.length > 0) {
    console.error(`Errors compiling ${baseFileName}:`)
    for (const error of errors) {
      console.error(`  ${error.message}`)
    }
    continue
  }

  // Extract only client JS (ignore marked template)
  const clientJsFile = result.files.find(f => f.type === 'clientJs')
  if (clientJsFile) {
    await Bun.write(resolve(DIST_COMPONENTS_DIR, clientJsFilename), clientJsFile.content)
    console.log(`Generated: dist/components/${clientJsFilename}`)
    clientJsFiles.set(baseNameNoExt, clientJsFile.content)
  }
}

// Combine parent-child client JS into single files
const combined = combineParentChildClientJs(clientJsFiles)
for (const [name, content] of combined) {
  const filename = `${name}.client.js`
  await Bun.write(resolve(DIST_COMPONENTS_DIR, filename), content)
  console.log(`Combined: dist/components/${filename}`)
}

console.log('\nCSR build complete!')
