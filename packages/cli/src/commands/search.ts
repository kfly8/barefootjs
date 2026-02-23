// barefoot search — find components by name, category, or tags.

import type { CliContext } from '../context'
import type { MetaIndexEntry } from '../lib/types'
import { loadIndex } from '../lib/meta-loader'

// Category aliases for better search (e.g., "form" → "input" components)
const categoryAliases: Record<string, string[]> = {
  'form': ['input'],
  'modal': ['overlay'],
  'nav': ['navigation'],
  'menu': ['navigation', 'overlay'],
}

function search(query: string, ctx: CliContext): MetaIndexEntry[] {
  const index = loadIndex(ctx.metaDir)
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

export function run(args: string[], ctx: CliContext): void {
  const query = args.join(' ')
  if (!query) {
    // List all components
    const index = loadIndex(ctx.metaDir)
    printSearchResults(index.components, ctx.jsonFlag)
  } else {
    printSearchResults(search(query, ctx), ctx.jsonFlag)
  }
}
