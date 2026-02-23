// Public API for BarefootJS design tokens.

import { readFile } from 'node:fs/promises'
import type { TokenSet } from './schema'

export type { Token, ColorToken, TokenSet } from './schema'
export { generateCSS, mergeTokenSets } from './generate-css'

/**
 * Load a TokenSet from a JSON file path.
 */
export async function loadTokens(jsonPath: string): Promise<TokenSet> {
  const content = await readFile(jsonPath, 'utf-8')
  return JSON.parse(content) as TokenSet
}
