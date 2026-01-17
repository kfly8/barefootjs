/**
 * BarefootJS Hono Integration
 *
 * Provides Hono-specific adapters and utilities for BarefootJS.
 */

// Hono Adapter for JSX compilation
export { HonoAdapter, honoAdapter } from './adapter'
export type { HonoAdapterOptions } from './adapter'

// BfScripts is exported from a separate entry point to avoid JSX runtime issues in tests
// Usage: import { BfScripts } from '@barefootjs/hono/scripts'
export type { CollectedScript, CollectedPropsScript } from './scripts'
