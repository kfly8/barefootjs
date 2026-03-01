// Go template build config factory for barefoot.config.ts

import { GoTemplateAdapter } from './adapter'
import type { GoTemplateAdapterOptions } from './adapter'

export interface GoTemplateBuildOptions {
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
  /** Adapter-specific options passed to GoTemplateAdapter */
  adapterOptions?: GoTemplateAdapterOptions
}

/**
 * Create a BarefootBuildConfig for Go html/template projects.
 *
 * Uses structural typing — does not import BarefootBuildConfig to avoid
 * circular dependency between @barefootjs/go-template and @barefootjs/cli.
 */
export function createConfig(options: GoTemplateBuildOptions = {}) {
  return {
    adapter: new GoTemplateAdapter(options.adapterOptions),
    components: options.components,
    outDir: options.outDir,
    minify: options.minify,
    contentHash: options.contentHash,
    clientOnly: options.clientOnly,
  }
}
