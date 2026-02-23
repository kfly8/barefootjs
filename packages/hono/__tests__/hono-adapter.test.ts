/**
 * Hono Adapter Tests
 *
 * Conformance tests (shared across adapters).
 */

import { HonoAdapter } from '../src/adapter'
import { runConformanceTests, runJSXConformanceTests } from '@barefootjs/adapter-tests'

// =============================================================================
// Shared Conformance Tests
// =============================================================================

runConformanceTests({
  createAdapter: () => new HonoAdapter({ injectScriptCollection: false }),
})

// =============================================================================
// JSX-Based Conformance Tests
// =============================================================================

runJSXConformanceTests({
  createAdapter: () => new HonoAdapter({ injectScriptCollection: false }),
  // No referenceAdapter: compile + render success only
})
