// `barefoot build` — Compile JSX components using barefoot.config.ts.

import type { CliContext } from '../context'
import { resolveBuildConfigFromTs, build } from '../lib/build'
import { findBuildConfig, loadBuildConfig } from '../lib/config-loader'

export async function run(args: string[], ctx: CliContext): Promise<void> {
  const projectDir = ctx.projectDir ?? process.cwd()

  const tsConfigPath = findBuildConfig(projectDir)
  if (!tsConfigPath) {
    console.error('Error: barefoot.config.ts not found.')
    console.error('Create one:')
    console.error('  import { createConfig } from "@barefootjs/hono/build"')
    console.error('  export default createConfig({ components: ["components"] })')
    process.exit(1)
  }

  const minify = args.includes('--minify')
  const tsConfig = await loadBuildConfig(tsConfigPath)
  const config = resolveBuildConfigFromTs(projectDir, tsConfig, { minify })

  console.log(`Adapter: ${config.adapter.name}`)
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
