// `barefoot build` — Compile JSX components using barefoot.json config.

import type { CliContext } from '../context'
import { resolveBuildConfig, build } from '../lib/build'

export async function run(args: string[], ctx: CliContext): Promise<void> {
  if (!ctx.config?.build) {
    console.error('Error: No "build" section found in barefoot.json.')
    console.error('Add a build configuration:')
    console.error('  { "build": { "adapter": "hono", "components": ["components"] } }')
    process.exit(1)
  }

  if (!ctx.projectDir) {
    console.error('Error: barefoot.json not found.')
    process.exit(1)
  }

  // Parse flags
  const minify = args.includes('--minify')

  const config = resolveBuildConfig(ctx.projectDir, ctx.config.build, { minify })

  console.log(`Building with adapter: ${config.adapter}`)
  console.log(`Source dirs: ${config.componentDirs.join(', ')}`)
  console.log(`Output dir: ${config.outDir}`)
  console.log('')

  const result = await build(config)

  console.log('')
  console.log(`Build complete: ${result.compiledCount} compiled, ${result.skippedCount} skipped, ${result.errorCount} errors`)

  if (result.errorCount > 0) {
    process.exit(1)
  }
}
