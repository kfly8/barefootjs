/**
 * BarefootJS UI build script with incremental build and watch mode
 *
 * Generates (file-based output):
 * - dist/components/{Component}.tsx (Marked JSX)
 * - dist/components/{Component}-{hash}.js (Client JS)
 * - dist/barefoot.js (Runtime)
 * - dist/uno.css (UnoCSS output)
 * - dist/manifest.json
 *
 * Usage:
 *   bun run build            # Incremental build (skip unchanged files)
 *   bun run build --force    # Force full rebuild
 *   bun run build --watch    # Watch mode with auto-rebuild
 *   bun run build Button     # Build specific component(s)
 *
 * Only components/* are compiled. Pages import compiled components via @/components.
 * The compiler handles "use client" filtering:
 * - Files with "use client" are included in output
 * - Files without "use client" are processed for dependency resolution only
 */

import { compileJSX, type PropWithType } from '@barefootjs/jsx'
import { honoMarkedJsxAdapter } from '@barefootjs/hono'
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { dirname, resolve, relative, basename, extname } from 'node:path'
import { watch, type FSWatcher } from 'node:fs'

// =============================================================================
// Types
// =============================================================================

interface ManifestEntry {
  clientJs?: string
  markedJsx: string
  props: PropWithType[]
}

interface CachedFileInfo {
  contentHash: string
  mtime: number
  dependencies: string[]
  outputs: {
    markedJsx: string
    clientJs?: string
  }
  manifestEntries: Record<string, ManifestEntry>
}

interface BuildCache {
  version: 1
  lastBuildTime: number
  files: Record<string, CachedFileInfo>
}

interface DependencyGraph {
  imports: Map<string, Set<string>>
  importedBy: Map<string, Set<string>>
}

// =============================================================================
// Constants
// =============================================================================

const ROOT_DIR = dirname(import.meta.path)
const COMPONENTS_DIR = resolve(ROOT_DIR, 'components')
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DIST_COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const DOM_PKG_DIR = resolve(ROOT_DIR, '../packages/dom')
const CACHE_FILE = resolve(DIST_DIR, '.buildcache.json')
const CACHE_VERSION = 1

// =============================================================================
// CLI Argument Parsing
// =============================================================================

const args = process.argv.slice(2)
const forceRebuild = args.includes('--force')
const watchMode = args.includes('--watch')
const targetComponents = args.filter(a => !a.startsWith('--'))

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a simple content hash for cache comparison
 */
function generateContentHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Extract local imports from source code (relative paths starting with ./ or ../)
 */
function extractLocalImports(source: string, sourceDir: string): string[] {
  const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"](\.[^'"]+)['"]/g
  const imports: string[] = []
  let match
  while ((match = importRegex.exec(source)) !== null) {
    let importPath = match[1]
    // Resolve to absolute path
    let resolved = resolve(sourceDir, importPath)
    // Add .tsx extension if not present
    if (!extname(resolved)) {
      resolved += '.tsx'
    }
    imports.push(resolved)
  }
  return imports
}

/**
 * Build dependency graph from source files
 */
async function buildDependencyGraph(files: string[]): Promise<DependencyGraph> {
  const imports = new Map<string, Set<string>>()
  const importedBy = new Map<string, Set<string>>()

  for (const file of files) {
    const content = await Bun.file(file).text()
    const sourceDir = dirname(file)
    const deps = extractLocalImports(content, sourceDir)

    imports.set(file, new Set(deps))

    for (const dep of deps) {
      if (!importedBy.has(dep)) {
        importedBy.set(dep, new Set())
      }
      importedBy.get(dep)!.add(file)
    }
  }

  return { imports, importedBy }
}

// =============================================================================
// Cache Management
// =============================================================================

async function readCache(): Promise<BuildCache | null> {
  try {
    const cacheFile = Bun.file(CACHE_FILE)
    if (!await cacheFile.exists()) {
      return null
    }
    const cache = await cacheFile.json() as BuildCache
    if (cache.version !== CACHE_VERSION) {
      console.log('Cache version mismatch, will rebuild all files')
      return null
    }
    return cache
  } catch {
    return null
  }
}

