// Build config types for barefoot.config.ts

import type { TemplateAdapter, BuildOptions } from '@barefootjs/jsx'

export interface BarefootBuildConfig extends BuildOptions {
  /** Adapter instance (e.g. HonoAdapter, GoTemplateAdapter) */
  adapter: TemplateAdapter
  /** Adapter-specific post-processing hook for marked templates */
  transformMarkedTemplate?: (content: string, componentId: string, clientJsPath: string) => string
}

/**
 * Identity function for type-checking barefoot.config.ts files.
 */
export function defineConfig(config: BarefootBuildConfig): BarefootBuildConfig {
  return config
}
