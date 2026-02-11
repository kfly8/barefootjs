/**
 * BarefootJS Site build script
 *
 * Generates:
 * - dist/globals.css (copied)
 * - dist/uno.css (UnoCSS output)
 * - dist/static/ (for Cloudflare Workers)
 * - dist/components/barefoot.js (runtime)
 * - dist/components/{Component}-{hash}.js (client JS for interactive components)
 */

import { compileJSX } from '@barefootjs/jsx'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve, join, relative } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')

// File type helpers
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

// Generate short hash from content
function generateHash(content: string): string {
  const hash = Bun.hash(content)
  return hash.toString(16).slice(0, 8)
}

// Add script collection wrapper to SSR component
function addScriptCollection(content: string, componentId: string, clientJsPath: string): string {
  const importStatement = "import { useRequestContext } from 'hono/jsx-renderer'\n"
  const importMatch = content.match(/^([\s\S]*?)((?:import[^\n]+\n)*)/m)
  if (!importMatch) {
    return content
  }

  const beforeImports = importMatch[1]
  const existingImports = importMatch[2]
  const restOfFile = content.slice(importMatch[0].length)

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

  const modifiedRest = restOfFile.replace(
    /export function (\w+)\(([^)]*)\)([^{]*)\{/g,
    (match, name, params, rest) => {
      return `export function ${name}(${params})${rest}{${scriptCollector}`
    }
  )

  return beforeImports + existingImports + importStatement + modifiedRest
}

// Recursively discover component files
async function discoverComponentFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await discoverComponentFiles(fullPath))
    } else if (entry.name.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }
  return files
}

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
const manifest: Record<string, { clientJs?: string; markedTemplate: string }> = {
  '__barefoot__': { markedTemplate: '', clientJs: `components/${barefootFileName}` }
}

// Create HonoAdapter
const adapter = new HonoAdapter({
  injectScriptCollection: false,
})

// Compile client components
const componentFiles = await discoverComponentFiles(COMPONENTS_DIR)

for (const entryPath of componentFiles) {
  const sourceContent = await Bun.file(entryPath).text()
  if (!hasUseClientDirective(sourceContent)) {
    continue
  }

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

  const relativePath = relative(COMPONENTS_DIR, entryPath)
  const dirPath = dirname(relativePath)
  const baseFileName = relativePath.split('/').pop()!
  const baseNameNoExt = baseFileName.replace('.tsx', '')

  const outputDir = dirPath === '.' ? DIST_COMPONENTS_DIR : resolve(DIST_COMPONENTS_DIR, dirPath)
  await mkdir(outputDir, { recursive: true })

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
    let transformedSource = sourceContent.replace(/^['"]use client['"];?\s*/m, '')
    await Bun.write(resolve(outputDir, baseFileName), transformedSource)
    console.log(`Generated: dist/components/${relativePath}`)
    manifest[baseNameNoExt] = { markedTemplate: `components/${relativePath}` }
    continue
  }

  if (markedJsxContent && !clientJsContent) {
    await Bun.write(resolve(outputDir, baseFileName), markedJsxContent)
    console.log(`Generated: dist/components/${relativePath}`)
    manifest[baseNameNoExt] = { markedTemplate: `components/${relativePath}` }
    continue
  }

  const hasClientJs = clientJsContent.length > 0
  const hash = generateHash(clientJsContent || markedJsxContent)
  const clientJsFilename = `${baseNameNoExt}-${hash}.js`

  if (hasClientJs) {
    // Check if client JS references imports from external modules and add them
    let processedClientJs = clientJsContent
    if (entryPath.includes('code-demo') && clientJsContent.includes('HONO_OUTPUT') && clientJsContent.includes('ECHO_OUTPUT')) {
      // Add import for code-examples
      processedClientJs = `import { HONO_OUTPUT, ECHO_OUTPUT } from './code-examples.js'\n` + processedClientJs
    }
    await Bun.write(resolve(outputDir, clientJsFilename), processedClientJs)
    const clientJsRelativePath = dirPath === '.' ? clientJsFilename : `${dirPath}/${clientJsFilename}`
    console.log(`Generated: dist/components/${clientJsRelativePath}`)
  }

  if (markedJsxContent && hasClientJs) {
    const clientJsRelPath = dirPath === '.' ? clientJsFilename : `${dirPath}/${clientJsFilename}`
    const wrappedContent = addScriptCollection(markedJsxContent, baseNameNoExt, clientJsRelPath)
    await Bun.write(resolve(outputDir, baseFileName), wrappedContent)
    console.log(`Generated: dist/components/${relativePath}`)
  } else if (markedJsxContent) {
    await Bun.write(resolve(outputDir, baseFileName), markedJsxContent)
    console.log(`Generated: dist/components/${relativePath}`)
  }

  const componentName = baseNameNoExt
  const markedJsxPath = `components/${relativePath}`
  const clientJsPath = hasClientJs
    ? `components/${dirPath === '.' ? clientJsFilename : `${dirPath}/${clientJsFilename}`}`
    : undefined

  manifest[componentName] = {
    markedTemplate: markedJsxPath,
    clientJs: clientJsPath,
  }
}

// Copy .ts files (non-component modules) that may be imported by client components
async function copyTsModules(srcDir: string, destDir: string): Promise<void> {
  const entries = await readdir(srcDir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)
    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true })
      await copyTsModules(srcPath, destPath)
    } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.js')) && !entry.name.endsWith('.d.ts')) {
      await Bun.write(destPath, Bun.file(srcPath))
      console.log(`Copied: dist/components/${relative(DIST_COMPONENTS_DIR, destPath)}`)
    }
  }
}
await copyTsModules(COMPONENTS_DIR, DIST_COMPONENTS_DIR)

