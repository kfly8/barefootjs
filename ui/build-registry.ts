/**
 * Registry Build Script
 *
 * Generates individual component JSON files for the shadcn/ui registry format.
 * Output: dist/r/{component}.json
 */

import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist/r')

// Component metadata (title, description, dependencies)
// Note: For custom registries, we include all dependency files directly
// instead of using registryDependencies (which resolves to shadcn's registry)
const componentMeta: Record<
  string,
  {
    title: string
    description: string
    dependencies: string[]
    files: Array<{ sourcePath: string; targetPath: string }>
  }
> = {
  slot: {
    title: 'Slot',
    description: 'A polymorphic component that merges props with child element',
    dependencies: ['@barefootjs/jsx'],
    files: [
      { sourcePath: 'base/slot.tsx', targetPath: 'base/slot.tsx' },
      { sourcePath: 'types/index.tsx', targetPath: 'types/index.tsx' },
    ],
  },
  button: {
    title: 'Button',
    description: 'A button component with variants and sizes',
    dependencies: ['@barefootjs/jsx'],
    // Include slot files directly (button depends on slot)
    files: [
      { sourcePath: 'components/ui/button.tsx', targetPath: 'components/ui/button.tsx' },
      { sourcePath: 'base/slot.tsx', targetPath: 'base/slot.tsx' },
      { sourcePath: 'types/index.tsx', targetPath: 'types/index.tsx' },
    ],
  },
}

interface RegistryItem {
  $schema: string
  name: string
  type: string
  title: string
  description: string
  dependencies: string[]
  files: Array<{
    path: string
    type: string
    content: string
  }>
}

interface RegistryIndex {
  $schema: string
  name: string
  homepage: string
  items: Array<{
    name: string
    type: string
    title: string
    description: string
  }>
}

async function buildRegistryItem(name: string): Promise<RegistryItem> {
  const meta = componentMeta[name]
  if (!meta) throw new Error(`Unknown component: ${name}`)

  const files: RegistryItem['files'] = []

  for (const fileInfo of meta.files) {
    const filePath = resolve(ROOT_DIR, fileInfo.sourcePath)
    const content = await Bun.file(filePath).text()

    files.push({
      path: fileInfo.targetPath,
      type: 'registry:ui',
      content,
    })
  }

  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:ui',
    title: meta.title,
    description: meta.description,
    dependencies: meta.dependencies,
    files,
  }
}

async function main() {
  await mkdir(DIST_DIR, { recursive: true })

  // Read and copy registry.json
  const registryPath = resolve(ROOT_DIR, 'registry.json')
  const registry: RegistryIndex = JSON.parse(await Bun.file(registryPath).text())
  await Bun.write(resolve(DIST_DIR, 'registry.json'), JSON.stringify(registry, null, 2))
  console.log('Generated: dist/r/registry.json')

  // Build individual component files
  for (const item of registry.items) {
    try {
      const registryItem = await buildRegistryItem(item.name)
      await Bun.write(resolve(DIST_DIR, `${item.name}.json`), JSON.stringify(registryItem, null, 2))
      console.log(`Generated: dist/r/${item.name}.json`)
    } catch (error) {
      console.error(`Error building ${item.name}:`, error)
    }
  }

  console.log('\nRegistry build complete!')
}

main()
