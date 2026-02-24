// barefoot search — find components by name, category, or tags.

import path from 'path'
import type { CliContext } from '../context'
import type { MetaIndex, MetaIndexEntry } from '../lib/types'
import { loadIndex, fetchIndex } from '../lib/meta-loader'

// Category aliases for better search (e.g., "form" → "input" components)
const categoryAliases: Record<string, string[]> = {
  'form': ['input'],
  'modal': ['overlay'],
  'nav': ['navigation'],
  'menu': ['navigation', 'overlay'],
}

export function search(query: string, index: MetaIndex): MetaIndexEntry[] {
  const q = query.toLowerCase()

  // Expand query to include category aliases
  const aliasCategories = categoryAliases[q] || []

  return index.components.filter(c =>
    c.name.includes(q) ||
    c.category.includes(q) ||
    aliasCategories.includes(c.category) ||
    c.description.toLowerCase().includes(q) ||
    c.tags.some(t => t.includes(q))
  )
}

function printSearchResults(results: MetaIndexEntry[], jsonFlag: boolean) {
  if (jsonFlag) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  if (results.length === 0) {
    console.log('No components found.')
    return
  }

  // Table format
  const nameWidth = Math.max(20, ...results.map(r => r.name.length + 2))
  const catWidth = 12
  const header = `${'NAME'.padEnd(nameWidth)}${'CATEGORY'.padEnd(catWidth)}DESCRIPTION`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const r of results) {
    const statefulMark = r.stateful ? ' *' : ''
    console.log(`${(r.name + statefulMark).padEnd(nameWidth)}${r.category.padEnd(catWidth)}${r.description.slice(0, 60)}`)
  }
  console.log(`\n${results.length} component(s) found. (* = stateful)`)
}

export async function run(args: string[], ctx: CliContext): Promise<void> {
  // Parse --dir flag
  let metaDir = ctx.metaDir
  const dirIdx = args.indexOf('--dir')
  if (dirIdx !== -1) {
    const dirValue = args[dirIdx + 1]
    if (!dirValue || dirValue.startsWith('-')) {
      console.error('Error: --dir requires a path argument.')
      process.exit(1)
    }
    metaDir = path.resolve(dirValue)
    args = [...args.slice(0, dirIdx), ...args.slice(dirIdx + 2)]
  }

  // Parse --registry flag
  let registryUrl: string | undefined
  const regIdx = args.indexOf('--registry')
  if (regIdx !== -1) {
    const regValue = args[regIdx + 1]
    if (!regValue || regValue.startsWith('-')) {
      console.error('Error: --registry requires a URL argument.')
      process.exit(1)
    }
    registryUrl = regValue
    args = [...args.slice(0, regIdx), ...args.slice(regIdx + 2)]
  }

  // Mutual exclusion
  if (dirIdx !== -1 && registryUrl) {
    console.error('Error: --dir and --registry cannot be used together.')
    process.exit(1)
  }

  // Load index from local or remote source
  const index = registryUrl
    ? await fetchIndex(registryUrl)
    : loadIndex(metaDir)

  const query = args.join(' ')
  if (!query) {
    printSearchResults(index.components, ctx.jsonFlag)
  } else {
    printSearchResults(search(query, index), ctx.jsonFlag)
  }
}
