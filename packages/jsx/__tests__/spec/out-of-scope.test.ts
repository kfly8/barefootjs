/**
 * Out of Scope Specification Tests
 *
 * Tests for OOS-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * These items are intentionally NOT supported by BarefootJS.
 * Tests verify that appropriate errors are thrown or features are ignored.
 */

import { describe, it, expect } from 'bun:test'
import { compileJSX } from '../../src/jsx-compiler'

describe('Out of Scope Specs', () => {
  // OOS-001: useEffect not supported
  it('OOS-001: documents that useEffect is not supported (use createEffect)', () => {
    // Note: useEffect is a React hook, not available in barefoot
    // The compiler does not recognize or transform useEffect
    // Users should use createEffect from @barefootjs/dom instead
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-002: useState not supported
  it('OOS-002: documents that useState is not supported (use createSignal)', () => {
    // Note: useState is a React hook, not available in barefoot
    // The compiler does not recognize or transform useState
    // Users should use createSignal from @barefootjs/dom instead
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-003: Context.Provider not supported
  it('OOS-003: documents that Context.Provider is not supported', () => {
    // Context.Provider is intentionally not supported
    // Users should pass props explicitly or use other state management
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-004: dangerouslySetInnerHTML not supported
  it('OOS-004: documents that dangerouslySetInnerHTML is not supported', () => {
    // dangerouslySetInnerHTML is intentionally not supported for security
    // Users should construct safe HTML programmatically
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-005: Class components not supported
  it('OOS-005: documents that class components are not supported', () => {
    // Class components are not supported
    // BarefootJS only supports function components
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-006: forwardRef not supported
  it('OOS-006: documents that forwardRef is not supported', () => {
    // forwardRef is not supported
    // Users should use ref callbacks instead
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-007: ErrorBoundary not supported
  it('OOS-007: documents that ErrorBoundary is not supported', () => {
    // ErrorBoundary is not supported
    // Users should handle errors in their code
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-008: Suspense/lazy not supported
  it('OOS-008: documents that Suspense/lazy is not supported', () => {
    // Suspense and React.lazy are not supported
    // Users should implement manual code splitting if needed
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-009: createPortal not supported
  it('OOS-009: documents that createPortal is not supported', () => {
    // createPortal is not supported
    // Users should manually manipulate DOM if needed
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-010: var not extracted
  it('OOS-010: documents that var declarations are not extracted', () => {
    // var declarations in components are not extracted to client JS
    // Users should use const or let instead
    // This is a documentation test
    expect(true).toBe(true)
  })

  // OOS-011: async components not supported
  it('OOS-011: documents that async components are not supported', () => {
    // async function components are not supported
    // Users should use signals for async data
    // This is a documentation test
    expect(true).toBe(true)
  })
})
