/**
 * BarefootJS + Hono/JSX build script
 *
 * Generates Marked JSX components for use with hono/jsx:
 * - dist/{Component}.tsx (Marked JSX component)
 * - dist/{basename}-{hash}.js (client JS)
 * - dist/manifest.json
 */

import { compileJSX } from '@barefootjs/jsx'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
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

// Add script collection wrapper to SSR component (Suspense-aware)
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

  // Suspense-aware script collection code
  // - Checks bfScriptsRendered flag to detect if inside Suspense boundary
  // - If inside Suspense (BfScripts already rendered), outputs scripts inline
  // - If outside Suspense, collects scripts for BfScripts to output later
  const scriptCollector = `
  // Script collection for client JS hydration (Suspense-aware)
  let __shouldOutputInline = false
  let __shouldOutputBarefoot = false
  let __shouldOutputThis = false
  const __barefootSrc = '/static/components/barefoot.js'
  const __thisSrc = '/static/components/${clientJsPath}'
  try {
    const __c = useRequestContext()
    const __outputScripts: Set<string> = __c.get('bfOutputScripts') || new Set()
    const __scriptsRendered = __c.get('bfScriptsRendered') ?? false

    // Check if we need to output each script (not already output)
    __shouldOutputBarefoot = !__outputScripts.has('__barefoot__')
    __shouldOutputThis = !__outputScripts.has('${componentId}')

    if (__scriptsRendered) {
      // BfScripts already rendered (e.g., inside Suspense boundary)
      // Output scripts inline and mark as output
      __shouldOutputInline = true
      if (__shouldOutputBarefoot) __outputScripts.add('__barefoot__')
      if (__shouldOutputThis) __outputScripts.add('${componentId}')
    } else {
      // BfScripts not yet rendered - collect for deferred rendering
      const __scripts: { src: string }[] = __c.get('bfCollectedScripts') || []
      if (__shouldOutputBarefoot) {
        __outputScripts.add('__barefoot__')
        __scripts.push({ src: __barefootSrc })
      }
      if (__shouldOutputThis) {
        __outputScripts.add('${componentId}')
        __scripts.push({ src: __thisSrc })
      }
      __c.set('bfCollectedScripts', __scripts)
    }
    __c.set('bfOutputScripts', __outputScripts)
  } catch {
    // Context unavailable - output inline as fallback
    __shouldOutputInline = true
    __shouldOutputBarefoot = true
    __shouldOutputThis = true
  }
`

  // Inline script tags to append to JSX return (for Suspense boundaries)
  const inlineScripts = `
      {__shouldOutputInline && __shouldOutputBarefoot && <script type="module" src={__barefootSrc} />}
      {__shouldOutputInline && __shouldOutputThis && <script type="module" src={__thisSrc} />}`

  // Insert script collector at the start of each export function
  let modifiedRest = restOfFile.replace(
    /export function (\w+)\(([^)]*)\)([^{]*)\{/g,
    (_match, name, params, rest) => {
      return `export function ${name}(${params})${rest}{${scriptCollector}`
    }
  )

  // Add inline scripts to JSX return statements
  // Handle both Fragment and regular element returns
  modifiedRest = addInlineScriptsToReturn(modifiedRest, inlineScripts)

  return beforeImports + existingImports + importStatement + modifiedRest
}

// Add inline scripts to return statements in component functions
function addInlineScriptsToReturn(content: string, inlineScripts: string): string {
  // Strategy: Find return statements with Fragment roots (<>...</>)
  // and insert inline scripts before the closing </>

  // For Fragment roots: insert before the last </> in the return statement
  // For single element roots: wrap in Fragment and add scripts

  // First, handle Fragment root pattern: return (\n    <>....</>)
  // Find the pattern "return (" followed by JSX ending with "</>" before ")"
  let result = content

  // Match return statements - we need to find return ( ... ) and modify the JSX inside
  // Use a simple approach: find all </> that appear to be closing a Fragment in a return
  // and insert the scripts before them

  // Pattern: Find `</>` followed by optional whitespace and `)` which closes the return
  // This indicates the end of a Fragment return statement
  result = result.replace(
    /(<\/>)(\s*\))/g,
    (_match, closeFragment, closeParen) => {
      return `${inlineScripts}\n    ${closeFragment}${closeParen}`
    }
  )

  return result
}

// Discover all component files
// The compiler handles "use client" filtering:
// - Files with "use client" are included in output
// - Files without "use client" are processed for dependency resolution only
// - Files importing @barefootjs/dom without "use client" will error
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
  resolve(DIST_COMPONENTS_DIR, barefootFileName),
  Bun.file(domDistFile)
)
console.log(`Generated: dist/components/${barefootFileName}`)

// Manifest - simplified structure for v2
const manifest: Record<string, { clientJs?: string; markedJsx: string }> = {
  '__barefoot__': { markedJsx: '', clientJs: `components/${barefootFileName}` }
}

// Compile each component
for (const entryPath of componentFiles) {
  // Check if file has "use client" directive
  const sourceContent = await Bun.file(entryPath).text()
  if (!hasUseClientDirective(sourceContent)) {
    continue // Skip server-only components
  }

  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  })

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
    if (file.type === 'markedJsx') {
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

  // Write Marked JSX (with script collection wrapper if client JS exists)
  if (markedJsxContent) {
    const finalContent = hasClientJs
      ? addScriptCollection(markedJsxContent, baseNameNoExt, clientJsFilename)
      : markedJsxContent
    await Bun.write(resolve(DIST_COMPONENTS_DIR, baseFileName), finalContent)
    console.log(`Generated: dist/components/${baseFileName}`)
  }

  // Manifest entry
  const markedJsxPath = `components/${baseFileName}`
  const clientJsPath = hasClientJs ? `components/${clientJsFilename}` : undefined

  manifest[baseNameNoExt] = {
    markedJsx: markedJsxPath,
    clientJs: clientJsPath,
  }
}

// Output manifest (in components/ alongside the Marked JSX files)
await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/components/manifest.json')

console.log('\nBuild complete!')
