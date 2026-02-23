// CLI context: shared configuration passed to every command.

import path from 'path'

export interface CliContext {
  root: string       // repo root (absolute)
  metaDir: string    // ui/meta/ (absolute)
  jsonFlag: boolean  // --json flag
}

/**
 * Create a CliContext from the current module location.
 * Assumes packages/cli/src/context.ts → root is 3 levels up.
 */
export function createContext(jsonFlag: boolean): CliContext {
  const root = path.resolve(import.meta.dir, '../../..')
  const metaDir = path.join(root, 'ui/meta')
  return { root, metaDir, jsonFlag }
}
