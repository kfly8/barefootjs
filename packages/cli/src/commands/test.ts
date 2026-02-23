// barefoot test — find and display test commands for a component.

import { existsSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'

export function run(args: string[], ctx: CliContext): void {
  const componentName = args[0]

  if (!componentName) {
    // Run all IR tests
    const cmd = `bun test ui/components/ui/__tests__/`
    if (ctx.jsonFlag) {
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

  const irExists = existsSync(path.join(ctx.root, irTestPath))
  const altIrExists = existsSync(path.join(ctx.root, altIrTestPath))
  const e2eExists = existsSync(path.join(ctx.root, e2eTestPath))

  if (ctx.jsonFlag) {
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
