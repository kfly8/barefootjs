/**
 * BarefootJS + Hono/JSX build script
 *
 * Generates Marked Template components for use with hono/jsx:
 * - dist/{Component}.tsx (Marked Template component)
 * - dist/{basename}-{hash}.js (client JS)
 * - dist/manifest.json
 */

import { compileJSX, combineParentChildClientJs } from '@barefootjs/jsx'
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

// Add script collection wrapper to SSR component
function addScriptCollection(content: string, componentId: string, clientJsPath: string): string {
  // Add import for useRequestContext
  const importStatement = "import { useRequestContext } from 'hono/jsx-renderer'\n"

  // Find the last import statement and add our import after it
  const importMatch = content.match(/^([\s\S]*?)((?:import[^\n]+\n)*)/m)
  if (!importMatch) {
    return content
  }

  const beforeImports = importMatch[1]
  const existingImports = importMatch[2]
  const restOfFile = content.slice(importMatch[0].length)

  // Script collection code to insert at the start of each component function
  const scriptCollector = `
  // Script collection for client JS hydration
  try {
    const __c = useRequestContext()
    const __scripts: { src: string }[] = __c.get('bfCollectedScripts') || []
    const __outputScripts: Set<string> = __c.get('bfOutputScripts') || new Set()
    if (!__outputScripts.has('__barefoot__')) {
      __outputScripts.add('__barefoot__')
      __scripts.push({ src: '/static/components/barefoot.js' })
    }
    if (!__outputScripts.has('${componentId}')) {
      __outputScripts.add('${componentId}')
      __scripts.push({ src: '/static/components/${clientJsPath}' })
    }
    __c.set('bfCollectedScripts', __scripts)
    __c.set('bfOutputScripts', __outputScripts)
  } catch {}
`

  // Insert script collector at the start of each export function
  const modifiedRest = restOfFile.replace(
    /export function (\w+)\(([^)]*)\)([^{]*)\{/g,
    (match, name, params, rest) => {
      return `export function ${name}(${params})${rest}{${scriptCollector}`
    }
  )

  return beforeImports + existingImports + importStatement + modifiedRest
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

// Compile each component
for (const entryPath of componentFiles) {
  // Check if file has "use client" directive
  const sourceContent = await Bun.file(entryPath).text()
  if (!hasUseClientDirective(sourceContent)) {
    continue // Skip server-only components
  }

  // Extract base file name from entry path
  const baseFileName = entryPath.split('/').pop()!
  const baseNameNoExt = baseFileName.replace('.tsx', '')
  const clientJsFilename = `${baseNameNoExt}.client.js`

  // Create HonoAdapter (script collection is handled via addScriptCollection post-processing)
  const adapter = new HonoAdapter()

  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { adapter })

  // Separate errors and warnings
  const errors = result.errors.filter(e => e.severity === 'error')
  const warnings = result.errors.filter(e => e.severity === 'warning')

  // Show warnings but continue
  if (warnings.length > 0) {
    console.warn(`Warnings compiling ${entryPath}:`)
    for (const warning of warnings) {
      console.warn(`  ${warning.message}`)
    }
  }

  // Only skip on actual errors
  if (errors.length > 0) {
    console.error(`Errors compiling ${entryPath}:`)
    for (const error of errors) {
      console.error(`  ${error.message}`)
    }
    continue
  }

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

  // Write Client JS
  const hasClientJs = clientJsContent.length > 0

  if (hasClientJs) {
    await Bun.write(resolve(DIST_COMPONENTS_DIR, clientJsFilename), clientJsContent)
    console.log(`Generated: dist/components/${clientJsFilename}`)
  }

  // Write Marked Template (with script collection wrapper if client JS exists)
  if (markedJsxContent && hasClientJs) {
    const wrappedContent = addScriptCollection(markedJsxContent, baseNameNoExt, clientJsFilename)
    await Bun.write(resolve(DIST_COMPONENTS_DIR, baseFileName), wrappedContent)
    console.log(`Generated: dist/components/${baseFileName}`)
  } else if (markedJsxContent) {
    await Bun.write(resolve(DIST_COMPONENTS_DIR, baseFileName), markedJsxContent)
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

// Combine parent-child client JS into single files
async function combineClientJs(manifestData: typeof manifest): Promise<void> {
  const files = new Map<string, string>()
  for (const [name, entry] of Object.entries(manifestData)) {
    if (!entry.clientJs) continue
    const filePath = resolve(DIST_DIR, entry.clientJs)
    files.set(name, await Bun.file(filePath).text())
  }

  const combined = combineParentChildClientJs(files)
  for (const [name, content] of combined) {
    const entry = manifestData[name]
    if (!entry?.clientJs) continue
    await Bun.write(resolve(DIST_DIR, entry.clientJs), content)
    console.log(`Combined: ${entry.clientJs}`)
  }
}

// Combine parent-child client JS
await combineClientJs(manifest)

console.log('\nBuild complete!')