// Output manifest
await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/components/manifest.json')

// Generate index.ts for re-exporting all compiled components
async function collectExports(dir: string, prefix: string = ''): Promise<string[]> {
  const exports: string[] = []
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      exports.push(...await collectExports(fullPath, `${prefix}${entry.name}/`))
    } else if (entry.name.endsWith('.tsx')) {
      const baseName = entry.name.replace('.tsx', '')
      const content = await Bun.file(fullPath).text()
      const exportMatches = content.matchAll(/export\s+(?:function|const)\s+(\w+)/g)
      for (const match of exportMatches) {
        exports.push(`export { ${match[1]} } from './${prefix}${baseName}'`)
      }
    }
  }
  return exports
}

const componentExports = await collectExports(DIST_COMPONENTS_DIR)
if (componentExports.length > 0) {
  await Bun.write(resolve(DIST_COMPONENTS_DIR, 'index.ts'), componentExports.join('\n') + '\n')
  console.log('Generated: dist/components/index.ts')
}

// Copy globals.css to dist
const STYLES_DIR = resolve(ROOT_DIR, 'styles')
const globalsSource = resolve(STYLES_DIR, 'globals.css')
const globalsDest = resolve(DIST_DIR, 'globals.css')

if (await Bun.file(globalsSource).exists()) {
  await Bun.write(globalsDest, Bun.file(globalsSource))
  console.log('Copied: dist/globals.css')
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

// Create dist/static/ directory for Cloudflare Workers compatibility
const DIST_STATIC_DIR = resolve(DIST_DIR, 'static')
await mkdir(DIST_STATIC_DIR, { recursive: true })

// Copy CSS files to static/
await Bun.write(resolve(DIST_STATIC_DIR, 'globals.css'), Bun.file(resolve(DIST_DIR, 'globals.css')))
await Bun.write(resolve(DIST_STATIC_DIR, 'uno.css'), Bun.file(resolve(DIST_DIR, 'uno.css')))
console.log('Copied: dist/static/globals.css')
console.log('Copied: dist/static/uno.css')

// Copy icon and logo files
const IMAGES_DIR = resolve(ROOT_DIR, '../images/logo')
const icon32 = resolve(IMAGES_DIR, 'icon-32.png')
const icon64 = resolve(IMAGES_DIR, 'icon-64.png')
const logoLight = resolve(IMAGES_DIR, 'logo-for-light.svg')
const logoDark = resolve(IMAGES_DIR, 'logo-for-dark.svg')

if (await Bun.file(icon32).exists()) {
  await Bun.write(resolve(DIST_DIR, 'icon-32.png'), Bun.file(icon32))
  await Bun.write(resolve(DIST_STATIC_DIR, 'icon-32.png'), Bun.file(icon32))
  await Bun.write(resolve(DIST_DIR, 'favicon.ico'), Bun.file(icon32))
  console.log('Copied: dist/icon-32.png, dist/static/icon-32.png, dist/favicon.ico')
}
if (await Bun.file(icon64).exists()) {
  await Bun.write(resolve(DIST_DIR, 'icon-64.png'), Bun.file(icon64))
  await Bun.write(resolve(DIST_STATIC_DIR, 'icon-64.png'), Bun.file(icon64))
  console.log('Copied: dist/icon-64.png, dist/static/icon-64.png')
}
if (await Bun.file(logoLight).exists()) {
  await Bun.write(resolve(DIST_DIR, 'logo-for-light.svg'), Bun.file(logoLight))
  await Bun.write(resolve(DIST_STATIC_DIR, 'logo-for-light.svg'), Bun.file(logoLight))
  console.log('Copied: dist/logo-for-light.svg, dist/static/logo-for-light.svg')
}
if (await Bun.file(logoDark).exists()) {
  await Bun.write(resolve(DIST_DIR, 'logo-for-dark.svg'), Bun.file(logoDark))
  await Bun.write(resolve(DIST_STATIC_DIR, 'logo-for-dark.svg'), Bun.file(logoDark))
  console.log('Copied: dist/logo-for-dark.svg, dist/static/logo-for-dark.svg')
}

// Copy components/ to static/components/
async function copyDir(src: string, dest: string) {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await Bun.write(destPath, Bun.file(srcPath))
    }
  }
}
await copyDir(DIST_COMPONENTS_DIR, resolve(DIST_STATIC_DIR, 'components'))
console.log('Copied: dist/static/components/')

