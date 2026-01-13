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
const DOCS_COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const UI_COMPONENTS_DIR = resolve(ROOT_DIR, '../../ui/components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../../packages/dom')

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

// Also copy to dist/ root for components outside rootDir (ui/base/)
// Their relative imports resolve to dist/ level
await Bun.write(
  resolve(DIST_DIR, barefootFileName),
  Bun.file(domDistFile)
)
console.log(`Generated: dist/${barefootFileName}`)

// Manifest
const manifest: Record<string, { clientJs?: string; markedJsx: string; props: PropWithType[] }> = {
  '__barefoot__': { markedJsx: '', clientJs: `components/${barefootFileName}`, props: [] }
}

// Compile each component
for (const entryPath of componentFiles) {
  // Determine rootDir based on whether the file is from UI or docs components
  const isUiComponent = entryPath.startsWith(UI_COMPONENTS_DIR)
  const rootDir = isUiComponent ? UI_COMPONENTS_DIR : DOCS_COMPONENTS_DIR
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { markedJsxAdapter: honoMarkedJsxAdapter, rootDir })

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

// Copy lib/ and base/ directories to dist/components/
// These are runtime utilities needed by compiled components
const LIB_DIR = resolve(ROOT_DIR, 'lib')
const BASE_DIR = resolve(ROOT_DIR, '../../ui/base')
const DIST_LIB_DIR = resolve(DIST_COMPONENTS_DIR, '../lib')
const DIST_BASE_DIR = resolve(DIST_COMPONENTS_DIR, '../base')

await mkdir(DIST_LIB_DIR, { recursive: true })
await mkdir(DIST_BASE_DIR, { recursive: true })

// Copy lib/*.tsx files
for (const file of await readdir(LIB_DIR).catch(() => [])) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    await Bun.write(resolve(DIST_LIB_DIR, file), Bun.file(resolve(LIB_DIR, file)))
    console.log(`Copied: dist/lib/${file}`)
  }
}

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
      // Skip files that have "use client" directive at start (already compiled)
      // Check if file starts with "use client" (with optional leading whitespace/comments)
      const hasUseClient = content.trimStart().startsWith('"use client"') ||
                           content.trimStart().startsWith("'use client'")
      if (!hasUseClient) {
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
await mkdir(DIST_SHARED_DIR, { recursive: true })
for (const file of await readdir(SHARED_DIR).catch(() => [])) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    await Bun.write(resolve(DIST_SHARED_DIR, file), Bun.file(resolve(SHARED_DIR, file)))
    console.log(`Copied: dist/components/shared/${file}`)
  }
}

// Copy base/*.tsx files
for (const file of await readdir(BASE_DIR).catch(() => [])) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    await Bun.write(resolve(DIST_BASE_DIR, file), Bun.file(resolve(BASE_DIR, file)))
    console.log(`Copied: dist/base/${file}`)
  }
}

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

// Copy barefoot.js to static/ root for base components
await Bun.write(resolve(DIST_STATIC_DIR, 'barefoot.js'), Bun.file(resolve(DIST_DIR, 'barefoot.js')))
console.log('Copied: dist/static/barefoot.js')

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

// Copy base/ to static/base/ for base component client JS (e.g., slot)
await copyDir(DIST_BASE_DIR, resolve(DIST_STATIC_DIR, 'base'))
console.log('Copied: dist/static/base/')

console.log('\nBuild complete!')
