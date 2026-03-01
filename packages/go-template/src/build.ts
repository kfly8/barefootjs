// Go template build config factory for barefoot.config.ts

import type { BuildOptions } from '@barefootjs/jsx'
import { GoTemplateAdapter } from './adapter'
import type { GoTemplateAdapterOptions } from './adapter'

export interface GoTemplateBuildOptions extends BuildOptions {
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
