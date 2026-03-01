// Core build module: shared pipeline for `barefoot build`.

import { compileJSX, combineParentChildClientJs } from '@barefootjs/jsx'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { resolve, basename, relative } from 'node:path'
import { createAdapter } from './adapter-factory'
import type { BuildSection } from '../context'

// ── Types ────────────────────────────────────────────────────────────────

export interface BuildConfig {
  /** Absolute path to the project directory (where barefoot.json lives) */
  projectDir: string
  /** Adapter name */
  adapter: string
  /** Adapter-specific options */
  adapterOptions?: Record<string, unknown>
  /** Source component directories (absolute paths) */
  componentDirs: string[]
  /** Output directory (absolute path) */
  outDir: string
  /** Minify client JS */
  minify: boolean
  /** Add content hash to filenames */
  contentHash: boolean
  /** Inject Hono script collection wrapper */
  scriptCollection: boolean
  /** Output only client JS, skip marked templates and manifest */
  clientOnly: boolean
}

export interface BuildResult {
  /** Number of components compiled */
  compiledCount: number
  /** Number of components skipped (no "use client") */
  skippedCount: number
  /** Number of compilation errors */
  errorCount: number
  /** Manifest entries */
  manifest: Record<string, { clientJs?: string; markedTemplate: string }>
}

// ── Utility functions ────────────────────────────────────────────────────

/**
 * Check if file content starts with a "use client" directive.
 * Skips leading comments (block and line).
 */