async function writeCache(cache: BuildCache): Promise<void> {
  await Bun.write(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// =============================================================================
// Incremental Build Logic
// =============================================================================

async function getFilesToRebuild(
  allFiles: string[],
  cache: BuildCache | null,
  depGraph: DependencyGraph
): Promise<{ toRebuild: Set<string>; deleted: Set<string> }> {
  if (forceRebuild || !cache) {
    return { toRebuild: new Set(allFiles), deleted: new Set() }
  }

  const toRebuild = new Set<string>()
  const deleted = new Set<string>()

  // Check for changed files
  for (const file of allFiles) {
    const cached = cache.files[file]
    if (!cached) {
      // New file
      toRebuild.add(file)
      continue
    }

    // Quick mtime check
    try {
      const fileStat = await stat(file)
      const mtime = fileStat.mtimeMs

      if (mtime <= cached.mtime) {
        continue // Likely unchanged
      }

      // Verify with content hash
      const content = await Bun.file(file).text()
      const currentHash = generateContentHash(content)
      if (currentHash !== cached.contentHash) {
        toRebuild.add(file)
      }
    } catch {
      // File no longer exists or cannot be read
      deleted.add(file)
    }
  }

  // Check for deleted files (in cache but not in allFiles)
  for (const cachedFile of Object.keys(cache.files)) {
    if (!allFiles.includes(cachedFile)) {
      deleted.add(cachedFile)
    }
  }

  // Propagate changes through reverse dependencies
  const queue = [...toRebuild, ...deleted]
  while (queue.length > 0) {
    const file = queue.shift()!
    const dependents = depGraph.importedBy.get(file)
    if (dependents) {
      for (const dependent of dependents) {
        if (!toRebuild.has(dependent) && allFiles.includes(dependent)) {
          toRebuild.add(dependent)
          queue.push(dependent)
        }
      }
    }
  }

  return { toRebuild, deleted }
}

// =============================================================================
// Build Functions
// =============================================================================

async function ensureBarefootRuntime(): Promise<void> {
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
}

async function cleanupDeletedFiles(
  deleted: Set<string>,
  cache: BuildCache
): Promise<void> {
  for (const file of deleted) {
    const cached = cache.files[file]
    if (cached?.outputs) {
      // Remove output files
      const markedJsxPath = resolve(DIST_DIR, cached.outputs.markedJsx)
      try {
        await unlink(markedJsxPath)
        console.log(`Removed: ${cached.outputs.markedJsx}`)
      } catch { /* file may not exist */ }

      if (cached.outputs.clientJs) {
        const clientJsPath = resolve(DIST_DIR, cached.outputs.clientJs)
        try {
          await unlink(clientJsPath)
          console.log(`Removed: ${cached.outputs.clientJs}`)
        } catch { /* file may not exist */ }
      }
    }
  }
}

async function compileComponent(
  entryPath: string
): Promise<{
  outputs: CachedFileInfo['outputs']
  manifestEntries: Record<string, ManifestEntry>
  dependencies: string[]
  contentHash: string
  mtime: number
}> {
  const content = await Bun.file(entryPath).text()
  const contentHash = generateContentHash(content)
  const fileStat = await stat(entryPath)
  const mtime = fileStat.mtimeMs
  const sourceDir = dirname(entryPath)
  const dependencies = extractLocalImports(content, sourceDir)

  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  }, { markedJsxAdapter: honoMarkedJsxAdapter })

  const manifestEntries: Record<string, ManifestEntry> = {}
  let outputs: CachedFileInfo['outputs'] = { markedJsx: '' }

  for (const file of result.files) {
    const baseFileName = file.sourcePath.split('/').pop()!
    await Bun.write(resolve(DIST_COMPONENTS_DIR, baseFileName), file.markedJsx)
    console.log(`Generated: dist/components/${baseFileName}`)

    if (file.hasClientJs) {
      await Bun.write(resolve(DIST_COMPONENTS_DIR, file.clientJsFilename), file.clientJs)
      console.log(`Generated: dist/components/${file.clientJsFilename}`)
    }

    const fileKey = `__file_${file.sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`
    const markedJsxPath = `components/${baseFileName}`
    const clientJsPath = file.hasClientJs ? `components/${file.clientJsFilename}` : undefined

    outputs = {
      markedJsx: markedJsxPath,
      clientJs: clientJsPath,
    }

    manifestEntries[fileKey] = {
      markedJsx: markedJsxPath,
      clientJs: clientJsPath,
      props: [],
    }

    for (const compName of file.componentNames) {
      manifestEntries[compName] = {
        markedJsx: markedJsxPath,
        clientJs: clientJsPath,
        props: file.componentProps[compName] || [],
      }
    }
  }

  return { outputs, manifestEntries, dependencies, contentHash, mtime }
}

