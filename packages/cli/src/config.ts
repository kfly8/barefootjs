// Build config types for barefoot.config.ts

import type { TemplateAdapter } from '@barefootjs/jsx'

export interface BarefootBuildConfig {
  /** Adapter instance (e.g. HonoAdapter, GoTemplateAdapter) */
  adapter: TemplateAdapter
  /** Source component directories relative to config file */
  components?: string[]
  /** Output directory relative to config file */
  outDir?: string
  /** Minify client JS output */
  minify?: boolean
  /** Add content hash to client JS filenames */
  contentHash?: boolean
  /** Output only client JS, skip marked templates and manifest */
  clientOnly?: boolean
  /** Adapter-specific post-processing hook for marked templates */
  transformMarkedTemplate?: (content: string, componentId: string, clientJsPath: string) => string
}

/**
 * Identity function for type-checking barefoot.config.ts files.
 */
export function defineConfig(config: BarefootBuildConfig): BarefootBuildConfig {
  return config
}
