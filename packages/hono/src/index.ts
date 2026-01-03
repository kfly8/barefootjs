/**
 * BarefootJS Hono Integration
 *
 * Provides Hono-specific adapters and utilities for BarefootJS.
 */

export { honoMarkedJsxAdapter } from './server-adapter'
export type { MarkedJsxAdapter } from './types'

// BfScripts is exported from a separate entry point to avoid JSX runtime issues in tests
// Usage: import { BfScripts } from '@barefoot/hono/scripts'
export type { CollectedScript, CollectedPropsScript } from './scripts'

// Legacy alias for backwards compatibility
export { honoMarkedJsxAdapter as honoServerAdapter } from './server-adapter'