async function generateIndexTs(): Promise<void> {
  const componentExports: string[] = []
  for (const file of await readdir(DIST_COMPONENTS_DIR)) {
    if (file.endsWith('.tsx')) {
      const baseName = file.replace('.tsx', '')
      const content = await Bun.file(resolve(DIST_COMPONENTS_DIR, file)).text()
      const exportMatches = content.matchAll(/export\s+(?:function|const)\s+(\w+)/g)
      for (const match of exportMatches) {
        componentExports.push(`export { ${match[1]} } from './${baseName}'`)
      }
    }
  }
  if (componentExports.length > 0) {
    await Bun.write(resolve(DIST_COMPONENTS_DIR, 'index.ts'), componentExports.join('\n') + '\n')
    console.log('Generated: dist/components/index.ts')
  }
}

async function copyGlobalsCss(): Promise<void> {
  const STYLES_DIR = resolve(ROOT_DIR, 'styles')
  const globalsSource = resolve(STYLES_DIR, 'globals.css')
  const globalsDest = resolve(DIST_DIR, 'globals.css')

  if (await Bun.file(globalsSource).exists()) {
    await Bun.write(globalsDest, Bun.file(globalsSource))
    console.log('Copied: dist/globals.css')
  }
}

async function runUnoCSS(): Promise<void> {
  console.log('\nGenerating UnoCSS...')
  const unoProc = Bun.spawn(['bunx', 'unocss', './**/*.tsx', './dist/**/*.tsx', '-o', 'dist/uno.css'], {
    cwd: ROOT_DIR,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  await unoProc.exited
  console.log('Generated: dist/uno.css')
}

// =============================================================================
// Main Build Function
// =============================================================================

async function build(changedFiles?: string[]): Promise<void> {
  await mkdir(DIST_COMPONENTS_DIR, { recursive: true })

  // Discover all component files
  const allComponentFiles = (await readdir(COMPONENTS_DIR))
    .filter(f => f.endsWith('.tsx'))
    .map(f => resolve(COMPONENTS_DIR, f))

  // Filter to target components if specified
  const componentFiles = targetComponents.length > 0
    ? allComponentFiles.filter(f =>
        targetComponents.some(t => basename(f, '.tsx').toLowerCase().includes(t.toLowerCase())))
    : allComponentFiles

  // Load cache
  const cache = await readCache()

  // Build dependency graph
  const depGraph = await buildDependencyGraph(allComponentFiles)

  // Determine what needs rebuilding
  let toRebuild: Set<string>
  let deleted: Set<string>

  if (changedFiles) {
    // In watch mode, rebuild changed files and their dependents
    toRebuild = new Set<string>()
    deleted = new Set<string>()

    for (const file of changedFiles) {
      if (componentFiles.includes(file)) {
        toRebuild.add(file)
      }
    }

    // Propagate through dependencies
    const queue = [...toRebuild]
    while (queue.length > 0) {
      const file = queue.shift()!
      const dependents = depGraph.importedBy.get(file)
      if (dependents) {
        for (const dependent of dependents) {
          if (!toRebuild.has(dependent) && componentFiles.includes(dependent)) {
            toRebuild.add(dependent)
            queue.push(dependent)
          }
        }
      }
    }
  } else {
    const result = await getFilesToRebuild(componentFiles, cache, depGraph)
    toRebuild = result.toRebuild
    deleted = result.deleted
  }

  // Build barefoot runtime
  await ensureBarefootRuntime()
  console.log('Generated: dist/components/barefoot.js')

  // Initialize manifest with existing cached entries
  const manifest: Record<string, ManifestEntry> = {
    '__barefoot__': { markedJsx: '', clientJs: 'components/barefoot.js', props: [] }
  }

  // Copy cached manifest entries for files not being rebuilt
  if (cache) {
    for (const [filePath, fileInfo] of Object.entries(cache.files)) {
      if (!toRebuild.has(filePath) && !deleted.has(filePath) && componentFiles.includes(filePath)) {
        Object.assign(manifest, fileInfo.manifestEntries)
      }
    }
  }

  // Cleanup deleted files
  if (cache && deleted.size > 0) {
    await cleanupDeletedFiles(deleted, cache)
  }

  // Report build status
  if (toRebuild.size === 0 && deleted.size === 0) {
    console.log('All files up to date. Nothing to rebuild.')
  } else {
    console.log(`Rebuilding ${toRebuild.size} file(s)...`)
  }

  // Build new cache
  const newCache: BuildCache = {
    version: CACHE_VERSION,
    lastBuildTime: Date.now(),
    files: {},
  }

  // Copy unchanged entries from old cache
  if (cache) {
    for (const [filePath, fileInfo] of Object.entries(cache.files)) {
      if (!toRebuild.has(filePath) && !deleted.has(filePath) && componentFiles.includes(filePath)) {
        newCache.files[filePath] = fileInfo
      }
    }
  }

  // Compile files that need rebuilding
  for (const entryPath of toRebuild) {
    try {
      const compiled = await compileComponent(entryPath)
      Object.assign(manifest, compiled.manifestEntries)
      newCache.files[entryPath] = {
        contentHash: compiled.contentHash,
        mtime: compiled.mtime,
        dependencies: compiled.dependencies,
        outputs: compiled.outputs,
        manifestEntries: compiled.manifestEntries,
      }
    } catch (error) {
      console.error(`Failed to compile ${relative(ROOT_DIR, entryPath)}:`, error)
      throw error
    }
  }

  // Output manifest
  await Bun.write(resolve(DIST_COMPONENTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('Generated: dist/components/manifest.json')

  // Generate index.ts
  await generateIndexTs()

  // Copy globals.css
  await copyGlobalsCss()

  // Write cache
  await writeCache(newCache)

  // Run UnoCSS (only in non-watch mode, watch mode runs it separately)
  if (!watchMode) {
    await runUnoCSS()
  }
}

// =============================================================================
// Watch Mode
// =============================================================================

let rebuildTimer: ReturnType<typeof setTimeout> | null = null
let pendingFiles = new Set<string>()
let isBuilding = false

function scheduleRebuild(changedFile: string): void {
  pendingFiles.add(changedFile)

  if (rebuildTimer) {
    clearTimeout(rebuildTimer)
  }

  rebuildTimer = setTimeout(async () => {
    if (isBuilding) {
      // If a build is in progress, reschedule
      rebuildTimer = setTimeout(() => scheduleRebuild(changedFile), 100)
      return
    }

    const files = [...pendingFiles]
    pendingFiles.clear()
    rebuildTimer = null

    const time = new Date().toLocaleTimeString()
    console.log(`\n[${time}] Detected changes in ${files.length} file(s)...`)

    isBuilding = true
    try {
      await build(files)
      console.log(`[${new Date().toLocaleTimeString()}] Rebuild complete. Watching for changes...`)
    } catch (error) {
      console.error('Build failed:', error instanceof Error ? error.message : error)
      console.log('Waiting for next file change...')
    } finally {
      isBuilding = false
    }
  }, 150)
}

async function startWatchMode(): Promise<void> {
  console.log('Starting watch mode...\n')

  // Initial build
  await build()
  console.log('\nInitial build complete. Watching for changes...')

  // Start UnoCSS in watch mode
  const unoWatcher = Bun.spawn(
    ['bunx', 'unocss', './**/*.tsx', './dist/**/*.tsx', '-o', 'dist/uno.css', '--watch'],
    {
      cwd: ROOT_DIR,
      stdout: 'inherit',
      stderr: 'inherit',
    }
  )

  // Watch components directory
  const watcher: FSWatcher = watch(
    COMPONENTS_DIR,
    { recursive: true },
    (event, filename) => {
      if (filename && filename.endsWith('.tsx')) {
        const fullPath = resolve(COMPONENTS_DIR, filename)
        scheduleRebuild(fullPath)
      }
    }
  )

  // Clean shutdown
  const cleanup = () => {
    console.log('\nShutting down...')
    watcher.close()
    unoWatcher.kill()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Keep the process running
  await new Promise(() => {})
}

// =============================================================================
// Main Entry Point
// =============================================================================

if (watchMode) {
  await startWatchMode()
} else {
  await build()
  console.log('\nBuild complete!')
}
