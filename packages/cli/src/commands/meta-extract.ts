// barefoot meta:extract — extract component metadata from ui/components/ui/*/index.tsx.

import { Glob } from 'bun'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'
import { parseComponent } from '../lib/parse-component'
import { categoryMap, relatedMap, detectTags } from '../lib/categories'
import type { ComponentMeta, MetaIndex, MetaIndexEntry } from '../lib/types'

// Read registry.json for fallback descriptions
function loadRegistry(root: string): Record<string, { title: string; description: string }> {
  const registryPath = path.join(root, 'ui/registry.json')
  const registry: Record<string, { title: string; description: string }> = {}
  try {
    const data = JSON.parse(readFileSync(registryPath, 'utf-8'))
    for (const item of data.items || []) {
      registry[item.name] = { title: item.title, description: item.description }
    }
  } catch {
    // registry.json is optional
  }
  return registry
}

// Convert directory path to component name (e.g., ".../radio-group/index.tsx" → "radio-group")
function fileToName(filePath: string): string {
  return path.basename(path.dirname(filePath))
}

// Convert kebab-case to Title Case
function toTitle(name: string): string {
  return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

export async function run(_args: string[], ctx: CliContext): Promise<void> {
  const componentsDir = path.join(ctx.root, 'ui/components/ui')

  // Ensure output directory exists
  if (!existsSync(ctx.metaDir)) {
    mkdirSync(ctx.metaDir, { recursive: true })
  }

  const registry = loadRegistry(ctx.root)

  // Glob all component index.tsx files (colocated structure)
  const glob = new Glob('*/index.tsx')
  const files: string[] = []
  for await (const file of glob.scan({ cwd: componentsDir })) {
    files.push(path.join(componentsDir, file))
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
      source: `ui/components/ui/${name}/index.tsx`,
    }

    // Write per-component JSON
    writeFileSync(
      path.join(ctx.metaDir, `${name}.json`),
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
    path.join(ctx.metaDir, 'index.json'),
    JSON.stringify(index, null, 2) + '\n',
  )

  console.log(`Extracted metadata for ${count} components → ui/meta/`)
}
