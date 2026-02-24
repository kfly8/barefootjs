// Shared type definitions for component metadata extraction and CLI

export type ComponentCategory = 'input' | 'overlay' | 'navigation' | 'layout' | 'display'

export interface PropMeta {
  name: string
  type: string
  required: boolean
  default?: string
  description: string
}

export interface SubComponentMeta {
  name: string
  description: string
  props: PropMeta[]
}

export interface ExampleMeta {
  title: string
  code: string
}

export interface AccessibilityMeta {
  role?: string
  ariaAttributes: string[]
  dataAttributes: string[]
}

export interface DependencyMeta {
  internal: string[]
  external: string[]
}

/**
 * Detailed per-component metadata (written to ui/meta/<name>.json).
 */
export interface ComponentMeta {
  name: string
  title: string
  category: ComponentCategory
  description: string
  tags: string[]
  stateful: boolean
  props: PropMeta[]
  subComponents?: SubComponentMeta[]
  variants?: Record<string, string[]>
  examples: ExampleMeta[]
  accessibility: AccessibilityMeta
  dependencies: DependencyMeta
  related: string[]
  source: string
}

/**
 * Compact per-component entry in the search index.
 */
export interface MetaIndexEntry {
  name: string
  title: string
  category: ComponentCategory
  description: string
  tags: string[]
  stateful: boolean
  subComponents?: string[]
}

/**
 * Search index (written to ui/meta/index.json).
 */
export interface MetaIndex {
  version: 1
  generatedAt: string
  components: MetaIndexEntry[]
}
