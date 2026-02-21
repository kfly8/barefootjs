#!/usr/bin/env bun
// Extract component metadata from ui/components/ui/*.tsx and write to ui/meta/

import { Glob } from 'bun'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import { parseComponent } from './lib/parse-component'
import { categoryMap, relatedMap, detectTags } from './lib/categories'
import type { ComponentMeta, MetaIndex, MetaIndexEntry } from './lib/types'

const ROOT = path.resolve(import.meta.dir, '..')
const COMPONENTS_DIR = path.join(ROOT, 'ui/components/ui')
const META_DIR = path.join(ROOT, 'ui/meta')
const REGISTRY_PATH = path.join(ROOT, 'ui/registry.json')

// Read registry.json for fallback descriptions
function loadRegistry(): Record<string, { title: string; description: string }> {
  const registry: Record<string, { title: string; description: string }> = {}
  try {
    const data = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
    for (const item of data.items || []) {
      registry[item.name] = { title: item.title, description: item.description }
    }
  } catch {
    // registry.json is optional
  }
  return registry
}

// Convert file name to component name (e.g., "radio-group.tsx" → "radio-group")
function fileToName(filePath: string): string {
  return path.basename(filePath, '.tsx')
}

// Convert kebab-case to Title Case
function toTitle(name: string): string {
  return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

async function main() {
  // Ensure output directory exists
  if (!existsSync(META_DIR)) {
    mkdirSync(META_DIR, { recursive: true })
  }

  const registry = loadRegistry()

  // Glob all component TSX files (exclude __tests__/)
  const glob = new Glob('*.tsx')
  const files: string[] = []
  for await (const file of glob.scan({ cwd: COMPONENTS_DIR })) {
    files.push(path.join(COMPONENTS_DIR, file))
  }
  files.sort()

  const indexEntries: MetaIndexEntry[] = []
  let count = 0

  for (const filePath of files) {
    const name = fileToName(filePath)
    const source = readFileSync(filePath, 'utf-8')
    const parsed = parseComponent(source)

    // Resolve metadata
    const registryEntry = registry[name]
    const description = parsed.description || registryEntry?.description || ''
    const title = registryEntry?.title || toTitle(name)
    const category = categoryMap[name] || 'display'
    const tags = detectTags(source)
    const related = relatedMap[name] || []

    const meta: ComponentMeta = {
      name,
      title,
      category,
      description,
      tags,
      stateful: parsed.useClient && /import\s+\{[^}]*createSignal[^}]*\}\s+from/.test(source),
      props: parsed.props,
      subComponents: parsed.subComponents.length > 0 ? parsed.subComponents : undefined,
      variants: Object.keys(parsed.variants).length > 0 ? parsed.variants : undefined,
      examples: parsed.examples,
      accessibility: parsed.accessibility,
      dependencies: parsed.dependencies,
      related,
      source: `ui/components/ui/${name}.tsx`,
    }

    // Write per-component JSON
    writeFileSync(
      path.join(META_DIR, `${name}.json`),
      JSON.stringify(meta, null, 2) + '\n',
    )

    // Build index entry
    const indexEntry: MetaIndexEntry = {
      name,
      title,
      category,
      description,
      tags,
      stateful: meta.stateful,
    }
    if (parsed.subComponents.length > 0) {
      indexEntry.subComponents = parsed.subComponents.map(s => s.name)
    }
    indexEntries.push(indexEntry)
    count++
  }

  // Write index.json
  const index: MetaIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    components: indexEntries,
  }
  writeFileSync(
    path.join(META_DIR, 'index.json'),
    JSON.stringify(index, null, 2) + '\n',
  )

  console.log(`Extracted metadata for ${count} components → ui/meta/`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
