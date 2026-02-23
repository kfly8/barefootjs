// barefoot preview — start preview dev server for visual check.

import type { CliContext } from '../context'

export async function run(args: string[], _ctx: CliContext): Promise<void> {
  const component = args[0]
  if (!component) {
    console.error('Usage: barefoot preview <component>')
    console.error('Example: barefoot preview checkbox')
    process.exit(1)
  }

  // Delegate to packages/preview (long-running server)
  const { runPreview } = await import('../../../preview/src/index')
  await runPreview(component)
}
