// BFS dependency resolver for internal component dependencies.

import { existsSync, readFileSync } from 'fs'
import path from 'path'
import type { ComponentMeta } from './types'

/**
 * Resolve transitive internal dependencies for the requested components.
 * Returns a sorted, deduplicated list including the requested components
 * and all their transitive internal dependencies.
 */
export function resolveDependencies(
  requested: string[],
  metaDir: string,
): string[] {
  const visited = new Set<string>()
  const queue = [...requested]

  while (queue.length > 0) {
    const name = queue.shift()!
    if (visited.has(name)) continue
    visited.add(name)

    const metaPath = path.join(metaDir, `${name}.json`)
    if (!existsSync(metaPath)) continue

    const meta: ComponentMeta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    for (const dep of meta.dependencies.internal) {
      if (!visited.has(dep)) {
        queue.push(dep)
      }
    }
  }

  return [...visited].sort()
}
