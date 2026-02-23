/**
 * barefoot preview <component>
 *
 * Entry point: find previews, compile, serve.
 */

/** @jsxImportSource hono/jsx */

import { resolve } from 'node:path'
import { compile } from './compile'
import { createPreviewApp, startServer, pascalToTitle, type PreviewEntry } from './server'

const ROOT_DIR = resolve(import.meta.dir, '../../..')
const PREVIEWS_DIR = resolve(ROOT_DIR, 'ui/components/ui/__previews__')
const DEFAULT_PORT = 3003

export async function runPreview(componentName: string) {
  const previewsPath = resolve(PREVIEWS_DIR, `${componentName}.previews.tsx`)

  // 1. Check previews file exists
  if (!await Bun.file(previewsPath).exists()) {
    console.error(`Error: Preview file not found: ui/components/ui/__previews__/${componentName}.previews.tsx`)
    process.exit(1)
  }

  // 2. Extract export function names from source
  const source = await Bun.file(previewsPath).text()
  const previewNames = [...source.matchAll(/export function (\w+)/g)].map(m => m[1])

  if (previewNames.length === 0) {
    console.error('Error: No exported functions found in previews file.')
    process.exit(1)
  }

  console.log(`Found ${previewNames.length} previews: ${previewNames.join(', ')}`)

  // 3. Compile
  console.log('\nCompiling...')
  const result = await compile({ previewsPath, previewNames })

  // 4. Import compiled previews module
  const previewsModule = await import(result.previewsCompiledPath)

  // 5. Build preview entries
  const previews: PreviewEntry[] = previewNames.map(name => ({
    name,
    displayName: pascalToTitle(name),
  }))

  // 6. Create and start server
  const app = createPreviewApp({
    previews,
    componentName: componentName.charAt(0).toUpperCase() + componentName.slice(1),
    renderPreview: (name: string) => {
      const Preview = previewsModule[name]
      if (!Preview) return <div>Preview "{name}" not found</div>
      return <Preview />
    },
    manifest: result.manifest,
    port: DEFAULT_PORT,
  })

  startServer(app, DEFAULT_PORT)
}

// Run if called directly (not imported)
if (import.meta.main) {
  const componentArg = process.argv[2]
  if (componentArg) {
    runPreview(componentArg)
  } else {
    console.error('Usage: bun run packages/preview/src/index.tsx <component>')
    process.exit(1)
  }
}
