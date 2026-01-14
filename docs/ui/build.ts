/**
 * BarefootJS UI build script
 *
 * Generates (file-based output):
 * - dist/components/{Component}.tsx (Marked JSX)
 * - dist/components/{Component}-{hash}.js (Client JS)
 * - dist/components/barefoot.js (Runtime)
 * - dist/uno.css (UnoCSS output)
 * - dist/manifest.json
 *
 * Only components/* are compiled. Pages import compiled components via @/components.
 * The compiler handles "use client" filtering:
 * - Files with "use client" are included in output
 * - Files without "use client" are processed for dependency resolution only
 */

import { compileJSX, type PropWithType } from '@barefootjs/jsx'
import { honoMarkedJsxAdapter } from '@barefootjs/hono'
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)

// File type helpers
function isTsOrTsxFile(filename: string): boolean {
  return filename.endsWith('.tsx') || filename.endsWith('.ts')
}

function hasUseClientDirective(content: string): boolean {
  const trimmed = content.trimStart()
  return trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")
}

// Copy all TS/TSX files from a directory (non-recursive)
async function copyTsFiles(srcDir: string, destDir: string, prefix: string = ''): Promise<void> {
  await mkdir(destDir, { recursive: true })
  const files = await readdir(srcDir).catch(() => [])
  for (const file of files) {
    if (isTsOrTsxFile(file)) {
      await Bun.write(resolve(destDir, file), Bun.file(resolve(srcDir, file)))
      console.log(`Copied: ${prefix}${file}`)
    }
  }
}

const DOCS_COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const UI_COMPONENTS_DIR = resolve(ROOT_DIR, '../../ui/components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

// Path aliases for resolving imports like @/components/ui/tabs or @ui/components/ui/tabs
const PATH_ALIASES: Record<string, string> = {
  '@/components/': UI_COMPONENTS_DIR + '/',
  '@ui/components/': UI_COMPONENTS_DIR + '/',
}

// Recursively discover all component files in ui/ and docs/ subdirectories
// Skip 'shared' directory which contains non-compilable utility modules
async function discoverComponentFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip shared directory - it contains utility modules, not components
      if (entry.name === 'shared') continue
      files.push(...await discoverComponentFiles(fullPath))
    } else if (entry.name.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }
  return files
}

// Discover all component files from both UI components and docs components
// The compiler handles "use client" filtering
const uiComponentFiles = await discoverComponentFiles(UI_COMPONENTS_DIR)
const docsComponentFiles = await discoverComponentFiles(DOCS_COMPONENTS_DIR)
const componentFiles = [...uiComponentFiles, ...docsComponentFiles]

await mkdir(DIST_COMPONENTS_DIR, { recursive: true })

// Build and copy barefoot.js from @barefootjs/dom
const barefootFileName = 'barefoot.js'
const domDistFile = resolve(DOM_PKG_DIR, 'dist/index.js')

if (!await Bun.file(domDistFile).exists()) {
  console.log('Building @barefootjs/dom...')
  const proc = Bun.spawn(['bun', 'run', 'build'], { cwd: DOM_PKG_DIR })
  await proc.exited
}

// Copy to dist/components/ for components inside rootDir (ui/components/)
await Bun.write(
  resolve(DIST_COMPONENTS_DIR, barefootFileName),
  Bun.file(domDistFile)
)
console.log(`Generated: dist/components/${barefootFileName}`)


// Manifest
const manifest: Record<string, { clientJs?: string; markedJsx: string; props: PropWithType[]; dependencies?: string[] }> = {
  '__barefoot__': { markedJsx: '', clientJs: `components/${barefootFileName}`, props: [] }
}

// Compile each component
for (const entryPath of componentFiles) {
  // Determine rootDir based on whether the file is from UI or docs components
  const isUiComponent = entryPath.startsWith(UI_COMPONENTS_DIR)
  const rootDir = isUiComponent ? UI_COMPONENTS_DIR : DOCS_COMPONENTS_DIR
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { markedJsxAdapter: honoMarkedJsxAdapter, rootDir, pathAliases: PATH_ALIASES })

  for (const file of result.files) {
    // Preserve subdirectory structure (ui/, docs/)
    // file.sourcePath is like "ui/Button.tsx" or "docs/CopyButton.tsx"
    const relativePath = file.sourcePath
    const dirPath = dirname(relativePath)
    const baseFileName = relativePath.split('/').pop()!
    const baseNameNoExt = baseFileName.replace('.tsx', '')

    // Create subdirectory if needed
    const outputDir = resolve(DIST_COMPONENTS_DIR, dirPath)
    await mkdir(outputDir, { recursive: true })

    // Marked JSX file - output to dist/components/{subdir}/
    await Bun.write(resolve(outputDir, baseFileName), file.markedJsx)
    console.log(`Generated: dist/components/${relativePath}`)

    // Client JS filename includes directory (e.g., "ui/Button-abc123.js")
    // Handle root-level files where dirPath is "."
    const clientJsRelativePath = file.hasClientJs
      ? (dirPath === '.' ? `${baseNameNoExt}-${file.hash}.js` : `${dirPath}/${baseNameNoExt}-${file.hash}.js`)
      : ''

    // Client JS - colocate with Marked JSX in same subdirectory
    if (file.hasClientJs) {
      await Bun.write(resolve(outputDir, file.clientJsFilename), file.clientJs)
      console.log(`Generated: dist/components/${clientJsRelativePath}`)
    }

    // Manifest entries
    const fileKey = `__file_${file.sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`
    const markedJsxPath = `components/${relativePath}`
    const clientJsPath = file.hasClientJs ? `components/${clientJsRelativePath}` : undefined
    manifest[fileKey] = {
      markedJsx: markedJsxPath,
      clientJs: clientJsPath,
      props: [],
    }

    // Manifest entries for each component in file
    for (const compName of file.componentNames) {
      const deps = file.componentDependencies[compName]
      manifest[compName] = {
        markedJsx: markedJsxPath,
        clientJs: clientJsPath,
        props: file.componentProps[compName] || [],
        dependencies: deps && deps.length > 0 ? deps : undefined,
      }
    }
  }
}

