/**
 * Build runner for BarefootJS projects
 * 
 * Reads configuration from barefoot.config.json and builds the project
 */

import { compileJSX } from './jsx-compiler'
import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import type { BuildConfig, ResolvedBuildConfig, StaticBuildConfig, ServerBuildConfig } from './build-config'

// Default relative path from example directory to dom runtime
const DEFAULT_DOM_DIR_PATH = '../../dom'

// Pattern to match barefoot.js imports in generated client code
const BAREFOOT_IMPORT_PATTERN = /from ['"]\.\/barefoot\.js['"]/g

/**
 * Load and resolve build configuration
 */
export async function loadBuildConfig(configPath: string): Promise<ResolvedBuildConfig> {
  const configFile = Bun.file(configPath)
  const config: BuildConfig = await configFile.json()
  
  const rootDir = dirname(configPath)
  const distDir = resolve(rootDir, config.dist || 'dist')
  const domDir = resolve(rootDir, DEFAULT_DOM_DIR_PATH)
  
  return {
    ...config,
    rootDir,
    distDir,
    domDir,
  }
}

/**
 * Hash content for cache busting
 */
function contentHash(content: string): string {
  return Bun.hash(content).toString(16).slice(0, 8)
}

/**
 * Build static HTML project (like counter, todo examples)
 */
async function buildStatic(config: ResolvedBuildConfig & StaticBuildConfig): Promise<void> {
  console.log('Building static project...')
  
  // Create dist/ directory
  await mkdir(config.distDir, { recursive: true })
  
  // Compile entry file
  const entryPath = resolve(config.rootDir, config.entry)
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  })
  
  // Output component JS files
  const scriptTags: string[] = []
  
  for (const component of result.components) {
    await Bun.write(resolve(config.distDir, component.filename), component.clientJs)
    scriptTags.push(`<script type="module" src="./${component.filename}"></script>`)
    console.log(`Generated: dist/${component.filename}`)
  }
  
  // Load template and generate HTML
  const templatePath = resolve(config.rootDir, config.template)
  const template = await Bun.file(templatePath).text()
  const html = template
    .replace('{{title}}', config.title)
    .replace('{{content}}', result.html)
    .replace('{{scripts}}', scriptTags.join('\n  '))
  
  await Bun.write(resolve(config.distDir, 'index.html'), html)
  console.log('Generated: dist/index.html')
  
  // Copy barefoot.js
  await Bun.write(
    resolve(config.distDir, 'barefoot.js'),
    Bun.file(resolve(config.domDir, 'runtime.js'))
  )
  console.log('Copied: dist/barefoot.js')
}

/**
 * Build server-side project (like hono example)
 */
async function buildServer(config: ResolvedBuildConfig & ServerBuildConfig): Promise<void> {
  console.log('Building server project...')
  
  await mkdir(config.distDir, { recursive: true })
  
  // Generate barefoot.js (with hash) first
  const barefootContent = await Bun.file(resolve(config.domDir, 'runtime.js')).text()
  const barefootHash = contentHash(barefootContent)
  const barefootFileName = `barefoot-${barefootHash}.js`
  await Bun.write(resolve(config.distDir, barefootFileName), barefootContent)
  console.log(`Generated: dist/${barefootFileName}`)
  
  // Manifest
  const manifest: Record<string, { clientJs?: string; serverComponent: string }> = {
    '__barefoot__': { serverComponent: '', clientJs: barefootFileName }
  }
  
  // Compile each component
  for (const componentName of config.components) {
    const entryPath = resolve(config.rootDir, `${componentName}.tsx`)
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    })
    
    for (const component of result.components) {
      // Server component
      const serverFileName = `${component.name}.tsx`
      await Bun.write(resolve(config.distDir, serverFileName), component.serverComponent)
      console.log(`Generated: dist/${serverFileName}`)
      
      // Client JS (rewrite import paths, with hash)
      let clientFileName: string | undefined
      if (component.clientJs) {
        const updatedClientJs = component.clientJs.replace(
          BAREFOOT_IMPORT_PATTERN,
          `from './${barefootFileName}'`
        )
        const hash = contentHash(updatedClientJs)
        clientFileName = `${component.name}.client-${hash}.js`
        await Bun.write(resolve(config.distDir, clientFileName), updatedClientJs)
        console.log(`Generated: dist/${clientFileName}`)
      }
      
      manifest[component.name] = {
        serverComponent: serverFileName,
        clientJs: clientFileName,
      }
    }
  }
  
  // Output manifest
  await Bun.write(resolve(config.distDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('Generated: dist/manifest.json')
}

/**
 * Main build function
 */
export async function build(configPath: string): Promise<void> {
  const config = await loadBuildConfig(configPath)
  
  if (config.mode === 'static') {
    await buildStatic(config as ResolvedBuildConfig & StaticBuildConfig)
  } else if (config.mode === 'server') {
    await buildServer(config as ResolvedBuildConfig & ServerBuildConfig)
  } else {
    // This should never happen if BuildConfig type is properly constrained
    const unknownMode = config.mode
    throw new Error(`Unknown build mode: ${unknownMode}`)
  }
  
  console.log('\nBuild complete!')
}
