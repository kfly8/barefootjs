// `barefoot add <component...>` — Add components to a BarefootJS project.

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, readdirSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'
import { findBarefootJson, loadBarefootConfig } from '../context'
import { resolveDependencies } from '../lib/dependency-resolver'
import type { MetaIndex, MetaIndexEntry, ComponentMeta } from '../lib/types'

export function run(args: string[], ctx: CliContext): void {
  const force = args.includes('--force')
  const componentNames = args.filter(a => !a.startsWith('--'))

  if (componentNames.length === 0) {
    console.error('Usage: barefoot add <component...> [--force]')
    process.exit(1)
  }

  // Load barefoot.json
  const configPath = findBarefootJson(process.cwd())
  if (!configPath) {
    console.error('Error: barefoot.json not found. Run `barefoot init` first.')
    process.exit(1)
  }

  const projectDir = path.dirname(configPath)
  const config = loadBarefootConfig(configPath)

  // Source directories (monorepo)
  const srcComponentsDir = path.resolve(ctx.root, 'ui/components/ui')
  const srcMetaDir = path.resolve(ctx.root, 'ui/meta')

  // Destination directories (user project)
  const destComponentsDir = path.resolve(projectDir, config.paths.components)
  const destMetaDir = path.resolve(projectDir, config.paths.meta)

  // Validate requested components exist in source
  for (const name of componentNames) {
    const srcFile = path.join(srcComponentsDir, name, 'index.tsx')
    if (!existsSync(srcFile)) {
      console.error(`Error: Component "${name}" not found in source registry.`)
      console.error(`  Expected: ${srcFile}`)
      process.exit(1)
    }
  }

  // Resolve dependencies
  const allComponents = resolveDependencies(componentNames, srcMetaDir)
  const autoDeps = allComponents.filter(c => !componentNames.includes(c))

  if (autoDeps.length > 0) {
    console.log(`  Resolved dependencies: ${autoDeps.join(', ')}`)
  }

  // Ensure directories exist
  mkdirSync(destComponentsDir, { recursive: true })
  mkdirSync(destMetaDir, { recursive: true })

  const added: string[] = []
  const skipped: string[] = []

  for (const name of allComponents) {
    const destDir = path.join(destComponentsDir, name)
    const destFile = path.join(destDir, 'index.tsx')

    // Skip if already exists (unless --force)
    if (existsSync(destFile) && !force) {
      skipped.push(name)
      continue
    }

    mkdirSync(destDir, { recursive: true })

    // Copy component source → <name>/index.tsx
    const srcFile = path.join(srcComponentsDir, name, 'index.tsx')
    if (existsSync(srcFile)) {
      copyFileSync(srcFile, destFile)
    }

    // Copy test → <name>/index.test.tsx
    const srcTest = path.join(srcComponentsDir, name, 'index.test.tsx')
    if (existsSync(srcTest)) {
      copyFileSync(srcTest, path.join(destDir, 'index.test.tsx'))
    }

    // Copy preview → <name>/index.preview.tsx
    const srcPreview = path.join(srcComponentsDir, name, 'index.preview.tsx')
    if (existsSync(srcPreview)) {
      copyFileSync(srcPreview, path.join(destDir, 'index.preview.tsx'))
    }

    // Copy meta JSON
    const srcMeta = path.join(srcMetaDir, `${name}.json`)
    const destMeta = path.join(destMetaDir, `${name}.json`)
    if (existsSync(srcMeta)) {
      copyFileSync(srcMeta, destMeta)
    }

    added.push(name)
  }

  // Rebuild meta/index.json from meta/*.json files
  rebuildMetaIndex(destMetaDir)

  // Summary
  if (added.length > 0) {
    console.log(`\n  Added: ${added.join(', ')}`)
  }
  if (skipped.length > 0) {
    console.log(`  Skipped (already exists): ${skipped.join(', ')}`)
    console.log(`  Use --force to overwrite existing components.`)
  }
  if (added.length > 0) {
    console.log(`\n  Run tests: bun test ${config.paths.components}/`)
  }
}

/**
 * Rebuild meta/index.json from all meta/*.json files in the directory.
 */
function rebuildMetaIndex(metaDir: string): void {
  const entries: MetaIndexEntry[] = []

  const files = readdirSync(metaDir).filter(f => f.endsWith('.json') && f !== 'index.json')
  for (const file of files.sort()) {
    try {
      const meta: ComponentMeta = JSON.parse(readFileSync(path.join(metaDir, file), 'utf-8'))
      entries.push({
        name: meta.name,
        title: meta.title,
        category: meta.category,
        description: meta.description,
        tags: meta.tags,
        stateful: meta.stateful,
        ...(meta.subComponents && meta.subComponents.length > 0
          ? { subComponents: meta.subComponents.map(sc => sc.name) }
          : {}),
      })
    } catch {
      // Skip malformed files
    }
  }

  const index: MetaIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    components: entries,
  }

  writeFileSync(path.join(metaDir, 'index.json'), JSON.stringify(index, null, 2) + '\n')
}