// Copy snippets to dist/static/snippets/
const SNIPPETS_SRC = resolve(ROOT_DIR, 'public/static/snippets')
const SNIPPETS_DEST = resolve(DIST_STATIC_DIR, 'snippets')
await mkdir(SNIPPETS_DEST, { recursive: true })
const snippetFiles = await readdir(SNIPPETS_SRC).catch(() => [])
for (const file of snippetFiles) {
  await Bun.write(resolve(SNIPPETS_DEST, file), Bun.file(resolve(SNIPPETS_SRC, file)))
}
if (snippetFiles.length > 0) {
  console.log(`Copied: dist/static/snippets/ (${snippetFiles.length} files)`)
}

// Copy framework logos (both to dist/logos/ and dist/static/logos/)
const LOGOS_DIR = resolve(ROOT_DIR, 'assets/logos')
const DIST_LOGOS_DIR = resolve(DIST_DIR, 'logos')
const DIST_STATIC_LOGOS_DIR = resolve(DIST_STATIC_DIR, 'logos')
await mkdir(DIST_LOGOS_DIR, { recursive: true })
await mkdir(DIST_STATIC_LOGOS_DIR, { recursive: true })
const logoFiles = await readdir(LOGOS_DIR).catch(() => [])
for (const file of logoFiles) {
  if (file.endsWith('.svg')) {
    await Bun.write(resolve(DIST_LOGOS_DIR, file), Bun.file(resolve(LOGOS_DIR, file)))
    await Bun.write(resolve(DIST_STATIC_LOGOS_DIR, file), Bun.file(resolve(LOGOS_DIR, file)))
  }
}
if (logoFiles.length > 0) {
  console.log(`Copied: dist/logos/, dist/static/logos/ (${logoFiles.length} files)`)
}

console.log('\nBuild complete!')
