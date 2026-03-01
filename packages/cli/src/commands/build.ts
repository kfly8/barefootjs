// `barefoot build` — Compile JSX components.
// Reads config from barefoot.config.ts (preferred) or barefoot.json build section (fallback).

import type { CliContext } from '../context'
import { resolveBuildConfigFromTs, build } from '../lib/build'
import { findBuildConfig, loadBuildConfig } from '../lib/config-loader'

export async function run(args: string[], ctx: CliContext): Promise<void> {
  // Parse flags
  const minify = args.includes('--minify')

  const projectDir = ctx.projectDir ?? process.cwd()

  // 1. Try barefoot.config.ts
  const tsConfigPath = findBuildConfig(projectDir)

  if (tsConfigPath) {
    const tsConfig = await loadBuildConfig(tsConfigPath)
    const config = resolveBuildConfigFromTs(projectDir, tsConfig, { minify })

    console.log(`Config: barefoot.config.ts`)
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
    return
  }

  // 2. Fallback: barefoot.json build section
  if (!ctx.config?.build) {
    console.error('Error: No barefoot.config.ts or "build" section in barefoot.json found.')
    console.error('Create a barefoot.config.ts:')
    console.error('  import { hono } from "@barefootjs/hono/build"')
    console.error('  export default hono({ components: ["components"] })')
    process.exit(1)
  }

  // Dynamic import to avoid bundling adapters in CLI
  const section = ctx.config.build

  switch (section.adapter) {
    case 'hono': {
      const { hono } = await import('@barefootjs/hono/build')
      const honoConfig = hono({
        components: section.components,
        outDir: section.outDir,
        minify: section.minify,
        contentHash: section.contentHash,
        clientOnly: section.clientOnly,
        scriptCollection: section.scriptCollection,
        adapterOptions: section.adapterOptions as any,
      })
      const config = resolveBuildConfigFromTs(projectDir, honoConfig, { minify })

      console.log(`Config: barefoot.json (build section)`)
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
      return
    }
    case 'go-template': {
      const { goTemplate } = await import('@barefootjs/go-template/build')
      const goConfig = goTemplate({
        components: section.components,
        outDir: section.outDir,
        minify: section.minify,
        contentHash: section.contentHash,
        clientOnly: section.clientOnly,
        adapterOptions: section.adapterOptions as any,
      })
      const config = resolveBuildConfigFromTs(projectDir, goConfig, { minify })

      console.log(`Config: barefoot.json (build section)`)
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
      return
    }
    default:
      console.error(`Error: Unknown adapter "${section.adapter}" in barefoot.json.`)
      console.error('Supported adapters: "hono", "go-template"')
      console.error('Consider migrating to barefoot.config.ts for custom adapters.')
      process.exit(1)
  }
}