// Output manifest
await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/components/manifest.json')

// Generate index.ts for re-exporting all components (handles subdirectories)
async function collectExports(dir: string, prefix: string = ''): Promise<string[]> {
  const exports: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
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

// Copy lib/ directory to dist/
// These are runtime utilities needed by compiled components
const LIB_DIR = resolve(ROOT_DIR, 'lib')
const DIST_LIB_DIR = resolve(DIST_DIR, 'lib')

// Copy lib/*.tsx files
await copyTsFiles(LIB_DIR, DIST_LIB_DIR, 'dist/lib/')

// Copy server components (without "use client") to dist
// These are components that don't need compilation but are still imported from @/components/
async function copyServerComponents(srcDir: string, destDir: string, prefix: string = '') {
  const entries = await readdir(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)
    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true })
      await copyServerComponents(srcPath, destPath, `${prefix}${entry.name}/`)
    } else if (entry.name.endsWith('.tsx')) {
      const content = await Bun.file(srcPath).text()
      // Skip files that have "use client" directive (already compiled)
      if (!hasUseClientDirective(content)) {
        // Check if file wasn't already output by compiler
        const distFile = resolve(DIST_COMPONENTS_DIR, prefix, entry.name)
        if (!await Bun.file(distFile).exists()) {
          await mkdir(dirname(distFile), { recursive: true })
          // Rewrite @ui/ imports to point to compiled components
          const rewrittenContent = content.replace(
            /@ui\/components\/ui\//g,
            '@/components/ui/'
          )
          await Bun.write(distFile, rewrittenContent)
          console.log(`Copied (server component): dist/components/${prefix}${entry.name}`)
        }
      }
    }
  }
}
await copyServerComponents(DOCS_COMPONENTS_DIR, DIST_COMPONENTS_DIR)
await copyServerComponents(UI_COMPONENTS_DIR, DIST_COMPONENTS_DIR)

// Copy shared/ directory (utility modules)
const SHARED_DIR = resolve(ROOT_DIR, 'components/shared')
const DIST_SHARED_DIR = resolve(DIST_COMPONENTS_DIR, 'shared')
await copyTsFiles(SHARED_DIR, DIST_SHARED_DIR, 'dist/components/shared/')

// Rewrite @ui/ imports in all dist/*.tsx files to @/
// This is needed because compiled components may reference @ui/ paths
async function rewriteUiImports(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await rewriteUiImports(fullPath)
    } else if (entry.name.endsWith('.tsx')) {
      const content = await Bun.file(fullPath).text()
      if (content.includes('@ui/')) {
        const rewritten = content.replace(/@ui\/components\/ui\//g, '@/components/ui/')
        await Bun.write(fullPath, rewritten)
      }
    }
  }
}
await rewriteUiImports(DIST_COMPONENTS_DIR)
console.log('Rewrote @ui/ imports in dist/')

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
// Wrangler [assets] serves files from dist/ at /, so /static/* needs dist/static/*
// Bun dev server uses serveStatic with rewrite, so this is only needed for production
const DIST_STATIC_DIR = resolve(DIST_DIR, 'static')
await mkdir(DIST_STATIC_DIR, { recursive: true })

// Copy CSS files to static/
await Bun.write(resolve(DIST_STATIC_DIR, 'globals.css'), Bun.file(resolve(DIST_DIR, 'globals.css')))
await Bun.write(resolve(DIST_STATIC_DIR, 'uno.css'), Bun.file(resolve(DIST_DIR, 'uno.css')))
console.log('Copied: dist/static/globals.css')
console.log('Copied: dist/static/uno.css')

// Copy icon files
// - dist/ for Bun dev server (serveStatic rewrites /static/* to /*)
// - dist/static/ for Cloudflare Workers ([assets] serves dist/ at /)
// - dist/favicon.ico for /favicon.ico requests
const IMAGES_DIR = resolve(ROOT_DIR, '../../images/logo')
const icon32 = resolve(IMAGES_DIR, 'icon-32.png')
const icon64 = resolve(IMAGES_DIR, 'icon-64.png')
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

// Copy components/ to static/components/ for client JS
async function copyDir(src: string, dest: string) {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })
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

console.log('\nBuild complete!')
