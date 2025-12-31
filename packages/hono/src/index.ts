/**
 * BarefootJS Hono Integration
 *
 * Provides Hono-specific adapters and utilities for BarefootJS.
 */

export { honoMarkedJsxAdapter } from './server-adapter'
export type { MarkedJsxAdapter } from './types'

// Legacy alias for backwards compatibility
export { honoMarkedJsxAdapter as honoServerAdapter } from './server-adapter'
