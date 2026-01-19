/**
 * BarefootJS + Hono/JSX build script
 *
 * Generates Marked Template components for use with hono/jsx:
 * - dist/{Component}.tsx (Marked Template component)
 * - dist/{basename}-{hash}.js (client JS)
 * - dist/manifest.json
 */

import { compileJSX } from '@barefootjs/jsx'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const SHARED_COMPONENTS_DIR = resolve(ROOT_DIR, '../shared/components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

await mkdir(DIST_COMPONENTS_DIR, { recursive: true })

// Check if file has "use client" directive
function hasUseClientDirective(content: string): boolean {
  let trimmed = content.trimStart()
  // Skip block comments
  while (trimmed.startsWith('/*')) {
    const endIndex = trimmed.indexOf('*/')
    if (endIndex === -1) break
    trimmed = trimmed.slice(endIndex + 2).trimStart()
  }
  // Skip line comments
  while (trimmed.startsWith('//')) {
    const endIndex = trimmed.indexOf('\n')
    if (endIndex === -1) break
    trimmed = trimmed.slice(endIndex + 1).trimStart()
  }
  return trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")
}

// Generate short hash from content
function generateHash(content: string): string {
  const hash = Bun.hash(content)
  return hash.toString(16).slice(0, 8)
}

// Discover all component files from both local and shared directories
const localComponents = (await readdir(COMPONENTS_DIR))
  .filter(f => f.endsWith('.tsx'))
  .map(f => resolve(COMPONENTS_DIR, f))
const sharedComponents = (await readdir(SHARED_COMPONENTS_DIR))
  .filter(f => f.endsWith('.tsx'))
  .map(f => resolve(SHARED_COMPONENTS_DIR, f))
const componentFiles = [...localComponents, ...sharedComponents]

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
  resolve(DIST_COMPONENTS_DIR, barefootFileName),
  Bun.file(domDistFile)
)
console.log(`Generated: dist/components/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; markedTemplate: string }> = {
  '__barefoot__': { markedTemplate: '', clientJs: `components/${barefootFileName}` }
}

// Create HonoAdapter with script collection enabled
const adapter = new HonoAdapter({
  injectScriptCollection: true,
  clientJsBasePath: '/static/components/',
  barefootJsPath: '/static/components/barefoot.js',
  clientJsFilenamePlaceholder: '__CLIENT_JS_FILENAME__',
  componentIdPlaceholder: '__COMPONENT_ID__',
})

// Compile each component
for (const entryPath of componentFiles) {
  // Check if file has "use client" directive
  const sourceContent = await Bun.file(entryPath).text()
  if (!hasUseClientDirective(sourceContent)) {
    continue // Skip server-only components
  }

  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { adapter })

  if (result.errors.length > 0) {
    console.error(`Errors compiling ${entryPath}:`)
    for (const error of result.errors) {
      console.error(`  ${error.message}`)
    }
    continue
  }

  // Extract base file name from entry path
  const baseFileName = entryPath.split('/').pop()!
  const baseNameNoExt = baseFileName.replace('.tsx', '')

  // Process each output file
  let markedJsxContent = ''
  let clientJsContent = ''

  for (const file of result.files) {
    if (file.type === 'markedTemplate') {
      markedJsxContent = file.content
    } else if (file.type === 'clientJs') {
      clientJsContent = file.content
    }
  }

  // Skip if no output
  if (!markedJsxContent && !clientJsContent) {
    continue
  }

  // Write Client JS with hash
  const hasClientJs = clientJsContent.length > 0
  let clientJsFilename = ''

  if (hasClientJs) {
    const hash = generateHash(clientJsContent)
    clientJsFilename = `${baseNameNoExt}-${hash}.js`
    await Bun.write(resolve(DIST_COMPONENTS_DIR, clientJsFilename), clientJsContent)
    console.log(`Generated: dist/components/${clientJsFilename}`)
  }

  // Write Marked Template with placeholders replaced
  if (markedJsxContent) {
    let finalContent = markedJsxContent
    if (hasClientJs) {
      // Replace placeholders with actual values
      finalContent = finalContent
        .replace(/__CLIENT_JS_FILENAME__/g, clientJsFilename)
        .replace(/__COMPONENT_ID__/g, baseNameNoExt)
    }
    await Bun.write(resolve(DIST_COMPONENTS_DIR, baseFileName), finalContent)
    console.log(`Generated: dist/components/${baseFileName}`)
  }

  // Manifest entry
  const markedJsxPath = `components/${baseFileName}`
  const clientJsPath = hasClientJs ? `components/${clientJsFilename}` : undefined

  manifest[baseNameNoExt] = {
    markedTemplate: markedJsxPath,
    clientJs: clientJsPath,
  }
}

// Output manifest (in components/ alongside the Marked JSX files)
await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/components/manifest.json')

console.log('\nBuild complete!')
