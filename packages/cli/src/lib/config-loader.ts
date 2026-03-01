// Config loader: detect and load barefoot.config.ts

import { existsSync } from 'fs'
import { resolve } from 'path'
import type { BarefootBuildConfig } from '../config'

const CONFIG_FILENAME = 'barefoot.config.ts'

/**
 * Search for barefoot.config.ts starting from the given directory.
 * Returns the absolute path if found, or null.
 */
export function findBuildConfig(startDir: string): string | null {
  const candidate = resolve(startDir, CONFIG_FILENAME)
  return existsSync(candidate) ? candidate : null
}

/**
 * Load and validate a barefoot.config.ts file.
 * Uses Bun's native TypeScript import support.
 */
export async function loadBuildConfig(configPath: string): Promise<BarefootBuildConfig> {
  const mod = await import(configPath)
  const config = mod.default

  if (!config) {
    throw new Error(`barefoot.config.ts must have a default export`)
  }

  if (!config.adapter) {
    throw new Error(`barefoot.config.ts: "adapter" is required`)
  }

  return config as BarefootBuildConfig
}
