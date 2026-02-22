#!/usr/bin/env bun
// CLI for agent-driven UI component discovery: search, docs, test

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { MetaIndex, MetaIndexEntry, ComponentMeta } from './lib/types'
import { generateTestTemplate } from './lib/test-template'
import { scaffold } from './lib/scaffold'

const ROOT = path.resolve(import.meta.dir, '..')
const META_DIR = path.join(ROOT, 'ui/meta')
const INDEX_PATH = path.join(META_DIR, 'index.json')

// Parse CLI args
const args = process.argv.slice(2)
const jsonFlag = args.includes('--json')
const filteredArgs = args.filter(a => a !== '--json')
const command = filteredArgs[0]
const query = filteredArgs.slice(1).join(' ')

function loadIndex(): MetaIndex {
  if (!existsSync(INDEX_PATH)) {
    console.error('Error: ui/meta/index.json not found. Run `bun run meta:extract` first.')
    process.exit(1)
  }
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'))
}

function loadComponent(name: string): ComponentMeta {
  const filePath = path.join(META_DIR, `${name}.json`)
  if (!existsSync(filePath)) {
    console.error(`Error: Component "${name}" not found. Available components are in ui/meta/index.json.`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

// --- search command ---

// Category aliases for better search (e.g., "form" → "input" components)
const categoryAliases: Record<string, string[]> = {
  'form': ['input'],
  'modal': ['overlay'],
  'nav': ['navigation'],
  'menu': ['navigation', 'overlay'],
}

function search(query: string): MetaIndexEntry[] {
  const index = loadIndex()
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

function printSearchResults(results: MetaIndexEntry[]) {
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

// --- docs command ---

function printComponent(meta: ComponentMeta) {
  if (jsonFlag) {
    console.log(JSON.stringify(meta, null, 2))
    return
  }

  console.log(`# ${meta.title}`)
  console.log(`Category: ${meta.category} | Stateful: ${meta.stateful ? 'yes' : 'no'}`)
  if (meta.tags.length > 0) console.log(`Tags: ${meta.tags.join(', ')}`)
  console.log()
  console.log(meta.description)
  console.log()

  // Props
  if (meta.props.length > 0) {
    console.log('## Props')
    for (const p of meta.props) {
      const req = p.required ? ' (required)' : ''
      const def = p.default ? ` [default: ${p.default}]` : ''
      console.log(`  ${p.name}${req}: ${p.type}${def}`)
      if (p.description) console.log(`    ${p.description}`)
    }
    console.log()
  }

  // Sub-components
  if (meta.subComponents && meta.subComponents.length > 0) {
    console.log('## Sub-Components')
    for (const sub of meta.subComponents) {
      console.log(`  ${sub.name}`)
      if (sub.description) console.log(`    ${sub.description}`)
      for (const p of sub.props) {
        const def = p.default ? ` [default: ${p.default}]` : ''
        console.log(`    - ${p.name}: ${p.type}${def}`)
      }
    }
    console.log()
  }

  // Variants
  if (meta.variants) {
    console.log('## Variants')
    for (const [name, values] of Object.entries(meta.variants)) {
      console.log(`  ${name}: ${values.join(' | ')}`)
    }
    console.log()
  }

  // Examples
  if (meta.examples.length > 0) {
    console.log('## Examples')
    for (const ex of meta.examples) {
      console.log(`  ### ${ex.title}`)
      console.log('  ```tsx')
      for (const line of ex.code.split('\n')) {
        console.log(`  ${line}`)
      }
      console.log('  ```')
    }
    console.log()
  }

  // Accessibility
  if (meta.accessibility.role || meta.accessibility.ariaAttributes.length > 0) {
    console.log('## Accessibility')
    if (meta.accessibility.role) console.log(`  Role: ${meta.accessibility.role}`)
    if (meta.accessibility.ariaAttributes.length > 0) console.log(`  ARIA: ${meta.accessibility.ariaAttributes.join(', ')}`)
    if (meta.accessibility.dataAttributes.length > 0) console.log(`  Data: ${meta.accessibility.dataAttributes.join(', ')}`)
    console.log()
  }

  // Related
  if (meta.related.length > 0) {
    console.log(`## Related: ${meta.related.join(', ')}`)
    console.log()
  }

  console.log(`Source: ${meta.source}`)
}

// --- test command ---

function runTest(componentName?: string) {
  if (!componentName) {
    // Run all IR tests
    const cmd = `bun test ui/components/ui/__tests__/`
    if (jsonFlag) {
      console.log(JSON.stringify({ command: cmd }))
    } else {
      console.log(`Running all IR tests:`)
      console.log(`  ${cmd}`)
    }
    return
  }

  const irTestPath = `ui/components/ui/__tests__/${componentName}.test.ts`
  const altIrTestPath = `packages/test/__tests__/${componentName}.test.ts`
  const e2eTestPath = `site/ui/e2e/${componentName}.spec.ts`

  const irExists = existsSync(path.join(ROOT, irTestPath))
  const altIrExists = existsSync(path.join(ROOT, altIrTestPath))
  const e2eExists = existsSync(path.join(ROOT, e2eTestPath))

  if (jsonFlag) {
    console.log(JSON.stringify({
      irTest: irExists ? irTestPath : altIrExists ? altIrTestPath : null,
      e2eTest: e2eExists ? e2eTestPath : null,
      commands: {
        ir: irExists ? `bun test ${irTestPath}` : altIrExists ? `bun test ${altIrTestPath}` : null,
        e2e: e2eExists ? `cd site/ui && npx playwright test e2e/${componentName}.spec.ts` : null,
      },
    }, null, 2))
    return
  }

  console.log(`# Tests for ${componentName}`)
  console.log()

  if (irExists) {
    console.log(`IR test: ${irTestPath}`)
    console.log(`  bun test ${irTestPath}`)
  } else if (altIrExists) {
    console.log(`IR test: ${altIrTestPath}`)
    console.log(`  bun test ${altIrTestPath}`)
  } else {
    console.log('IR test: not found')
  }

  if (e2eExists) {
    console.log(`E2E test: ${e2eTestPath}`)
    console.log(`  cd site/ui && npx playwright test e2e/${componentName}.spec.ts`)
  } else {
    console.log('E2E test: not found')
  }
}

// --- test:template command ---

function printTestTemplate(componentName: string) {
  // Try standard component path first
  const standardPath = path.join(ROOT, 'ui/components/ui', `${componentName}.tsx`)
  if (!existsSync(standardPath)) {
    console.error(`Error: Source file not found: ui/components/ui/${componentName}.tsx`)
    process.exit(1)
  }
  console.log(generateTestTemplate(standardPath))
}

// --- scaffold command ---

function runScaffold(componentName: string, useComponents: string[]) {
  const { writeFileSync, mkdirSync } = require('fs')

  const result = scaffold(componentName, useComponents)

  // Write component file
  const componentAbsPath = path.join(ROOT, result.componentPath)
  if (existsSync(componentAbsPath)) {
    console.error(`Error: ${result.componentPath} already exists. Delete it first or choose a different name.`)
    process.exit(1)
  }

  // Write test file
  const testAbsPath = path.join(ROOT, result.testPath)
  const testDir = path.dirname(testAbsPath)
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true })
  }

  writeFileSync(componentAbsPath, result.componentCode)
  writeFileSync(testAbsPath, result.testCode)

  console.log(`Created:`)
  console.log(`  ${result.componentPath}`)
  console.log(`  ${result.testPath}`)
  console.log(``)
  console.log(`Next steps:`)
  console.log(`  1. Implement the component in ${result.componentPath}`)
  console.log(`  2. bun test ${result.testPath}`)
  console.log(`  3. bun run barefoot test:template ${componentName}  (regenerate richer test)`)
}

// --- main ---

function printUsage() {
  console.log(`Usage: barefoot <command> [options]

Commands:
  search <query>              Search components by name/category/tags
  docs <component>            Show component documentation (props, examples, a11y)
  scaffold <name> <comp...>   Generate component skeleton + IR test
  test [component]            Find and show test commands
  test:template <name>        Generate IR test from existing source
  story <component>           Start story dev server for visual preview

Options:
  --json                      Output in JSON format

Workflow:
  1. barefoot search <query>               — Find components
  2. barefoot docs <component>             — Learn props and usage
  3. barefoot scaffold <name> <comp...>    — Generate skeleton + test
  4. Implement the component
  5. bun test <path>                       — Verify
  6. barefoot test:template <name>         — Regenerate richer test
  7. barefoot story <component>            — Visual preview in browser`)
}

switch (command) {
  case 'search':
    if (!query) {
      // List all components
      const index = loadIndex()
      printSearchResults(index.components)
    } else {
      printSearchResults(search(query))
    }
    break

  case 'docs':
    if (!query) {
      console.error('Error: Component name required. Usage: barefoot docs <component>')
      process.exit(1)
    }
    printComponent(loadComponent(query))
    break

  case 'test':
    runTest(query || undefined)
    break

  case 'test:template':
    if (!query) {
      console.error('Error: Component name required. Usage: barefoot test:template <component>')
      process.exit(1)
    }
    printTestTemplate(query)
    break

  case 'story': {
    if (!query) {
      console.error('Usage: barefoot story <component>')
      console.error('Example: barefoot story checkbox')
      process.exit(1)
    }
    // Delegate to packages/story (long-running server)
    const { runStory } = await import('../packages/story/src/index')
    await runStory(query)
    break
  }

  case 'scaffold': {
    const scaffoldArgs = filteredArgs.slice(1)
    if (scaffoldArgs.length < 2) {
      console.error('Usage: barefoot scaffold <component-name> <use-component1> [use-component2] ...')
      console.error('Example: barefoot scaffold settings-form input switch button')
      process.exit(1)
    }
    const [scaffoldName, ...useComponents] = scaffoldArgs
    runScaffold(scaffoldName, useComponents)
    break
  }

  default:
    printUsage()
    break
}
