#!/usr/bin/env bun
// CLI entry point: arg parse → switch dispatch.

import { createContext } from './context'

const args = process.argv.slice(2)
const jsonFlag = args.includes('--json')
const filteredArgs = args.filter(a => a !== '--json')
const command = filteredArgs[0]
const commandArgs = filteredArgs.slice(1)

const ctx = createContext(jsonFlag)

function printUsage() {
  console.log(`Usage: barefoot <command> [options]

Commands:
  search <query>              Search components by name/category/tags
  docs <component>            Show component documentation (props, examples, a11y)
  scaffold <name> <comp...>   Generate component skeleton + IR test
  test [component]            Find and show test commands
  test:template <name>        Generate IR test from existing source
  preview <component>         Start preview dev server for visual check
  tokens [--category <cat>]   List design tokens (categories: typography, spacing, etc.)
  meta:extract                Extract metadata from ui/components/ui/*.tsx

Options:
  --json                      Output in JSON format

Workflow:
  1. barefoot search <query>               — Find components
  2. barefoot docs <component>             — Learn props and usage
  3. barefoot scaffold <name> <comp...>    — Generate skeleton + test
  4. Implement the component
  5. bun test <path>                       — Verify
  6. barefoot test:template <name>         — Regenerate richer test
  7. barefoot preview <component>          — Visual preview in browser`)
}

switch (command) {
  case 'search': {
    const { run } = await import('./commands/search')
    run(commandArgs, ctx)
    break
  }

  case 'docs': {
    const { run } = await import('./commands/docs')
    run(commandArgs, ctx)
    break
  }

  case 'test': {
    const { run } = await import('./commands/test')
    run(commandArgs, ctx)
    break
  }

  case 'test:template': {
    const { run } = await import('./commands/test-template')
    run(commandArgs, ctx)
    break
  }

  case 'scaffold': {
    const { run } = await import('./commands/scaffold')
    run(commandArgs, ctx)
    break
  }

  case 'preview': {
    const { run } = await import('./commands/preview')
    await run(commandArgs, ctx)
    break
  }

  case 'tokens': {
    const { run } = await import('./commands/tokens')
    await run(commandArgs, ctx)
    break
  }

  case 'meta:extract': {
    const { run } = await import('./commands/meta-extract')
    await run(commandArgs, ctx)
    break
  }

  default:
    printUsage()
    break
}
