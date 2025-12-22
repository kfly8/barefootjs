/**
 * Build configuration types for BarefootJS projects
 */

export type BuildMode = 'static' | 'server'

export interface StaticBuildConfig {
  mode: 'static'
  entry: string
  template: string
  title: string
  dist?: string
}

export interface ServerBuildConfig {
  mode: 'server'
  components: string[]
  dist?: string
}

export type BuildConfig = StaticBuildConfig | ServerBuildConfig

export type ResolvedBuildConfig = 
  | (StaticBuildConfig & { rootDir: string; distDir: string; domDir: string })
  | (ServerBuildConfig & { rootDir: string; distDir: string; domDir: string })