export function hasUseClientDirective(content: string): boolean {
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

/**
 * Recursively discover .tsx component files in a directory.
 * Skips .test.tsx, .spec.tsx, and .preview.tsx files.
 */
export async function discoverComponentFiles(dir: string): Promise<string[]> {
  const results: string[] = []

  let entries: { name: string; isDirectory(): boolean }[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    const fullPath = resolve(dir, String(entry.name))
    if (entry.isDirectory()) {
      results.push(...await discoverComponentFiles(fullPath))
    } else if (
      String(entry.name).endsWith('.tsx') &&
      !String(entry.name).endsWith('.test.tsx') &&
      !String(entry.name).endsWith('.spec.tsx') &&
      !String(entry.name).endsWith('.preview.tsx')
    ) {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * Generate a short content hash string (8 hex chars).
 */
export function generateHash(content: string): string {
  const hash = Bun.hash(content)
  return hash.toString(16).slice(0, 8)
}

/**
 * Add Hono script collection wrapper to an SSR marked template.
 * Injects imports, a helper function, and script collector into each
 * exported component function.
 */
export function addScriptCollection(content: string, componentId: string, clientJsPath: string): string {
  const importStatement = "import { useRequestContext } from 'hono/jsx-renderer'\nimport { Fragment } from 'hono/jsx'\n"

  // Find the last import statement and add our import after it
  const importMatch = content.match(/^([\s\S]*?)((?:import[^\n]+\n)*)/m)
  if (!importMatch) {
    return content
  }

  const beforeImports = importMatch[1]
  const existingImports = importMatch[2]
  const restOfFile = content.slice(importMatch[0].length)

  // Helper function to wrap JSX with inline script tags (for Suspense streaming)
  const helperFn = `
function __bfWrap(jsx: any, scripts: string[]) {
  if (scripts.length === 0) return jsx
  return <Fragment>{jsx}{scripts.map(s => <script type="module" src={s} />)}</Fragment>
}
`

  // Script collection code to insert at the start of each component function.
  // When BfScripts has already rendered (e.g., inside Suspense boundaries),
  // scripts are output inline instead of being collected.
  const scriptCollector = `
  let __bfInlineScripts: string[] = []
  // Script collection for client JS hydration
  try {
    const __c = useRequestContext()
    const __scripts: { src: string }[] = __c.get('bfCollectedScripts') || []
    const __outputScripts: Set<string> = __c.get('bfOutputScripts') || new Set()
    const __bfRendered = __c.get('bfScriptsRendered')
    if (!__outputScripts.has('__barefoot__')) {
      __outputScripts.add('__barefoot__')
      if (__bfRendered) __bfInlineScripts.push('/static/components/barefoot.js')
      else __scripts.push({ src: '/static/components/barefoot.js' })
    }
    if (!__outputScripts.has('${componentId}')) {
      __outputScripts.add('${componentId}')
      if (__bfRendered) __bfInlineScripts.push('/static/components/${clientJsPath}')
      else __scripts.push({ src: '/static/components/${clientJsPath}' })
    }
    __c.set('bfCollectedScripts', __scripts)
    __c.set('bfOutputScripts', __outputScripts)
  } catch {}
`

  // Insert script collector at the start of each export function
  let modifiedRest = restOfFile.replace(
    /export function (\w+)\(([^)]*)\)([^{]*)\{/g,
    (_match, name, params, rest) => {
      return `export function ${name}(${params})${rest}{${scriptCollector}`
    }
  )

  // Wrap each return (...) with __bfWrap((...), __bfInlineScripts)
  // Process from back to front to preserve offsets
  const returnPattern = /return\s*\(/g
  const returnMatches: Array<{ index: number; length: number }> = []
  let m: RegExpExecArray | null
  while ((m = returnPattern.exec(modifiedRest)) !== null) {
    returnMatches.push({ index: m.index, length: m[0].length })
  }
  // Process from last to first to keep earlier offsets valid
  for (let ri = returnMatches.length - 1; ri >= 0; ri--) {
    const rm = returnMatches[ri]
    const afterOpen = rm.index + rm.length // position after 'return ('
    let depth = 1
    let ci = afterOpen
    while (ci < modifiedRest.length && depth > 0) {
      if (modifiedRest[ci] === '(') depth++
      else if (modifiedRest[ci] === ')') depth--
      ci++
    }
    // ci is right after the matching ')'; insert wrap closing there
    modifiedRest = modifiedRest.slice(0, ci) + ', __bfInlineScripts)' + modifiedRest.slice(ci)
    // Replace 'return (' with 'return __bfWrap(('
    modifiedRest = modifiedRest.slice(0, rm.index) + 'return __bfWrap((' + modifiedRest.slice(rm.index + rm.length)
  }

  return beforeImports + existingImports + importStatement + helperFn + modifiedRest
}

// ── Resolve BuildConfig from BuildSection ────────────────────────────────

export function resolveBuildConfig(
  projectDir: string,
  section: BuildSection,
  overrides?: { minify?: boolean }
): BuildConfig {
  const componentDirs = (section.components ?? ['components']).map(
    dir => resolve(projectDir, dir)
  )
  const outDir = resolve(projectDir, section.outDir ?? 'dist')
  const isHono = section.adapter === 'hono'

  return {
    projectDir,
    adapter: section.adapter,
    adapterOptions: section.adapterOptions,
    componentDirs,
    outDir,
    minify: overrides?.minify ?? section.minify ?? false,
    contentHash: section.contentHash ?? false,
    scriptCollection: section.scriptCollection ?? isHono,
    clientOnly: section.clientOnly ?? false,
  }
}

// ── Main build pipeline ──────────────────────────────────────────────────

export async function build(config: BuildConfig): Promise<BuildResult> {
  const componentsOutDir = resolve(config.outDir, 'components')
  await mkdir(componentsOutDir, { recursive: true })

  // 1. Build and copy barefoot.js runtime
  const domPkgDir = resolve(config.projectDir, 'node_modules/@barefootjs/dom')
  // Try workspace path first (monorepo), then node_modules
  const domDistCandidates = [
    resolve(config.projectDir, '../../packages/dom/dist/index.js'),
    resolve(domPkgDir, 'dist/index.js'),
  ]
  let domDistFile: string | null = null
  for (const candidate of domDistCandidates) {
    try {
      await stat(candidate)
      domDistFile = candidate
      break
    } catch {
      // continue
    }
  }

  if (domDistFile) {
    await Bun.write(
      resolve(componentsOutDir, 'barefoot.js'),
      Bun.file(domDistFile)
    )
    console.log('Generated: components/barefoot.js')
  } else {
    console.warn('Warning: @barefootjs/dom dist not found. Skipping barefoot.js copy.')
  }

  // 2. Create adapter
  const adapter = await createAdapter(config.adapter, config.adapterOptions)

  // 3. Discover component files
  const allFiles: string[] = []
  for (const dir of config.componentDirs) {
    allFiles.push(...await discoverComponentFiles(dir))
  }

  // 4. Manifest
  const manifest: Record<string, { clientJs?: string; markedTemplate: string }> = {
    '__barefoot__': { markedTemplate: '', clientJs: 'components/barefoot.js' },
  }

  let compiledCount = 0
  let skippedCount = 0
  let errorCount = 0

  // 5. Compile each component
  for (const entryPath of allFiles) {
    const sourceContent = await Bun.file(entryPath).text()
    if (!hasUseClientDirective(sourceContent)) {
      skippedCount++
      continue
    }

    const baseFileName = basename(entryPath)
    const baseNameNoExt = baseFileName.replace('.tsx', '')
    let clientJsFilename = `${baseNameNoExt}.client.js`

    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    }, { adapter })

    // Separate errors and warnings
    const errors = result.errors.filter(e => e.severity === 'error')
    const warnings = result.errors.filter(e => e.severity === 'warning')

    if (warnings.length > 0) {
      console.warn(`Warnings compiling ${relative(config.projectDir, entryPath)}:`)
      for (const warning of warnings) {
        console.warn(`  ${warning.message}`)
      }
    }

    if (errors.length > 0) {
      console.error(`Errors compiling ${relative(config.projectDir, entryPath)}:`)
      for (const error of errors) {
        console.error(`  ${error.message}`)
      }
      errorCount++
      continue
    }

    let markedJsxContent = ''
    let clientJsContent = ''

    for (const file of result.files) {
      if (file.type === 'markedTemplate') {
        markedJsxContent = file.content
      } else if (file.type === 'clientJs') {
        clientJsContent = file.content
      }
    }

    if (!markedJsxContent && !clientJsContent) {
      skippedCount++
      continue
    }

    // 5a. Content hash
    if (config.contentHash && clientJsContent) {
      const hash = generateHash(clientJsContent)
      clientJsFilename = `${baseNameNoExt}-${hash}.client.js`
    }

    // 5b. Minify client JS
    if (config.minify && clientJsContent) {
      // @ts-expect-error minifySyntax is supported at runtime but missing from older bun-types
      const transpiler = new Bun.Transpiler({ minifyWhitespace: true, minifySyntax: true })
      clientJsContent = transpiler.transformSync(clientJsContent)
    }

    const hasClientJs = clientJsContent.length > 0

    // 5c. Write client JS
    if (hasClientJs) {
      await Bun.write(resolve(componentsOutDir, clientJsFilename), clientJsContent)
      console.log(`Generated: components/${clientJsFilename}`)
    }

    // 5d. Write marked template (skip in clientOnly mode)
    if (markedJsxContent && !config.clientOnly) {
      let outputContent = markedJsxContent
      if (hasClientJs && config.scriptCollection) {
        outputContent = addScriptCollection(markedJsxContent, baseNameNoExt, clientJsFilename)
      }
      await Bun.write(resolve(componentsOutDir, baseFileName), outputContent)
      console.log(`Generated: components/${baseFileName}`)
    }

    // 5e. Manifest entry
    if (!config.clientOnly) {
      manifest[baseNameNoExt] = {
        markedTemplate: `components/${baseFileName}`,
        clientJs: hasClientJs ? `components/${clientJsFilename}` : undefined,
      }
    }

    compiledCount++
  }

  // 6. Combine parent-child client JS
  const clientJsFiles = new Map<string, string>()
  for (const [name, entry] of Object.entries(manifest)) {
    if (!entry.clientJs) continue
    const filePath = resolve(config.outDir, entry.clientJs)
    try {
      clientJsFiles.set(name, await Bun.file(filePath).text())
    } catch {
      // File may not exist (e.g. __barefoot__)
    }
  }

  if (clientJsFiles.size > 0) {
    const combined = combineParentChildClientJs(clientJsFiles)
    for (const [name, content] of combined) {
      const entry = manifest[name]
      if (!entry?.clientJs) continue
      await Bun.write(resolve(config.outDir, entry.clientJs), content)
      console.log(`Combined: ${entry.clientJs}`)
    }
  }

  // 7. Write manifest (skip in clientOnly mode)
  if (!config.clientOnly) {
    await Bun.write(
      resolve(componentsOutDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    console.log('Generated: components/manifest.json')
  }

  return { compiledCount, skippedCount, errorCount, manifest }
}
