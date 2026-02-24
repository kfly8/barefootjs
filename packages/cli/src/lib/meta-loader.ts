// Load component metadata from ui/meta/ directory.

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { MetaIndex, ComponentMeta } from './types'

export function loadIndex(metaDir: string): MetaIndex {
  const indexPath = path.join(metaDir, 'index.json')
  if (!existsSync(indexPath)) {
    console.error(`Error: ${indexPath} not found.`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(indexPath, 'utf-8'))
}

export function loadComponent(metaDir: string, name: string): ComponentMeta {
  const filePath = path.join(metaDir, `${name}.json`)
  if (!existsSync(filePath)) {
    console.error(`Error: Component "${name}" not found. Available components are in ui/meta/index.json.`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}
